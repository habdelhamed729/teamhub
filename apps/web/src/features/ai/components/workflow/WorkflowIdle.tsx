import { Sparkles, Clipboard } from "lucide-react";
import { Button } from "@/shared/components/Button";

interface WorkflowIdleProps {
  onStart: () => void;
  isLoading: boolean;
}

export const WorkflowIdle = ({ onStart, isLoading }: WorkflowIdleProps) => {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-text-muted">
      <Sparkles className="w-12 h-12 text-primary-accent/40 mb-3" />
      <h4 className="text-sm font-bold text-text-secondary mb-1">Stateful AI Task Extractor</h4>
      <p className="text-xs max-w-[280px] leading-relaxed mb-6">
        Launch a multi-step LangGraph agent to extract tasks from this document, clarify vague assignees/dates, and insert them directly into your Kanban Board.
      </p>
      <Button
        onClick={onStart}
        disabled={isLoading}
        variant="primary"
        className="w-full flex items-center justify-center gap-2"
        icon={<Clipboard className="w-4 h-4" />}
      >
        Start Agent Scan
      </Button>
    </div>
  );
};
