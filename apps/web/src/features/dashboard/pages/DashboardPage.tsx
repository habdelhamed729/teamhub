import { useState } from 'react';
import { useWorkspaceStore } from '@/app/store/useWorkspaceStore';
import { useAuthStore } from '@/app/store/useAuthStore';
import { useDashboardData, dashboardQueryKeys } from '../hooks/useDashboardData';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { useDashboardRealtime } from '../hooks/useDashboardRealtime';
import { CreateDocumentDialog } from '@/features/documents/components/CreateDocumentDialog';
import { TaskCreateEditModal } from '@/features/work-management/components/TaskCreateEditModal';
import { workManagementApi } from '@/features/work-management/api/workManagement.api';
import { buildCreateTaskPayload } from '@/features/work-management/utils/workManagementPayloads';
import { toast } from 'sonner';
import { HeroHeader } from '../components/HeroHeader';
import { MetricsRow } from '../components/MetricsRow';
import { QuickActions } from '../components/QuickActions';
import { ActivePriorityTasks } from '../components/ActivePriorityTasks';
import { RecentDocuments } from '../components/RecentDocuments';
import { TeamStatus } from '../components/TeamStatus';
import { LiveFeed } from '../components/LiveFeed';
import { AutoAssignmentDrawer } from '../components/AutoAssignmentDrawer';
import { DashboardSkeleton } from '../components/DashboardSkeleton';
import { DashboardError } from '../components/DashboardError';
import { BoardSelectorModal } from '../components/BoardSelectorModal';

export const DashboardPage = () => {
  const queryClient = useQueryClient();
  const activeWorkspace = useWorkspaceStore((state) => state.activeWorkspace);
  const user = useAuthStore((state) => state.user);

  const workspaceId = activeWorkspace?.id ?? '';

  // 1. Fetch dashboard queries
  const { data: dashboard, isLoading, isError, refetch } = useDashboardData(workspaceId);

  // 2. Fetch workspace boards to support quick task creation
  const { data: boards } = useQuery({
    queryKey: ['boards', workspaceId],
    queryFn: () => workManagementApi.listWorkspaceBoards(workspaceId),
    enabled: !!workspaceId
  });

  // 3. Modals & Panels States
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isCreateDocOpen, setIsCreateDocOpen] = useState(false);
  const [isAutoAssignOpen, setIsAutoAssignOpen] = useState(false);
  const [isSavingTask, setIsSavingTask] = useState(false);
  const [selectedBoardIdForNewTask, setSelectedBoardIdForNewTask] = useState<string | null>(null);
  const [isBoardSelectorOpen, setIsBoardSelectorOpen] = useState(false);

  // 4. Hook for socket event listening & query invalidation
  useDashboardRealtime(workspaceId, boards);

  // Task creation mutation
  const createTaskMutation = useMutation({
    mutationFn: ({ columnId, payload }: { columnId: string; payload: any }) => 
      workManagementApi.createTask(columnId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.workspace(workspaceId) });
      setIsTaskModalOpen(false);
      toast.success('Task created successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create task');
    },
    onSettled: () => {
      setIsSavingTask(false);
    }
  });

  const handleNewTaskClick = () => {
    if (!boards || boards.length === 0) {
      toast.error('Please create a Kanban Board first in the Tasks page');
      return;
    }
    if (boards.length === 1) {
      setSelectedBoardIdForNewTask(boards[0].id);
      setIsTaskModalOpen(true);
    } else {
      setIsBoardSelectorOpen(true);
    }
  };

  const handleBoardSelected = (boardId: string) => {
    setSelectedBoardIdForNewTask(boardId);
    setIsBoardSelectorOpen(false);
    setIsTaskModalOpen(true);
  };

  const handleCreateTask = async (data: any) => {
    const targetBoardId = selectedBoardIdForNewTask;
    if (!targetBoardId) {
      toast.error('No target board selected');
      return;
    }

    setIsSavingTask(true);
    try {
      const boardDetail = await workManagementApi.getBoardDetail(targetBoardId);
      
      if (!boardDetail.columns || boardDetail.columns.length === 0) {
        toast.error('The selected board has no columns. Please open the board and add a column.');
        setIsSavingTask(false);
        return;
      }

      const targetColumnId = boardDetail.columns[0].id;
      const payload = buildCreateTaskPayload(targetColumnId, data);
      
      createTaskMutation.mutate({ columnId: targetColumnId, payload });
    } catch (err) {
      toast.error('Failed to resolve target board column');
      setIsSavingTask(false);
    }
  };

  // Loading skeleton placeholder
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (isError || !dashboard) {
    return <DashboardError onRetry={refetch} />;
  }

  const { workspace, taskStats, workload, activePriorityTasks, recentDocuments, members, activities } = dashboard;

  return (
    <div className="space-y-8 pb-12">
      {/* ── HERO HEADER SECTION ────────────────────────────────────────── */}
      <HeroHeader 
        displayName={user?.display_name} 
        taskStats={taskStats} 
        workspace={workspace} 
      />

      {/* ── METRICS & CAPACITY ROW ────────────────────────────────────── */}
      <MetricsRow 
        taskStats={taskStats} 
        workload={workload} 
        activities={activities} 
      />

      {/* ── QUICK ACTIONS PANEL ───────────────────────────────────────── */}
      <QuickActions 
        onNewTaskClick={handleNewTaskClick}
        onWriteDocClick={() => setIsCreateDocOpen(true)}
        onAutoAssignClick={() => setIsAutoAssignOpen(true)}
      />

      {/* ── PRIMARY WORKSPACE GRID ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Focus & Productivity */}
        <div className="lg:col-span-2 space-y-8">
          {/* Active Priority Tasks */}
          <ActivePriorityTasks 
            workspaceId={workspaceId} 
            activePriorityTasks={activePriorityTasks} 
          />

          {/* Recent Documents */}
          <RecentDocuments 
            workspaceId={workspaceId} 
            recentDocuments={recentDocuments} 
            onWriteDocClick={() => setIsCreateDocOpen(true)} 
          />
        </div>

        {/* Right Column: Collaboration & Activity */}
        <div className="space-y-8">
          {/* Team Status */}
          <TeamStatus members={members} />

          {/* Live Feed Event Logger */}
          <LiveFeed activities={activities} />
        </div>
      </div>

      {/* ── DRAWERS & DIALOG MODALS ───────────────────────────────────── */}
      {/* Create Document Dialog */}
      <CreateDocumentDialog
        workspaceId={workspaceId}
        isOpen={isCreateDocOpen}
        onClose={() => setIsCreateDocOpen(false)}
      />

      {/* Create Task Modal */}
      <TaskCreateEditModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        workspaceId={workspaceId}
        title="New Task"
        isLoading={isSavingTask}
        onSave={handleCreateTask}
      />

      {/* Auto-Assignment Drawer */}
      <AutoAssignmentDrawer 
        isOpen={isAutoAssignOpen} 
        onClose={() => setIsAutoAssignOpen(false)} 
        workspaceId={workspaceId} 
      />

      {/* Board Selector Dialog */}
      <BoardSelectorModal
        isOpen={isBoardSelectorOpen}
        onClose={() => setIsBoardSelectorOpen(false)}
        boards={boards}
        onBoardSelected={handleBoardSelected}
      />
    </div>
  );
};
