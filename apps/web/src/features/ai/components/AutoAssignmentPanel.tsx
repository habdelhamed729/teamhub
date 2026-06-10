import { useState, useEffect } from "react";
import { Loader2, AlertCircle, Play, CheckCircle2, UserCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import * as AIAPI from "../api/ai.api";
import { workManagementApi } from "@/features/work-management/api/workManagement.api";
import { listMembers } from "@/features/members/api/members.api";
import type { WorkspaceMember } from "@teamhub/shared";
import { Button } from "@/shared/components/Button";

interface BoardOption {
  id: string;
  name: string;
}

interface AutoAssignmentPanelProps {
  workspaceId: string;
  initialBoardId?: string;
}

const PRIORITY_POINTS: Record<string, number> = {
  low: 1,
  medium: 2,
  high: 3,
  urgent: 5,
};

const getPriorityBadgeStyle = (priority: string) => {
  const p = (priority || "").toLowerCase();
  switch (p) {
    case "urgent":
      return "bg-red-500/10 text-red-400 border border-red-500/20";
    case "high":
      return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
    case "medium":
      return "bg-sky-500/10 text-sky-400 border border-sky-500/20";
    default:
      return "bg-slate-500/10 text-slate-400 border border-slate-500/20";
  }
};

export const AutoAssignmentPanel = ({
  workspaceId,
  initialBoardId = "",
}: AutoAssignmentPanelProps) => {
  // Workflow orchestration states
  const [threadId, setThreadId] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "running" | "approval" | "success" | "error">("idle");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Input Configurations
  const [selectedBoardId, setSelectedBoardId] = useState<string>(initialBoardId);
  const [maxWorkload, setMaxWorkload] = useState<number>(10);

  // Reference Data
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [boards, setBoards] = useState<BoardOption[]>([]);

  // Workflow Data
  const [unassignedTasks, setUnassignedTasks] = useState<any[]>([]);
  const [membersCapacities, setMembersCapacities] = useState<any[]>([]);
  const [proposedAssignments, setProposedAssignments] = useState<Record<string, string>>({});

  // 1. Fetch Board & Workspace Members on Mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [fetchedMembers, fetchedBoards] = await Promise.all([
          listMembers(workspaceId),
          workManagementApi.listWorkspaceBoards(workspaceId),
        ]);
        setMembers(fetchedMembers);
        setBoards(fetchedBoards);
        if (fetchedBoards.length > 0 && !selectedBoardId) {
          setSelectedBoardId(fetchedBoards[0].id);
        }
      } catch (err) {
        console.error("Failed to load workspace data for auto-assignment:", err);
      }
    };
    if (workspaceId) {
      loadData();
    }
  }, [workspaceId]);

  // 2. Clear state on tab/workspace shifts
  useEffect(() => {
    setThreadId(null);
    setStatus("idle");
    setErrorMessage(null);
    setUnassignedTasks([]);
    setMembersCapacities([]);
    setProposedAssignments({});
  }, [workspaceId, selectedBoardId]);

  // Launch Optimizer Run
  const handleStartWorkflow = async () => {
    if (!selectedBoardId) {
      toast.error("Please select a target board");
      return;
    }

    setIsLoading(true);
    setStatus("running");
    setErrorMessage(null);

    try {
      const state = await AIAPI.startAutoAssignmentWorkflow(selectedBoardId, maxWorkload);
      setThreadId(state.thread_id);
      processWorkflowState(state);
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setErrorMessage(err?.response?.data?.message || "Failed to start workload optimization.");
      toast.error("Optimization initiation failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Process return states from LLM solver
  const processWorkflowState = (state: AIAPI.WorkflowStateResponse) => {
    const nextSteps = state.next_step || [];

    if (state.status === "completed") {
      setStatus("success");
      setProposedAssignments(state.assignments || {});
      toast.success("Assignments committed successfully!");
    } else if (nextSteps.includes("ask_human_approval")) {
      setStatus("approval");
      setProposedAssignments(state.assignments || {});
      setUnassignedTasks(state.unassigned_tasks || []);
      setMembersCapacities(state.members || []);
    } else {
      if (state.status === "completed") {
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMessage("Workflow halted unexpectedly during analysis.");
      }
    }
  };

  // Update inline allocation override in state
  const handleAssigneeOverride = (taskId: string, userId: string) => {
    setProposedAssignments((prev) => ({
      ...prev,
      [taskId]: userId,
    }));
  };

  // Final Commit trigger
  const handleCommitAssignments = async () => {
    if (!threadId) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const state = await AIAPI.resumeAutoAssignmentWorkflow(threadId, proposedAssignments);
      processWorkflowState(state);
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setErrorMessage(err?.response?.data?.message || "Failed to commit task assignments.");
      toast.error("Failed to commit final assignments");
    } finally {
      setIsLoading(false);
    }
  };

  // Dynamic point calculator for visual capacity bars
  const getUserWorkloadPoints = (userId: string) => {
    const memberObj = membersCapacities.find((m) => m.id === userId);
    const startingPoints = memberObj ? memberObj.workload_points : 0;

    // Sum points of newly assigned tasks
    let allocatedPoints = 0;
    Object.entries(proposedAssignments).forEach(([taskId, assignedUserId]) => {
      if (assignedUserId === userId) {
        const taskObj = unassignedTasks.find((t) => t.id === taskId);
        if (taskObj) {
          allocatedPoints += PRIORITY_POINTS[taskObj.priority] || 2;
        }
      }
    });

    return {
      starting: startingPoints,
      allocated: allocatedPoints,
      total: startingPoints + allocatedPoints,
    };
  };

  // Progress Bar styling matching workload stress
  const getCapacityProgressStyles = (current: number, max: number) => {
    const ratio = Math.min(current / max, 1);
    if (current > max) {
      return {
        bar: "bg-red-500",
        bg: "bg-red-500/10 border-red-500/25",
        text: "text-red-400 font-bold animate-pulse",
      };
    }
    if (ratio >= 0.8) {
      return {
        bar: "bg-amber-500",
        bg: "bg-amber-500/10 border-amber-500/25",
        text: "text-amber-400 font-semibold",
      };
    }
    return {
      bar: "bg-emerald-500",
      bg: "bg-emerald-500/10 border-emerald-500/25",
      text: "text-emerald-400",
    };
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      
      {/* 1. Header Gradient Banner */}
      <div className="p-4 bg-linear-to-r from-violet-600/15 via-indigo-600/10 to-transparent border-b border-white/5 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-violet-400 animate-pulse" />
            AI Workload Auto-Assigner
          </h3>
          <p className="text-[10px] text-text-muted mt-0.5">
            Optimize backlog matching based on member capacity and completed task patterns
          </p>
        </div>
      </div>

      {/* 2. Scrollable Body Content */}
      <div className="flex-1 overflow-y-auto p-4 min-h-0 relative bg-surface-secondary/15">

        {/* Global Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-main-bg/75 backdrop-blur-xs z-20 flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
              <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
            </div>
            <div className="text-center">
              <span className="text-xs font-bold text-text-secondary">Optimizer Running...</span>
              <p className="text-[10px] text-text-muted mt-0.5">Iterating task allocations to resolve capacity limits.</p>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {status === "error" && errorMessage && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2 text-xs text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold">Workflow Failure:</span>
              <p className="mt-0.5 leading-relaxed">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* VIEW: IDLE / CONFIGURATION */}
        {status === "idle" && (
          <div className="space-y-4">
            
            {/* Board Selector */}
            <div className="p-4 bg-surface-elevated border border-white/5 rounded-2xl space-y-3.5 shadow-md">
              <label className="text-xs font-bold text-text-primary uppercase tracking-wider block">
                🎯 Target Kanban Board
              </label>
              <select
                value={selectedBoardId}
                onChange={(e) => setSelectedBoardId(e.target.value)}
                className="w-full bg-surface-secondary border border-white/5 rounded-xl px-3 py-2 text-xs text-text-secondary focus:outline-none focus:border-indigo-500/35"
              >
                <option value="" disabled>Choose a board...</option>
                {boards.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            {/* Constraints Config */}
            <div className="p-4 bg-surface-elevated border border-white/5 rounded-2xl space-y-3.5 shadow-md">
              <label className="text-xs font-bold text-text-primary uppercase tracking-wider block">
                ⚖️ Point Capacity Threshold
              </label>
              <div className="space-y-1">
                <input
                  type="number"
                  min={5}
                  max={40}
                  value={maxWorkload}
                  onChange={(e) => setMaxWorkload(parseInt(e.target.value) || 10)}
                  className="w-full bg-surface-secondary border border-white/5 rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-indigo-500/35"
                  placeholder="e.g. 10 workload points"
                />
                <p className="text-[9px] text-text-muted leading-relaxed pt-1">
                  Point weights: Low (1pt), Medium (2pts), High (3pts), Urgent (5pts). Maximum recommended workload prevents overload warnings.
                </p>
              </div>
            </div>

            <Button
              onClick={handleStartWorkflow}
              disabled={isLoading || !selectedBoardId}
              variant="primary"
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white mt-2 font-semibold shadow-indigo-600/10"
              icon={<Play className="w-4 h-4 fill-current" />}
            >
              Analyze & Auto-Assign
            </Button>
          </div>
        )}

        {/* VIEW: RUNNING TRANSITION */}
        {status === "running" && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 animate-pulse">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-text-primary">Balancing workloads...</h4>
              <p className="text-[10px] text-text-muted max-w-[260px] leading-relaxed mt-1">
                AI is compiling historical task context, loading current assignees, and evaluating point capacity maps.
              </p>
            </div>
          </div>
        )}

        {/* VIEW: APPROVAL / MANUAL OVERRIDES */}
        {status === "approval" && (
          <div className="space-y-4">
            
            {/* Section A: Live Capacity Status Bars */}
            <div className="p-4 bg-surface-elevated border border-white/5 rounded-2xl space-y-3 shadow-md">
              <label className="text-xs font-bold text-text-primary uppercase tracking-wider block">
                📈 Member Workload Point Balance
              </label>
              
              {membersCapacities.length === 0 && (
                <p className="text-[10px] text-text-muted">No workspace members detected.</p>
              )}

              <div className="space-y-2.5">
                {membersCapacities.map((member) => {
                  const points = getUserWorkloadPoints(member.id);
                  const styles = getCapacityProgressStyles(points.total, maxWorkload);
                  const progressPercentage = Math.min((points.total / maxWorkload) * 100, 100);

                  return (
                    <div key={member.id} className="space-y-1 bg-surface-secondary/40 p-2 border border-white/5 rounded-xl">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-semibold text-text-secondary">{member.name}</span>
                        <span className={styles.text}>
                          {points.total} / {maxWorkload} pts
                          {points.starting > 0 && ` (${points.starting} active)`}
                        </span>
                      </div>
                      
                      {/* Visual Point Bar */}
                      <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${styles.bar}`}
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section B: Allocation Cards */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <label className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  🤝 Recommended Allocations ({unassignedTasks.length})
                </label>
              </div>

              {unassignedTasks.length === 0 && (
                <div className="text-center p-6 bg-surface-elevated/40 border border-dashed border-white/5 rounded-2xl">
                  <p className="text-xs text-text-muted">No unassigned tasks on this board.</p>
                </div>
              )}

              {unassignedTasks.map((task) => {
                const assignedUserId = proposedAssignments[task.id] || "";
                const points = PRIORITY_POINTS[task.priority] || 2;

                return (
                  <div key={task.id} className="p-4 bg-surface-elevated border border-white/5 rounded-2xl space-y-3 shadow-md relative">
                    
                    {/* Header: Title and points weight */}
                    <div className="flex items-start justify-between gap-4">
                      <h4 className="text-xs font-bold text-text-primary line-clamp-2 leading-relaxed flex-1">
                        {task.title}
                      </h4>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase shrink-0 ${getPriorityBadgeStyle(task.priority)}`}>
                        {task.priority} ({points}pt)
                      </span>
                    </div>

                    {/* Desc */}
                    {task.description && (
                      <p className="text-[10px] text-text-muted line-clamp-2 leading-relaxed bg-surface-secondary/35 p-2 rounded-lg">
                        {task.description}
                      </p>
                    )}

                    {/* Selector */}
                    <div className="space-y-1 pt-1.5">
                      <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Assignee Match</span>
                      <select
                        value={assignedUserId}
                        onChange={(e) => handleAssigneeOverride(task.id, e.target.value)}
                        className="w-full bg-surface-secondary border border-white/5 rounded-xl px-2.5 py-1.5 text-[11px] text-text-secondary focus:outline-none focus:border-indigo-500/35"
                      >
                        <option value="">Leave Unassigned</option>
                        {members.map((m) => (
                          <option key={m.user.id} value={m.user.id}>
                            {m.user.display_name}
                          </option>
                        ))}
                      </select>
                    </div>

                  </div>
                );
              })}
            </div>

            <div className="flex gap-2.5 pt-2">
              <Button
                onClick={() => setStatus("idle")}
                variant="secondary"
                className="flex-1 text-xs py-2 border-white/5 hover:bg-white/5"
              >
                Abort
              </Button>
              <Button
                onClick={handleCommitAssignments}
                disabled={isLoading}
                variant="primary"
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2"
                icon={<UserCheck className="w-4 h-4" />}
              >
                Commit Assignments
              </Button>
            </div>
          </div>
        )}

        {/* VIEW: SUCCESS FEEDBACK */}
        {status === "success" && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 mb-4 animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-sm font-bold text-text-primary mb-1">Tasks Auto-Assigned!</h4>
            <p className="text-xs text-text-muted max-w-[280px] leading-relaxed mb-6">
              Workloads optimized and assignees committed directly to your Kanban board tasks.
            </p>
            
            <div className="w-full flex flex-col gap-2">
              <Button
                onClick={() => setStatus("idle")}
                variant="primary"
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                Optimize Again
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
