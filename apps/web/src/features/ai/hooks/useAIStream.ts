import { useState, useCallback, useRef, useEffect } from "react";
import type { SourceChunk } from "../api/ai.api";

interface UseAIStreamReturn {
  text: string;
  sources: SourceChunk[];
  isLoading: boolean;
  error: string | null;
  startStream: (streamUrl: string) => void;
  stopStream: () => void;
  resetStream: () => void;
}

export const useAIStream = (): UseAIStreamReturn => {
  const [text, setText] = useState("");
  const [sources, setSources] = useState<SourceChunk[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);

  const stopStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsLoading(false);
  }, []);

  const resetStream = useCallback(() => {
    stopStream();
    setText("");
    setSources([]);
    setError(null);
  }, [stopStream]);

  const startStream = useCallback(
    (streamUrl: string) => {
      resetStream();
      setIsLoading(true);

      const eventSource = new EventSource(streamUrl);
      eventSourceRef.current = eventSource;

      // Handle sources chunk event (for RAG Q&A)
      eventSource.addEventListener("sources", (e: MessageEvent) => {
        try {
          const parsed = JSON.parse(e.data);
          if (parsed.chunks) {
            setSources(parsed.chunks);
          }
        } catch (err) {
          console.error("Failed to parse sources event", err);
        }
      });

      // Handle token chunk event
      eventSource.addEventListener("token", (e: MessageEvent) => {
        try {
          const parsed = JSON.parse(e.data);
          if (parsed.content) {
            setText((prev) => prev + parsed.content);
          }
        } catch (err) {
          console.error("Failed to parse token event", err);
        }
      });

      // Handle completion
      eventSource.addEventListener("done", () => {
        stopStream();
      });

      // Handle stream errors
      eventSource.addEventListener("error", (e: Event) => {
        console.error("EventSource error occurred:", e);
        // Sometimes standard message streams are parsed differently or end abruptly
        // We retrieve the error details if custom error event is emitted, else generic message
        let errMsg = "Streaming connection lost.";
        
        // If the EventSource readyState is CLOSED, it closed cleanly or failed to connect
        if (eventSource.readyState === EventSource.CLOSED) {
          errMsg = "Failed to establish a streaming connection.";
        }

        setError(errMsg);
        stopStream();
      });
    },
    [resetStream, stopStream]
  );

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  return {
    text,
    sources,
    isLoading,
    error,
    startStream,
    stopStream,
    resetStream,
  };
};
