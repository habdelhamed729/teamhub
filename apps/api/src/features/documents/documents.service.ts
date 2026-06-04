import { Prisma } from '@prisma/client';
import { prisma } from '../../database/prisma';
import type { CreateDocumentInput, UpdateDocumentInput } from '@teamhub/shared';
import { deleteAttachmentsByTarget } from '../attachments/attachments.service';

// ─── helpers ────────────────────────────────────────────────────────────────

const creatorSelect = { id: true, display_name: true, avatar_url: true } as const;

const documentInclude = {
  creator: { select: creatorSelect },
  last_editor: { select: creatorSelect },
} as const;

const documentIncludeWithAttachments = {
  creator: { select: creatorSelect },
  last_editor: { select: creatorSelect },
  attachments: {
    include: {
      uploader: {
        select: creatorSelect,
      },
    },
  },
} as const;

/** Verify user is a member of the workspace. Throws 403 if not. */
const verifyWorkspaceMembership = async (workspaceId: string, userId: string) => {
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspace_id_user_id: { workspace_id: workspaceId, user_id: userId },
    },
  });

  if (!membership) {
    throw Object.assign(new Error('Workspace not found or access denied'), { status: 403 });
  }

  return membership;
};

/**
 * Find a non-archived document and verify the user has access.
 * Used by getDocument and updateDocument.
 */
const findActiveDocument = async (documentId: string, userId: string) => {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: documentIncludeWithAttachments,
  });

  if (!document || document.is_archived) {
    throw Object.assign(new Error('Document not found'), { status: 404 });
  }

  await verifyWorkspaceMembership(document.workspace_id, userId);

  return document;
};

/**
 * Find any document (including archived) and verify the user has access.
 * Used by restoreDocument and deleteDocument.
 */
const findAnyDocument = async (documentId: string, userId: string) => {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: documentInclude,
  });

  if (!document) {
    throw Object.assign(new Error('Document not found'), { status: 404 });
  }

  await verifyWorkspaceMembership(document.workspace_id, userId);

  return document;
};

/** Get all descendant IDs of a document in-memory using a single workspace fetch */
const getDescendantIds = async (workspaceId: string, parentId: string): Promise<string[]> => {
  const allDocs = await prisma.document.findMany({
    where: { workspace_id: workspaceId },
    select: { id: true, parent_id: true },
  });

  const parentToChildren = new Map<string, string[]>();
  for (const doc of allDocs) {
    if (doc.parent_id) {
      if (!parentToChildren.has(doc.parent_id)) {
        parentToChildren.set(doc.parent_id, []);
      }
      parentToChildren.get(doc.parent_id)!.push(doc.id);
    }
  }

  const descendantIds: string[] = [];
  const queue = [parentId];
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const children = parentToChildren.get(currentId) || [];
    for (const childId of children) {
      descendantIds.push(childId);
      queue.push(childId);
    }
  }

  return descendantIds;
};

// ─── list ────────────────────────────────────────────────────────────────────

export const listDocuments = async (
  workspaceId: string,
  userId: string,
  page?: number,
  limit?: number,
) => {
  await verifyWorkspaceMembership(workspaceId, userId);

  if (page !== undefined && limit !== undefined) {
    const skip = (page - 1) * limit;
    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where: { workspace_id: workspaceId, is_archived: false },
        include: documentIncludeWithAttachments,
        orderBy: { updated_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.document.count({
        where: { workspace_id: workspaceId, is_archived: false },
      }),
    ]);

    return {
      documents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  const documents = await prisma.document.findMany({
    where: { workspace_id: workspaceId, is_archived: false },
    include: documentIncludeWithAttachments,
    orderBy: { updated_at: 'desc' },
  });

  return { documents };
};

// ─── list archived ──────────────────────────────────────────────────────────

export const listArchivedDocuments = async (
  workspaceId: string,
  userId: string,
  page?: number,
  limit?: number,
) => {
  await verifyWorkspaceMembership(workspaceId, userId);

  if (page !== undefined && limit !== undefined) {
    const skip = (page - 1) * limit;
    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where: { workspace_id: workspaceId, is_archived: true },
        include: documentInclude,
        orderBy: { archived_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.document.count({
        where: { workspace_id: workspaceId, is_archived: true },
      }),
    ]);

    return {
      documents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  const documents = await prisma.document.findMany({
    where: { workspace_id: workspaceId, is_archived: true },
    include: documentInclude,
    orderBy: { archived_at: 'desc' },
  });

  return { documents };
};

// ─── create ──────────────────────────────────────────────────────────────────

export const createDocument = async (
  workspaceId: string,
  userId: string,
  dto: CreateDocumentInput,
) => {
  await verifyWorkspaceMembership(workspaceId, userId);

  // If parent_id is provided, verify it belongs to the same workspace
  if (dto.parent_id) {
    const parent = await prisma.document.findUnique({
      where: { id: dto.parent_id },
    });

    if (!parent || parent.workspace_id !== workspaceId || parent.is_archived) {
      throw Object.assign(new Error('Parent document not found'), { status: 404 });
    }
  }

  return prisma.document.create({
    data: {
      title: dto.title,
      workspace_id: workspaceId,
      created_by_id: userId,
      ...(dto.parent_id && { parent_id: dto.parent_id }),
    },
    include: documentInclude,
  });
};

// ─── get one ─────────────────────────────────────────────────────────────────

export const getDocument = async (documentId: string, userId: string) => {
  return findActiveDocument(documentId, userId);
};

// ─── update (auto-save) ─────────────────────────────────────────────────────

export const updateDocument = async (
  documentId: string,
  userId: string,
  dto: UpdateDocumentInput,
) => {
  await findActiveDocument(documentId, userId);

  const data: Prisma.DocumentUncheckedUpdateInput = {
    last_edited_by_id: userId,
  };

  if (dto.title !== undefined) {
    data.title = dto.title;
  }

  if (dto.content !== undefined) {
    data.content = dto.content === null
      ? Prisma.JsonNull
      : (dto.content as Prisma.InputJsonValue);
  }

  if (dto.parent_id !== undefined) {
    data.parent_id = dto.parent_id;
  }

  if (dto.icon !== undefined) {
    data.icon = dto.icon;
  }

  if (dto.cover_url !== undefined) {
    data.cover_url = dto.cover_url;
  }

  const updatedDoc = await prisma.document.update({
    where: { id: documentId },
    data,
    include: documentIncludeWithAttachments,
  });

  // If title or content changed, queue an embedding job
  if (dto.title !== undefined || dto.content !== undefined) {
    try {
      const existingJobs = await prisma.$queryRawUnsafe<any[]>(
        `SELECT id FROM "ai"."ai_jobs" WHERE "source_id" = $1::uuid AND "status" = 'pending'`,
        documentId
      );
      if (existingJobs.length === 0) {
        await prisma.$executeRawUnsafe(
          `INSERT INTO "ai"."ai_jobs" ("id", "workspace_id", "job_type", "source_type", "source_id", "status", "attempts", "max_attempts", "payload", "created_at")
           VALUES (gen_random_uuid(), $1::uuid, 'embed_document', 'document', $2::uuid, 'pending', 0, 3, '{}'::jsonb, NOW())`,
          updatedDoc.workspace_id,
          documentId
        );
      }
    } catch (err) {
      console.error("[AI Job Queue] Failed to queue embedding job:", err);
    }
  }

  return updatedDoc;
};

// ─── archive (soft delete) ──────────────────────────────────────────────────

export const archiveDocument = async (documentId: string, userId: string) => {
  const document = await findActiveDocument(documentId, userId);
  const now = new Date();

  // Get descendant IDs in-memory
  const descendantIds = await getDescendantIds(document.workspace_id, document.id);

  // Batch archive all descendants in a single query
  if (descendantIds.length > 0) {
    await prisma.document.updateMany({
      where: { id: { in: descendantIds }, is_archived: false },
      data: { is_archived: true, archived_at: now },
    });
  }

  return prisma.document.update({
    where: { id: documentId },
    data: { is_archived: true, archived_at: now },
    include: documentInclude,
  });
};

// ─── restore (un-archive) ──────────────────────────────────────────────────

export const restoreDocument = async (documentId: string, userId: string) => {
  const document = await findAnyDocument(documentId, userId);

  if (!document.is_archived) {
    throw Object.assign(new Error('Document is not archived'), { status: 400 });
  }

  return prisma.document.update({
    where: { id: documentId },
    data: { is_archived: false, archived_at: null },
    include: documentInclude,
  });
};

// ─── delete (hard delete) ───────────────────────────────────────────────────

export const deleteDocument = async (documentId: string, userId: string) => {
  const document = await findAnyDocument(documentId, userId);

  // Get descendant IDs in-memory
  const descendantIds = await getDescendantIds(document.workspace_id, documentId);

  // Clean up attachments of this document and all descendants in parallel
  const allTargetIds = [documentId, ...descendantIds];
  await Promise.allSettled(
    allTargetIds.map(targetId => deleteAttachmentsByTarget("document", targetId))
  );

  // Batch-delete child documents
  if (descendantIds.length > 0) {
    await prisma.document.deleteMany({
      where: { id: { in: descendantIds } },
    });
  }

  return prisma.document.delete({
    where: { id: documentId },
  });
};
