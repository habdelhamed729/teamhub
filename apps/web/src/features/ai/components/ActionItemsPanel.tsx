import React, { useState, useEffect } from "react";
import { Sparkles, Clipboard, Loader2, User as UserIcon, Calendar, CheckSquare, Copy, Check } from "lucide-react";
import { Button } from "@/shared/components/Button";
import { useDocumentAI } from "../hooks/useDocumentAI";
import type { ActionItem } from "../api/ai.api";
import { toast } from "sonner";

interface ActionItemsPanelProps {
  documentId: string;
}

export const ActionItemsPanel: React.FC<ActionItemsPanelProps> = ({ documentId }) => {
  const [items, setItems] = useState<ActionItem[]>([]);
  const [completed, setCompleted] = useState<Record<number, boolean>>({});
  const [hasExtracted, setHasExtracted] = useState(false);
  const [copied, setCopied] = useState(false);
  const { extractActions, isExtractingActions } = useDocumentAI(documentId);

  // Reset extracted tasks when documentId changes
  useEffect(() => {
    setItems([]);
    setCompleted({});
    setHasExtracted(false);
    setCopied(false);
  }, [documentId]);

  const handleExtract = async () => {
    try {
      const res = await extractActions();
      setItems(res.items);
      setCompleted({});
      setHasExtracted(true);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleComplete = (idx: number) => {
    setCompleted((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const handleCopyMarkdown = () => {
    if (items.length === 0) return;

    const markdown = items
      .map((item) => {
        const assigneeStr = item.assignee ? ` (@${item.assignee})` : "";
        const dueStr = item.due_date ? ` [due: ${item.due_date}]` : "";
        const priorityStr = ` [priority: ${item.priority}]`;
        return `- [ ] ${item.action}${assigneeStr}${dueStr}${priorityStr}`;
      })
      .join("\n");

    navigator.clipboard.writeText(markdown);
    setCopied(true);
    toast.success("Checklist copied as Markdown!");
    setTimeout(() => setCopied(false), 2000);
  };

  const getPriorityBadge = (priority: string) => {
    const p = priority.toLowerCase();
    if (p === "high") {
      return "bg-danger/10 text-danger border border-danger/25";
    }
    if (p === "medium") {
      return "bg-warning/10 text-warning border border-warning/25";
    }
    return "bg-primary-accent/10 text-primary-accent border border-primary-accent/25";
  };

  return (
    <div className="flex flex-col h-full overflow-hidden p-4 space-y-4">
      {/* Extract Button */}
      <div className="shrink-0">
        <Button
          onClick={handleExtract}
          disabled={isExtractingActions}
          variant={hasExtracted ? "secondary" : "primary"}
          className="w-full flex items-center justify-center gap-2"
          icon={
            isExtractingActions ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Clipboard className="w-4 h-4" />
            )
          }
        >
          {isExtractingActions 
            ? "Extracting Tasks..." 
            : hasExtracted 
            ? "Re-extract Action Items" 
            : "Extract Action Items"}
        </Button>
      </div>

      {/* Task List Box */}
      <div className="flex-1 overflow-y-auto bg-surface-elevated/40 border border-white/5 rounded-2xl p-4 min-h-0 relative">
        {isExtractingActions && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-surface-secondary/80 backdrop-blur-xs rounded-2xl">
            <Loader2 className="w-6 h-6 text-primary-accent animate-spin" />
            <span className="text-xs text-text-muted">Scanning document text...</span>
          </div>
        )}

        {!hasExtracted && !isExtractingActions && (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-text-muted">
            <CheckSquare className="w-10 h-10 text-primary-accent/30 mb-2" />
            <p className="text-xs">No action items extracted. Click the button above to scan this document for deliverables, assignees, and deadlines.</p>
          </div>
        )}

        {hasExtracted && items.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-text-muted">
            <Sparkles className="w-10 h-10 text-emerald-400/30 mb-2" />
            <p className="text-sm font-semibold text-text-secondary">All clean!</p>
            <p className="text-xs">No action items or check-lists detected in this document.</p>
          </div>
        )}

        {hasExtracted && items.length > 0 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                Extracted Checklist ({items.length})
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyMarkdown}
                className="text-[10px] hover:bg-white/5 gap-1.5 px-2 py-1 text-text-secondary border-transparent"
                icon={copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              >
                {copied ? "Copied" : "Copy Markdown"}
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => {
                const isDone = !!completed[idx];
                return (
                  <div
                    key={idx}
                    onClick={() => toggleComplete(idx)}
                    className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer border transition-all ${
                      isDone 
                        ? "bg-white/1 border-white/2 opacity-60" 
                        : "bg-surface-elevated border-white/5 hover:border-primary-accent/20"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isDone}
                      onChange={() => {}} // toggled by parent div onClick
                      className="mt-1 h-3.5 w-3.5 rounded border-white/15 bg-transparent text-primary-accent focus:ring-primary-accent/30 cursor-pointer"
                    />

                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-relaxed ${
                        isDone ? "line-through text-text-muted" : "text-text-primary"
                      }`}>
                        {item.action}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2">
                        {/* Priority */}
                        <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold shrink-0 ${getPriorityBadge(item.priority)}`}>
                          {item.priority}
                        </span>

                        {/* Assignee */}
                        {item.assignee && (
                          <span className="text-[10px] text-text-muted flex items-center gap-1 shrink-0 font-medium">
                            <UserIcon className="w-3 h-3 text-primary-accent/70" />
                            {item.assignee}
                          </span>
                        )}

                        {/* Due Date */}
                        {item.due_date && (
                          <span className="text-[10px] text-text-muted flex items-center gap-1 shrink-0 font-medium">
                            <Calendar className="w-3 h-3 text-primary-accent/70" />
                            {item.due_date}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
