import { api } from "@/shared/services/axios";
import type {
  CreateDocumentInput,
  UpdateDocumentInput,
  Document,
} from "@teamhub/shared";

export const listDocuments = async (workspaceId: string, page?: number, limit?: number) => {
  const { data } = await api.get(`/workspaces/${workspaceId}/documents`, {
    params: { page, limit },
  });
  return data.data as {
    documents: Document[];
    pagination?: { page: number; limit: number; total: number; totalPages: number };
  };
};

export const listArchivedDocuments = async (workspaceId: string, page?: number, limit?: number) => {
  const { data } = await api.get(
    `/workspaces/${workspaceId}/documents/archived`,
    { params: { page, limit } }
  );
  return data.data as {
    documents: Document[];
    pagination?: { page: number; limit: number; total: number; totalPages: number };
  };
};

export const createDocument = async (
  workspaceId: string,
  dto: CreateDocumentInput,
) => {
  const { data } = await api.post(`/workspaces/${workspaceId}/documents`, dto);
  return data.data.document as Document;
};

export const getDocument = async (documentId: string) => {
  const { data } = await api.get(`/documents/${documentId}`);
  return data.data.document as Document;
};

export const updateDocument = async (
  documentId: string,
  dto: UpdateDocumentInput,
) => {
  const { data } = await api.patch(`/documents/${documentId}`, dto);
  return data.data.document as Document;
};

export const archiveDocument = async (documentId: string) => {
  const { data } = await api.patch(`/documents/${documentId}/archive`);
  return data.data.document as Document;
};

export const restoreDocument = async (documentId: string) => {
  const { data } = await api.patch(`/documents/${documentId}/restore`);
  return data.data.document as Document;
};

export const deleteDocument = async (documentId: string) => {
  await api.delete(`/documents/${documentId}`);
};

export const uploadImage = async (file: File) => {
  const formData = new FormData();
  formData.append("image", file);
  const { data } = await api.post("/documents/upload-image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.data as { url: string; public_id: string; width: number; height: number };
};
