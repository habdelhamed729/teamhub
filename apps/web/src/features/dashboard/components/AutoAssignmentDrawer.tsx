import { Sparkles } from 'lucide-react';
import { AutoAssignmentPanel } from '@/features/ai/components/AutoAssignmentPanel';

interface AutoAssignmentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
}

export const AutoAssignmentDrawer = ({
  isOpen,
  onClose,
  workspaceId,
}: AutoAssignmentDrawerProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Backdrop click closer */}
      <div className="absolute inset-0 cursor-pointer" onClick={onClose} />
      
      {/* Drawer Content */}
      <div className="relative w-full max-w-2xl h-full bg-surface-secondary border-l border-white/5 shadow-2xl p-6 sm:p-8 overflow-y-auto flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary-accent" /> Workload Auto-Assignment
          </h2>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-all cursor-pointer font-bold"
          >
            ✕
          </button>
        </div>
        <div className="grow">
          <AutoAssignmentPanel workspaceId={workspaceId} />
        </div>
      </div>
    </div>
  );
};
