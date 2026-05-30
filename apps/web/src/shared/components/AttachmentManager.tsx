import React, { useRef, useState } from "react";
import {
  FileText,
  FileImage,
  FileVideo,
  FileSpreadsheet,
  FileArchive,
  File as FileIcon,
  Download,
  Trash2,
  Paperclip,
  Upload,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useAttachments } from "../hooks/useAttachments";
import { ConfirmModal } from "./ConfirmModal";
import type { Attachment, AttachmentTarget } from "@teamhub/shared";

interface AttachmentManagerProps {
  target: AttachmentTarget;
  targetId: string;
  attachments: Attachment[];
  currentUserId?: string;
  queryKeysToInvalidate?: any[][];
}

/* ─── Helper Functions ─────────────────────────────────────────────────────── */
const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith("image/")) return <FileImage className="w-5 h-5 text-emerald-400" />;
  if (mimeType.startsWith("video/")) return <FileVideo className="w-5 h-5 text-indigo-400" />;
  if (mimeType.includes("pdf")) return <FileIcon className="w-5 h-5 text-rose-400" />;
  if (mimeType.includes("word") || mimeType.includes("document"))
    return <FileText className="w-5 h-5 text-blue-400" />;
  if (mimeType.includes("excel") || mimeType.includes("spreadsheet") || mimeType.includes("csv"))
    return <FileSpreadsheet className="w-5 h-5 text-green-400" />;
  if (mimeType.includes("zip") || mimeType.includes("tar") || mimeType.includes("rar") || mimeType.includes("archive"))
    return <FileArchive className="w-5 h-5 text-amber-400" />;
  if (mimeType.startsWith("text/")) return <FileText className="w-5 h-5 text-slate-300" />;
  return <FileIcon className="w-5 h-5 text-slate-400" />;
};

/* ─── Main Component ─────────────────────────────────────────────────────── */
export const AttachmentManager: React.FC<AttachmentManagerProps> = ({
  target,
  targetId,
  attachments = [],
  currentUserId,
  queryKeysToInvalidate,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const { uploadAttachment, deleteAttachment, isUploading, isDeleting, uploadProgress } =
    useAttachments({
      target,
      targetId,
      queryKeysToInvalidate,
    });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      await uploadAttachment(files[i]);
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = e.dataTransfer.files;
      for (let i = 0; i < files.length; i++) {
        await uploadAttachment(files[i]);
      }
    }
  };

  const handleDelete = (id: string) => {
    setDeleteTargetId(id);
  };

  const confirmDelete = async () => {
    if (deleteTargetId) {
      await deleteAttachment(deleteTargetId);
      setDeleteTargetId(null);
    }
  };

  return (
    <div className="w-full mt-8 bg-surface-secondary/40 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-md transition-all">
      {/* Panel Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-white/5 transition-colors select-none"
      >
        <div className="flex items-center gap-2.5">
          <Paperclip className="w-4 h-4 text-primary-accent" />
          <span className="text-sm font-bold text-text-primary">
            Attachments
          </span>
          <span className="bg-white/5 text-text-secondary text-xs px-2 py-0.5 rounded-full font-bold">
            {attachments.length}
          </span>
        </div>
        <button className="text-text-muted hover:text-text-primary transition-colors">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="p-5 border-t border-white/5 space-y-4">
          {/* Drag & Drop File Area */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`relative flex flex-col items-center justify-center border border-dashed rounded-xl p-6 transition-all ${
              dragActive
                ? "border-primary-accent bg-primary-accent/5"
                : "border-white/10 hover:border-white/20 bg-white/1"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />

            {isUploading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-primary-accent animate-spin" />
                <div className="text-center">
                  <p className="text-sm font-semibold text-text-primary">Uploading attachment...</p>
                  <p className="text-xs text-text-muted mt-1">{uploadProgress}% complete</p>
                </div>
                {/* Micro progress bar */}
                <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full bg-primary-accent transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-3">
                  <Upload className="w-5 h-5 text-text-secondary" />
                </div>
                <p className="text-sm font-semibold text-text-primary">
                  Drag and drop files here, or{" "}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-primary-accent hover:underline font-bold focus:outline-none"
                  >
                    browse
                  </button>
                </p>
                <p className="text-xs text-text-muted mt-1">
                  Supports PDF, Word, Excel, Images, Video, Text, ZIP up to 50MB
                </p>
              </div>
            )}
          </div>

          {/* Attachments List */}
          {attachments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {attachments.map((file) => {
                const isUploader = currentUserId && file.uploaded_by === currentUserId;

                return (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3.5 bg-surface-elevated/40 border border-white/5 rounded-xl hover:border-white/10 hover:bg-white/2 group transition-all"
                  >
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-85 transition-opacity cursor-pointer group/link"
                      title={`Open ${file.file_name}`}
                    >
                      <div className="p-2 bg-white/5 rounded-lg shrink-0 group-hover/link:bg-white/10 transition-colors">
                        {getFileIcon(file.file_type)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-text-primary truncate group-hover/link:text-primary-accent transition-colors" title={file.file_name}>
                          {file.file_name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-text-muted">
                          <span>{formatBytes(file.file_size)}</span>
                          <span>•</span>
                          <span className="truncate">
                            By {file.uploader?.display_name || "Unknown"}
                          </span>
                        </div>
                      </div>
                    </a>

                    <div className="flex items-center gap-1.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                      <a
                        href={file.url}
                        download={file.file_name}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-white/5 rounded-lg transition-all"
                        title="Download file"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      {(isUploader || isDeleting) && (
                        <button
                          onClick={() => handleDelete(file.id)}
                          disabled={isDeleting}
                          className="p-1.5 text-text-secondary hover:text-danger hover:bg-danger/10 rounded-lg transition-all disabled:opacity-50"
                          title="Delete attachment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-text-muted text-center py-2">
              No files attached to this document yet.
            </p>
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmDelete}
        title="Delete Attachment"
        description="Are you sure you want to permanently delete this attachment? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
      />
    </div>
  );
};
