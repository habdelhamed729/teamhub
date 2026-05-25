import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  Plus,
  Search,
  FileText,
  Trash2,
  LayoutGrid,
  List,
  ArrowUpDown,
} from "lucide-react";
import {
  useDocuments,
  useArchivedDocuments,
  useArchiveDocument,
  useDeleteDocument,
  useRestoreDocument,
} from "../hooks/useDocuments";
import { DocumentCard } from "../components/DocumentCard";
import { CreateDocumentDialog } from "../components/CreateDocumentDialog";
import { ArchivePanel } from "../components/ArchivePanel";

type SortKey = "updated" | "title" | "created";
type ViewMode = "grid" | "list";

export const DocumentsPage = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>("updated");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 12;

  const { data: documentsData, isLoading } = useDocuments(workspaceId!, page, limit);
  const { data: archivedDocumentsData } = useArchivedDocuments(workspaceId!);
  const { mutate: archiveDoc } = useArchiveDocument(workspaceId!);
  const { mutate: deleteDoc } = useDeleteDocument(workspaceId!);
  const { mutate: restoreDoc } = useRestoreDocument(workspaceId!);

  const archivedDocuments = archivedDocumentsData?.documents || [];

  // Active (non-archived) docs from paginated result
  const activeDocs = useMemo(
    () => documentsData?.documents || [],
    [documentsData],
  );

  // Filtered + sorted docs
  const filteredDocs = useMemo(() => {
    let docs = activeDocs;
    if (searchQuery.trim()) {
      docs = docs.filter((d) =>
        d.title?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }
    return [...docs].sort((a, b) => {
      if (sortBy === "title")
        return (a.title || "").localeCompare(b.title || "");
      if (sortBy === "created")
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      return (
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    });
  }, [activeDocs, searchQuery, sortBy]);

  const sortLabels: Record<SortKey, string> = {
    updated: "Last edited",
    title: "Title A→Z",
    created: "Date created",
  };

  return (
    <div className="flex-1 overflow-y-auto bg-main-bg relative z-0">
      <div className="max-w-7xl mx-auto p-8">
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-text-primary tracking-tight">
              Documents
            </h1>
            <p className="text-text-muted mt-1 text-sm">
              {activeDocs.length} document{activeDocs.length !== 1 ? "s" : ""}{" "}
              in this workspace
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => setIsTrashOpen(true)}
              className="px-4 py-2.5 bg-surface-secondary border border-white/10 hover:bg-white/5 text-text-secondary hover:text-text-primary font-bold rounded-xl transition-all flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Trash</span>
              {archivedDocuments && archivedDocuments.length > 0 && (
                <span className="bg-danger/20 text-danger text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {archivedDocuments.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-primary-accent hover:bg-[#4CD5C0] text-main-bg font-bold rounded-xl transition-all shadow-[0_0_20px_-5px_rgba(94,234,212,0.3)] hover:shadow-[0_0_25px_-5px_rgba(94,234,212,0.5)] flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Document
            </button>
          </div>
        </div>

        {/* ── Toolbar ─────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-secondary border border-white/5 focus:border-primary-accent/40 rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary-accent/30 transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Sort dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-text-secondary bg-surface-secondary border border-white/5 rounded-lg hover:bg-white/5 transition-colors"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                {sortLabels[sortBy]}
              </button>
              {showSortMenu && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-surface-elevated border border-white/10 rounded-xl shadow-2xl py-1 z-50">
                  {(Object.keys(sortLabels) as SortKey[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => {
                        setSortBy(key);
                        setShowSortMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                        sortBy === key
                          ? "text-primary-accent bg-primary-accent/10 font-bold"
                          : "text-text-secondary hover:text-text-primary hover:bg-white/5"
                      }`}
                    >
                      {sortLabels[key]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* View toggle */}
            <div className="flex bg-surface-secondary border border-white/5 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 transition-colors ${viewMode === "grid" ? "bg-primary-accent/10 text-primary-accent" : "text-text-muted hover:text-text-primary"}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 transition-colors ${viewMode === "list" ? "bg-primary-accent/10 text-primary-accent" : "text-text-muted hover:text-text-primary"}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ── All Documents Label ──────────────────────────────────────── */}
        {!searchQuery && (
          <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-4">
            All Documents
          </h2>
        )}

        {/* ── Content ─────────────────────────────────────────────────── */}
        {isLoading ? (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
                : "flex flex-col gap-3"
            }
          >
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className={`bg-surface-elevated/40 border border-white/5 rounded-2xl animate-pulse ${viewMode === "grid" ? "h-44" : "h-16"}`}
              >
                <div className="p-5 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-white/5 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="w-3/4 h-4 bg-white/5 rounded" />
                      <div className="w-1/2 h-3 bg-white/5 rounded" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredDocs.length > 0 ? (
          <div className="space-y-6">
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
                  : "flex flex-col gap-3"
              }
            >
              {filteredDocs.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  workspaceId={workspaceId!}
                  onArchive={archiveDoc}
                  onDelete={deleteDoc}
                  listMode={viewMode === "list"}
                />
              ))}
            </div>

            {documentsData?.pagination && documentsData.pagination.totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-white/5">
                <p className="text-xs text-text-muted">
                  Showing <span className="font-semibold text-text-primary">{(page - 1) * limit + 1}</span> to{" "}
                  <span className="font-semibold text-text-primary">
                    {Math.min(page * limit, documentsData.pagination.total)}
                  </span>{" "}
                  of <span className="font-semibold text-text-primary">{documentsData.pagination.total}</span> documents
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    disabled={page === 1}
                    className="px-3.5 py-2 text-xs font-bold text-text-secondary hover:text-text-primary bg-surface-secondary border border-white/5 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/5 transition-all"
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-secondary border border-white/5 rounded-xl text-xs font-semibold text-text-muted">
                    Page <span className="text-text-primary font-bold">{page}</span> of {documentsData.pagination.totalPages}
                  </div>
                  <button
                    onClick={() => setPage((prev) => Math.min(prev + 1, documentsData.pagination!.totalPages))}
                    disabled={page === documentsData.pagination.totalPages}
                    className="px-3.5 py-2 text-xs font-bold text-text-secondary hover:text-text-primary bg-surface-secondary border border-white/5 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/5 transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ── Empty State ────────────────────────────────────────────── */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-primary-accent/5 rounded-full blur-3xl scale-150" />
              <div className="relative w-20 h-20 bg-surface-secondary border border-white/5 rounded-2xl flex items-center justify-center shadow-2xl shadow-black/50 rotate-3">
                <FileText className="w-9 h-9 text-primary-accent/50" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">
              {searchQuery ? "No documents found" : "No documents yet"}
            </h2>
            <p className="text-text-muted max-w-sm mb-8 text-sm leading-relaxed">
              {searchQuery
                ? "We couldn't find any documents matching your search. Try different keywords."
                : "Create your first document to start collaborating with your team."}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-6 py-2.5 bg-white/5 hover:bg-primary-accent/10 text-text-primary hover:text-primary-accent font-bold rounded-xl transition-all border border-white/5 hover:border-primary-accent/20"
              >
                Create your first document
              </button>
            )}
          </div>
        )}
      </div>

      <CreateDocumentDialog
        workspaceId={workspaceId!}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {isTrashOpen && (
        <ArchivePanel
          documents={archivedDocuments || []}
          onRestore={restoreDoc}
          onDeleteForever={deleteDoc}
          onClose={() => setIsTrashOpen(false)}
        />
      )}
    </div>
  );
};
