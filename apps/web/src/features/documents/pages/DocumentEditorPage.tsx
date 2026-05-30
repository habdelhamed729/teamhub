import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AlertCircle, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useDocument, useUpdateDocument } from "../hooks/useDocument";
import { useArchiveDocument, useDeleteDocument } from "../hooks/useDocuments";
import { useAutoSave } from "../hooks/useAutoSave";
import { DocumentEditor } from "../components/DocumentEditor";
import { uploadImage } from "../api/documents.api";
import { useAuthStore } from "@/app/store/useAuthStore";
import { AttachmentManager } from "@/shared/components/AttachmentManager";
import { useAttachments } from "@/shared/hooks/useAttachments";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import { Button } from "@/shared/components/Button";
import { KeyboardShortcutsModal } from "../components/KeyboardShortcutsModal";
import { DocumentCoverSection, COVERS } from "../components/DocumentCoverSection";
import { DocumentIconPicker } from "../components/DocumentIconPicker";
import { DocumentHeaderBar } from "../components/DocumentHeaderBar";
import type { JSONContent, Editor } from "@tiptap/react";
import "../styles/editor.css";

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const getWordCount = (editor: Editor | null) => {
  if (!editor) return { words: 0, chars: 0, readingTime: "0 min" };
  const text = editor.state.doc.textContent;
  const words = text.split(/\s+/).filter((w) => w.length > 0).length;
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

  const navigate = useNavigate();
  const { data: document, isLoading } = useDocument(documentId!);
  const { mutateAsync: archiveDoc } = useArchiveDocument(workspaceId!);
  const { mutateAsync: deleteDoc, isPending: isDeleting } = useDeleteDocument(
    workspaceId!,
  );
  const { mutateAsync: updateDoc } = useUpdateDocument();
  const currentUser = useAuthStore((state) => state.user);

  const { uploadAttachment, isUploading: isUploadingAttachment } =
    useAttachments({
      target: "document",
      targetId: documentId!,
      queryKeysToInvalidate: [["document", documentId]],
    });

  const [content, setContent] = useState<JSONContent | null>(null);
  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  const [editorRef, setEditorRef] = useState<Editor | null>(null);
  const [wordInfo, setWordInfo] = useState({
    words: 0,
    chars: 0,
    readingTime: "0 min read",
  });
  const [isUploading, setIsUploading] = useState(false);

  const lastLoadedIdRef = useRef<string | null>(null);

  // Update backend document details
  const handleUpdateIcon = (newIcon: string | null) => {
    setIcon(newIcon);
    updateDoc({ documentId: documentId!, dto: { icon: newIcon || "" } });
  };

  const handleUpdateCover = (newCover: string | null) => {
    setCoverUrl(newCover);
    updateDoc({ documentId: documentId!, dto: { cover_url: newCover || "" } });
  };

  // Initialize state from fetched data (only when doc ID changes)
  useEffect(() => {
    if (document && lastLoadedIdRef.current !== document.id) {
      setTitle(document.title || "");
      setContent((document.content as JSONContent) || null);
      setIcon(document.icon || null);
      setCoverUrl(document.cover_url || null);
      lastLoadedIdRef.current = document.id;
    }
  }, [document]);

  // Listen for "?" to open shortcuts cheat sheet
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }
      if (e.key === "?") {
        setShowShortcutsModal(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
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

  // Image upload handler passed to HeaderBar
  const handleImageUpload = async (file: File) => {
    if (!editorRef) return;
    try {
      setIsUploading(true);
      const result = await uploadImage(file);
      editorRef.chain().focus().setImage({ src: result.url }).run();
    } catch (err) {
      console.error("Image upload failed:", err);
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  // Attachment upload handler passed to HeaderBar
  const handleAttachmentUpload = async (file: File) => {
    if (!editorRef) return;
    try {
      const result = await uploadAttachment(file);
      editorRef
        .chain()
        .focus()
        .insertContent(
          `<a href="${result.url}" target="_blank" rel="noopener noreferrer" class="attachment-link">📎 ${result.file_name}</a> `,
        )
        .run();
    } catch (err) {
      console.error("Attachment upload failed:", err);
      toast.error("Failed to upload attachment");
    }
  };

  const handleArchive = async () => {
    const toastId = toast.loading("Archiving document...");
    try {
      await archiveDoc(documentId!);
      toast.success("Document archived successfully", { id: toastId });
      navigate(`/workspaces/${workspaceId}/documents`);
    } catch (err) {
      toast.error("Failed to archive document", { id: toastId });
    }
  };

  const handleDeleteDocument = async () => {
    const toastId = toast.loading("Deleting document...");
    try {
      await deleteDoc(documentId!);
      toast.success("Document deleted permanently", { id: toastId });
      setIsDeleteModalOpen(false);
      navigate(`/workspaces/${workspaceId}/documents`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete document", { id: toastId });
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
      {/* Header Bar */}
      <DocumentHeaderBar
        workspaceId={workspaceId!}
        documentId={documentId!}
        title={title}
        wordInfo={wordInfo}
        saveStatus={saveStatus}
        isUploading={isUploading}
        isUploadingAttachment={isUploadingAttachment}
        onImageUpload={handleImageUpload}
        onAttachmentUpload={handleAttachmentUpload}
        onShowShortcuts={() => setShowShortcutsModal(true)}
        onArchive={handleArchive}
        onDeleteClick={() => setIsDeleteModalOpen(true)}
      />

      {/* Editor Area */}
      <div className="flex-1 overflow-y-auto relative">
        {/* Cover Image Banner */}
        <DocumentCoverSection
          coverUrl={coverUrl}
          onUpdateCover={handleUpdateCover}
        />

        <div className="max-w-4xl mx-auto px-8 py-12 relative group/header">
          {/* Overlapping/Inline Page Icon */}
          {icon ? (
            <DocumentIconPicker
              icon={icon}
              onUpdateIcon={handleUpdateIcon}
              coverUrl={coverUrl}
            />
          ) : (
            /* Hover Action Triggers when icon/cover is missing */
            <div className="flex gap-3 mb-6 opacity-20 group-hover/header:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleUpdateIcon("📝")}
                className="text-xs text-text-muted hover:text-text-primary bg-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/5 transition-colors"
              >
                Add icon
              </Button>
              {!coverUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleUpdateCover(COVERS[0].value)}
                  className="text-xs text-text-muted hover:text-text-primary bg-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/5 transition-colors"
                >
                  Add cover
                </Button>
              )}
            </div>
          )}

          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled"
            className="w-full bg-transparent text-[2.75rem] leading-tight font-bold text-text-primary placeholder:text-text-muted/20 focus:outline-none mb-2 tracking-tight"
          />

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-text-muted mb-10 pb-6 border-b border-white/5">
            {document.creator?.display_name && (
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-text-secondary">Created by:</span>
                <span>{document.creator.display_name}</span>
              </div>
            )}
            {document.last_editor && document.last_editor.id !== document.creator?.id && (
              <>
                <span className="text-white/10 hidden sm:inline">•</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-text-secondary">Last edited by:</span>
                  <span>{document.last_editor.display_name}</span>
                </div>
              </>
            )}
            <span className="text-white/10 hidden sm:inline">•</span>
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-text-secondary">Updated:</span>
              <span>
                {formatDistanceToNow(new Date(document.updated_at), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </div>

          {/* Editor */}
          <DocumentEditor
            key={documentId}
            initialContent={(document.content as JSONContent) || null}
            onChange={handleContentChange}
            onEditorReady={handleEditorReady}
          />

          {/* Attachments Section */}
          <AttachmentManager
            target="document"
            targetId={documentId!}
            attachments={document.attachments || []}
            currentUserId={currentUser?.id}
            queryKeysToInvalidate={[["document", documentId]]}
          />
        </div>
      </div>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => !isDeleting && setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteDocument}
        title="Delete Document"
        description="Are you sure you want to permanently delete this document? This action will also delete all of its child documents and attachments. This cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isDanger={true}
        isLoading={isDeleting}
      />

      <KeyboardShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />
    </div>
  );
};
