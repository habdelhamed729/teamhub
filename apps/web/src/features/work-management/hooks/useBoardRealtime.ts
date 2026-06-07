import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '@/shared/services/socket';
import { 
  WorkManagementEvents, 
} from '@teamhub/shared';
import type {
  TaskDTO, 
  BoardDetailDTO 
} from '@teamhub/shared';
import { workManagementQueryKeys } from '../utils/workManagementQueryKeys';
import { toast } from 'sonner';

export const useBoardRealtime = (boardId: string) => {
  const queryClient = useQueryClient();
  const socket = getSocket();

  useEffect(() => {
    if (!boardId) return;

    // Join the board room
    socket.emit(WorkManagementEvents.JOIN_BOARD, boardId);

    // ── TASK_CREATED ──────────────────────────────────────────
    const handleTaskCreated = (payload: { task: TaskDTO; boardId: string }) => {
      if (payload.boardId !== boardId) return;
      
      queryClient.setQueryData<BoardDetailDTO>(
        workManagementQueryKeys.boardDetail(boardId),
        (old) => {
          if (!old) return old;
          
          // Check if task already exists to avoid duplicates (e.g. from local optimistic update)
          const column = old.columns.find(c => c.id === payload.task.columnId);
          if (!column) return old;
          
          if (column.tasks.some(t => t.id === payload.task.id)) return old;

          return {
            ...old,
            columns: old.columns.map(c => 
              c.id === payload.task.columnId 
                ? { ...c, tasks: [...c.tasks, payload.task].sort((a, b) => a.order - b.order) }
                : c
            )
          };
        }
      );
    };

    // ── TASK_UPDATED ──────────────────────────────────────────
    const handleTaskUpdated = (payload: { task: TaskDTO; boardId: string }) => {
      if (payload.boardId !== boardId) return;

      queryClient.setQueryData<BoardDetailDTO>(
        workManagementQueryKeys.boardDetail(boardId),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            columns: old.columns.map(c => ({
              ...c,
              tasks: c.tasks.map(t => t.id === payload.task.id ? payload.task : t)
            }))
          };
        }
      );

      // Also update single task query if active
      queryClient.invalidateQueries({ queryKey: workManagementQueryKeys.task(payload.task.id) });
    };

    // ── TASK_MOVED ────────────────────────────────────────────
    const handleTaskMoved = (payload: { taskId: string; boardId: string }) => {
      if (payload.boardId !== boardId) return;
      
      // Reorders can be complex to patch manually, safe invalidation is preferred
      // unless we want to do deep cloning. For now, invalidation ensures truth.
      queryClient.invalidateQueries({ queryKey: workManagementQueryKeys.boardDetail(boardId) });
    };

    // ── TASK_DELETED ──────────────────────────────────────────
    const handleTaskDeleted = (payload: { taskId: string; boardId: string }) => {
      if (payload.boardId !== boardId) return;

      queryClient.setQueryData<BoardDetailDTO>(
        workManagementQueryKeys.boardDetail(boardId),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            columns: old.columns.map(c => ({
              ...c,
              tasks: c.tasks.filter(t => t.id !== payload.taskId)
            }))
          };
        }
      );
      
      toast.info('A task was deleted by another user');
    };

    // ── TASK_COMMENT_CREATED ──────────────────────────────────
    const handleCommentCreated = (payload: { taskId: string; boardId: string }) => {
      if (payload.boardId !== boardId) return;
      queryClient.invalidateQueries({ queryKey: workManagementQueryKeys.taskComments(payload.taskId) });
    };

    // ── Listeners ─────────────────────────────────────────────
    socket.on(WorkManagementEvents.TASK_CREATED, handleTaskCreated);
    socket.on(WorkManagementEvents.TASK_UPDATED, handleTaskUpdated);
    socket.on(WorkManagementEvents.TASK_MOVED, handleTaskMoved);
    socket.on(WorkManagementEvents.TASK_DELETED, handleTaskDeleted);
    socket.on(WorkManagementEvents.TASK_COMMENT_CREATED, handleCommentCreated);

    return () => {
      socket.off(WorkManagementEvents.TASK_CREATED, handleTaskCreated);
      socket.off(WorkManagementEvents.TASK_UPDATED, handleTaskUpdated);
      socket.off(WorkManagementEvents.TASK_MOVED, handleTaskMoved);
      socket.off(WorkManagementEvents.TASK_DELETED, handleTaskDeleted);
      socket.off(WorkManagementEvents.TASK_COMMENT_CREATED, handleCommentCreated);
      socket.emit(WorkManagementEvents.LEAVE_BOARD, boardId);
    };
  }, [boardId, queryClient, socket]);
};
