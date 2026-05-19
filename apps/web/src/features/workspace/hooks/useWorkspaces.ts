import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as workspaceApi from '../api/workspace.api';
import { useWorkspaceStore } from '@/app/store/useWorkspaceStore';
import { useEffect } from 'react';

export const useWorkspaces = () => {
  const setWorkspaces = useWorkspaceStore((state) => state.setWorkspaces);

  const query = useQuery({
    queryKey: ['workspaces'],
    queryFn: workspaceApi.listWorkspaces,
  });

  // Sync with store when data changes
  useEffect(() => {
    if (query.data) {
      setWorkspaces(query.data);
    }
  }, [query.data, setWorkspaces]);

  return query;
};

export const useCreateWorkspace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: workspaceApi.createWorkspace,
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
};
