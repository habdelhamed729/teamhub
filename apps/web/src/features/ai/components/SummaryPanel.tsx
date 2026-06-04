import React, { useState, useEffect } from "react";
import { Sparkles, FileText, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/shared/components/Button";
import { getStreamToken } from "../api/ai.api";
import { useAIStream } from "../hooks/useAIStream";
import { parseMarkdown } from "../utils/markdown";

interface SummaryPanelProps {
  documentId: string;
}

export const SummaryPanel: React.FC<SummaryPanelProps> = ({ documentId }) => {
  const [length, setLength] = useState<"short" | "medium" | "long">("medium");
  const { text, isLoading, error, startStream, resetStream } = useAIStream();

  // Reset summary output when documentId changes
  useEffect(() => {
    resetStream();
  }, [documentId, resetStream]);

  const handleGenerate = async () => {
    try {
      const { url } = await getStreamToken(documentId, "summarize", { length });
      startStream(url);
    } catch (err: any) {
      console.error("Failed to start summarization stream:", err);
    }
  };



  return (
    <div className="flex flex-col h-full overflow-hidden p-4 space-y-4">
      {/* Settings Selector */}
      <div className="flex flex-col gap-2 shrink-0">
        <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
          Summary Length
        </label>
        <div className="grid grid-cols-3 bg-surface-elevated p-1 rounded-xl border border-white/5">
          {(["short", "medium", "long"] as const).map((len) => (
            <button
              key={len}
              disabled={isLoading}
              onClick={() => setLength(len)}
              className={`py-2 text-xs font-semibold rounded-lg capitalize cursor-pointer transition-all active:scale-[0.98] ${
                length === len
                  ? "bg-primary-accent/15 text-primary-accent border border-primary-accent/20"
                  : "text-text-muted hover:text-text-secondary hover:bg-white/2 border border-transparent"
              }`}
            >
              {len}
            </button>
          ))}
        </div>
      </div>

      {/* Action Button */}
      <div className="shrink-0">
        <Button
          onClick={handleGenerate}
          disabled={isLoading}
          variant={text ? "secondary" : "primary"}
          className="w-full flex items-center justify-center gap-2"
          icon={
            isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : text ? (
              <RefreshCw className="w-4 h-4" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )
          }
        >
          {isLoading 
            ? "Summarizing..." 
            : text 
            ? "Regenerate Summary" 
            : "Generate Document Summary"}
        </Button>
      </div>

      {/* Summary Output Box */}
      <div className="flex-1 overflow-y-auto bg-surface-elevated/40 border border-white/5 rounded-2xl p-4 min-h-0 relative">
        {error && (
          <div className="flex items-center gap-2 text-danger p-2 bg-danger/5 border border-danger/10 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="text-xs">{error}</span>
          </div>
        )}

        {!text && !isLoading && !error && (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-text-muted">
            <FileText className="w-10 h-10 text-primary-accent/30 mb-2" />
            <p className="text-xs">No summary generated yet. Select a length and click the button above to begin.</p>
          </div>
        )}

        {text && (
          <div className="prose prose-invert max-w-none text-left select-text">
            {parseMarkdown(text)}
          </div>
        )}

        {isLoading && !text && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-surface-secondary/80 backdrop-blur-xs rounded-2xl">
            <Loader2 className="w-6 h-6 text-primary-accent animate-spin" />
            <span className="text-xs text-text-muted">Reading document...</span>
          </div>
        )}
      </div>
    </div>
  );
};
