import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { InfiniteData } from '@tanstack/react-query';
import * as MessagesAPI from '../api/messages.api';
import type { PaginatedMessages, Message } from '@teamhub/shared';

// ─── Queries ──────────────────────────────────────────────────────────────────

export const useReplies = (messageId: string, limit: number = 30) => {
  return useInfiniteQuery<PaginatedMessages, Error, InfiniteData<PaginatedMessages>, (string | undefined)[], string | undefined>({
    queryKey: ['replies', messageId],
    queryFn: ({ pageParam }) => MessagesAPI.fetchReplies(messageId, pageParam, limit),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!messageId,
  });
};

// ─── Mutations ────────────────────────────────────────────────────────────────

export const useSendReply = (messageId: string, channelId?: string) => {
  const queryClient = useQueryClient();

  return useMutation<Message, Error, { content: string; attachmentIds?: string[] }>({
    mutationFn: (dto) => MessagesAPI.sendReply(messageId, dto),
    onSuccess: (savedReply) => {
      // 1. Invalidate or update replies query list
      queryClient.invalidateQueries({ queryKey: ['replies', messageId] });

      // 2. Increment parent message replyCount in the main messages feed
      if (channelId) {
        const messagesQueryKey = ['messages', channelId];
        queryClient.setQueryData<InfiniteData<PaginatedMessages>>(messagesQueryKey, (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              messages: page.messages.map((m) =>
                m.id === messageId ? { ...m, replyCount: m.replyCount + 1 } : m
              ),
            })),
          };
        });
      }
    },
  });
};
