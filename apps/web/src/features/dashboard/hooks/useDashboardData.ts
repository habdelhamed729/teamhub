import { useQuery } from '@tanstack/react-query';
import { getDashboardData } from '../api/dashboard.api';

export const dashboardQueryKeys = {
  all: ['dashboard'] as const,
  workspace: (workspaceId: string) => [...dashboardQueryKeys.all, workspaceId] as const,
};

export const useDashboardData = (workspaceId: string) => {
  return useQuery({
    queryKey: dashboardQueryKeys.workspace(workspaceId),
    queryFn: () => getDashboardData(workspaceId),
    enabled: !!workspaceId,
    staleTime: 1000 * 30, // 30 seconds stale time
  });
};
