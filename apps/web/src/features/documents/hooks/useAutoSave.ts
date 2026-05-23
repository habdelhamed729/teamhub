import { useCallback, useEffect, useRef, useState } from "react";
import type { SaveStatus, UseAutoSaveOptions } from "../types";
import { useUpdateDocument } from "./useDocument";

export const useAutoSave = ({
  documentId,
  content,
  title,
  enabled = true,
  debounceMs = 1500,
}: UseAutoSaveOptions) => {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasChangedRef = useRef(false);
  const latestRef = useRef({ title, content });
  const isFirstRender = useRef(true);

  // Always keep latest values in ref
  latestRef.current = { title, content };

  // Reset states when documentId changes
  useEffect(() => {
    isFirstRender.current = true;
    hasChangedRef.current = false;
    setSaveStatus("saved");
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [documentId]);

  // Detect changes after initial render
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (enabled) {
      hasChangedRef.current = true;
      setSaveStatus("unsaved");
    }
  }, [title, content, enabled]);

  const { mutateAsync: updateDocument } = useUpdateDocument();

  const saveNow = useCallback(async () => {
    if (!enabled || !hasChangedRef.current) return;

    try {
      setSaveStatus("saving");
      await updateDocument({
        documentId,
        dto: {
          title: latestRef.current.title,
          content: latestRef.current.content,
        },
      });
      hasChangedRef.current = false;
      setSaveStatus("saved");
    } catch (error) {
      console.error("Auto-save failed:", error);
      setSaveStatus("error");
    }
  }, [documentId, enabled, updateDocument]);

  // Debounced auto-save
  useEffect(() => {
    if (!enabled || saveStatus !== "unsaved") return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      saveNow();
    }, debounceMs);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [enabled, saveStatus, debounceMs, saveNow]);

  // Flush on visibility change or unmount
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && hasChangedRef.current) {
        saveNow();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (hasChangedRef.current) {
        saveNow();
      }
    };
  }, [saveNow]);

  return { saveStatus, saveNow };
};
