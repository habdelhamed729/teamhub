import { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useBoardDetail, useBoardMutations } from '../hooks/useBoards';
import { useTaskMutations } from '../hooks/useTaskMutations';
import { BoardColumn } from '../components/BoardColumn';
import { BoardDetailSkeleton } from '../components/BoardSkeleton';
import { TaskCreateEditModal } from '../components/TaskCreateEditModal';
import { TaskDetailPanel } from '../components/TaskDetailPanel';
import { ColumnModal } from '../components/ColumnModal';
import { BoardModal } from '../components/BoardModal';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { Button } from '@/shared/components/Button';
import { ChevronLeft, Plus, Settings, Sparkles, X } from 'lucide-react';
import type { TaskDTO, BoardColumnDTO } from '@teamhub/shared';
import { AutoAssignmentPanel } from '../../ai/components/AutoAssignmentPanel';
import { BoardDragDropProvider } from '../components/BoardDragDropProvider';
import { useBoardRealtime } from '../hooks/useBoardRealtime';
import { buildCreateTaskPayload, buildUpdateTaskPayload } from '../utils/workManagementPayloads';
import { toast } from 'sonner';
import { useAuthStore } from '@/app/store/useAuthStore';
import { useBoardTaskFilters } from '../hooks/useBoardTaskFilters';
import { BoardCommandCenter } from '../components/BoardCommandCenter';
import { BoardFilters } from '../components/BoardFilters';

export const BoardPage = () => {
  const { workspaceId, boardId } = useParams<{ workspaceId: string; boardId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTaskId = searchParams.get('task');
  
  const currentUserId = useAuthStore(state => state.user?.id);

  // Activate real-time sync
  const { isConnected } = useBoardRealtime(boardId || '');

  const { data: board, isLoading, isError } = useBoardDetail(boardId || '');
  const { deleteBoard, updateBoard } = useBoardMutations(workspaceId || '');
  const { 
    createTask, 
    updateTask, 
    deleteTask, 
    moveTask,
    createColumn, 
    updateColumn, 
    deleteColumn 
  } = useTaskMutations(boardId || '');

  // Filters & Stats
  const {
    filters,
    setFilters,
    activeFilterCount,
    clearFilters,
    filteredBoard,
    boardStats,
    isFiltering
  } = useBoardTaskFilters(board, currentUserId);

  // Modals / Panels States
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskDTO | undefined>();
  const [targetColumnId, setTargetColumnId] = useState<string | null>(null);

  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<BoardColumnDTO | undefined>();

  const [isBoardSettingsOpen, setIsBoardSettingsOpen] = useState(false);
  const [isDeleteBoardConfirmOpen, setIsDeleteBoardConfirmOpen] = useState(false);
  const [isDeleteTaskConfirmOpen, setIsDeleteTaskConfirmOpen] = useState(false);
  const [isDeleteColumnConfirmOpen, setIsDeleteColumnConfirmOpen] = useState(false);
  const [isAutoAssignOpen, setIsAutoAssignOpen] = useState(false);

  const activeTask = useMemo(() => {
    if (!board || !activeTaskId) return null;
    for (const col of board.columns) {
      const task = col.tasks.find(t => t.id === activeTaskId);
      if (task) return task;
    }
    return null;
  }, [board, activeTaskId]);

  // Clean up invalid task ID from URL
  useEffect(() => {
    if (board && activeTaskId && !activeTask) {
      toast.error("Task not found");
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('task');
      setSearchParams(newParams, { replace: true });
    }
  }, [board, activeTaskId, activeTask, searchParams, setSearchParams]);

  const handleTaskClick = (taskId: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('task', taskId);
    setSearchParams(newParams);
  };

  const handleCloseTask = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('task');
    setSearchParams(newParams);
  };

  // Mobile column switcher state
  const [activeMobileColumnId, setActiveMobileColumnId] = useState<string | null>(null);

  // Derive the effectively active column for mobile
  const effectiveActiveColumnId = useMemo(() => {
    if (!filteredBoard || filteredBoard.columns.length === 0) return null;
    
    // If the selected column exists, use it
    if (activeMobileColumnId && filteredBoard.columns.some(c => c.id === activeMobileColumnId)) {
      return activeMobileColumnId;
    }
    
    // Otherwise fallback to the first column
    return filteredBoard.columns[0].id;
  }, [filteredBoard, activeMobileColumnId]);

  if (isLoading) return <BoardDetailSkeleton />;
  if (isError || !board || !filteredBoard) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center p-8 animate-fade-in">
        <div className="w-16 h-16 rounded-3xl bg-surface-secondary flex items-center justify-center mb-6 border border-white/5 shadow-xl">
          <Settings className="w-8 h-8 text-text-muted opacity-40 animate-spin-slow" />
        </div>
        <h2 className="text-xl font-bold text-text-primary mb-2">Board not found</h2>
        <p className="text-sm text-text-muted mb-8 max-w-xs">The board you are looking for might have been deleted or moved.</p>
        <Link to={`/workspaces/${workspaceId}/tasks`}>
          <Button variant="secondary" icon={<ChevronLeft className="w-4 h-4" />} className="rounded-xl">
            Back to Boards
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-main-bg overflow-hidden animate-fade-in">
      {/* Board Header */}
      <header className="px-4 sm:px-8 py-5 flex flex-col gap-4 border-b border-white/5 bg-surface-secondary/10 backdrop-blur-md sticky top-0 z-30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 overflow-hidden">
            <Link to={`/workspaces/${workspaceId}/tasks`}>
              <Button variant="ghost" iconOnly size="sm" icon={<ChevronLeft className="w-5 h-5" />} className="rounded-lg hover:bg-white/5" />
            </Link>
            <div className="overflow-hidden">
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-text-primary truncate tracking-tight">{board.name}</h1>
                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-widest ${
                  isConnected 
                    ? 'bg-success/10 border-success/20 text-success' 
                    : 'bg-warning/10 border-warning/20 text-warning'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-success animate-pulse' : 'bg-warning'}`} />
                  {isConnected ? 'Live' : 'Reconnecting...'}
                </div>
              </div>
              {board.description && <p className="text-xs text-text-muted truncate mt-0.5 opacity-80">{board.description}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="ghost"
              size="sm"
              icon={<Sparkles className="w-4 h-4 text-violet-400" />}
              onClick={() => setIsAutoAssignOpen(true)}
              className="rounded-xl text-text-muted hover:text-text-primary hover:bg-white/5 h-9"
            >
              Auto-Assign
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={<Settings className="w-4 h-4" />}
              onClick={() => setIsBoardSettingsOpen(true)}
              className="rounded-xl text-text-muted hover:text-text-primary hover:bg-white/5 h-9"
            >
              Settings
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setIsColumnModalOpen(true)}
              className="rounded-xl h-9 shadow-lg shadow-primary-accent/10 hidden sm:flex"
            >
              Add Column
            </Button>
          </div>
        </div>

        {/* Command Center */}
        <BoardCommandCenter stats={boardStats} />

        {/* Filters */}
        <BoardFilters 
          filters={filters} 
          setFilters={setFilters} 
          activeFilterCount={activeFilterCount} 
          clearFilters={clearFilters}
          workspaceId={workspaceId || ''} 
        />
        
        {/* Mobile Column Switcher */}
        <div className="sm:hidden flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
          {filteredBoard.columns.map((column) => (
            <button
              key={column.id}
              onClick={() => setActiveMobileColumnId(column.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                effectiveActiveColumnId === column.id
                  ? 'bg-primary-accent/10 border-primary-accent/30 text-primary-accent'
                  : 'bg-surface-elevated/50 border-white/5 text-text-muted hover:text-text-primary'
              }`}
            >
              {column.name}
              <span className="ml-2 px-1.5 py-0.5 rounded bg-white/10 text-[9px]">
                {column.tasks.length}
              </span>
            </button>
          ))}
          <button
            onClick={() => {
              setEditingColumn(undefined);
              setIsColumnModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border bg-surface-elevated/50 border-dashed border-white/20 text-text-muted hover:text-text-primary flex items-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" />
            New
          </button>
        </div>
      </header>

      {/* Columns Container */}
      <main className="flex-1 overflow-x-auto overflow-y-hidden p-4 sm:p-8 scrollbar-thin scrollbar-thumb-white/10">
        <BoardDragDropProvider board={filteredBoard} disabled={isFiltering}>
          <div className="flex gap-6 h-full items-start pb-4">
            {filteredBoard.columns.map((column) => (
              <div 
                key={column.id} 
                className={`h-full ${effectiveActiveColumnId === column.id ? 'flex' : 'hidden sm:flex'}`}
              >
                <BoardColumn
                  column={column}
                  onTaskClick={handleTaskClick}
                  onAddTask={(colId) => {
                    setTargetColumnId(colId);
                    setEditingTask(undefined);
                    setIsTaskModalOpen(true);
                  }}
                  onEditColumn={(col) => {
                    setEditingColumn(col);
                    setIsColumnModalOpen(true);
                  }}
                />
              </div>
            ))}

            {/* Add Column Shortcut - Desktop Only */}
            <button
              onClick={() => {
                setEditingColumn(undefined);
                setIsColumnModalOpen(true);
              }}
              className="hidden sm:flex w-[85vw] sm:w-80 shrink-0 h-16 rounded-3xl border-2 border-dashed border-white/5 items-center justify-center gap-3 text-text-muted hover:text-primary-accent hover:border-primary-accent/40 hover:bg-primary-accent/5 transition-all group shadow-sm active:scale-95"
            >
              <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary-accent group-hover:text-main-bg transition-colors">
                <Plus className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-[0.2em]">New Column</span>
            </button>
            
            {/* Spacer for horizontal scroll padding */}
            <div className="w-8 shrink-0 h-px hidden sm:block" />
          </div>
        </BoardDragDropProvider>
      </main>

      {/* Task Detail Panel Overlay */}
      {activeTask && (
        <TaskDetailPanel
          task={activeTask}
          columns={filteredBoard.columns}
          onClose={handleCloseTask}
          onEdit={(task) => {
            setEditingTask(task);
            setIsTaskModalOpen(true);
          }}
          onDelete={() => setIsDeleteTaskConfirmOpen(true)}
          onMove={(taskId, targetColumnId) => {
            const targetCol = board.columns.find(c => c.id === targetColumnId);
            if (targetCol) {
              moveTask.mutate({
                taskId,
                payload: {
                  columnId: targetColumnId,
                  order: targetCol.tasks.length,
                }
              });
            }
          }}
          isMoving={moveTask.isPending}
        />
      )}

      {/* Modals */}
      <TaskCreateEditModal
        key={editingTask ? `edit-${editingTask.id}` : `new-${targetColumnId}`}
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        workspaceId={workspaceId || ''}
        title={editingTask ? 'Edit Task' : 'New Task'}
        initialData={editingTask}
        isLoading={createTask.isPending || updateTask.isPending}
        onSave={(data) => {
          if (editingTask) {
            const payload = buildUpdateTaskPayload(data);
            updateTask.mutate({ taskId: editingTask.id, payload }, {
              onSuccess: () => setIsTaskModalOpen(false)
            });
          } else if (targetColumnId) {
            const payload = buildCreateTaskPayload(targetColumnId, data);
            
            if (!payload.columnId) {
              toast.error("Please select a column");
              return;
            }

            createTask.mutate({ columnId: targetColumnId, payload }, {
              onSuccess: () => setIsTaskModalOpen(false)
            });
          }
        }}
      />

      <ColumnModal
        key={editingColumn ? `edit-${editingColumn.id}` : 'new-column'}
        isOpen={isColumnModalOpen}
        onClose={() => setIsColumnModalOpen(false)}
        title={editingColumn ? 'Edit Column' : 'New Column'}
        initialData={editingColumn}
        isLoading={createColumn.isPending || updateColumn.isPending || deleteColumn.isPending}
        onSave={(data) => {
          if (editingColumn) {
            updateColumn.mutate({ columnId: editingColumn.id, payload: data }, {
              onSuccess: () => setIsColumnModalOpen(false)
            });
          } else {
            createColumn.mutate({ boardId: board.id, name: data.name }, {
              onSuccess: () => setIsColumnModalOpen(false)
            });
          }
        }}
        onDelete={editingColumn ? () => setIsDeleteColumnConfirmOpen(true) : undefined}
      />

      <BoardModal
        key={board.id}
        isOpen={isBoardSettingsOpen}
        onClose={() => setIsBoardSettingsOpen(false)}
        title="Board Settings"
        initialData={{ name: board.name, description: board.description || '' }}
        isLoading={updateBoard.isPending}
        onSave={(data) => {
          updateBoard.mutate({ boardId: board.id, payload: data }, {
            onSuccess: () => setIsBoardSettingsOpen(false)
          });
        }}
      />

      <ConfirmModal
        isOpen={isDeleteBoardConfirmOpen}
        onClose={() => setIsDeleteBoardConfirmOpen(false)}
        onConfirm={() => {
          deleteBoard.mutate(board.id, {
            onSuccess: () => {
              setIsDeleteBoardConfirmOpen(false);
              window.location.href = `/workspaces/${workspaceId}/tasks`;
            }
          });
        }}
        title="Delete Board"
        description="This will permanently delete the board and all its tasks. This action cannot be undone."
      />

      <ConfirmModal
        isOpen={isDeleteTaskConfirmOpen}
        onClose={() => setIsDeleteTaskConfirmOpen(false)}
        onConfirm={() => {
          if (activeTaskId) {
            deleteTask.mutate(activeTaskId, {
              onSuccess: () => {
                setIsDeleteTaskConfirmOpen(false);
                handleCloseTask();
              }
            });
          }
        }}
        isLoading={deleteTask.isPending}
        title="Delete Task"
        description="Are you sure you want to delete this task? This action cannot be undone."
      />

      <ConfirmModal
        isOpen={isDeleteColumnConfirmOpen}
        onClose={() => setIsDeleteColumnConfirmOpen(false)}
        onConfirm={() => {
          if (editingColumn) {
            deleteColumn.mutate(editingColumn.id, {
              onSuccess: () => {
                setIsDeleteColumnConfirmOpen(false);
                setIsColumnModalOpen(false);
              }
            });
          }
        }}
        isLoading={deleteColumn.isPending}
        title="Delete Column"
        description="This will permanently delete the column and all its tasks. Are you sure?"
      />

      {isAutoAssignOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-85 animate-fade-in lg:bg-black/20" 
            onClick={() => setIsAutoAssignOpen(false)} 
          />
          <div className="fixed inset-y-0 right-0 w-full sm:w-[500px] lg:w-[450px] bg-surface-elevated border-l border-white/10 shadow-2xl z-90 flex flex-col animate-slide-in-right ring-1 ring-white/5">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-surface-elevated/80 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <Button variant="ghost" iconOnly size="sm" onClick={() => setIsAutoAssignOpen(false)} icon={<X className="w-5 h-5" />} />
                <h2 className="text-xs font-bold text-text-muted uppercase tracking-widest text-[10px]">AI Workload Optimizer</h2>
              </div>
            </div>
            <div className="flex-1 overflow-hidden min-h-0 bg-surface-secondary/20 relative">
              <AutoAssignmentPanel workspaceId={workspaceId || ''} initialBoardId={boardId} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};
