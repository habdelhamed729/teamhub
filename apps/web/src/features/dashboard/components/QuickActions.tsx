import { Plus, FileText, Sparkles } from 'lucide-react';

interface QuickActionsProps {
  onNewTaskClick: () => void;
  onWriteDocClick: () => void;
  onAutoAssignClick: () => void;
}

export const QuickActions = ({
  onNewTaskClick,
  onWriteDocClick,
  onAutoAssignClick,
}: QuickActionsProps) => {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button 
        onClick={onNewTaskClick}
        className="flex items-center gap-2 bg-surface-elevated hover:bg-white/5 border border-white/5 hover:border-primary-accent/30 px-4 py-2.5 rounded-xl text-xs font-bold text-text-secondary hover:text-primary-accent shadow-premium transition-all cursor-pointer select-none"
      >
        <Plus className="w-4 h-4" /> New Task
      </button>
      <button 
        onClick={onWriteDocClick}
        className="flex items-center gap-2 bg-surface-elevated hover:bg-white/5 border border-white/5 hover:border-primary-accent/30 px-4 py-2.5 rounded-xl text-xs font-bold text-text-secondary hover:text-primary-accent shadow-premium transition-all cursor-pointer select-none"
      >
        <FileText className="w-4 h-4" /> Write Document
      </button>
      <button 
        onClick={onAutoAssignClick}
        className="flex items-center gap-2 bg-primary-accent/10 hover:bg-primary-accent/20 border border-primary-accent/20 hover:border-primary-accent/30 px-4 py-2.5 rounded-xl text-xs font-extrabold text-primary-accent shadow-premium hover:shadow-[0_0_15px_-5px_rgba(94,234,212,0.3)] transition-all cursor-pointer select-none"
      >
        <Sparkles className="w-4 h-4" /> Auto-Assign
      </button>
    </div>
  );
};
