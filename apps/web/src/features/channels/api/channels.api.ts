import { api } from '@/shared/services/axios';

export const listChannels = async (workspaceId: string) => {
  const { data } = await api.get(`/channels/${workspaceId}`);
  return data.data.channels;
};

export const createChannel = async (
  workspaceId: string,
  dto: { name: string; type?: string; participantUserId?: string },
) => {
  const { data } = await api.post(`/channels/${workspaceId}`, dto);
  return data.data.channel;
};

export const getChannel = async (workspaceId: string, channelId: string) => {
  const { data } = await api.get(`/channels/${workspaceId}/${channelId}`);
  return data.data.channel;
};

export const updateChannel = async (workspaceId: string, channelId: string, dto: { name?: string }) => {
  const { data } = await api.patch(`/channels/${workspaceId}/${channelId}`, dto);
  return data.data.channel;
};

export const deleteChannel = async (workspaceId: string, channelId: string) => {
  await api.delete(`/channels/${workspaceId}/${channelId}`);
};

export const joinChannel = async (workspaceId: string, channelId: string) => {
  const { data } = await api.post(`/channels/${workspaceId}/${channelId}/join`);
  return data.data.channel;
};
