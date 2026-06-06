import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workManagementApi } from '../api/workManagement.api';
import { workManagementQueryKeys } from '../utils/workManagementQueryKeys';
import { toast } from 'sonner';
import type { CreateTaskCommentInput } from '@teamhub/shared';
import type { AxiosError } from 'axios';

export const useTaskComments = (taskId: string) => {
  const queryClient = useQueryClient();

  const commentsQuery = useQuery({
    queryKey: workManagementQueryKeys.taskComments(taskId),
    queryFn: () => workManagementApi.listTaskComments(taskId),
    enabled: !!taskId,
  });

  const createCommentMutation = useMutation({
    mutationFn: (payload: CreateTaskCommentInput) => workManagementApi.createTaskComment(taskId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workManagementQueryKeys.taskComments(taskId) });
      toast.success('Comment added');
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.response?.data?.message || 'Failed to add comment');
    },
  });

  return {
    comments: commentsQuery.data,
    isLoading: commentsQuery.isLoading,
    isError: commentsQuery.isError,
    createComment: createCommentMutation,
  };
};
