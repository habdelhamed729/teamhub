import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as ChannelsAPI from '../api/channels.api';
import type { Channel, ChannelType } from '@teamhub/shared';

type CreateChannelDTO = { name: string; type?: ChannelType; participantUserId?: string };
type UpdateChannelArgs = { channelId: string; dto: { name?: string } };

export const useChannels = (workspaceId: string) => {
  return useQuery({
    queryKey: ['channels', workspaceId],
    queryFn: () => ChannelsAPI.listChannels(workspaceId),
  });
};

export const useCreateChannel = (workspaceId: string) => {
  const qc = useQueryClient();
  return useMutation<Channel, unknown, CreateChannelDTO>({
    mutationFn: (dto: CreateChannelDTO) => ChannelsAPI.createChannel(workspaceId, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['channels', workspaceId] }),
  });
};

export const useGetChannel = (workspaceId: string, channelId: string) => {
  return useQuery({
    queryKey: ['channel', workspaceId, channelId],
    queryFn: () => ChannelsAPI.getChannel(workspaceId, channelId),
  });
};

export const useUpdateChannel = (workspaceId: string) => {
  const qc = useQueryClient();
  return useMutation<Channel, unknown, UpdateChannelArgs>({
    mutationFn: ({ channelId, dto }: UpdateChannelArgs) => ChannelsAPI.updateChannel(workspaceId, channelId, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['channels', workspaceId] }),
  });
};

export const useDeleteChannel = (workspaceId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (channelId: string) => ChannelsAPI.deleteChannel(workspaceId, channelId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['channels', workspaceId] }),
  });
};

export const useJoinChannel = (workspaceId: string) => {
  const qc = useQueryClient();
  return useMutation<Channel, unknown, string>({
    mutationFn: (channelId: string) => ChannelsAPI.joinChannel(workspaceId, channelId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['channels', workspaceId] }),
  });
};
