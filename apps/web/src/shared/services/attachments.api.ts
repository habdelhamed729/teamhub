import { api } from "@/shared/services/axios";
import type { Attachment, AttachmentTarget } from "@teamhub/shared";

export const uploadAttachment = async (
  file: File,
  target: AttachmentTarget,
  targetId: string,
  onUploadProgress?: (progressEvent: any) => void
) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("target", target);
  formData.append("target_id", targetId);

  const { data } = await api.post("/attachments", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress,
  });
  return data.data.attachment as Attachment;
};

export const deleteAttachment = async (attachmentId: string) => {
  const { data } = await api.delete(`/attachments/${attachmentId}`);
  return data;
};
