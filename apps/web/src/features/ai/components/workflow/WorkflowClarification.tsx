import { AlertCircle, User as UserIcon, Calendar, ArrowRight } from "lucide-react";
import { Button } from "@/shared/components/Button";
import type { WorkspaceMember } from "@teamhub/shared";

interface WorkflowClarificationProps {
  ambiguousTasks: any[];
  members: WorkspaceMember[];
  clarifications: Record<string, { assignee_raw: string; due_date: string }>;
  onChange: (index: string, field: "assignee_raw" | "due_date", value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export const WorkflowClarification = ({
  ambiguousTasks,
  members,
  clarifications,
  onChange,
  onSubmit,
  isLoading
}: WorkflowClarificationProps) => {
  return (
    <div className="space-y-4">
      <div className="p-3 bg-primary-accent/15 border border-primary-accent/20 rounded-2xl flex items-start gap-2.5">
        <AlertCircle className="w-5 h-5 text-primary-accent shrink-0 mt-0.5" />
        <div className="text-xs">
          <span className="font-bold text-primary-accent">Clarifications Required</span>
          <p className="text-text-secondary mt-0.5 leading-relaxed">
            Vague dates or unspecified assignees were detected. Help the agent map them correctly:
          </p>
        </div>
      </div>

      <div className="space-y-3.5">
        {ambiguousTasks.map((item) => (
          <div key={item.index} className="p-4 bg-surface-elevated border border-white/5 rounded-2xl space-y-3 shadow-md">
            <div className="pb-2 border-b border-white/5">
              <span className="text-[9px] uppercase font-bold text-text-muted">Extracted Item #{parseInt(item.index) + 1}</span>
              <p className="text-sm font-semibold text-text-primary mt-0.5">{item.task.title}</p>
              {item.task.description && (
                <p className="text-[11px] text-text-muted mt-1 leading-relaxed">{item.task.description}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* Assignee raw resolving */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted flex items-center gap-1 uppercase">
                  <UserIcon className="w-3 h-3 text-primary-accent/70" /> Assignee
                </label>
                <select
                  value={clarifications[item.index]?.assignee_raw || ""}
                  onChange={(e) => onChange(item.index, "assignee_raw", e.target.value)}
                  className="w-full bg-surface-secondary border border-white/5 rounded-xl px-2.5 py-1.5 text-xs text-text-secondary focus:outline-none focus:border-primary-accent/35"
                >
                  <option value="">-- Assign Person --</option>
                  {members.map((m) => (
                    <option key={m.user.id} value={m.user.display_name}>
                      {m.user.display_name} ({m.user.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Vague date resolving */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted flex items-center gap-1 uppercase">
                  <Calendar className="w-3 h-3 text-primary-accent/70" /> Due Date
                </label>
                <input
                  type="date"
                  value={clarifications[item.index]?.due_date || ""}
                  onChange={(e) => onChange(item.index, "due_date", e.target.value)}
                  className="w-full bg-surface-secondary border border-white/5 rounded-xl px-2.5 py-1.5 text-xs text-text-secondary focus:outline-none focus:border-primary-accent/35"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button
        onClick={onSubmit}
        disabled={isLoading}
        variant="primary"
        className="w-full flex items-center justify-center gap-2 mt-4"
        icon={<ArrowRight className="w-4 h-4" />}
      >
        Submit & Re-run
      </Button>
    </div>
  );
};
