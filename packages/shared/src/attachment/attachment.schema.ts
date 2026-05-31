import { z } from 'zod';

export const attachmentTargetEnum = z.enum(['message', 'task', 'document']);

export const uploadAttachmentSchema = z.object({
  target: attachmentTargetEnum,
  target_id: z.string().uuid(),
});

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

export const ALLOWED_FILE_TYPES = [
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  // Videos
  'video/mp4',
  'video/mpeg',
  'video/quicktime',
  'video/webm',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  // Text
  'text/plain',
  'text/csv',
  // Archives
  'application/zip',
] as const;

export type UploadAttachmentDTO = z.infer<typeof uploadAttachmentSchema>;
