import { Fragment } from "react";
import { Check, ChevronRight } from "lucide-react";

interface WorkflowStepperProps {
  currentStepIndex: number;
}

export const WorkflowStepper = ({ currentStepIndex }: WorkflowStepperProps) => {
  const steps = [
    { num: 1, label: "Scan" },
    { num: 2, label: "Clarify" },
    { num: 3, label: "Approve" },
    { num: 4, label: "Done" }
  ];

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-surface-secondary/40 shrink-0">
      {steps.map((s, idx) => (
        <Fragment key={s.num}>
          <div className="flex items-center gap-1.5">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all border ${
              currentStepIndex === idx
                ? "bg-primary-accent text-main-bg border-primary-accent shadow-[0_0_8px_rgba(var(--primary-accent-rgb),0.4)] animate-pulse"
                : currentStepIndex > idx
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/20"
                : "bg-surface-elevated text-text-muted border-white/5"
            }`}>
              {currentStepIndex > idx ? <Check className="w-3 h-3" /> : s.num}
            </div>
            <span className={`text-[10px] font-semibold tracking-wider uppercase ${
              currentStepIndex === idx 
                ? "text-primary-accent" 
                : currentStepIndex > idx 
                ? "text-emerald-400" 
                : "text-text-muted"
            }`}>
              {s.label}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <ChevronRight className="w-3 h-3 text-text-muted/30 shrink-0" />
          )}
        </Fragment>
      ))}
    </div>
  );
};
