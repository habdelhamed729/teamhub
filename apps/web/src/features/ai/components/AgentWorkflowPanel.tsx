import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Clipboard, 
  Loader2, 
  User as UserIcon, 
  Calendar, 
  CheckSquare, 
  Check, 
  AlertCircle, 
  ArrowRight,
  Plus,
  Trash2,
  ChevronRight,
  Grid
} from "lucide-react";
import { Button } from "@/shared/components/Button";
import * as AIAPI from "../api/ai.api";
import { workManagementApi } from "@/features/work-management/api/workManagement.api";
import { listMembers } from "@/features/members/api/members.api";
import type { WorkspaceMember } from "@teamhub/shared";
import { toast } from "sonner";

interface BoardOption {
  id: string;
  name: string;
}

interface AgentWorkflowPanelProps {
  documentId: string;
  workspaceId: string;
}

export const AgentWorkflowPanel: React.FC<AgentWorkflowPanelProps> = ({ 
  documentId, 
  workspaceId 
}) => {
  // Thread & step states
  const [threadId, setThreadId] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "running" | "clarification" | "approval" | "success" | "error">("idle");
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Workflow data states
  const [ambiguousTasks, setAmbiguousTasks] = useState<any[]>([]);
  const [clarifications, setClarifications] = useState<Record<string, { assignee_raw: string; due_date: string }>>({});
  const [taskDrafts, setTaskDrafts] = useState<any[]>([]);
  const [createdTaskIds, setCreatedTaskIds] = useState<string[]>([]);

  // Workspace configuration data
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [boards, setBoards] = useState<BoardOption[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<string>("");
  const [isCreatingNewBoard, setIsCreatingNewBoard] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");

  // Load members and boards when needed
  useEffect(() => {
    const loadWorkspaceData = async () => {
      try {
        const [fetchedMembers, fetchedBoards] = await Promise.all([
          listMembers(workspaceId),
          workManagementApi.listWorkspaceBoards(workspaceId)
        ]);
        setMembers(fetchedMembers);
        setBoards(fetchedBoards);
        if (fetchedBoards.length > 0) {
          setSelectedBoardId(fetchedBoards[0].id);
        } else {
          setIsCreatingNewBoard(true);
          setNewBoardName("AI Task Board");
        }
      } catch (err) {
        console.error("Failed to load workspace data for workflow:", err);
      }
    };
    if (workspaceId) {
      loadWorkspaceData();
    }
  }, [workspaceId]);

  // Reset state on document change
  useEffect(() => {
    setThreadId(null);
    setStatus("idle");
    setCurrentStepIndex(0);
    setErrorMessage(null);
    setAmbiguousTasks([]);
    setClarifications({});
    setTaskDrafts([]);
    setCreatedTaskIds([]);
  }, [documentId]);

  const handleStartWorkflow = async () => {
    setIsLoading(true);
    setStatus("running");
    setCurrentStepIndex(0);
    setErrorMessage(null);

    try {
      const state = await AIAPI.startDocumentTasksWorkflow(documentId);
      setThreadId(state.thread_id);
      processWorkflowState(state);
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setErrorMessage(err?.response?.data?.message || "Failed to start extraction workflow.");
      toast.error("Workflow initialization failed");
    } finally {
      setIsLoading(false);
    }
  };

  const processWorkflowState = (state: AIAPI.WorkflowStateResponse) => {
    const nextSteps = state.next_step || [];

    if (state.status === "completed") {
      setStatus("success");
      setCurrentStepIndex(3);
      setCreatedTaskIds(state.created_task_ids || []);
      toast.success("Tasks created successfully!");
    } else if (nextSteps.includes("ask_human_clarification")) {
      setStatus("clarification");
      setCurrentStepIndex(1);
      const items = state.ambiguous_tasks || [];
      setAmbiguousTasks(items);
      
      // Initialize clarifications structure
      const initialClars: Record<string, { assignee_raw: string; due_date: string }> = {};
      items.forEach((item) => {
        initialClars[item.index] = {
          assignee_raw: item.task.assignee_raw || "",
          due_date: item.task.due_date || ""
        };
      });
      setClarifications(initialClars);
    } else if (nextSteps.includes("ask_board_and_approval")) {
      setStatus("approval");
      setCurrentStepIndex(2);
      setTaskDrafts(state.task_drafts || []);
    } else {
      // General state updates
      if (state.status === "completed") {
        setStatus("success");
        setCurrentStepIndex(3);
      } else {
        setStatus("error");
        setErrorMessage("Unexpected workflow halting state.");
      }
    }
  };

  const handleClarificationChange = (index: string, field: "assignee_raw" | "due_date", value: string) => {
    setClarifications((prev) => ({
      ...prev,
      [index]: {
        ...prev[index],
        [field]: value
      }
    }));
  };

  const handleSubmitClarifications = async () => {
    if (!threadId) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const state = await AIAPI.resumeDocumentTasksWorkflow(threadId, clarifications);
      processWorkflowState(state);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.response?.data?.message || "Failed to submit clarifications.");
      toast.error("Submission failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateDraftTask = (index: number, field: string, value: any) => {
    setTaskDrafts((prev) => 
      prev.map((draft, idx) => 
        idx === index ? { ...draft, [field]: value } : draft
      )
    );
  };

  const handleDeleteDraftTask = (index: number) => {
    setTaskDrafts((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleAddDraftTask = () => {
    setTaskDrafts((prev) => [
      ...prev,
      {
        title: "New Task",
        description: "",
        assignee_id: null,
        priority: "medium",
        due_date: ""
      }
    ]);
  };

  const handleSubmitApproval = async () => {
    if (!threadId) return;
    if (isCreatingNewBoard && !newBoardName.trim()) {
      toast.error("Please enter a new board name");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const payload = {
      board_id: isCreatingNewBoard ? null : selectedBoardId,
      new_board_name: isCreatingNewBoard ? newBoardName : null,
      approved_tasks: taskDrafts
    };

    try {
      const state = await AIAPI.resumeDocumentTasksWorkflow(threadId, payload);
      processWorkflowState(state);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.response?.data?.message || "Failed to commit tasks.");
      toast.error("Failed to commit board tasks");
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    const p = (priority || "").toLowerCase();
    switch (p) {
      case "urgent": return "bg-red-500/10 text-red-400 border border-red-500/20";
      case "high": return "bg-danger/10 text-danger border border-danger/20";
      case "medium": return "bg-warning/10 text-warning border border-warning/20";
      default: return "bg-primary-accent/10 text-primary-accent border border-primary-accent/20";
    }
  };

  // Stepper Header Component
  const renderStepper = () => {
    const steps = [
      { num: 1, label: "Scan" },
      { num: 2, label: "Clarify" },
      { num: 3, label: "Approve" },
      { num: 4, label: "Done" }
    ];

    return (
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-surface-secondary/40 shrink-0">
        {steps.map((s, idx) => (
          <React.Fragment key={s.num}>
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
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {renderStepper()}

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 min-h-0 relative bg-surface-secondary/20">
        
        {/* Error Notification */}
        {status === "error" && errorMessage && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2 text-xs text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold">Workflow Error:</span>
              <p className="mt-0.5 leading-relaxed">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* LOADING STATE OVERLAY */}
        {isLoading && (
          <div className="absolute inset-0 bg-main-bg/75 backdrop-blur-xs z-20 flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary-accent/10 flex items-center justify-center border border-primary-accent/20">
              <Loader2 className="w-6 h-6 text-primary-accent animate-spin" />
            </div>
            <div className="text-center">
              <span className="text-xs font-bold text-text-secondary">Agent Thinking...</span>
              <p className="text-[10px] text-text-muted mt-0.5">Please wait while the state graph executes.</p>
            </div>
          </div>
        )}

        {/* IDLE STATE */}
        {status === "idle" && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-text-muted">
            <Sparkles className="w-12 h-12 text-primary-accent/40 mb-3" />
            <h4 className="text-sm font-bold text-text-secondary mb-1">Stateful AI Task Extractor</h4>
            <p className="text-xs max-w-[280px] leading-relaxed mb-6">
              Launch a multi-step LangGraph agent to extract tasks from this document, clarify vague assignees/dates, and insert them directly into your Kanban Board.
            </p>
            <Button
              onClick={handleStartWorkflow}
              variant="primary"
              className="w-full flex items-center justify-center gap-2"
              icon={<Clipboard className="w-4 h-4" />}
            >
              Start Agent Scan
            </Button>
          </div>
        )}

        {/* RUNNING STATE */}
        {status === "running" && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-text-muted">
            <Loader2 className="w-12 h-12 text-primary-accent animate-spin mb-3" />
            <h4 className="text-sm font-bold text-text-secondary mb-1">Scanning Document</h4>
            <p className="text-xs max-w-[260px] leading-relaxed">
              Analyzing sentences, identifying action points, and checking assignee databases...
            </p>
          </div>
        )}

        {/* INTERRUPT STATE 1: CLARIFICATION REQUIRED */}
        {status === "clarification" && (
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
                        onChange={(e) => handleClarificationChange(item.index, "assignee_raw", e.target.value)}
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
                        onChange={(e) => handleClarificationChange(item.index, "due_date", e.target.value)}
                        className="w-full bg-surface-secondary border border-white/5 rounded-xl px-2.5 py-1.5 text-xs text-text-secondary focus:outline-none focus:border-primary-accent/35"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button
              onClick={handleSubmitClarifications}
              variant="primary"
              className="w-full flex items-center justify-center gap-2 mt-4"
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Submit & Re-run
            </Button>
          </div>
        )}

        {/* INTERRUPT STATE 2: BOARD CONFIGURATION & DRAFT APPROVAL */}
        {status === "approval" && (
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
                  onClick={handleAddDraftTask}
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
                    onClick={() => handleDeleteDraftTask(idx)}
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
                      onChange={(e) => handleUpdateDraftTask(idx, "title", e.target.value)}
                      placeholder="Task Title"
                      className="w-full bg-transparent border-b border-white/5 focus:border-primary-accent/30 text-sm font-bold text-text-primary pb-1 focus:outline-none"
                    />

                    {/* Editable Description */}
                    <textarea
                      value={draft.description || ""}
                      onChange={(e) => handleUpdateDraftTask(idx, "description", e.target.value)}
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
                        onChange={(e) => handleUpdateDraftTask(idx, "assignee_id", e.target.value || null)}
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
                        onChange={(e) => handleUpdateDraftTask(idx, "priority", e.target.value)}
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
                        onChange={(e) => handleUpdateDraftTask(idx, "due_date", e.target.value || null)}
                        className="w-full bg-surface-secondary border border-white/5 rounded-xl px-2.5 py-1.5 text-[11px] text-text-secondary focus:outline-none focus:border-primary-accent/35"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button
              onClick={handleSubmitApproval}
              disabled={taskDrafts.length === 0}
              variant="primary"
              className="w-full flex items-center justify-center gap-2 mt-4"
              icon={<Check className="w-4 h-4" />}
            >
              Approve and Commit Tasks
            </Button>
          </div>
        )}

        {/* SUCCESS STATE */}
        {status === "success" && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 mb-4 animate-bounce">
              <CheckSquare className="w-8 h-8" />
            </div>
            <h4 className="text-sm font-bold text-text-primary mb-1">Tasks Created Successfully!</h4>
            <p className="text-xs text-text-muted max-w-[280px] leading-relaxed mb-6">
              The agent compiled and loaded <strong>{createdTaskIds.length} tasks</strong> into the target board's "To Do" column.
            </p>
            
            <div className="w-full flex flex-col gap-2">
              <Button
                onClick={() => {
                  // Direct to boards or workspace
                  window.location.reload(); // Quick refresh or simple state reset
                }}
                variant="secondary"
                className="w-full flex items-center justify-center gap-2"
                icon={<Grid className="w-4 h-4" />}
              >
                Go to Workspace Boards
              </Button>
              
              <Button
                onClick={handleStartWorkflow}
                variant="ghost"
                className="w-full flex items-center justify-center gap-2 text-text-muted hover:text-text-primary text-xs border-transparent hover:bg-white/5"
              >
                Run Again
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
