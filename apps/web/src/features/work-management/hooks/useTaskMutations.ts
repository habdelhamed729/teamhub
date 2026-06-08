import { useMutation, useQueryClient } from '@tanstack/react-query';
import { workManagementApi } from '../api/workManagement.api';
import { workManagementQueryKeys } from '../utils/workManagementQueryKeys';
import { toast } from 'sonner';
import type { 
  CreateTaskInput, 
  UpdateTaskInput, 
  MoveTaskInput,
  CreateColumnInput,
  UpdateColumnInput
} from '@teamhub/shared';
import type { AxiosError } from 'axios';
import { updateBoardOptimistically, rollbackBoardUpdate } from '../utils/workManagementOptimistic';
import { moveTaskBetweenColumns, reorderTaskInColumn, findColumnOfTask } from '../utils/workManagementDnD';

export const useTaskMutations = (boardId: string) => {
  const queryClient = useQueryClient();

  const createTaskMutation = useMutation({
    mutationFn: ({ columnId, payload }: { columnId: string; payload: CreateTaskInput }) => 
      workManagementApi.createTask(columnId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workManagementQueryKeys.boardDetail(boardId) });
      toast.success('Task created successfully');
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.response?.data?.message || 'Failed to create task');
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, payload }: { taskId: string; payload: UpdateTaskInput & { assigneeIds?: string[] } }) => 
      workManagementApi.updateTask(taskId, payload),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: workManagementQueryKeys.boardDetail(boardId) });
      queryClient.invalidateQueries({ queryKey: workManagementQueryKeys.task(taskId) });
      toast.success('Task updated successfully');
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.response?.data?.message || 'Failed to update task');
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) => workManagementApi.deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workManagementQueryKeys.boardDetail(boardId) });
      toast.success('Task deleted successfully');
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.response?.data?.message || 'Failed to delete task');
    },
  });

  const moveTaskMutation = useMutation({
    mutationFn: ({ taskId, payload }: { taskId: string; payload: MoveTaskInput }) => 
      workManagementApi.moveTask(taskId, payload),
    onMutate: async ({ taskId, payload }) => {
      const { previousBoard } = updateBoardOptimistically(queryClient, boardId, (old) => {
        const sourceColumn = findColumnOfTask(old, taskId);
        if (!sourceColumn) return old;

        if (sourceColumn.id === payload.columnId) {
          return reorderTaskInColumn(old, sourceColumn.id, taskId, payload.order);
        } else {
          return moveTaskBetweenColumns(old, taskId, sourceColumn.id, payload.columnId, payload.order);
        }
      });

      return { previousBoard };
    },
    onError: (error: AxiosError<{ message: string }>, _, context) => {
      rollbackBoardUpdate(queryClient, boardId, context?.previousBoard);
      toast.error(error.response?.data?.message || 'Failed to move task. Board restored.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: workManagementQueryKeys.boardDetail(boardId) });
    },
  });

  const createColumnMutation = useMutation({
    mutationFn: (payload: CreateColumnInput) => workManagementApi.createColumn(boardId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workManagementQueryKeys.boardDetail(boardId) });
      toast.success('Column created successfully');
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.response?.data?.message || 'Failed to create column');
    },
  });

  const updateColumnMutation = useMutation({
    mutationFn: ({ columnId, payload }: { columnId: string; payload: UpdateColumnInput }) => 
      workManagementApi.updateColumn(columnId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workManagementQueryKeys.boardDetail(boardId) });
      toast.success('Column updated successfully');
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.response?.data?.message || 'Failed to update column');
    },
  });

  const deleteColumnMutation = useMutation({
    mutationFn: (columnId: string) => workManagementApi.deleteColumn(columnId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workManagementQueryKeys.boardDetail(boardId) });
      toast.success('Column deleted successfully');
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.response?.data?.message || 'Failed to delete column');
    },
  });

  return {
    createTask: createTaskMutation,
    updateTask: updateTaskMutation,
    deleteTask: deleteTaskMutation,
    moveTask: moveTaskMutation,
    createColumn: createColumnMutation,
    updateColumn: updateColumnMutation,
    deleteColumn: deleteColumnMutation,
  };
};
