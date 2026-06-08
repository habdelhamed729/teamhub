import { LayoutGrid } from 'lucide-react';

export const BoardEmptyState = ({ onCreateBoard }: { onCreateBoard: () => void }) => (
  <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8 animate-fade-in">
    <div className="w-16 h-16 rounded-2xl bg-surface-elevated border border-white/5 flex items-center justify-center mb-6 shadow-premium">
      <LayoutGrid className="w-8 h-8 text-primary-accent" />
    </div>
    <h2 className="text-xl font-bold text-text-primary mb-2">No boards yet</h2>
    <p className="text-text-secondary max-w-sm mb-8">
      Boards help you organize tasks into columns and workflows. Create your first board to get started.
    </p>
    <button
      onClick={onCreateBoard}
      className="bg-primary-accent text-main-bg px-6 py-2.5 rounded-xl font-bold hover:opacity-90 transition-all active:scale-[0.98] shadow-[0_0_15px_rgba(94,234,212,0.3)]"
    >
      Create Board
    </button>
  </div>
);
