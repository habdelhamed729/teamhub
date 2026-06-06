import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workManagementApi } from '../api/workManagement.api';
import { workManagementQueryKeys } from '../utils/workManagementQueryKeys';
import { toast } from 'sonner';
import type { CreateBoardInput, UpdateBoardInput } from '@teamhub/shared';
import type { AxiosError } from 'axios';

export const useBoards = (workspaceId: string) => {
  return useQuery({
    queryKey: workManagementQueryKeys.boards(workspaceId),
    queryFn: () => workManagementApi.listWorkspaceBoards(workspaceId),
    enabled: !!workspaceId,
  });
};

export const useBoardDetail = (boardId: string) => {
  return useQuery({
    queryKey: workManagementQueryKeys.boardDetail(boardId),
    queryFn: () => workManagementApi.getBoardDetail(boardId),
    enabled: !!boardId,
  });
};

export const useBoardMutations = (workspaceId: string) => {
  const queryClient = useQueryClient();

  const createBoardMutation = useMutation({
    mutationFn: (payload: CreateBoardInput) => workManagementApi.createBoard(workspaceId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workManagementQueryKeys.boards(workspaceId) });
      toast.success('Board created successfully');
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.response?.data?.message || 'Failed to create board');
    },
  });

  const updateBoardMutation = useMutation({
    mutationFn: ({ boardId, payload }: { boardId: string; payload: UpdateBoardInput }) => 
      workManagementApi.updateBoard(boardId, payload),
    onSuccess: (_, { boardId }) => {
      queryClient.invalidateQueries({ queryKey: workManagementQueryKeys.boards(workspaceId) });
      queryClient.invalidateQueries({ queryKey: workManagementQueryKeys.boardDetail(boardId) });
      toast.success('Board updated successfully');
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.response?.data?.message || 'Failed to update board');
    },
  });

  const deleteBoardMutation = useMutation({
    mutationFn: (boardId: string) => workManagementApi.deleteBoard(boardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workManagementQueryKeys.boards(workspaceId) });
      toast.success('Board deleted successfully');
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.response?.data?.message || 'Failed to delete board');
    },
  });

  return {
    createBoard: createBoardMutation,
    updateBoard: updateBoardMutation,
    deleteBoard: deleteBoardMutation,
  };
};
