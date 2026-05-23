import { useState, useMemo } from "react";
import {
  ArchiveRestore,
  Trash2,
  ArrowRight,
  Search,
  CheckSquare,
  Square,
  AlertCircle,
  Clock,
  Sparkles,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Document } from "@teamhub/shared";

interface ArchivePanelProps {
  documents: Document[];
  onRestore: (id: string) => void;
  onDeleteForever: (id: string) => void;
  onClose: () => void;
}

export const ArchivePanel = ({
  documents,
  onRestore,
  onDeleteForever,
  onClose,
}: ArchivePanelProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeletingBatch, setIsDeletingBatch] = useState(false);

  // Filter documents based on search
  const filteredDocs = useMemo(() => {
    return documents.filter((doc) =>
      (doc.title || "Untitled")
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );
  }, [documents, searchQuery]);

  // Toggle selection for a single document
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Toggle selection for all filtered documents
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredDocs.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredDocs.map((doc) => doc.id));
    }
  };

  // Batch restore
  const handleBatchRestore = () => {
    if (selectedIds.length === 0) return;
    selectedIds.forEach((id) => onRestore(id));
    setSelectedIds([]);
  };

  // Batch delete forever
  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return;
    
    const count = selectedIds.length;
    const confirmMessage =
      count === 1
        ? "Are you sure you want to permanently delete this document? This action cannot be undone."
        : `Are you sure you want to permanently delete these ${count} documents? This action cannot be undone.`;

    if (window.confirm(confirmMessage)) {
      setIsDeletingBatch(true);
      selectedIds.forEach((id) => onDeleteForever(id));
      setSelectedIds([]);
      setIsDeletingBatch(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full sm:w-[460px] bg-surface-secondary/95 backdrop-blur-xl border-l border-white/10 shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-surface-elevated/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-danger/10 border border-danger/25 flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.1)]">
              <Trash2 className="w-5 h-5 text-danger" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary">Trash Bin</h2>
              <p className="text-xs text-text-muted">
                {documents.length} item{documents.length !== 1 ? "s" : ""} archived
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-muted hover:text-text-primary hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-white/10"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Info Alert */}
        {documents.length > 0 && (
          <div className="px-6 py-3 bg-danger/5 border-b border-danger/10 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-danger/70 mt-0.5 shrink-0" />
            <p className="text-[11px] text-text-muted leading-relaxed">
              Items in the trash bin are archived. Deleting them forever is permanent.
            </p>
          </div>
        )}

        {/* Search & Actions Bar */}
        {documents.length > 0 && (
          <div className="p-4 border-b border-white/5 bg-surface-secondary/50 flex flex-col gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search archived documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-elevated/60 border border-white/5 focus:border-primary-accent/40 rounded-lg pl-9 pr-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary-accent/30 transition-all"
              />
            </div>

            {/* Selection Toolbar */}
            <div className="flex items-center justify-between px-1 text-xs">
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors font-medium"
              >
                {selectedIds.length === filteredDocs.length && filteredDocs.length > 0 ? (
                  <CheckSquare className="w-4 h-4 text-primary-accent" />
                ) : (
                  <Square className="w-4 h-4 text-text-muted" />
                )}
                <span>
                  {selectedIds.length > 0
                    ? `Selected ${selectedIds.length} of ${filteredDocs.length}`
                    : "Select all"}
                </span>
              </button>

              {selectedIds.length > 0 && (
                <div className="flex items-center gap-2 animate-in fade-in duration-200">
                  <button
                    onClick={handleBatchRestore}
                    className="flex items-center gap-1.5 py-1 px-2.5 bg-primary-accent/10 border border-primary-accent/20 hover:bg-primary-accent hover:text-main-bg text-primary-accent text-xs font-bold rounded-md transition-all"
                  >
                    <ArchiveRestore className="w-3.5 h-3.5" />
                    Restore
                  </button>
                  <button
                    onClick={handleBatchDelete}
                    disabled={isDeletingBatch}
                    className="flex items-center gap-1.5 py-1 px-2.5 bg-danger/10 border border-danger/20 hover:bg-danger hover:text-white text-danger text-xs font-bold rounded-md transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Documents List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-main-bg/25">
          {documents.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-white/5 rounded-full blur-2xl scale-150" />
                <div className="relative w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-lg">
                  <Trash2 className="w-7 h-7 text-text-muted/60" />
                </div>
              </div>
              <h3 className="font-bold text-text-primary text-base mb-1">
                Trash is empty
              </h3>
              <p className="text-xs text-text-muted max-w-[240px] leading-relaxed">
                When you archive documents, they will appear here.
              </p>
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <p className="text-sm text-text-muted">No search results found</p>
            </div>
          ) : (
            filteredDocs.map((doc) => {
              const isSelected = selectedIds.includes(doc.id);
              return (
                <div
                  key={doc.id}
                  onClick={() => toggleSelect(doc.id)}
                  className={`group relative p-4 bg-surface-elevated/60 hover:bg-surface-elevated border rounded-xl transition-all duration-300 flex items-center gap-4 cursor-pointer select-none ${
                    isSelected
                      ? "border-primary-accent bg-surface-elevated ring-1 ring-primary-accent/20"
                      : "border-white/5 hover:border-white/10"
                  }`}
                >
                  {/* Custom Checkbox */}
                  <div className="shrink-0">
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-primary-accent" />
                    ) : (
                      <Square className="w-4 h-4 text-text-muted group-hover:text-text-secondary transition-colors" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-text-primary text-sm truncate group-hover:text-primary-accent transition-colors mb-1">
                      {doc.title || "Untitled Document"}
                    </h4>
                    <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
                      <Clock className="w-3 h-3 text-text-muted/70" />
                      <span>
                        Archived{" "}
                        {doc.archived_at
                          ? formatDistanceToNow(new Date(doc.archived_at), {
                              addSuffix: true,
                            })
                          : "recently"}
                      </span>
                    </div>
                  </div>

                  {/* Individual Actions (appear on hover) */}
                  <div
                    className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => onRestore(doc.id)}
                      className="p-2 bg-white/5 hover:bg-primary-accent hover:text-main-bg text-text-secondary rounded-lg transition-all"
                      title="Restore document"
                    >
                      <ArchiveRestore className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            `Are you sure you want to permanently delete "${
                              doc.title || "Untitled"
                            }"? This action cannot be undone.`
                          )
                        ) {
                          onDeleteForever(doc.id);
                        }
                      }}
                      className="p-2 bg-white/5 hover:bg-danger hover:text-white text-text-muted rounded-lg transition-all"
                      title="Delete forever"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
};
