export type AttachmentTarget = 'message' | 'task' | 'document';

export interface Attachment {
  id: string;
  file_name: string;
  url: string;
  file_type: string;
  file_size: number;
  uploaded_by: string;
  message_id?: string | null;
  task_id?: string | null;
  document_id?: string | null;
  created_at: string | Date;
  uploader?: { id: string; display_name: string; avatar_url?: string | null };
}

export interface UploadResponse {
  attachment: Attachment;
}
