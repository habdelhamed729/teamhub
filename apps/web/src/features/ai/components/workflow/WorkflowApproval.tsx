import { Plus, Trash2, Check } from "lucide-react";
import { Button } from "@/shared/components/Button";
import type { WorkspaceMember } from "@teamhub/shared";

interface BoardOption {
  id: string;
  name: string;
}

interface WorkflowApprovalProps {
  taskDrafts: any[];
  members: WorkspaceMember[];
  boards: BoardOption[];
  selectedBoardId: string;
  setSelectedBoardId: (id: string) => void;
  isCreatingNewBoard: boolean;
  setIsCreatingNewBoard: (val: boolean) => void;
  newBoardName: string;
  setNewBoardName: (val: string) => void;
  onUpdateDraft: (index: number, field: string, value: any) => void;
  onDeleteDraft: (index: number) => void;
  onAddDraft: () => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export const WorkflowApproval = ({
  taskDrafts,
  members,
  boards,
  selectedBoardId,
  setSelectedBoardId,
  isCreatingNewBoard,
  setIsCreatingNewBoard,
  newBoardName,
  setNewBoardName,
  onUpdateDraft,
  onDeleteDraft,
  onAddDraft,
  onSubmit,
  isLoading
}: WorkflowApprovalProps) => {
  const getPriorityBadgeColor = (priority: string) => {
    const p = (priority || "").toLowerCase();
    switch (p) {
      case "urgent": return "bg-red-500/10 text-red-400 border border-red-500/20";
      case "high": return "bg-danger/10 text-danger border border-danger/20";
      case "medium": return "bg-warning/10 text-warning border border-warning/20";
      default: return "bg-primary-accent/10 text-primary-accent border border-primary-accent/20";
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Board Selector Section */}
      <div className="p-4 bg-surface-elevated border border-white/5 rounded-2xl space-y-3.5 shadow-md">
        <label className="text-xs font-bold text-text-primary uppercase tracking-wider block">
          🎯 Target Kanban Board
        </label>

        <div className="flex items-center gap-3 text-xs bg-surface-secondary/40 p-2 border border-white/5 rounded-xl">
          <input
            type="checkbox"
            id="newBoardToggle"
            checked={isCreatingNewBoard}
            onChange={(e) => setIsCreatingNewBoard(e.target.checked)}
            className="rounded border-white/15 bg-transparent text-primary-accent focus:ring-primary-accent/30 cursor-pointer h-3.5 w-3.5"
          />
          <label htmlFor="newBoardToggle" className="cursor-pointer font-semibold text-text-secondary select-none">
            Create a new board for this document
          </label>
        </div>

        {!isCreatingNewBoard ? (
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Choose Board</label>
            <select
              value={selectedBoardId}
              onChange={(e) => setSelectedBoardId(e.target.value)}
              className="w-full bg-surface-secondary border border-white/5 rounded-xl px-3 py-2 text-xs text-text-secondary focus:outline-none focus:border-primary-accent/35"
            >
              {boards.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">New Board Name</label>
            <input
              type="text"
              value={newBoardName}
              onChange={(e) => setNewBoardName(e.target.value)}
              placeholder="e.g. Graduation Sprint Tasks"
              className="w-full bg-surface-secondary border border-white/5 rounded-xl px-3 py-2 text-xs text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-primary-accent/35"
            />
          </div>
        )}
      </div>

      {/* Task Drafts List Editor */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-1">
          <label className="text-xs font-bold text-text-primary uppercase tracking-wider">
            📋 Task Drafts Review ({taskDrafts.length})
          </label>
          <Button
            onClick={onAddDraft}
            variant="ghost"
            size="sm"
            className="text-[10px] hover:bg-white/5 border border-white/5 px-2 py-1 text-primary-accent rounded-lg"
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Task
          </Button>
        </div>

        {taskDrafts.length === 0 && (
          <div className="text-center p-6 bg-surface-elevated/40 border border-dashed border-white/5 rounded-2xl">
            <p className="text-xs text-text-muted">No task drafts available. Add one or abort.</p>
          </div>
        )}

        {taskDrafts.map((draft, idx) => (
          <div key={idx} className="p-4 bg-surface-elevated border border-white/5 rounded-2xl space-y-3.5 relative shadow-md">
            
            {/* Delete draft trigger */}
            <button 
              onClick={() => onDeleteDraft(idx)}
              className="absolute top-3 right-3 text-text-muted hover:text-danger hover:bg-danger/10 p-1.5 rounded-lg transition-colors cursor-pointer"
              title="Remove task draft"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <div className="pr-7 space-y-2">
              {/* Editable Title */}
              <input
                type="text"
                value={draft.title || ""}
                onChange={(e) => onUpdateDraft(idx, "title", e.target.value)}
                placeholder="Task Title"
                className="w-full bg-transparent border-b border-white/5 focus:border-primary-accent/30 text-sm font-bold text-text-primary pb-1 focus:outline-none"
              />

              {/* Editable Description */}
              <textarea
                value={draft.description || ""}
                onChange={(e) => onUpdateDraft(idx, "description", e.target.value)}
                placeholder="Add descriptions or requirements..."
                rows={2}
                className="w-full bg-surface-secondary/50 border border-white/5 rounded-lg p-2 text-xs text-text-secondary focus:outline-none focus:border-primary-accent/30 resize-none leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-3 gap-2.5 text-xs pt-1.5">
              {/* Assignee mapping dropdown */}
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Assignee</span>
                <select
                  value={draft.assignee_id || ""}
                  onChange={(e) => onUpdateDraft(idx, "assignee_id", e.target.value || null)}
                  className="w-full bg-surface-secondary border border-white/5 rounded-xl px-2.5 py-1.5 text-[11px] text-text-secondary focus:outline-none focus:border-primary-accent/35"
                >
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.user.id} value={m.user.id}>
                      {m.user.display_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority Selector */}
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Priority</span>
                <select
                  value={draft.priority || "medium"}
                  onChange={(e) => onUpdateDraft(idx, "priority", e.target.value)}
                  className={`w-full border rounded-xl px-2.5 py-1.5 text-[11px] font-bold focus:outline-none ${getPriorityBadgeColor(draft.priority)}`}
                >
                  <option value="low" className="bg-surface-elevated text-text-secondary">Low</option>
                  <option value="medium" className="bg-surface-elevated text-warning">Medium</option>
                  <option value="high" className="bg-surface-elevated text-danger">High</option>
                  <option value="urgent" className="bg-surface-elevated text-red-500">Urgent</option>
                </select>
              </div>

              {/* Due date input */}
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Due Date</span>
                <input
                  type="date"
                  value={draft.due_date || ""}
                  onChange={(e) => onUpdateDraft(idx, "due_date", e.target.value || null)}
                  className="w-full bg-surface-secondary border border-white/5 rounded-xl px-2.5 py-1.5 text-[11px] text-text-secondary focus:outline-none focus:border-primary-accent/35"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button
        onClick={onSubmit}
        disabled={taskDrafts.length === 0 || isLoading}
        variant="primary"
        className="w-full flex items-center justify-center gap-2 mt-4"
        icon={<Check className="w-4 h-4" />}
      >
        Approve and Commit Tasks
      </Button>
    </div>
  );
};
