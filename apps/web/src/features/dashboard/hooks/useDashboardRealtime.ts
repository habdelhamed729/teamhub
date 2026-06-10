import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '@/shared/services/socket';
import { WorkManagementEvents } from '@teamhub/shared';
import { dashboardQueryKeys } from './useDashboardData';

export const useDashboardRealtime = (workspaceId: string, boards: any[] | undefined) => {
  const queryClient = useQueryClient();
  const socket = getSocket();

  useEffect(() => {
    if (!workspaceId || !boards) return;

    boards.forEach((board) => {
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
      boards.forEach((board) => {
        socket.emit(WorkManagementEvents.LEAVE_BOARD, board.id);
      });
      socket.off(WorkManagementEvents.TASK_CREATED, handleRealtimeUpdate);
      socket.off(WorkManagementEvents.TASK_UPDATED, handleRealtimeUpdate);
      socket.off(WorkManagementEvents.TASK_MOVED, handleRealtimeUpdate);
      socket.off(WorkManagementEvents.TASK_DELETED, handleRealtimeUpdate);
    };
  }, [workspaceId, boards, socket, queryClient]);
};
