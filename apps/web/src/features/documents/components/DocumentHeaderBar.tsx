import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  AlertCircle,
  MoreHorizontal,
  Archive,
  Trash2,
  LinkIcon,
  Clock,
  FileText,
  ImagePlus,
  Paperclip,
  Keyboard,
  Sparkles,
  Download,
} from "lucide-react";
import { Button } from "@/shared/components/Button";
import { useClickOutside } from "@/shared/hooks/useClickOutside";

interface DocumentHeaderBarProps {
  workspaceId: string;
  documentId: string;
  title: string;
  wordInfo: { words: number; chars: number; readingTime: string };
  saveStatus: "saved" | "saving" | "unsaved" | "error";
  isUploading: boolean;
  isUploadingAttachment: boolean;
  onImageUpload: (file: File) => Promise<any>;
  onAttachmentUpload: (file: File) => Promise<any>;
  onShowShortcuts: () => void;
  onArchive: () => Promise<any>;
  onDeleteClick: () => void;
  isAISidebarOpen: boolean;
  onToggleAI: () => void;
  onExportMarkdown: () => void;
  onExportPDF: () => void;
}

export const DocumentHeaderBar = ({
  workspaceId,
  title,
  wordInfo,
  saveStatus,
  isUploading,
  isUploadingAttachment,
  onImageUpload,
  onAttachmentUpload,
  onShowShortcuts,
  onArchive,
  onDeleteClick,
  isAISidebarOpen,
  onToggleAI,
  onExportMarkdown,
  onExportPDF,
}: DocumentHeaderBarProps) => {
  const [showOptions, setShowOptions] = useState(false);
  const optionsRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  // Close options menu on click outside, ignoring clicks on the trigger button
  useClickOutside(optionsRef, () => setShowOptions(false), [triggerRef]);

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await onImageUpload(file);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAttachmentFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await onAttachmentUpload(file);
    } finally {
      if (attachmentInputRef.current) attachmentInputRef.current.value = "";
    }
  };

  return (
    <header className="flex items-center justify-between px-6 py-2.5 border-b border-white/5 bg-surface-secondary/50 backdrop-blur-xl shrink-0 relative z-30">
      <div className="flex items-center gap-3 min-w-0">
        {/* Back Button */}
        <Link
          to={`/workspaces/${workspaceId}/documents`}
          className="p-1.5 text-text-muted hover:text-text-primary hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2 shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium hidden sm:inline">Docs</span>
        </Link>

        <div className="w-px h-4 bg-white/10" />

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-text-muted truncate">
          <FileText className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate max-w-[200px] font-medium">
            {title || "Untitled"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Word Count */}
        <div className="hidden md:flex items-center gap-3 text-xs text-text-muted mr-2 select-none">
          <span>{wordInfo.words} words</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {wordInfo.readingTime}
          </span>
          <span className="text-white/10">•</span>
          <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded border border-white/5 flex items-center gap-1">
            Press{" "}
            <kbd className="font-mono font-bold text-text-secondary bg-white/5 px-1 rounded text-[9px] border border-white/10">
              ?
            </kbd>{" "}
            for shortcuts
          </span>
        </div>

        {/* Upload Image Trigger */}
        <Button
          variant="ghost"
          iconOnly
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="p-1.5 text-text-muted hover:text-text-primary hover:bg-white/5 border border-transparent rounded-lg transition-colors"
          title="Upload image"
          icon={
            isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ImagePlus className="w-4 h-4" />
            )
          }
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageFileChange}
        />

        {/* Upload Attachment Trigger */}
        <Button
          variant="ghost"
          iconOnly
          size="sm"
          onClick={() => attachmentInputRef.current?.click()}
          disabled={isUploadingAttachment}
          className="p-1.5 text-text-muted hover:text-text-primary hover:bg-white/5 border border-transparent rounded-lg transition-colors"
          title="Attach file inline"
          icon={
            isUploadingAttachment ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Paperclip className="w-4 h-4" />
            )
          }
        />
        <input
          ref={attachmentInputRef}
          type="file"
          className="hidden"
          onChange={handleAttachmentFileChange}
        />

        {/* Toggle AI Sidebar */}
        <Button
          variant={isAISidebarOpen ? "accent" : "ghost"}
          size="sm"
          onClick={onToggleAI}
          className="p-1.5 text-text-muted hover:text-text-primary hover:bg-white/5 border border-transparent rounded-lg transition-colors flex items-center gap-1.5 px-2.5"
          title="Toggle AI Assistant"
          icon={<Sparkles className="w-4.5 h-4.5 text-primary-accent" />}
        >
          <span className="text-xs font-bold hidden sm:inline">Ask AI</span>
        </Button>

        {/* Save Status */}
        <div className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-lg bg-white/5">
          {saveStatus === "saving" && (
            <span className="text-text-muted flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin" />
              Saving
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="text-primary-accent/70 flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3" />
              Saved
            </span>
          )}
          {saveStatus === "unsaved" && (
            <span className="text-warning flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-warning rounded-full animate-pulse" />
              Editing
            </span>
          )}
          {saveStatus === "error" && (
            <span className="text-danger flex items-center gap-1.5">
              <AlertCircle className="w-3 h-3" />
              Error
            </span>
          )}
        </div>

        <div className="w-px h-4 bg-white/10" />

        {/* Keyboard Shortcuts Trigger */}
        <Button
          variant="ghost"
          iconOnly
          size="sm"
          onClick={onShowShortcuts}
          className="p-1.5 text-text-muted hover:text-text-primary hover:bg-white/5 border border-transparent rounded-lg transition-colors"
          title="Keyboard shortcuts (?)"
          icon={<Keyboard className="w-4 h-4" />}
        />

        {/* Options Dropdown */}
        <div className="relative" ref={optionsRef}>
          <Button
            ref={triggerRef}
            variant="ghost"
            iconOnly
            size="sm"
            onClick={() => setShowOptions(!showOptions)}
            className="p-1.5 text-text-muted hover:text-text-primary hover:bg-white/10 border border-transparent rounded-lg transition-colors"
            icon={<MoreHorizontal className="w-5 h-5" />}
          />

          {showOptions && (
            <div className="popover-panel absolute right-0 top-full mt-2 w-64 p-1.5 space-y-0.5 flex flex-col z-50 animate-in fade-in duration-150">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  setShowOptions(false);
                  toast.success("Link copied to clipboard");
                }}
                className="w-full justify-start gap-3 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-white/8 rounded-md transition-all border border-transparent font-medium"
                icon={<LinkIcon className="w-4 h-4 text-text-muted" />}
              >
                Copy link
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  setShowOptions(false);
                  await onArchive();
                }}
                className="w-full justify-start gap-3 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-white/8 rounded-md transition-all border border-transparent font-medium"
                icon={<Archive className="w-4 h-4 text-text-muted" />}
              >
                Archive
              </Button>
              <div className="h-px bg-white/5 my-1" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowOptions(false);
                  onExportPDF();
                }}
                className="w-full justify-start gap-3 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-white/8 rounded-md transition-all border border-transparent font-medium"
                icon={<Download className="w-4 h-4 text-primary-accent" />}
              >
                Export as PDF (.pdf)
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowOptions(false);
                  onExportMarkdown();
                }}
                className="w-full justify-start gap-3 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-white/8 rounded-md transition-all border border-transparent font-medium"
                icon={<FileText className="w-4 h-4 text-primary-accent" />}
              >
                Export as Markdown (.md)
              </Button>
              <div className="h-px bg-white/5 my-1" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowOptions(false);
                  onDeleteClick();
                }}
                className="w-full justify-start gap-3 px-3 py-2 text-sm text-danger hover:bg-danger/10 hover:text-danger rounded-md transition-all border border-transparent font-medium"
                icon={<Trash2 className="w-4 h-4 text-danger/80" />}
              >
                Delete
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
