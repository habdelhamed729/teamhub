import { api } from '@/shared/services/axios';

export const listChannelMembers = async (workspaceId: string, channelId: string) => {
  const { data } = await api.get(`/channels/${workspaceId}/${channelId}/members`);
  return data.data;
};

export const addChannelMember = async (workspaceId: string, channelId: string, dto: { userId: string }) => {
  const { data } = await api.post(`/channels/${workspaceId}/${channelId}/members`, dto);
  return data.data;
};
