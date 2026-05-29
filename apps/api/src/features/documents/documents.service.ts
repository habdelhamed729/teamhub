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
  attachments: true,
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

const archiveDescendants = async (parentId: string, date: Date) => {
  const children = await prisma.document.findMany({
    where: { parent_id: parentId, is_archived: false },
  });
  if (children.length === 0) return;

  await prisma.document.updateMany({
    where: { parent_id: parentId, is_archived: false },
    data: { is_archived: true, archived_at: date },
  });

  for (const child of children) {
    await archiveDescendants(child.id, date);
  }
};

const deleteDescendants = async (parentId: string) => {
  const children = await prisma.document.findMany({
    where: { parent_id: parentId },
    select: { id: true },
  });

  // Recurse into each child first (depth-first)
  for (const child of children) {
    await deleteDescendants(child.id);
  }

  // Batch-cleanup attachments for all children (parallel Cloudinary + single deleteMany)
  await Promise.allSettled(
    children.map(child => deleteAttachmentsByTarget("document", child.id))
  );

  // Batch-delete child documents
  if (children.length > 0) {
    await prisma.document.deleteMany({
      where: { parent_id: parentId },
    });
  }
};

// ─── list ────────────────────────────────────────────────────────────────────

export const listDocuments = async (
  workspaceId: string,
  userId: string,
  page?: number,
  limit?: number,
) => {
  if (page !== undefined && limit !== undefined) {
    const skip = (page - 1) * limit;
    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where: { workspace_id: workspaceId, is_archived: false },
        include: documentInclude,
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
    include: documentInclude,
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

  return prisma.document.update({
    where: { id: documentId },
    data,
    include: documentIncludeWithAttachments,
  });
};

// ─── archive (soft delete) ──────────────────────────────────────────────────

export const archiveDocument = async (documentId: string, userId: string) => {
  const document = await findActiveDocument(documentId, userId);
  const now = new Date();

  // Recursively archive all descendants
  await archiveDescendants(document.id, now);

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
  await findAnyDocument(documentId, userId);

  // Recursively delete all descendants first to prevent foreign key violations
  await deleteDescendants(documentId);

  // Clean up attachments of this parent document
  await deleteAttachmentsByTarget("document", documentId);

  return prisma.document.delete({
    where: { id: documentId },
  });
};
