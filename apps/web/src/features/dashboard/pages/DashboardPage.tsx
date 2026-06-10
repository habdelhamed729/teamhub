import { useState, useEffect, useMemo } from 'react';
import { useWorkspaceStore } from '@/app/store/useWorkspaceStore';
import { useAuthStore } from '@/app/store/useAuthStore';
import { useDashboardData, dashboardQueryKeys } from '../hooks/useDashboardData';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { getSocket } from '@/shared/services/socket';
import { WorkManagementEvents } from '@teamhub/shared';
import { CreateDocumentDialog } from '@/features/documents/components/CreateDocumentDialog';
import { TaskCreateEditModal } from '@/features/work-management/components/TaskCreateEditModal';
import { AutoAssignmentPanel } from '@/features/ai/components/AutoAssignmentPanel';
import { workManagementApi } from '@/features/work-management/api/workManagement.api';
import { buildCreateTaskPayload } from '@/features/work-management/utils/workManagementPayloads';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { 
  CheckSquare, 
  Calendar, 
  FileText, 
  Plus, 
  Users, 
  Flame, 
  TrendingUp, 
  MessageSquare,
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-react';

// Format time utility
export function formatRelativeTime(date: string | Date): string {
  const parsedDate = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - parsedDate.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays}d ago`;
}

export const DashboardPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const activeWorkspace = useWorkspaceStore((state) => state.activeWorkspace);
  const user = useAuthStore((state) => state.user);
  const socket = getSocket();

  const workspaceId = activeWorkspace?.id ?? '';

  // 1. Fetch dashboard queries
  const { data: dashboard, isLoading, isError, refetch } = useDashboardData(workspaceId);

  // 2. Fetch workspace boards to support quick task creation
  const { data: boards } = useQuery({
    queryKey: ['boards', workspaceId],
    queryFn: () => workManagementApi.listWorkspaceBoards(workspaceId),
    enabled: !!workspaceId
  });

  // Modals & Panels States
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isCreateDocOpen, setIsCreateDocOpen] = useState(false);
  const [isAutoAssignOpen, setIsAutoAssignOpen] = useState(false);
  const [isSavingTask, setIsSavingTask] = useState(false);

  // 3. Socket real-time synchronization
  useEffect(() => {
    if (!workspaceId || !boards) return;

    // Join all board socket rooms associated with this workspace
    boards.forEach(board => {
      socket.emit(WorkManagementEvents.JOIN_BOARD, board.id);
    });

    const handleRealtimeUpdate = () => {
      queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.workspace(workspaceId) });
    };

    socket.on(WorkManagementEvents.TASK_CREATED, handleRealtimeUpdate);
    socket.on(WorkManagementEvents.TASK_UPDATED, handleRealtimeUpdate);
    socket.on(WorkManagementEvents.TASK_MOVED, handleRealtimeUpdate);
    socket.on(WorkManagementEvents.TASK_DELETED, handleRealtimeUpdate);

    return () => {
      boards.forEach(board => {
        socket.emit(WorkManagementEvents.LEAVE_BOARD, board.id);
      });
      socket.off(WorkManagementEvents.TASK_CREATED, handleRealtimeUpdate);
      socket.off(WorkManagementEvents.TASK_UPDATED, handleRealtimeUpdate);
      socket.off(WorkManagementEvents.TASK_MOVED, handleRealtimeUpdate);
      socket.off(WorkManagementEvents.TASK_DELETED, handleRealtimeUpdate);
    };
  }, [workspaceId, boards, socket, queryClient]);

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

  const handleCreateTask = async (data: any) => {
    if (!boards || boards.length === 0) {
      toast.error('Please create a Kanban Board first in the Tasks page');
      return;
    }

    setIsSavingTask(true);
    try {
      // Fetch the first board details to find its first column
      const firstBoardId = boards[0].id;
      const boardDetail = await workManagementApi.getBoardDetail(firstBoardId);
      
      if (!boardDetail.columns || boardDetail.columns.length === 0) {
        toast.error('The default board has no columns. Please open the board and add a column.');
        setIsSavingTask(false);
        return;
      }

      const targetColumnId = boardDetail.columns[0].id;
      const payload = buildCreateTaskPayload(targetColumnId, data);
      
      createTaskMutation.mutate({ columnId: targetColumnId, payload });
    } catch (err) {
      toast.error('Failed to resolve default board column');
      setIsSavingTask(false);
    }
  };

  // Workload points level styles
  const workloadPointsRatio = useMemo(() => {
    if (!dashboard) return 0;
    return Math.min(1, dashboard.workload.currentPoints / dashboard.workload.capacityLimit);
  }, [dashboard]);

  const workloadStatus = useMemo(() => {
    if (!dashboard) return { label: 'Healthy', colorClass: 'text-success bg-success/10', barClass: 'from-cyan-400 to-emerald-400' };
    const points = dashboard.workload.currentPoints;
    if (points > 9) {
      return { 
        label: 'Overload', 
        colorClass: 'text-danger bg-danger/10 border-danger/20 shadow-[0_0_15px_-5px_rgba(239,68,68,0.4)] animate-pulse', 
        barClass: 'from-rose-500 to-red-600 shadow-[0_0_15px_rgba(239,68,68,0.5)]' 
      };
    }
    if (points > 6) {
      return { label: 'Caution', colorClass: 'text-warning bg-warning/10 border-warning/20', barClass: 'from-amber-400 to-orange-500' };
    }
    return { label: 'Healthy', colorClass: 'text-success bg-success/10 border-success/20', barClass: 'from-sky-400 to-emerald-400' };
  }, [dashboard]);

  // Loading skeleton placeholder
  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse text-white">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-3">
            <div className="h-8 w-64 bg-white/5 rounded-xl" />
            <div className="h-4 w-96 bg-white/5 rounded-lg" />
          </div>
          <div className="h-16 w-64 bg-white/5 rounded-2xl" />
        </div>

        {/* Metrics Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-44 bg-white/5 border border-white/5 rounded-2xl" />
          <div className="h-44 bg-white/5 border border-white/5 rounded-2xl" />
          <div className="h-44 bg-white/5 border border-white/5 rounded-2xl" />
        </div>

        {/* Layout Split Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="h-64 bg-white/5 border border-white/5 rounded-2xl" />
            <div className="h-64 bg-white/5 border border-white/5 rounded-2xl" />
          </div>
          <div className="h-96 bg-white/5 border border-white/5 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError || !dashboard) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center p-8">
        <div className="w-16 h-16 rounded-3xl bg-surface-secondary flex items-center justify-center mb-6 border border-white/5 shadow-xl">
          <Info className="w-8 h-8 text-text-muted opacity-40" />
        </div>
        <h2 className="text-xl font-bold text-text-primary mb-2">Failed to load dashboard</h2>
        <p className="text-sm text-text-muted mb-6">Verify your network connection or reload the workspace.</p>
        <button onClick={() => refetch()} className="px-5 py-2.5 bg-primary-accent text-main-bg font-bold rounded-xl hover:bg-primary-accent/90 transition-all">
          Reload
        </button>
      </div>
    );
  }

  const { workspace, taskStats, workload, activePriorityTasks, recentDocuments, members, activities } = dashboard;

  return (
    <div className="space-y-8 pb-12">
      {/* ── HERO HEADER SECTION ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">
            Welcome back, {user?.display_name}!
          </h1>
          <p className="text-sm text-text-muted mt-2">
            You have <span className="text-primary-accent font-semibold">{taskStats.todo + taskStats.inProgress} active tasks</span>, and {taskStats.overdue > 0 ? (
              <span className="text-danger font-semibold">{taskStats.overdue} tasks are overdue</span>
            ) : (
              <span>0 tasks are overdue</span>
            )}. Let's get to work.
          </p>
        </div>

        {/* Workspace Brand Card */}
        <div className="flex items-center gap-4 bg-surface-elevated/40 border border-white/5 px-5 py-4 rounded-2xl shadow-premium backdrop-blur-md shrink-0">
          <div className="w-11 h-11 bg-primary-accent/10 border border-primary-accent/20 rounded-xl flex items-center justify-center font-bold text-lg text-primary-accent">
            {workspace.logo_url ? (
              <img src={workspace.logo_url} alt={workspace.name} className="w-full h-full object-contain" />
            ) : (
              workspace.name.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-text-primary">{workspace.name}</span>
              <span className="px-1.5 py-0.5 text-[9px] font-bold tracking-widest text-primary-accent bg-primary-accent/10 rounded uppercase border border-primary-accent/15">
                {workspace.plan}
              </span>
            </div>
            <p className="text-xs text-text-muted mt-1 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              {workspace.memberCount} Members
            </p>
          </div>
        </div>
      </div>

      {/* ── METRICS & CAPACITY ROW ────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* My Tasks Widget */}
        <div className="bg-surface-elevated/40 border border-white/5 p-6 rounded-2xl shadow-premium backdrop-blur-md flex flex-col justify-between group hover:border-white/10 transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-secondary flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-text-muted" /> My Tasks
            </h3>
            <span className="text-xs font-bold text-text-muted">{taskStats.totalActive} Active</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-surface-secondary/50 rounded-xl p-3 text-center border border-white/5">
              <div className="text-2xl font-bold text-text-primary">{taskStats.todo}</div>
              <div className="text-[10px] text-text-muted font-bold uppercase tracking-wider mt-1">To Do</div>
            </div>
            <div className="bg-primary-accent/5 rounded-xl p-3 text-center border border-primary-accent/10">
              <div className="text-2xl font-bold text-primary-accent">{taskStats.inProgress}</div>
              <div className="text-[10px] text-primary-accent/80 font-bold uppercase tracking-wider mt-1">Doing</div>
            </div>
            <div className={`rounded-xl p-3 text-center border ${taskStats.overdue > 0 ? 'bg-danger/5 border-danger/10 text-danger' : 'bg-surface-secondary/50 border-white/5 text-text-muted'}`}>
              <div className="text-2xl font-bold">{taskStats.overdue}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider mt-1">Overdue</div>
            </div>
          </div>
        </div>

        {/* Live Workload Capacity Bar */}
        <div className="bg-surface-elevated/40 border border-white/5 p-6 rounded-2xl shadow-premium backdrop-blur-md flex flex-col justify-between group hover:border-white/10 transition-all">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-secondary flex items-center gap-2">
              <Flame className="w-4 h-4 text-text-muted" /> Capacity
            </h3>
            <span className={`px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest rounded border ${workloadStatus.colorClass}`}>
              {workloadStatus.label}
            </span>
          </div>

          <div className="space-y-3 mt-4">
            <div className="flex items-center justify-between text-xs font-bold text-text-muted">
              <span>Current Workload</span>
              <span className="text-text-primary">{workload.currentPoints} / {workload.capacityLimit} Points</span>
            </div>
            <div className="h-3 w-full bg-surface-secondary rounded-full overflow-hidden p-[2px] border border-white/5">
              <div 
                className={`h-full bg-linear-to-r rounded-full transition-all duration-500 ${workloadStatus.barClass}`}
                style={{ width: `${workloadPointsRatio * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-text-muted leading-relaxed mt-2 border-t border-white/5 pt-2 select-none">
              Weighted by task priority: Low (1pt), Medium (2pts), High (3pts), Urgent (5pts) against a capacity threshold of 10.
            </p>
          </div>
        </div>

        {/* Recent Updates Mini Feed */}
        <div className="bg-surface-elevated/40 border border-white/5 p-6 rounded-2xl shadow-premium backdrop-blur-md flex flex-col justify-between group hover:border-white/10 transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-secondary flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-text-muted" /> Activity
            </h3>
            <span className="text-xs font-bold text-text-muted">Live logs</span>
          </div>

          <div className="space-y-3.5 max-h-24 overflow-y-auto scrollbar-none">
            {activities.slice(0, 3).map((act) => (
              <div key={act.id} className="flex items-center gap-3 text-xs">
                <div className="w-6 h-6 rounded-md bg-surface-secondary flex items-center justify-center shrink-0 border border-white/5 text-text-muted">
                  {act.type.includes('task') ? <CheckSquare className="w-3 h-3" /> : act.type.includes('document') ? <FileText className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
                </div>
                <div className="truncate flex-1 text-text-secondary">
                  <span className="font-bold text-text-primary">{act.user.display_name}</span>{' '}
                  {act.type.includes('created') ? 'created' : 'updated'}{' '}
                  <span className="font-medium text-text-primary">{act.targetName}</span>
                </div>
                <span className="text-[10px] text-text-muted font-semibold shrink-0">{formatRelativeTime(act.timestamp)}</span>
              </div>
            ))}
            {activities.length === 0 && (
              <p className="text-xs text-text-muted italic text-center py-4">No recent activity logs</p>
            )}
          </div>
        </div>
      </div>

      {/* ── QUICK ACTIONS PANEL ───────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <button 
          onClick={() => setIsTaskModalOpen(true)}
          className="flex items-center gap-2 bg-surface-elevated hover:bg-white/5 border border-white/5 hover:border-primary-accent/30 px-4 py-2.5 rounded-xl text-xs font-bold text-text-secondary hover:text-primary-accent shadow-premium transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> New Task
        </button>
        <button 
          onClick={() => setIsCreateDocOpen(true)}
          className="flex items-center gap-2 bg-surface-elevated hover:bg-white/5 border border-white/5 hover:border-primary-accent/30 px-4 py-2.5 rounded-xl text-xs font-bold text-text-secondary hover:text-primary-accent shadow-premium transition-all cursor-pointer"
        >
          <FileText className="w-4 h-4" /> Write Document
        </button>
        <button 
          onClick={() => setIsAutoAssignOpen(true)}
          className="flex items-center gap-2 bg-primary-accent/10 hover:bg-primary-accent/20 border border-primary-accent/20 hover:border-primary-accent/30 px-4 py-2.5 rounded-xl text-xs font-extrabold text-primary-accent shadow-premium hover:shadow-[0_0_15px_-5px_rgba(94,234,212,0.3)] transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4" /> Auto-Assign
        </button>
      </div>

      {/* ── PRIMARY WORKSPACE GRID ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Focus & Productivity */}
        <div className="lg:col-span-2 space-y-8">
          {/* Active Priority Tasks */}
          <div className="bg-surface-elevated/40 border border-white/5 rounded-2xl shadow-premium backdrop-blur-md p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-text-primary">Active Priority</h2>
                <p className="text-xs text-text-muted mt-0.5">Your top high-priority tasks</p>
              </div>
              <Link to={`/workspaces/${workspaceId}/tasks`} className="text-xs font-bold text-primary-accent hover:underline flex items-center gap-1">
                View All <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-3.5">
              {activePriorityTasks.map((task) => (
                <div 
                  key={task.id} 
                  onClick={() => navigate(`/workspaces/${workspaceId}/tasks/${task.boardId}?task=${task.id}`)}
                  className="flex items-center justify-between gap-4 bg-surface-secondary/30 hover:bg-surface-secondary/70 border border-white/5 hover:border-primary-accent/20 px-4 py-3.5 rounded-xl transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <CheckSquare className="w-4.5 h-4.5 text-text-muted shrink-0 group-hover:text-primary-accent transition-colors" />
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-text-primary truncate">{task.title}</h4>
                      <p className="text-[11px] text-text-muted font-medium mt-1 flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 uppercase text-[9px] font-bold">
                          {task.priority}
                        </span>
                        {task.dueDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex -space-x-2.5 overflow-hidden shrink-0">
                    {task.assignees.map((assignee) => (
                      <div 
                        key={assignee.userId} 
                        className="w-6 h-6 rounded-md bg-surface-elevated border border-white/10 flex items-center justify-center overflow-hidden font-bold text-[9px] text-text-primary ring-2 ring-surface-secondary"
                        title={assignee.user.display_name}
                      >
                        {assignee.user.avatar_url ? (
                          <img src={assignee.user.avatar_url} alt={assignee.user.display_name} className="w-full h-full object-cover" />
                        ) : (
                          assignee.user.display_name.charAt(0).toUpperCase()
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {activePriorityTasks.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 border border-dashed border-white/5 rounded-xl p-6 bg-surface-secondary/10 text-center">
                  <div className="w-10 h-10 rounded-xl bg-surface-secondary border border-white/5 flex items-center justify-center mb-3">
                    <CheckSquare className="w-5 h-5 text-text-muted opacity-40" />
                  </div>
                  <h4 className="text-xs font-bold text-text-primary">All caught up!</h4>
                  <p className="text-[11px] text-text-muted max-w-xs mt-1">No active priority tasks assigned to you. Take a break or auto-assign new tasks.</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Documents */}
          <div className="bg-surface-elevated/40 border border-white/5 rounded-2xl shadow-premium backdrop-blur-md p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-text-primary">Recent Documents</h2>
                <p className="text-xs text-text-muted mt-0.5">Documents edited recently in the workspace</p>
              </div>
              <Link to={`/workspaces/${workspaceId}/documents`} className="text-xs font-bold text-primary-accent hover:underline flex items-center gap-1">
                View All <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recentDocuments.map((doc) => (
                <div 
                  key={doc.id}
                  onClick={() => navigate(`/workspaces/${workspaceId}/docs/${doc.id}`)}
                  className="bg-surface-secondary/30 hover:bg-surface-secondary/70 border border-white/5 hover:border-primary-accent/20 p-5 rounded-xl transition-all cursor-pointer flex flex-col justify-between min-h-[120px] group relative overflow-hidden"
                >
                  {/* Subtle Cover Gradient Hover Overlay */}
                  {doc.cover_url && (
                    <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity bg-cover bg-center pointer-events-none" style={{ backgroundImage: `url(${doc.cover_url})` }} />
                  )}

                  <div className="flex items-start justify-between gap-3 relative">
                    <div className="w-8 h-8 rounded-lg bg-surface-elevated border border-white/5 flex items-center justify-center shrink-0 text-base">
                      {doc.icon || '📄'}
                    </div>
                    <div className="w-6 h-6 rounded-md bg-surface-elevated border border-white/10 flex items-center justify-center overflow-hidden font-bold text-[9px] text-text-primary" title={doc.last_editor?.display_name || doc.creator.display_name}>
                      {doc.last_editor?.avatar_url || doc.creator.avatar_url ? (
                        <img src={doc.last_editor?.avatar_url || doc.creator.avatar_url || ''} alt="User Avatar" className="w-full h-full object-cover" />
                      ) : (
                        (doc.last_editor?.display_name || doc.creator.display_name || '?').charAt(0).toUpperCase()
                      )}
                    </div>
                  </div>

                  <div className="mt-4 relative">
                    <h4 className="text-sm font-semibold text-text-primary truncate group-hover:text-primary-accent transition-colors leading-snug">{doc.title}</h4>
                    <p className="text-[10px] text-text-muted mt-1 font-medium">
                      Edited {formatRelativeTime(doc.updated_at)}
                    </p>
                  </div>
                </div>
              ))}

              {recentDocuments.length === 0 && (
                <div className="col-span-2 flex flex-col items-center justify-center py-10 border border-dashed border-white/5 rounded-xl p-6 bg-surface-secondary/10 text-center">
                  <div className="w-10 h-10 rounded-xl bg-surface-secondary border border-white/5 flex items-center justify-center mb-3">
                    <FileText className="w-5 h-5 text-text-muted opacity-40" />
                  </div>
                  <h4 className="text-xs font-bold text-text-primary">No recent documents</h4>
                  <p className="text-[11px] text-text-muted max-w-xs mt-1">Write notes, ideas, or audits. Get started by creating a new document.</p>
                  <button onClick={() => setIsCreateDocOpen(true)} className="mt-3 text-xs font-semibold px-4 py-2 bg-primary-accent text-main-bg rounded-lg hover:bg-primary-accent/90 transition-all select-none">
                    Write Document
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Collaboration & Activity */}
        <div className="space-y-8">
          {/* Team Status */}
          <div className="bg-surface-elevated/40 border border-white/5 rounded-2xl shadow-premium backdrop-blur-md p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-text-primary">Team Status</h2>
              <p className="text-xs text-text-muted mt-0.5">Current teammate online statuses</p>
            </div>

            <div className="space-y-3.5">
              {members.map((member) => {
                const statusDotColors: Record<string, string> = {
                  online: 'bg-success shadow-[0_0_10px_#22c55e]',
                  offline: 'bg-text-muted opacity-60',
                  away: 'bg-warning shadow-[0_0_10px_#f59e0b]',
                  dnd: 'bg-danger shadow-[0_0_10px_#ef4444]'
                };

                return (
                  <div key={member.user_id} className="flex items-center justify-between gap-3 bg-surface-secondary/20 border border-white/5 px-3 py-2.5 rounded-xl">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative">
                        <div className="w-8 h-8 rounded-md bg-surface-elevated border border-white/10 flex items-center justify-center font-bold text-xs text-text-primary">
                          {member.user.avatar_url ? (
                            <img src={member.user.avatar_url} alt={member.user.display_name} className="w-full h-full object-cover rounded-md" />
                          ) : (
                            member.user.display_name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <span className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-main-bg ${statusDotColors[member.user.status] || 'bg-text-muted'}`} />
                      </div>

                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-text-primary truncate">{member.user.display_name}</h4>
                        <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider mt-0.5">{member.user.status}</p>
                      </div>
                    </div>

                    <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-[9px] font-bold text-text-muted uppercase shrink-0 select-none">
                      {member.role}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Feed Event Logger */}
          <div className="bg-surface-elevated/40 border border-white/5 rounded-2xl shadow-premium backdrop-blur-md p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-text-primary">Live Feed</h2>
              <p className="text-xs text-text-muted mt-0.5">Real-time collaboration updates</p>
            </div>

            <div className="space-y-4 max-h-[300px] overflow-y-auto scrollbar-thin pl-1">
              {activities.map((act) => (
                <div key={act.id} className="flex items-start gap-3.5 text-xs animate-fade-in relative pl-4 border-l border-white/5 pb-2.5 last:pb-0">
                  {/* Event Marker */}
                  <span className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary-accent/40 border border-primary-accent/60" />

                  <div className="min-w-0 flex-1">
                    <p className="text-text-secondary leading-snug">
                      <span className="font-bold text-text-primary">{act.user.display_name}</span>{' '}
                      {act.type.includes('task_created') && <span>created task <span className="font-semibold text-text-primary">{act.targetName}</span> in <span className="font-semibold">{act.metadata?.boardName}</span></span>}
                      {act.type.includes('task_updated') && <span>updated task <span className="font-semibold text-text-primary">{act.targetName}</span></span>}
                      {act.type.includes('document_created') && <span>created document <span className="font-semibold text-text-primary">{act.targetName}</span></span>}
                      {act.type.includes('document_updated') && <span>updated document <span className="font-semibold text-text-primary">{act.targetName}</span></span>}
                      {act.type.includes('comment_created') && <span>commented on <span className="font-semibold text-text-primary">{act.targetName}</span>: <span className="italic text-text-muted">"{act.metadata?.content}"</span></span>}
                    </p>
                    <span className="text-[10px] text-text-muted font-semibold mt-1 block">
                      {formatRelativeTime(act.timestamp)}
                    </span>
                  </div>
                </div>
              ))}

              {activities.length === 0 && (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <p className="text-xs text-text-muted italic">No logs recorded yet. Events stream automatically.</p>
                </div>
              )}
            </div>
          </div>
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
      {isAutoAssignOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setIsAutoAssignOpen(false)} />
          <div className="relative w-full max-w-2xl h-full bg-surface-secondary border-l border-white/5 shadow-2xl p-6 sm:p-8 overflow-y-auto flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
              <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary-accent" /> Workload Auto-Assignment
              </h2>
              <button 
                onClick={() => setIsAutoAssignOpen(false)}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-all cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>
            <div className="grow">
              <AutoAssignmentPanel workspaceId={workspaceId} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
