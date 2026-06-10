interface BoardSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  boards: any[] | undefined;
  onBoardSelected: (boardId: string) => void;
}

export const BoardSelectorModal = ({
  isOpen,
  onClose,
  boards,
  onBoardSelected,
}: BoardSelectorModalProps) => {
  if (!isOpen || !boards) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-surface-elevated border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-zoom-in p-6 flex flex-col gap-4">
        <h3 className="text-lg font-bold text-text-primary">Select Target Board</h3>
        <p className="text-xs text-text-muted">Choose which Kanban Board to create this task on:</p>
        
        <div className="space-y-2 max-h-48 overflow-y-auto mt-2">
          {boards.map((b) => (
            <button
              key={b.id}
              onClick={() => onBoardSelected(b.id)}
              className="w-full text-left px-4 py-3 rounded-xl bg-surface-secondary/40 hover:bg-primary-accent/10 border border-white/5 hover:border-primary-accent/20 transition-all text-sm font-semibold text-text-secondary hover:text-primary-accent cursor-pointer"
            >
              {b.name}
            </button>
          ))}
        </div>
        
        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-text-muted hover:text-text-primary transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
