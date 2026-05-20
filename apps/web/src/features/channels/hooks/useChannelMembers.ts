import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as ChannelMembersAPI from '../api/channelMembers.api';
import type { ChannelMember } from '@teamhub/shared';

export const useChannelMembers = (workspaceId: string, channelId: string) => {
  return useQuery({
    queryKey: ['channelMembers', workspaceId, channelId],
    queryFn: () => ChannelMembersAPI.listChannelMembers(workspaceId, channelId),
  });
};

export const useAddChannelMember = (workspaceId: string, channelId: string) => {
  const qc = useQueryClient();
  return useMutation<ChannelMember[], unknown, { userId: string }>({
    mutationFn: (dto) => ChannelMembersAPI.addChannelMember(workspaceId, channelId, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['channelMembers', workspaceId, channelId] }),
  });
};
