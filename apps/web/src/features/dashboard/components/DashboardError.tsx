import { Info } from 'lucide-react';

interface DashboardErrorProps {
  onRetry: () => void;
}

export const DashboardError = ({ onRetry }: DashboardErrorProps) => {
  return (
    <div className="flex flex-col items-center justify-center h-[70vh] text-center p-8">
      <div className="w-16 h-16 rounded-3xl bg-surface-secondary flex items-center justify-center mb-6 border border-white/5 shadow-xl">
        <Info className="w-8 h-8 text-text-muted opacity-40" />
      </div>
      <h2 className="text-xl font-bold text-text-primary mb-2">Failed to load dashboard</h2>
      <p className="text-sm text-text-muted mb-6">Verify your network connection or reload the workspace.</p>
      <button 
        onClick={onRetry} 
        className="px-5 py-2.5 bg-primary-accent text-main-bg font-bold rounded-xl hover:bg-primary-accent/90 transition-all cursor-pointer"
      >
        Reload
      </button>
    </div>
  );
};
