import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import {
  MoreHorizontal,
  FileText,
  Archive,
  Trash2,
  Paperclip,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import type { Document } from "@teamhub/shared";

interface DocumentCardProps {
  document: Document;
  workspaceId: string;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  compact?: boolean;
  listMode?: boolean;
}

/* Extract plain text preview from Tiptap JSON content */
const getContentPreview = (content: unknown, maxLen = 100): string => {
  if (!content || typeof content !== "object") return "";
  try {
    const extract = (node: any): string => {
      if (node.text) return node.text;
      if (node.content) return node.content.map(extract).join(" ");
      return "";
    };
    const text = extract(content).trim();
    return text.length > maxLen ? text.slice(0, maxLen) + "…" : text;
  } catch {
    return "";
  }
};

export const DocumentCard = ({
  document,
  workspaceId,
  onArchive,
  onDelete,
  compact = false,
  listMode = false,
}: DocumentCardProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, []);

  const preview = getContentPreview(document.content);
  const isRecent =
    Date.now() - new Date(document.updated_at).getTime() < 1000 * 60 * 60; // 1 hour

  /* ── List Mode ────────────────────────────────────────────────────── */
  if (listMode) {
    return (
      <Link
        to={`/workspaces/${workspaceId}/docs/${document.id}`}
        className="group flex items-center gap-4 p-4 bg-surface-elevated/30 border border-white/5 rounded-xl hover:border-primary-accent/30 hover:bg-surface-elevated/60 transition-all"
      >
        <div className="p-2 bg-white/5 rounded-lg group-hover:bg-primary-accent/10 transition-colors shrink-0">
          {document.icon ? (
            <span className="text-sm leading-none flex items-center justify-center w-4 h-4 select-none">
              {document.icon}
            </span>
          ) : (
            <FileText className="w-4 h-4 text-text-muted group-hover:text-primary-accent transition-colors" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-text-primary text-sm group-hover:text-primary-accent transition-colors truncate">
            {document.title || "Untitled"}
          </h3>
          {preview && (
            <p className="text-xs text-text-muted truncate mt-0.5">
              {preview}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-text-muted shrink-0">
          {document.attachments && document.attachments.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-text-muted/80 bg-white/5 px-2 py-0.5 rounded-md font-medium shrink-0">
              <Paperclip className="w-3.5 h-3.5 text-primary-accent" />
              <span>{document.attachments.length}</span>
            </div>
          )}
          {isRecent && (
            <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          )}
          <span>
            {formatDistanceToNow(new Date(document.updated_at), {
              addSuffix: true,
            })}
          </span>
          {document.creator?.display_name && (
            <>
              <span className="text-white/10">•</span>
              <span>{document.creator.display_name}</span>
            </>
          )}
        </div>
      </Link>
    );
  }

  /* ── Grid/Compact Mode ──────────────────────────────────────────── */
  return (
    <div
      className={`group relative flex flex-col bg-surface-elevated/40 backdrop-blur-xl border border-white/5 rounded-2xl hover:border-primary-accent/30 transition-all duration-300 hover:shadow-[0_0_25px_-5px_rgba(94,234,212,0.12)] overflow-visible ${compact ? "p-4" : "p-5"}`}
    >
      {/* Glow */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-accent/8 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="flex justify-between items-start mb-3 relative z-10">
        <Link
          to={`/workspaces/${workspaceId}/docs/${document.id}`}
          className="flex items-start gap-3 flex-1 min-w-0"
        >
          <div
            className={`p-2 bg-white/5 rounded-lg border border-white/10 group-hover:bg-primary-accent/10 group-hover:border-primary-accent/20 transition-colors shrink-0 ${compact ? "mt-0" : "mt-0.5"}`}
          >
            {document.icon ? (
              <span className={`leading-none flex items-center justify-center select-none ${compact ? "text-sm w-4 h-4" : "text-base w-5 h-5"}`}>
                {document.icon}
              </span>
            ) : (
              <FileText
                className={`text-text-secondary group-hover:text-primary-accent transition-colors ${compact ? "w-4 h-4" : "w-5 h-5"}`}
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {isRecent && (
                <div className="w-1.5 h-1.5 rounded-full bg-success shrink-0 animate-pulse" />
              )}
              <h3
                className={`font-bold text-text-primary group-hover:text-primary-accent transition-colors line-clamp-1 ${compact ? "text-sm" : "text-base"}`}
              >
                {document.title || "Untitled Document"}
              </h3>
            </div>
            <p className="text-xs text-text-muted mt-1 font-medium">
              {formatDistanceToNow(new Date(document.updated_at), {
                addSuffix: true,
              })}
            </p>
          </div>
        </Link>

        {/* Menu */}
        {!compact && (
          <div className="relative ml-2 shrink-0" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 text-text-muted hover:text-text-primary hover:bg-white/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-surface-elevated border border-white/10 rounded-xl shadow-2xl shadow-black/50 z-50 py-1">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onArchive(document.id);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors font-medium"
                >
                  <Archive className="w-3.5 h-3.5" />
                  Archive
                </button>
                <div className="h-px bg-white/5 my-1" />
                {showDeleteConfirm ? (
                  <div className="px-3 py-2 space-y-2">
                    <p className="text-[11px] text-danger font-medium">
                      Delete permanently?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          setShowDeleteConfirm(false);
                          onDelete(document.id);
                        }}
                        className="flex-1 text-[11px] font-bold text-white bg-danger hover:bg-danger/80 py-1 rounded-md transition-colors"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 text-[11px] font-bold text-text-secondary bg-white/5 hover:bg-white/10 py-1 rounded-md transition-colors"
                      >
                        No
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-xs text-danger hover:bg-danger/10 transition-colors font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content preview */}
      {!compact && preview && (
        <p className="text-xs text-text-muted/70 line-clamp-2 mb-4 leading-relaxed relative z-10 pl-12">
          {preview}
        </p>
      )}

      {/* Footer */}
      <div
        className={`mt-auto flex items-center justify-between relative z-10 ${compact ? "" : "pt-3 border-t border-white/5"}`}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {document.creator?.avatar_url ? (
              <img
                src={document.creator.avatar_url}
                alt=""
                className="w-5 h-5 rounded-full ring-1 ring-surface-elevated"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-linear-to-br from-primary-accent to-blue-500 flex items-center justify-center text-[9px] font-bold text-main-bg ring-1 ring-surface-elevated">
                {document.creator?.display_name?.charAt(0).toUpperCase() || "?"}
              </div>
            )}
            <span className="text-[11px] text-text-muted truncate max-w-[80px]">
              {document.creator?.display_name || "Unknown"}
            </span>
          </div>
          {document.attachments && document.attachments.length > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-text-muted/80 bg-white/5 px-1.5 py-0.5 rounded-md font-medium shrink-0">
              <Paperclip className="w-3.5 h-3.5 text-primary-accent" />
              <span>{document.attachments.length}</span>
            </div>
          )}
        </div>

        {!compact && (
          <Link
            to={`/workspaces/${workspaceId}/docs/${document.id}`}
            className="text-[11px] font-bold text-primary-accent bg-primary-accent/10 hover:bg-primary-accent/20 px-3 py-1 rounded-lg transition-colors"
          >
            Open
          </Link>
        )}
      </div>
    </div>
  );
};
