import type { JSONContent } from "@tiptap/react";

export type SaveStatus = "saved" | "saving" | "unsaved" | "error";
export interface UseAutoSaveOptions {
  documentId: string;
  title: string;
  content: JSONContent | null;
  enabled?: boolean;
  debounceMs?: number;
}
