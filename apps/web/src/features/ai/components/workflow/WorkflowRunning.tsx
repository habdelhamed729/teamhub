import { Loader2 } from "lucide-react";

export const WorkflowRunning = () => {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-text-muted">
      <Loader2 className="w-12 h-12 text-primary-accent animate-spin mb-3" />
      <h4 className="text-sm font-bold text-text-secondary mb-1">Scanning Document</h4>
      <p className="text-xs max-w-[260px] leading-relaxed">
        Analyzing sentences, identifying action points, and checking assignee databases...
      </p>
    </div>
  );
};
