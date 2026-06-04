import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { X, Search, Sparkles, FileText, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/shared/components/Button";
import { useSemanticSearch } from "../hooks/useSemanticSearch";

interface AISearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
}

export const AISearchModal: React.FC<AISearchModalProps> = ({
  isOpen,
  onClose,
  workspaceId,
}) => {
  const navigate = useNavigate();
  const { query, setQuery, results, isLoading, error, clearSearch } = useSemanticSearch(workspaceId);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close modal on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Focus input on mount
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      setSelectedIndex(0);
    } else {
      clearSearch();
    }
  }, [isOpen, clearSearch]);

  // Keyboard navigation for results
  useEffect(() => {
    if (!isOpen || results.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % results.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const selected = results[selectedIndex];
        if (selected) {
          navigate(`/workspaces/${workspaceId}/docs/${selected.document_id}`);
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, results, selectedIndex, navigate, workspaceId, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-9999 flex items-start justify-center p-4 md:p-12 bg-black/70 backdrop-blur-md">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Box */}
      <div className="relative w-full max-w-2xl bg-surface-secondary/95 border border-white/10 rounded-2xl shadow-2xl overflow-hidden mt-8 md:mt-16 backdrop-blur-xl flex flex-col max-h-[80vh]">
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-primary-accent to-blue-500" />

        {/* Input Bar */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-white/5 relative">
          <Search className="w-5 h-5 text-text-muted shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search workspace semantically with AI... (e.g., 'explain how similarity works')"
            className="flex-1 bg-transparent text-text-primary text-base font-medium placeholder:text-text-muted/40 focus:outline-none"
          />
          <div className="flex items-center gap-2 shrink-0">
            {isLoading ? (
              <Loader2 className="w-4 h-4 text-primary-accent animate-spin" />
            ) : (
              <div className="flex items-center gap-1 text-[10px] bg-white/5 px-2 py-1 rounded border border-white/5 text-text-muted font-mono select-none">
                <span>ESC to close</span>
              </div>
            )}
            <Button
              variant="ghost"
              iconOnly
              size="sm"
              onClick={onClose}
              icon={<X className="w-4 h-4" />}
              className="text-text-muted hover:text-text-primary hover:bg-white/5 border-transparent"
            />
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2">
          {error && (
            <div className="px-4 py-8 text-center text-sm text-danger flex flex-col items-center gap-2">
              <span>{error}</span>
            </div>
          )}

          {!isLoading && results.length === 0 && query.trim().length > 0 && (
            <div className="px-4 py-12 text-center flex flex-col items-center gap-2 text-text-muted">
              <Sparkles className="w-8 h-8 text-text-muted/30" />
              <p className="text-sm font-semibold">No semantic matches found</p>
              <p className="text-xs">Try asking about topics discussed in your team's documents.</p>
            </div>
          )}

          {!isLoading && results.length === 0 && !query.trim() && (
            <div className="px-4 py-12 text-center flex flex-col items-center gap-2 text-text-muted">
              <Sparkles className="w-10 h-10 text-primary-accent/30 animate-pulse" />
              <p className="text-sm font-semibold text-text-secondary">AI Semantic Workspace Search</p>
              <p className="text-xs max-w-md">
                Search documents by **meaning** rather than exact keywords. This queries our vector database and downloads relevant attachment text inline.
              </p>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-1">
              <div className="px-3 py-1.5 text-[10px] font-bold text-text-muted uppercase tracking-widest flex justify-between">
                <span>Results</span>
                <span>Press ↑↓ to navigate, ↵ to open</span>
              </div>

              {results.map((res, index) => {
                const isSelected = index === selectedIndex;
                const matchScore = Math.round(res.similarity * 100);

                return (
                  <div
                    key={`${res.document_id}-${res.chunk_index}`}
                    onClick={() => {
                      navigate(`/workspaces/${workspaceId}/docs/${res.document_id}`);
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                      isSelected
                        ? "bg-primary-accent/10 border-l-2 border-primary-accent text-text-primary"
                        : "hover:bg-white/2 text-text-secondary border-l-2 border-transparent"
                    }`}
                  >
                    <FileText className={`w-5 h-5 shrink-0 mt-0.5 ${isSelected ? "text-primary-accent" : "text-text-muted"}`} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className={`font-bold text-sm truncate ${isSelected ? "text-primary-accent" : "text-text-primary"}`}>
                          {res.document_title || "Untitled Document"}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold shrink-0 ${
                          matchScore > 70 
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                            : matchScore > 50 
                            ? "bg-primary-accent/10 text-primary-accent border border-primary-accent/20"
                            : "bg-white/5 text-text-muted border border-white/5"
                        }`}>
                          {matchScore}% match
                        </span>
                      </div>

                      {res.section_title && (
                        <p className="text-[10px] text-text-muted font-semibold truncate mb-1 bg-white/5 px-1.5 py-0.5 rounded w-fit max-w-full">
                          {res.section_title.split(" > ").pop()}
                        </p>
                      )}

                      <p className="text-xs text-text-muted line-clamp-2 leading-relaxed font-normal">
                        {res.chunk_text}
                      </p>
                    </div>

                    <ArrowRight className={`w-4 h-4 shrink-0 self-center transition-transform ${
                      isSelected ? "translate-x-0.5 text-primary-accent" : "opacity-0"
                    }`} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
