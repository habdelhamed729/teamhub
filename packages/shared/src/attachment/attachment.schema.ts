import { z } from 'zod';

export const attachmentTargetEnum = z.enum(['message', 'task', 'document']);

export const uploadAttachmentSchema = z.object({
  target: attachmentTargetEnum,
  target_id: z.string().uuid(),
});

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export const ALLOWED_FILE_TYPES = [
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
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
