import { api } from "@/shared/services/axios";

export interface SourceChunk {
  chunk_text: string;
  similarity: number;
  section_title: string;
}

export interface QAResponse {
  answer: string;
  sources: SourceChunk[];
  model: string;
}

export interface SummarizeResponse {
  summary: string;
}

export interface TagsResponse {
  tags: string[];
}

export interface TitleResponse {
  title: string;
}

export interface ActionItem {
  action: string;
  assignee: string | null;
  priority: string;
  due_date: string | null;
}

export interface ActionExtractionResponse {
  items: ActionItem[];
}

export interface SearchResult {
  document_id: string;
  chunk_index: number;
  chunk_text: string;
  section_title: string;
  document_title: string;
  similarity: number;
}

export interface SearchResponse {
  results: SearchResult[];
}

export interface StreamTokenResponse {
  token: string;
  url: string;
}

export const documentQA = async (documentId: string, question: string): Promise<QAResponse> => {
  const { data } = await api.post(`/ai/documents/${documentId}/qa`, { question });
  return data.data as QAResponse;
};

export const summarizeDocument = async (
  documentId: string,
  length: "short" | "medium" | "long" = "medium"
): Promise<SummarizeResponse> => {
  const { data } = await api.post(`/ai/documents/${documentId}/summarize`, { length });
  return data.data as SummarizeResponse;
};

export const generateTags = async (documentId: string): Promise<TagsResponse> => {
  const { data } = await api.post(`/ai/documents/${documentId}/generate-tags`);
  return data.data as TagsResponse;
};

export const generateTitle = async (documentId: string): Promise<TitleResponse> => {
  const { data } = await api.post(`/ai/documents/${documentId}/generate-title`);
  return data.data as TitleResponse;
};

export const extractActionItems = async (documentId: string): Promise<ActionExtractionResponse> => {
  const { data } = await api.post(`/ai/documents/${documentId}/extract-actions`);
  return data.data as ActionExtractionResponse;
};

export const workspaceSemanticSearch = async (
  workspaceId: string,
  query: string,
  limit = 10
): Promise<SearchResponse> => {
  const { data } = await api.post(`/ai/workspaces/${workspaceId}/search`, { query, limit });
  return data.data as SearchResponse;
};

export const getStreamToken = async (
  documentId: string,
  action: "qa" | "summarize",
  payload: Record<string, any>
): Promise<StreamTokenResponse> => {
  const { data } = await api.post(`/ai/stream/token`, {
    documentId,
    action,
    payload,
  });
  return data.data as StreamTokenResponse;
};
