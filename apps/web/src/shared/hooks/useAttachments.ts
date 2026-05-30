import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as AttachmentsAPI from "../services/attachments.api";
import type { AttachmentTarget } from "@teamhub/shared";

interface UseAttachmentsOptions {
  target: AttachmentTarget;
  targetId: string;
  onSuccess?: () => void;
  queryKeysToInvalidate?: any[][];
}

export const useAttachments = ({
  target,
  targetId,
  onSuccess,
  queryKeysToInvalidate,
}: UseAttachmentsOptions) => {
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // 1. Upload Mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      setIsUploading(true);
      setUploadProgress(0);
      try {
        const result = await AttachmentsAPI.uploadAttachment(
          file,
          target,
          targetId,
          (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total ?? 1)
            );
            setUploadProgress(percentCompleted);
          }
        );
        return result;
      } finally {
        setIsUploading(false);
      }
    },
    onSuccess: () => {
      toast.success("File uploaded successfully");
      setUploadProgress(0);
      
      // Invalidate target query caches to trigger re-fetch
      if (queryKeysToInvalidate) {
        queryKeysToInvalidate.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: key });
        });
      } else {
        // Fallback default invalidate for common targets
        queryClient.invalidateQueries({ queryKey: [target, targetId] });
      }

      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      const errorMsg = error?.response?.data?.message || error.message || "Failed to upload file";
      toast.error(errorMsg);
    },
  });

  // 2. Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (attachmentId: string) =>
      AttachmentsAPI.deleteAttachment(attachmentId),
    onSuccess: () => {
      toast.success("Attachment deleted");
      
      // Invalidate target query caches
      if (queryKeysToInvalidate) {
        queryKeysToInvalidate.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: key });
        });
      } else {
        queryClient.invalidateQueries({ queryKey: [target, targetId] });
      }

      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      const errorMsg = error?.response?.data?.message || error.message || "Failed to delete attachment";
      toast.error(errorMsg);
    },
  });

  return {
    uploadAttachment: uploadMutation.mutateAsync,
    deleteAttachment: deleteMutation.mutateAsync,
    isUploading: isUploading || uploadMutation.isPending,
    isDeleting: deleteMutation.isPending,
    uploadProgress,
  };
};
