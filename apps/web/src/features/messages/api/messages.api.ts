import { api } from '@/shared/services/axios';
import type { PaginatedMessages, Message } from '@teamhub/shared';

// Fetch top-level messages for a channel with cursor-based pagination
export const fetchMessages = async (
  channelId: string,
  cursor?: string,
  limit?: number,
): Promise<PaginatedMessages> => {
  const { data } = await api.get(`/channels/${channelId}/messages`, {
    params: { cursor, limit },
  });
  return data.data;
};

// Send a new message to a channel
export const sendMessage = async (
  channelId: string,
  dto: { content: string; parentMessageId?: string; attachmentIds?: string[] },
): Promise<Message> => {
  const { data } = await api.post(`/channels/${channelId}/messages`, dto);
  return data.data.message;
};

// Edit content of an existing message
export const editMessage = async (
  messageId: string,
  content: string,
): Promise<Message> => {
  const { data } = await api.patch(`/messages/${messageId}`, { content });
  return data.data.message;
};

// Soft-delete a message
export const deleteMessage = async (messageId: string): Promise<void> => {
  await api.delete(`/messages/${messageId}`);
};

// Add emoji reaction to a message
export const addReaction = async (
  messageId: string,
  emoji: string,
): Promise<void> => {
  await api.post(`/messages/${messageId}/reactions`, { emoji });
};

// Remove emoji reaction from a message
export const removeReaction = async (
  messageId: string,
  emoji: string,
): Promise<void> => {
  await api.delete(`/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`);
};

// Fetch thread replies for a parent message
export const fetchReplies = async (
  messageId: string,
  cursor?: string,
  limit?: number,
): Promise<PaginatedMessages> => {
  const { data } = await api.get(`/messages/${messageId}/replies`, {
    params: { cursor, limit },
  });
  return data.data;
};

// Reply to a parent message (creates a message inside the thread)
export const sendReply = async (
  messageId: string,
  dto: { content: string; attachmentIds?: string[] },
): Promise<Message> => {
  const { data } = await api.post(`/messages/${messageId}/replies`, dto);
  return data.data.message;
};
