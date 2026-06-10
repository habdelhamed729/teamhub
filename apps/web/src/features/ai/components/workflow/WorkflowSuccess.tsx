import { CheckSquare, Grid } from "lucide-react";
import { Button } from "@/shared/components/Button";

interface WorkflowSuccessProps {
  createdTaskCount: number;
  onRunAgain: () => void;
}

export const WorkflowSuccess = ({
  createdTaskCount,
  onRunAgain
}: WorkflowSuccessProps) => {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-6">
      <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 mb-4 animate-bounce">
        <CheckSquare className="w-8 h-8" />
      </div>
      <h4 className="text-sm font-bold text-text-primary mb-1">Tasks Created Successfully!</h4>
      <p className="text-xs text-text-muted max-w-[280px] leading-relaxed mb-6">
        The agent compiled and loaded <strong>{createdTaskCount} tasks</strong> into the target board's "To Do" column.
      </p>
      
      <div className="w-full flex flex-col gap-2">
        <Button
          onClick={() => {
            window.location.reload(); // Quick refresh or simple state reset
          }}
          variant="secondary"
          className="w-full flex items-center justify-center gap-2"
          icon={<Grid className="w-4 h-4" />}
        >
          Go to Workspace Boards
        </Button>
        
        <Button
          onClick={onRunAgain}
          variant="ghost"
          className="w-full flex items-center justify-center gap-2 text-text-muted hover:text-text-primary text-xs border-transparent hover:bg-white/5"
        >
          Run Again
        </Button>
      </div>
    </div>
  );
};
