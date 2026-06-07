import { useInfiniteQuery, useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';

import * as MessagesAPI from '../api/messages.api';
import { useAuthStore } from '@/app/store/useAuthStore';
import type { PaginatedMessages, Message, MessageType } from '@teamhub/shared';

// ─── Queries ──────────────────────────────────────────────────────────────────

export const useMessages = (channelId: string, limit: number = 30) => {
  return useInfiniteQuery<PaginatedMessages, Error, InfiniteData<PaginatedMessages>, (string | undefined)[], string | undefined>({
    queryKey: ['messages', channelId],
    queryFn: ({ pageParam }) => MessagesAPI.fetchMessages(channelId, pageParam, limit),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!channelId,
  });
};

// ─── Mutations ────────────────────────────────────────────────────────────────

export const useSendMessage = (channelId: string) => {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);

  return useMutation<Message, Error, { content: string; parentMessageId?: string; parentMessage?: Pick<Message, 'id' | 'content' | 'sender' | 'attachments'> | null; attachmentIds?: string[] }>({
    mutationFn: ({ content, parentMessageId, attachmentIds }) =>
      MessagesAPI.sendMessage(channelId, { content, parentMessageId, attachmentIds }),
    onMutate: async (newMsg) => {
      const queryKey = ['messages', channelId];
      await queryClient.cancelQueries({ queryKey });

      const previousMessages = queryClient.getQueryData<InfiniteData<PaginatedMessages>>(queryKey);

      if (currentUser) {
        // Construct a client-side optimistic message
        const optimisticMessage: Message = {
          id: `temp-${Date.now()}`,
          channelId,
          sender: currentUser,
          content: newMsg.content,
          messageType: 'text' as MessageType,
          parentMessageId: newMsg.parentMessageId ?? null,
          // Embed parent message so ReplyPreview renders immediately
          parentMessage: newMsg.parentMessage ?? null,
          attachments: [],
          reactions: [],
          replyCount: 0,
          isEdited: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        queryClient.setQueryData<InfiniteData<PaginatedMessages>>(queryKey, (old) => {
          if (!old) {
            return {
              pages: [{ messages: [optimisticMessage], nextCursor: null }],
              pageParams: [undefined],
            };
          }
          const newPages = [...old.pages];
          if (newPages[0]) {
            newPages[0] = {
              ...newPages[0],
              messages: [optimisticMessage, ...newPages[0].messages],
            };
          }
          return {
            ...old,
            pages: newPages,
          };
        });
      }

      return { previousMessages };
    },
    onError: (_err, _newMsg, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(['messages', channelId], context.previousMessages);
      }
    },
    onSuccess: (savedMessage) => {
      const queryKey = ['messages', channelId];
      // Replace the optimistic message with the actual persisted message
      queryClient.setQueryData<InfiniteData<PaginatedMessages>>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            messages: page.messages.map((m) =>
              m.id.startsWith('temp-') && m.content === savedMessage.content ? savedMessage : m
            ),
          })),
        };
      });
    },
  });
};

export const useEditMessage = (channelId: string) => {
  const queryClient = useQueryClient();

  return useMutation<Message, Error, { messageId: string; content: string }>({
    mutationFn: ({ messageId, content }) => MessagesAPI.editMessage(messageId, content),
    onMutate: async ({ messageId, content }) => {
      const queryKey = ['messages', channelId];
      await queryClient.cancelQueries({ queryKey });

      const previousMessages = queryClient.getQueryData<InfiniteData<PaginatedMessages>>(queryKey);

      queryClient.setQueryData<InfiniteData<PaginatedMessages>>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            messages: page.messages.map((m) =>
              m.id === messageId ? { ...m, content, isEdited: true } : m
            ),
          })),
        };
      });

      return { previousMessages };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(['messages', channelId], context.previousMessages);
      }
    },
  });
};

export const useDeleteMessage = (channelId: string) => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (messageId) => MessagesAPI.deleteMessage(messageId),
    onMutate: async (messageId) => {
      const queryKey = ['messages', channelId];
      await queryClient.cancelQueries({ queryKey });

      const previousMessages = queryClient.getQueryData<InfiniteData<PaginatedMessages>>(queryKey);

      queryClient.setQueryData<InfiniteData<PaginatedMessages>>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            messages: page.messages.filter((m) => m.id !== messageId),
          })),
        };
      });

      return { previousMessages };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(['messages', channelId], context.previousMessages);
      }
    },
  });
};
