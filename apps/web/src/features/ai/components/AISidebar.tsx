import React, { useState } from "react";
import { X, Sparkles, MessageSquare, FileText, ClipboardList, Tag, Heading, Loader2 } from "lucide-react";
import { Button } from "@/shared/components/Button";
import { QAPanel } from "./QAPanel";
import { SummaryPanel } from "./SummaryPanel";
import { ActionItemsPanel } from "./ActionItemsPanel";
import { useDocumentAI } from "../hooks/useDocumentAI";

interface AISidebarProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  onTitleSuggested?: (title: string) => void;
  onInsertContent?: (content: string) => void;
}

export const AISidebar: React.FC<AISidebarProps> = ({
  isOpen,
  onClose,
  documentId,
  onTitleSuggested,
  onInsertContent,
}) => {
  const [activeTab, setActiveTab] = useState<"qa" | "summary" | "actions">("qa");
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const { generateTitle, isGeneratingTitle, generateTags, isGeneratingTags } = useDocumentAI(documentId);

  const handleGenerateTitle = async () => {
    const res = await generateTitle();
    if (res && res.title && onTitleSuggested) {
      onTitleSuggested(res.title);
    }
  };

  const handleGenerateTags = async () => {
    const res = await generateTags();
    if (res && res.tags) {
      setSuggestedTags(res.tags);
    }
  };

  return (
    <div
      className={`fixed right-0 top-0 bottom-0 w-full sm:w-[420px] bg-surface-secondary border-l border-white/5 shadow-2xl z-40 flex flex-col transition-all duration-300 ease-out transform ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {/* Decorative top accent */}
      <div className="h-1 bg-linear-to-r from-primary-accent via-indigo-500 to-blue-500 shrink-0" />

      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-surface-secondary shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary-accent animate-pulse" />
          <h2 className="text-sm font-bold text-text-primary">✨ Document AI</h2>
        </div>
        <Button
          variant="ghost"
          iconOnly
          size="sm"
          onClick={onClose}
          icon={<X className="w-4.5 h-4.5" />}
          className="text-text-muted hover:text-text-primary hover:bg-white/5 border-transparent"
        />
      </div>

      {/* Segmented Tabs Navigation */}
      <div className="px-4 py-2 border-b border-white/5 bg-surface-secondary/40 shrink-0">
        <div className="grid grid-cols-3 bg-surface-elevated p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setActiveTab("qa")}
            className={`py-2 px-1 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
              activeTab === "qa"
                ? "bg-primary-accent/15 text-primary-accent border border-primary-accent/10"
                : "text-text-muted hover:text-text-secondary border border-transparent"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Q&A</span>
          </button>
          <button
            onClick={() => setActiveTab("summary")}
            className={`py-2 px-1 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
              activeTab === "summary"
                ? "bg-primary-accent/15 text-primary-accent border border-primary-accent/10"
                : "text-text-muted hover:text-text-secondary border border-transparent"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Summary</span>
          </button>
          <button
            onClick={() => setActiveTab("actions")}
            className={`py-2 px-1 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
              activeTab === "actions"
                ? "bg-primary-accent/15 text-primary-accent border border-primary-accent/10"
                : "text-text-muted hover:text-text-secondary border border-transparent"
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Tasks</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content Panel */}
      <div className="flex-1 overflow-hidden min-h-0 bg-surface-secondary/20 relative">
        <div className={`h-full ${activeTab === "qa" ? "block" : "hidden"}`}>
          <QAPanel documentId={documentId} />
        </div>
        <div className={`h-full ${activeTab === "summary" ? "block" : "hidden"}`}>
          <SummaryPanel documentId={documentId} />
        </div>
        <div className={`h-full ${activeTab === "actions" ? "block" : "hidden"}`}>
          <ActionItemsPanel documentId={documentId} />
        </div>
      </div>

      {/* Quick Quick-Actions Drawer Footer */}
      <div className="p-4 border-t border-white/5 bg-surface-elevated shrink-0 space-y-3">
        <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest block mb-1">
          ⚡ Quick Actions
        </label>
        
        <div className="grid grid-cols-2 gap-2">
          {/* Suggest Title */}
          <Button
            onClick={handleGenerateTitle}
            disabled={isGeneratingTitle}
            variant="ghost"
            className="w-full flex items-center justify-start gap-2 bg-white/2 hover:bg-white/5 border border-white/5 py-2 px-3 text-xs font-semibold text-text-secondary hover:text-text-primary rounded-xl"
            icon={isGeneratingTitle ? <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-accent" /> : <Heading className="w-3.5 h-3.5 text-primary-accent" />}
          >
            Suggest Title
          </Button>

          {/* Suggest Tags */}
          <Button
            onClick={handleGenerateTags}
            disabled={isGeneratingTags}
            variant="ghost"
            className="w-full flex items-center justify-start gap-2 bg-white/2 hover:bg-white/5 border border-white/5 py-2 px-3 text-xs font-semibold text-text-secondary hover:text-text-primary rounded-xl"
            icon={isGeneratingTags ? <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-accent" /> : <Tag className="w-3.5 h-3.5 text-primary-accent" />}
          >
            Suggest Tags
          </Button>
        </div>

        {/* Suggested Tags Chips list */}
        {suggestedTags.length > 0 && (
          <div className="pt-2 flex flex-col gap-1.5 border-t border-white/5">
            <span className="text-[9px] text-text-muted font-bold block">Suggested Tags (click to insert):</span>
            <div className="flex flex-wrap gap-1">
              {suggestedTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => onInsertContent?.(`#${tag} `)}
                  title="Click to insert tag into document editor"
                  className="text-[9px] bg-primary-accent/10 hover:bg-primary-accent/20 border border-primary-accent/20 text-primary-accent px-2.5 py-1 rounded-lg transition-colors cursor-pointer select-none font-medium"
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
