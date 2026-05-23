import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { InfiniteData } from '@tanstack/react-query';
import * as MessagesAPI from '../api/messages.api';
import type { PaginatedMessages } from '@teamhub/shared';

type ReactionArgs = { messageId: string; emoji: string };

export const useAddReaction = (channelId: string) => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, ReactionArgs>({
    mutationFn: ({ messageId, emoji }) => MessagesAPI.addReaction(messageId, emoji),
    onMutate: async ({ messageId, emoji }) => {
      const queryKey = ['messages', channelId];
      await queryClient.cancelQueries({ queryKey });

      const previousMessages = queryClient.getQueryData<InfiniteData<PaginatedMessages>>(queryKey);

      queryClient.setQueryData<InfiniteData<PaginatedMessages>>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            messages: page.messages.map((m) => {
              if (m.id !== messageId) return m;

              // Check if reaction already exists
              const reactionIndex = m.reactions.findIndex((r) => r.emoji === emoji);
              const updatedReactions = [...m.reactions];

              if (reactionIndex > -1) {
                const reaction = updatedReactions[reactionIndex]!;
                updatedReactions[reactionIndex] = {
                  ...reaction,
                  count: reaction.count + 1,
                  reacted: true,
                };
              } else {
                updatedReactions.push({
                  emoji,
                  count: 1,
                  reacted: true,
                });
              }

              return {
                ...m,
                reactions: updatedReactions,
              };
            }),
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

export const useRemoveReaction = (channelId: string) => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, ReactionArgs>({
    mutationFn: ({ messageId, emoji }) => MessagesAPI.removeReaction(messageId, emoji),
    onMutate: async ({ messageId, emoji }) => {
      const queryKey = ['messages', channelId];
      await queryClient.cancelQueries({ queryKey });

      const previousMessages = queryClient.getQueryData<InfiniteData<PaginatedMessages>>(queryKey);

      queryClient.setQueryData<InfiniteData<PaginatedMessages>>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            messages: page.messages.map((m) => {
              if (m.id !== messageId) return m;

              const reactionIndex = m.reactions.findIndex((r) => r.emoji === emoji);
              if (reactionIndex === -1) return m;

              let updatedReactions = [...m.reactions];
              const reaction = updatedReactions[reactionIndex]!;

              if (reaction.count <= 1) {
                // Remove the reaction from the list completely
                updatedReactions = updatedReactions.filter((r) => r.emoji !== emoji);
              } else {
                updatedReactions[reactionIndex] = {
                  ...reaction,
                  count: reaction.count - 1,
                  reacted: false,
                };
              }

              return {
                ...m,
                reactions: updatedReactions,
              };
            }),
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
