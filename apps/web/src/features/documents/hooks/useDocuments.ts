import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as DocumentsAPI from "../api/documents.api";
import type { CreateDocumentInput } from "@teamhub/shared";

export const useDocuments = (workspaceId: string, page?: number, limit?: number) => {
  return useQuery({
    queryKey: ["documents", workspaceId, page, limit],
    queryFn: () => DocumentsAPI.listDocuments(workspaceId, page, limit),
  });
};

export const useArchivedDocuments = (workspaceId: string, page?: number, limit?: number) => {
  return useQuery({
    queryKey: ["archived-documents", workspaceId, page, limit],
    queryFn: () => DocumentsAPI.listArchivedDocuments(workspaceId, page, limit),
  });
};

export const useCreateDocument = (workspaceId: string) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateDocumentInput) =>
      DocumentsAPI.createDocument(workspaceId, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents", workspaceId] });
      qc.invalidateQueries({ queryKey: ["archived-documents", workspaceId] });
    },
  });
};

export const useArchiveDocument = (workspaceId: string) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (documentId: string) =>
      DocumentsAPI.archiveDocument(documentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents", workspaceId] });
      qc.invalidateQueries({ queryKey: ["archived-documents", workspaceId] });
    },
  });
};

export const useRestoreDocument = (workspaceId: string) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (documentId: string) =>
      DocumentsAPI.restoreDocument(documentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents", workspaceId] });
      qc.invalidateQueries({ queryKey: ["archived-documents", workspaceId] });
    },
  });
};

export const useDeleteDocument = (workspaceId: string) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (documentId: string) => DocumentsAPI.deleteDocument(documentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents", workspaceId] });
      qc.invalidateQueries({ queryKey: ["archived-documents", workspaceId] });
    },
  });
};
