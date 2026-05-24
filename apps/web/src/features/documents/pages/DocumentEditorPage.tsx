import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
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
} from "lucide-react";
import { useDocument } from "../hooks/useDocument";
import { useArchiveDocument, useDeleteDocument } from "../hooks/useDocuments";
import { useAutoSave } from "../hooks/useAutoSave";
import { DocumentEditor } from "../components/DocumentEditor";
import { uploadImage } from "../api/documents.api";
import type { JSONContent, Editor } from "@tiptap/react";
import "../styles/editor.css";

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const getWordCount = (editor: Editor | null) => {
  if (!editor) return { words: 0, chars: 0, readingTime: "0 min" };
  const text = editor.state.doc.textContent;
  const words = text
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
  const chars = text.length;
  const readingTime = Math.max(1, Math.ceil(words / 200));
  return { words, chars, readingTime: `${readingTime} min read` };
};

/* ─── Main Component ─────────────────────────────────────────────────────── */
export const DocumentEditorPage = () => {
  const { workspaceId, documentId } = useParams<{
    workspaceId: string;
    documentId: string;
  }>();

  const { data: document, isLoading } = useDocument(documentId!);
  const { mutate: archiveDoc } = useArchiveDocument(workspaceId!);
  const { mutate: deleteDoc } = useDeleteDocument(workspaceId!);

  const [content, setContent] = useState<JSONContent | null>(null);
  const [title, setTitle] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const [editorRef, setEditorRef] = useState<Editor | null>(null);
  const [wordInfo, setWordInfo] = useState({
    words: 0,
    chars: 0,
    readingTime: "0 min read",
  });
  const [isUploading, setIsUploading] = useState(false);
  const optionsRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastLoadedIdRef = useRef<string | null>(null);

  // Initialize state from fetched data (only when doc ID changes)
  useEffect(() => {
    if (document && lastLoadedIdRef.current !== document.id) {
      setTitle(document.title || "");
      setContent((document.content as JSONContent) || null);
      lastLoadedIdRef.current = document.id;
    }
  }, [document]);

  // Close options dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        optionsRef.current &&
        !optionsRef.current.contains(e.target as Node)
      ) {
        setShowOptions(false);
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, []);

  // Update word count when editor changes
  const handleContentChange = useCallback(
    (newContent: JSONContent) => {
      setContent(newContent);
      setWordInfo(getWordCount(editorRef));
    },
    [editorRef],
  );

  const handleEditorReady = useCallback((editor: Editor) => {
    setEditorRef(editor);
    setWordInfo(getWordCount(editor));
  }, []);

  // Image upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editorRef) return;

    try {
      setIsUploading(true);
      const result = await uploadImage(file);
      editorRef
        .chain()
        .focus()
        .setImage({ src: result.url })
        .run();
    } catch (err) {
      console.error("Image upload failed:", err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const { saveStatus } = useAutoSave({
    documentId: documentId!,
    title,
    content,
    enabled: !!document,
  });

  /* ─── Loading ─────────────────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-main-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-primary-accent/10 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-primary-accent animate-spin" />
            </div>
          </div>
          <p className="text-sm text-text-muted font-medium">
            Loading document...
          </p>
        </div>
      </div>
    );
  }

  /* ─── Not found ───────────────────────────────────────────────────────── */
  if (!document) {
    return (
      <div className="flex-1 flex items-center justify-center bg-main-bg flex-col gap-4">
        <div className="w-16 h-16 rounded-2xl bg-danger/10 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-danger" />
        </div>
        <h2 className="text-xl font-bold text-text-primary">
          Document not found
        </h2>
        <Link
          to={`/workspaces/${workspaceId}/documents`}
          className="text-primary-accent hover:underline text-sm font-medium"
        >
          ← Return to Documents
        </Link>
      </div>
    );
  }

  /* ─── Render ──────────────────────────────────────────────────────────── */
  return (
    <div className="flex-1 flex flex-col bg-main-bg h-full overflow-hidden relative z-0">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-6 py-2.5 border-b border-white/5 bg-surface-secondary/50 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {/* Back */}
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
          {/* Word count */}
          <div className="hidden md:flex items-center gap-3 text-xs text-text-muted mr-2">
            <span>{wordInfo.words} words</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {wordInfo.readingTime}
            </span>
          </div>

          {/* Upload image button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="p-1.5 text-text-muted hover:text-text-primary hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
            title="Upload image"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ImagePlus className="w-4 h-4" />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />

          {/* Save status */}
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

          {/* Options */}
          <div className="relative" ref={optionsRef}>
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="p-1.5 text-text-muted hover:text-text-primary hover:bg-white/5 rounded-lg transition-colors"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {showOptions && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-surface-elevated border border-white/10 rounded-xl shadow-2xl shadow-black/50 py-1 z-50">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    setShowOptions(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
                >
                  <LinkIcon className="w-4 h-4" />
                  Copy link
                </button>
                <button
                  onClick={() => {
                    setShowOptions(false);
                    archiveDoc(documentId!);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
                >
                  <Archive className="w-4 h-4" />
                  Archive
                </button>
                <div className="h-px bg-white/5 my-1" />
                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        "Are you sure you want to delete this document?",
                      )
                    ) {
                      setShowOptions(false);
                      deleteDoc(documentId!);
                    }
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-danger hover:bg-danger/10 transition-colors font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Editor Area ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-8 py-16">
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled"
            className="w-full bg-transparent text-[2.75rem] leading-tight font-bold text-text-primary placeholder:text-text-muted/20 focus:outline-none mb-2 tracking-tight"
          />
          {/* Meta info */}
          <div className="flex items-center gap-3 text-xs text-text-muted mb-10 pb-6 border-b border-white/5">
            {document.creator?.display_name && (
              <span>Created by {document.creator.display_name}</span>
            )}
          </div>

          {/* Editor */}
          <DocumentEditor
            key={documentId}
            initialContent={(document.content as JSONContent) || null}
            onChange={handleContentChange}
            onEditorReady={handleEditorReady}
          />
        </div>
      </div>
    </div>
  );
};
