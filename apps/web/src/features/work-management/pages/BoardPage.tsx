import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
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
import { ChevronLeft, Plus, Settings } from 'lucide-react';
import type { TaskDTO, BoardColumnDTO } from '@teamhub/shared';
import { BoardDragDropProvider } from '../components/BoardDragDropProvider';

export const BoardPage = () => {
  const { workspaceId, boardId } = useParams<{ workspaceId: string; boardId: string }>();
  const { data: board, isLoading, isError } = useBoardDetail(boardId || '');
  const { deleteBoard, updateBoard } = useBoardMutations(workspaceId || '');
  const { 
    createTask, 
    updateTask, 
    deleteTask, 
    createColumn, 
    updateColumn, 
    deleteColumn 
  } = useTaskMutations(boardId || '');

  // Modals / Panels States
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskDTO | undefined>();
  const [targetColumnId, setTargetColumnId] = useState<string | null>(null);

  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<BoardColumnDTO | undefined>();

  const [isBoardSettingsOpen, setIsBoardSettingsOpen] = useState(false);
  const [isDeleteBoardConfirmOpen, setIsDeleteBoardConfirmOpen] = useState(false);

  const activeTask = useMemo(() => {
    if (!board || !activeTaskId) return null;
    for (const col of board.columns) {
      const task = col.tasks.find(t => t.id === activeTaskId);
      if (task) return task;
    }
    return null;
  }, [board, activeTaskId]);

  if (isLoading) return <BoardDetailSkeleton />;
  if (isError || !board) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <h2 className="text-xl font-bold text-text-primary mb-4">Board not found</h2>
        <Link to={`/workspaces/${workspaceId}/tasks`}>
          <Button variant="secondary" icon={<ChevronLeft className="w-4 h-4" />}>
            Back to Boards
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-main-bg overflow-hidden animate-fade-in">
      {/* Board Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-white/5 bg-surface-secondary/20">
        <div className="flex items-center gap-4 overflow-hidden">
          <Link to={`/workspaces/${workspaceId}/tasks`}>
            <Button variant="ghost" iconOnly size="sm" icon={<ChevronLeft className="w-5 h-5" />} />
          </Link>
          <div className="overflow-hidden">
            <h1 className="text-lg font-bold text-text-primary truncate">{board.name}</h1>
            {board.description && <p className="text-xs text-text-muted truncate">{board.description}</p>}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            icon={<Settings className="w-4 h-4" />}
            onClick={() => setIsBoardSettingsOpen(true)}
          >
            Board Settings
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsColumnModalOpen(true)}
          >
            Add Column
          </Button>
        </div>
      </header>

      {/* Columns Container */}
      <main className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <BoardDragDropProvider board={board}>
          <div className="flex gap-6 h-full items-start">
            {board.columns.map((column) => (
              <BoardColumn
                key={column.id}
                column={column}
                onTaskClick={(taskId) => setActiveTaskId(taskId)}
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
            ))}

            {/* Add Column Shortcut */}
            <button
              onClick={() => {
                setEditingColumn(undefined);
                setIsColumnModalOpen(true);
              }}
              className="w-80 shrink-0 h-14 rounded-2xl border-2 border-dashed border-white/5 flex items-center justify-center gap-2 text-text-muted hover:text-primary-accent hover:border-primary-accent/30 hover:bg-primary-accent/5 transition-all group"
            >
              <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-bold uppercase tracking-widest">New Column</span>
            </button>
          </div>
        </BoardDragDropProvider>
      </main>

      {/* Task Detail Panel */}
      {activeTask && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[85] animate-fade-in" onClick={() => setActiveTaskId(null)} />
          <TaskDetailPanel
            task={activeTask}
            onClose={() => setActiveTaskId(null)}
            onEdit={(task) => {
              setEditingTask(task);
              setIsTaskModalOpen(true);
            }}
            onDelete={(id) => {
              if (window.confirm('Are you sure you want to delete this task?')) {
                deleteTask.mutate(id, { onSuccess: () => setActiveTaskId(null) });
              }
            }}
          />
        </>
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
            updateTask.mutate({ taskId: editingTask.id, payload: data }, {
              onSuccess: () => setIsTaskModalOpen(false)
            });
          } else if (targetColumnId) {
            createTask.mutate({ columnId: targetColumnId, payload: data }, {
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
        onDelete={editingColumn ? () => {
          if (window.confirm('Delete this column and all its tasks?')) {
            deleteColumn.mutate(editingColumn.id, { onSuccess: () => setIsColumnModalOpen(false) });
          }
        } : undefined}
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
    </div>
  );
};
