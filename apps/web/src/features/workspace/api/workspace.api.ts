import { api } from '@/shared/services/axios';
import type { Workspace } from '@teamhub/shared';

export interface CreateWorkspaceRequest {
  name: string;
  slug: string;
}

export interface JoinWorkspaceRequest {
  code: string;
}

export const listWorkspaces = async (): Promise<Workspace[]> => {
  const { data } = await api.get('/workspaces');
  return data.data.workspaces;
};

export const createWorkspace = async (req: CreateWorkspaceRequest): Promise<Workspace> => {
  const { data } = await api.post('/workspaces', req);
  return data.data.workspace;
};

export const getWorkspace = async (id: string): Promise<Workspace> => {
  const { data } = await api.get(`/workspaces/${id}`);
  return data.data.workspace;
};

export const updateWorkspace = async (
  id: string,
  req: Partial<CreateWorkspaceRequest>,
): Promise<Workspace> => {
  const { data } = await api.patch(`/workspaces/${id}`, req);
  return data.data.workspace;
};

