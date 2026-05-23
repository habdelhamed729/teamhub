import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as DocumentsAPI from "../api/documents.api";

export const useDocument = (documentId: string) => {
  return useQuery({
    queryKey: ["document", documentId],
    queryFn: () => DocumentsAPI.getDocument(documentId),
  });
};

export const useUpdateDocument = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ documentId, dto }: { documentId: string; dto: any }) =>
      DocumentsAPI.updateDocument(documentId, dto),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: ["document", variables.documentId] }),
  });
};
