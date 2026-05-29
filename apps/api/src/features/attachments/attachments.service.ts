import { prisma } from "../../database/prisma";
import { cloudinary } from "../../config/cloudinary";
import type { AttachmentTarget } from "@teamhub/shared";

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Parses Cloudinary Public ID from the secure URL.
 */
const getPublicIdFromUrl = (url: string): string | null => {
  const parts = url.split("/upload/");
  if (parts.length < 2) return null;
  const pathAfterUpload = parts[1]!;
  // Strip version prefix if present (e.g. v12345678/)
  const cleanPath = pathAfterUpload.replace(/^v\d+\//, "");
  // Strip the file extension to get the clean public ID
  return cleanPath.replace(/\.[^/.]+$/, "");
};

/**
 * Detects the Cloudinary resource type from a file URL.
 */
const detectResourceType = (url: string): string => {
  if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url)) return "image";
  if (/\.(mp4|webm|ogg|mov|mpeg)$/i.test(url)) return "video";
  return "raw";
};

/**
 * Uploads a file buffer to Cloudinary using standard resource detection.
 */
const uploadToCloudinary = (
  fileBuffer: Buffer,
  fileName: string
): Promise<{ secure_url: string; public_id: string }> => {
  return new Promise((resolve, reject) => {
    // Strip file extension from public_id to let Cloudinary manage URLs cleanly
    const cleanPublicIdName = fileName.replace(/\.[^/.]+$/, "");
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "teamhub/attachments",
        resource_type: "auto", // Auto-detects image, raw document, audio, video, etc.
        public_id: `${Date.now()}-${cleanPublicIdName}`,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result!);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

/**
 * Deletes an asset from Cloudinary using its secure URL.
 * Non-blocking best-effort — logs errors but never throws.
 */
export const deleteFromCloudinary = async (url: string): Promise<void> => {
  try {
    const publicId = getPublicIdFromUrl(url);
    if (!publicId) return;

    const resourceType = detectResourceType(url);
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (error) {
    console.error(`Failed to delete Cloudinary asset for ${url}:`, error);
  }
};

const uploaderSelect = {
  id: true,
  display_name: true,
  avatar_url: true,
} as const;

// ─── Access Control ─────────────────────────────────────────────────────────

/**
 * Resolves the workspace_id for a given attachment target.
 * Returns null for targets that don't yet track workspace (e.g. placeholder Task model).
 */
const resolveWorkspaceId = async (
  target: AttachmentTarget,
  targetId: string
): Promise<string | null> => {
  if (target === "document") {
    const document = await prisma.document.findUnique({
      where: { id: targetId },
      select: { workspace_id: true, is_archived: true },
    });
    if (!document || document.is_archived) {
      throw Object.assign(new Error("Document not found or archived"), { status: 404 });
    }
    return document.workspace_id;
  }

  if (target === "message") {
    // targetId can be either a message ID or a channel ID (pre-upload flow)
    const message = await prisma.message.findUnique({
      where: { id: targetId },
      include: { channel: { select: { id: true, workspace_id: true, type: true, created_by_id: true } } },
    });

    // If the targetId matched a message, use its channel
    const channel = message?.channel ?? await prisma.channel.findUnique({
      where: { id: targetId },
      select: { id: true, workspace_id: true, type: true, created_by_id: true },
    });

    if (!channel) {
      throw Object.assign(new Error("Message or Channel target not found"), { status: 404 });
    }

    // Store channel info for private channel check in assertTargetAccess
    return channel.workspace_id;
  }

  if (target === "task") {
    const task = await prisma.task.findUnique({
      where: { id: targetId },
    });
    if (!task) {
      throw Object.assign(new Error("Task not found"), { status: 404 });
    }
    return null; // Task model doesn't have workspace_id yet
  }

  throw Object.assign(new Error("Invalid attachment target"), { status: 400 });
};

/**
 * Asserts that the user has authorization to access the targeted entity.
 * Returns { isMessage: boolean } so callers know whether the targetId is
 * a real message (vs a channel ID used for pre-upload).
 */
export const assertTargetAccess = async (
  target: AttachmentTarget,
  targetId: string,
  userId: string
): Promise<{ isMessage: boolean }> => {
  if (target === "document") {
    const document = await prisma.document.findUnique({
      where: { id: targetId },
      select: { workspace_id: true, is_archived: true },
    });
    if (!document || document.is_archived) {
      throw Object.assign(new Error("Document not found or archived"), { status: 404 });
    }

    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspace_id_user_id: { workspace_id: document.workspace_id, user_id: userId },
      },
    });
    if (!membership) {
      throw Object.assign(new Error("Workspace access denied"), { status: 403 });
    }
    return { isMessage: false };
  }

  if (target === "message") {
    // targetId can be either a message ID or a channel ID (pre-upload flow)
    const message = await prisma.message.findUnique({
      where: { id: targetId },
      include: { channel: { select: { id: true, workspace_id: true, type: true, created_by_id: true } } },
    });

    const channel = message?.channel ?? await prisma.channel.findUnique({
      where: { id: targetId },
      select: { id: true, workspace_id: true, type: true, created_by_id: true },
    });

    if (!channel) {
      throw Object.assign(new Error("Message or Channel target not found"), { status: 404 });
    }

    const wsMembership = await prisma.workspaceMember.findUnique({
      where: {
        workspace_id_user_id: { workspace_id: channel.workspace_id, user_id: userId },
      },
    });
    if (!wsMembership) {
      throw Object.assign(new Error("Workspace access denied"), { status: 403 });
    }

    if (channel.type === "private") {
      const channelMembership = await prisma.channelMember.findUnique({
        where: {
          channel_id_user_id: { channel_id: channel.id, user_id: userId },
        },
      });
      if (!channelMembership && channel.created_by_id !== userId) {
        throw Object.assign(new Error("Channel access denied"), { status: 403 });
      }
    }

    return { isMessage: !!message };
  }

  if (target === "task") {
    const task = await prisma.task.findUnique({
      where: { id: targetId },
    });
    if (!task) {
      throw Object.assign(new Error("Task not found"), { status: 404 });
    }
    return { isMessage: false };
  }

  throw Object.assign(new Error("Invalid attachment target"), { status: 400 });
};

// ─── Service Methods ────────────────────────────────────────────────────────

/**
 * Creates a new attachment in the database and uploads the file to Cloudinary.
 * If the DB insert fails, the Cloudinary asset is cleaned up to prevent orphans.
 */
export const createAttachment = async (
  userId: string,
  target: AttachmentTarget,
  targetId: string,
  file: { originalname: string; buffer: Buffer; mimetype: string; size: number }
) => {
  // 1. Assert user has access to target entity (also tells us if targetId is a real message)
  const { isMessage } = await assertTargetAccess(target, targetId, userId);

  // 2. Stream upload to Cloudinary
  const uploadResult = await uploadToCloudinary(file.buffer, file.originalname);

  // 3. Persist record to DB — rollback Cloudinary on failure
  try {
    const attachment = await prisma.attachment.create({
      data: {
        file_name: file.originalname,
        url: uploadResult.secure_url,
        file_type: file.mimetype,
        file_size: file.size,
        uploaded_by: userId,
        message_id: (target === "message" && isMessage) ? targetId : null,
        document_id: target === "document" ? targetId : null,
        task_id: target === "task" ? targetId : null,
      },
      include: {
        uploader: {
          select: uploaderSelect,
        },
      },
    });

    return attachment;
  } catch (error) {
    // Rollback: delete orphaned Cloudinary asset
    await deleteFromCloudinary(uploadResult.secure_url);
    throw error;
  }
};

/**
 * Retrieves the metadata details of a single attachment.
 */
export const getAttachment = async (attachmentId: string, userId: string) => {
  const attachment = await prisma.attachment.findUnique({
    where: { id: attachmentId },
    include: {
      uploader: {
        select: uploaderSelect,
      },
    },
  });

  if (!attachment) {
    throw Object.assign(new Error("Attachment not found"), { status: 404 });
  }

  // Verify access based on where this attachment is linked
  if (attachment.document_id) {
    await assertTargetAccess("document", attachment.document_id, userId);
  } else if (attachment.message_id) {
    await assertTargetAccess("message", attachment.message_id, userId);
  } else if (attachment.task_id) {
    await assertTargetAccess("task", attachment.task_id, userId);
  }

  return attachment;
};

/**
 * Internal system deletion function to clean up Cloudinary assets and DB records
 * without checking ownership (used when cascading parent entity deletes).
 * Combines find + delete into a single DB operation.
 */
export const deleteAttachmentRecord = async (attachmentId: string) => {
  // Delete from DB in one shot — returns the deleted record or throws if not found
  const attachment = await prisma.attachment.delete({
    where: { id: attachmentId },
  }).catch(() => null);

  if (!attachment) return null;

  // Non-blocking Cloudinary cleanup (best-effort)
  deleteFromCloudinary(attachment.url).catch(console.error);

  return attachment;
};

/**
 * Batch-deletes all attachments for a given target entity.
 * Cloudinary cleanup runs in parallel for performance, DB uses a single deleteMany.
 */
export const deleteAttachmentsByTarget = async (
  target: AttachmentTarget,
  targetId: string
): Promise<void> => {
  const whereClause =
    target === "document" ? { document_id: targetId } :
    target === "message" ? { message_id: targetId } :
    { task_id: targetId };

  const attachments = await prisma.attachment.findMany({
    where: whereClause,
    select: { url: true },
  });

  // Delete from Cloudinary in parallel (best-effort)
  await Promise.allSettled(
    attachments.map(a => deleteFromCloudinary(a.url))
  );

  // Batch delete from DB in one query
  await prisma.attachment.deleteMany({ where: whereClause });
};

/**
 * Deletes an attachment from both the database and Cloudinary.
 * Allowed for: the uploader, or a workspace admin/owner of the linked entity.
 */
export const deleteAttachment = async (attachmentId: string, userId: string) => {
  const attachment = await prisma.attachment.findUnique({
    where: { id: attachmentId },
  });

  if (!attachment) {
    throw Object.assign(new Error("Attachment not found"), { status: 404 });
  }

  // Fast path: the uploader can always delete their own attachment
  if (attachment.uploaded_by !== userId) {
    // Slow path: check if user is a workspace admin/owner for the linked entity
    const isAdmin = await checkWorkspaceAdminForAttachment(attachment, userId);
    if (!isAdmin) {
      throw Object.assign(new Error("Only the uploader or a workspace admin can delete this attachment"), {
        status: 403,
      });
    }
  }

  return deleteAttachmentRecord(attachmentId);
};

// ─── Internal Helpers ───────────────────────────────────────────────────────

/**
 * Checks if a user holds an admin or owner role in the workspace
 * that the attachment's target entity belongs to.
 */
const checkWorkspaceAdminForAttachment = async (
  attachment: { document_id: string | null; message_id: string | null; task_id: string | null },
  userId: string
): Promise<boolean> => {
  let workspaceId: string | null = null;

  if (attachment.document_id) {
    const doc = await prisma.document.findUnique({
      where: { id: attachment.document_id },
      select: { workspace_id: true },
    });
    workspaceId = doc?.workspace_id ?? null;
  } else if (attachment.message_id) {
    const message = await prisma.message.findUnique({
      where: { id: attachment.message_id },
      include: { channel: { select: { workspace_id: true } } },
    });
    workspaceId = message?.channel?.workspace_id ?? null;
  }
  // Task model doesn't have workspace_id yet — admin check not possible

  if (!workspaceId) return false;

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspace_id_user_id: { workspace_id: workspaceId, user_id: userId },
    },
  });

  return membership?.role === "admin" || membership?.role === "owner";
};
