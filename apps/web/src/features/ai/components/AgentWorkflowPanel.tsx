import { useState, useEffect } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import * as AIAPI from "../api/ai.api";
import { workManagementApi } from "@/features/work-management/api/workManagement.api";
import { listMembers } from "@/features/members/api/members.api";
import type { WorkspaceMember } from "@teamhub/shared";

// Workflow Sub-components (Separation of Concerns / SRP)
import { WorkflowStepper } from "./workflow/WorkflowStepper";
import { WorkflowIdle } from "./workflow/WorkflowIdle";
import { WorkflowRunning } from "./workflow/WorkflowRunning";
import { WorkflowClarification } from "./workflow/WorkflowClarification";
import { WorkflowApproval } from "./workflow/WorkflowApproval";
import { WorkflowSuccess } from "./workflow/WorkflowSuccess";

interface BoardOption {
  id: string;
  name: string;
}

interface AgentWorkflowPanelProps {
  documentId: string;
  workspaceId: string;
}

export const AgentWorkflowPanel = ({ 
  documentId, 
  workspaceId 
}: AgentWorkflowPanelProps) => {
  // Thread & execution orchestration states
  const [threadId, setThreadId] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "running" | "clarification" | "approval" | "success" | "error">("idle");
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Workflow data states passed to child components
  const [ambiguousTasks, setAmbiguousTasks] = useState<any[]>([]);
  const [clarifications, setClarifications] = useState<Record<string, { assignee_raw: string; due_date: string }>>({});
  const [taskDrafts, setTaskDrafts] = useState<any[]>([]);
  const [createdTaskIds, setCreatedTaskIds] = useState<string[]>([]);

  // Workspace reference data
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [boards, setBoards] = useState<BoardOption[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<string>("");
  const [isCreatingNewBoard, setIsCreatingNewBoard] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");

  // 1. Fetch workspace context data once workspaceId is ready
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

  // 2. Reset workflow orchestrator state when switching documents
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

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <WorkflowStepper currentStepIndex={currentStepIndex} />

      {/* Main Scrollable View Area */}
      <div className="flex-1 overflow-y-auto p-4 min-h-0 relative bg-surface-secondary/20">
        
        {/* Error Alert Box */}
        {status === "error" && errorMessage && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2 text-xs text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold">Workflow Error:</span>
              <p className="mt-0.5 leading-relaxed">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Global Loading Overlay */}
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

        {/* Dynamic Workflow Views (SRP delegation) */}
        {status === "idle" && (
          <WorkflowIdle onStart={handleStartWorkflow} isLoading={isLoading} />
        )}

        {status === "running" && (
          <WorkflowRunning />
        )}

        {status === "clarification" && (
          <WorkflowClarification
            ambiguousTasks={ambiguousTasks}
            members={members}
            clarifications={clarifications}
            onChange={handleClarificationChange}
            onSubmit={handleSubmitClarifications}
            isLoading={isLoading}
          />
        )}

        {status === "approval" && (
          <WorkflowApproval
            taskDrafts={taskDrafts}
            members={members}
            boards={boards}
            selectedBoardId={selectedBoardId}
            setSelectedBoardId={setSelectedBoardId}
            isCreatingNewBoard={isCreatingNewBoard}
            setIsCreatingNewBoard={setIsCreatingNewBoard}
            newBoardName={newBoardName}
            setNewBoardName={setNewBoardName}
            onUpdateDraft={handleUpdateDraftTask}
            onDeleteDraft={handleDeleteDraftTask}
            onAddDraft={handleAddDraftTask}
            onSubmit={handleSubmitApproval}
            isLoading={isLoading}
          />
        )}

        {status === "success" && (
          <WorkflowSuccess
            createdTaskCount={createdTaskIds.length}
            onRunAgain={handleStartWorkflow}
          />
        )}

      </div>
    </div>
  );
};
