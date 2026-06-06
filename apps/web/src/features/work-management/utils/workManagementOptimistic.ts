import { QueryClient } from '@tanstack/react-query';
import type { BoardDetailDTO } from '@teamhub/shared';
import { workManagementQueryKeys } from './workManagementQueryKeys';

export const updateBoardOptimistically = (
  queryClient: QueryClient,
  boardId: string,
  updater: (old: BoardDetailDTO) => BoardDetailDTO
) => {
  const queryKey = workManagementQueryKeys.boardDetail(boardId);
  
  // Cancel outgoing refetches
  queryClient.cancelQueries({ queryKey });

  // Snapshot the previous value
  const previousBoard = queryClient.getQueryData<BoardDetailDTO>(queryKey);

  // Optimistically update to the new value
  if (previousBoard) {
    queryClient.setQueryData<BoardDetailDTO>(queryKey, updater(previousBoard));
  }

  return { previousBoard };
};

export const rollbackBoardUpdate = (
  queryClient: QueryClient,
  boardId: string,
  previousBoard?: BoardDetailDTO
) => {
  if (previousBoard) {
    queryClient.setQueryData(workManagementQueryKeys.boardDetail(boardId), previousBoard);
  }
};
