import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as MembersAPI from '../api/members.api';
import type { WorkspaceMember, WorkspaceRole } from '@teamhub/shared';

type AddMemberDTO = { userId: string; role?: WorkspaceRole };
type UpdateMemberRoleArgs = { userId: string; dto: { role: WorkspaceRole } };

export const useMembers = (workspaceId: string) => {
  return useQuery<WorkspaceMember[]>({
    queryKey: ['members', workspaceId],
    queryFn: () => MembersAPI.listMembers(workspaceId),
  });
};

export const useAddMember = (workspaceId: string) => {
  const qc = useQueryClient();
  return useMutation<WorkspaceMember, unknown, AddMemberDTO>({
    mutationFn: (dto: AddMemberDTO) => MembersAPI.addMember(workspaceId, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members', workspaceId] }),
  });
};

export const useUpdateMemberRole = (workspaceId: string) => {
  const qc = useQueryClient();
  return useMutation<WorkspaceMember, unknown, UpdateMemberRoleArgs>({
    mutationFn: ({ userId, dto }: UpdateMemberRoleArgs) => MembersAPI.updateMemberRole(workspaceId, userId, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members', workspaceId] }),
  });
};

export const useRemoveMember = (workspaceId: string) => {
  const qc = useQueryClient();
  return useMutation<void, unknown, string>({
    mutationFn: (userId: string) => MembersAPI.removeMember(workspaceId, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members', workspaceId] }),
  });
};
