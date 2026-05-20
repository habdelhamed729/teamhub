import { api } from '@/shared/services/axios';
import type {  WorkspaceMember } from '@teamhub/shared';

export const listMembers = async (workspaceId: string): Promise<WorkspaceMember[]> => {
  const { data } = await api.get(`/workspaces/${workspaceId}/members`);
  return data.data.members;
};

export const addMember = async (workspaceId: string, dto: { userId: string; role?: string }): Promise<WorkspaceMember> => {
  const { data } = await api.post(`/workspaces/${workspaceId}/members`, dto);
  return data.data.membership;
};

export const updateMemberRole = async (workspaceId: string, userId: string, dto: { role: string }): Promise<WorkspaceMember> => {
  const { data } = await api.patch(`/workspaces/${workspaceId}/members/${userId}`, dto);
  return data.data.membership;
};

export const removeMember = async (workspaceId: string, userId: string) => {
  await api.delete(`/workspaces/${workspaceId}/members/${userId}`);
};
