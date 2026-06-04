import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as AIAPI from "../api/ai.api";

export const useDocumentAI = (documentId: string) => {
  const qc = useQueryClient();

  // Mutation to generate a new document title
  const generateTitleMutation = useMutation({
    mutationFn: () => AIAPI.generateTitle(documentId),
    onSuccess: (data) => {
      // Optimistically update document title cache
      qc.setQueryData(["document", documentId], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          title: data.title,
        };
      });
      // Invalidate general list query
      qc.invalidateQueries({ queryKey: ["documents"] });
      toast.success(`Title suggested: "${data.title}"`);
    },
    onError: (err: any) => {
      console.error("Failed to generate title:", err);
      toast.error(err?.response?.data?.message || "Failed to generate title suggestion");
    },
  });

  // Mutation to generate document tags
  const generateTagsMutation = useMutation({
    mutationFn: () => AIAPI.generateTags(documentId),
    onSuccess: (data) => {
      // Invalidate the document data to pull new tags/metadata if they are saved
      // Note: tags are currently calculated on-the-fly and returned.
      // We will let the parent handle updating the state/database with the tags.
      toast.success(`Generated ${data.tags.length} tag suggestion(s)`);
    },
    onError: (err: any) => {
      console.error("Failed to generate tags:", err);
      toast.error(err?.response?.data?.message || "Failed to generate tags");
    },
  });

  // Mutation to extract action items from document
  const extractActionsMutation = useMutation({
    mutationFn: () => AIAPI.extractActionItems(documentId),
    onSuccess: (data) => {
      toast.success(`Extracted ${data.items.length} action item(s)`);
    },
    onError: (err: any) => {
      console.error("Failed to extract action items:", err);
      toast.error(err?.response?.data?.message || "Failed to extract action items");
    },
  });

  return {
    generateTitle: generateTitleMutation.mutateAsync,
    isGeneratingTitle: generateTitleMutation.isPending,
    generateTags: generateTagsMutation.mutateAsync,
    isGeneratingTags: generateTagsMutation.isPending,
    extractActions: extractActionsMutation.mutateAsync,
    isExtractingActions: extractActionsMutation.isPending,
  };
};
