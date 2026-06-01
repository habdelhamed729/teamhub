import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { InfiniteData } from '@tanstack/react-query';
import { getSocket } from '@/shared/services/socket';
import { useAuthStore } from '@/app/store/useAuthStore';
import { MessageEvents } from '@teamhub/shared';
import type { PaginatedMessages, Message, ReactionEvent, MentionEvent } from '@teamhub/shared';

export const useMessageSocket = (channelId: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!channelId) return;

    const socket = getSocket();
    const currentUserId = useAuthStore.getState().user?.id;

    // 1. Join the active channel's room
    socket.emit(MessageEvents.JOIN_CHANNEL, channelId);

    // 2. Setup message lifecycle listeners
    
    // MESSAGE_RECEIVED
    const handleMessageReceived = (message: Message) => {
      if (message.parentMessageId) {
        // Handle reply (add to replies cache)
        const repliesKey = ['replies', message.parentMessageId];
        queryClient.setQueryData<InfiniteData<PaginatedMessages>>(repliesKey, (old) => {
          if (!old) return old;

          // Check if already in cache
          const exists = old.pages.some((page) => page.messages.some((m) => m.id === message.id));
          if (exists) return old;

          const newPages = [...old.pages];
          const lastIdx = newPages.length - 1;
          if (newPages[lastIdx]) {
            newPages[lastIdx] = {
              ...newPages[lastIdx],
              messages: [...newPages[lastIdx].messages, message],
            };
          }
          return { ...old, pages: newPages };
        });

        // Also increment parent message's replyCount in the main message list
        queryClient.setQueryData<InfiniteData<PaginatedMessages>>(['messages', channelId], (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              messages: page.messages.map((m) =>
                m.id === message.parentMessageId ? { ...m, replyCount: m.replyCount + 1 } : m
              ),
            })),
          };
        });
      } else {
        // Handle top-level message (add to main list cache)
        queryClient.setQueryData<InfiniteData<PaginatedMessages>>(['messages', channelId], (old) => {
          if (!old) return old;

          // Prevent duplication
          const exists = old.pages.some((page) => page.messages.some((m) => m.id === message.id));
          if (exists) return old;

          // Clean out optimistic/temp matching message if any
          const cleanPages = old.pages.map((page) => ({
            ...page,
            messages: page.messages.filter((m) => !m.id.startsWith('temp-') || m.content !== message.content),
          }));

          const newPages = [...cleanPages];
          if (newPages[0]) {
            newPages[0] = {
              ...newPages[0],
              messages: [message, ...newPages[0].messages],
            };
          }
          return { ...old, pages: newPages };
        });
      }
    };

    // MESSAGE_UPDATED
    const handleMessageUpdated = (message: Message) => {
      const targetQueryKey = message.parentMessageId ? ['replies', message.parentMessageId] : ['messages', channelId];

      queryClient.setQueryData<InfiniteData<PaginatedMessages>>(targetQueryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            messages: page.messages.map((m) => (m.id === message.id ? message : m)),
          })),
        };
      });
    };

    // MESSAGE_DELETED
    const handleMessageDeleted = (payload: { messageId: string; channelId: string }) => {
      // Clean from both potential feeds (top-level and replies)
      const feedKeys = [['messages', channelId], ['replies', payload.messageId]];
      
      feedKeys.forEach((key) => {
        queryClient.setQueryData<InfiniteData<PaginatedMessages>>(key, (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              messages: page.messages.filter((m) => m.id !== payload.messageId),
            })),
          };
        });
      });
    };

    // REACTION_ADDED
    const handleReactionAdded = (event: ReactionEvent) => {
      queryClient.setQueryData<InfiniteData<PaginatedMessages>>(['messages', channelId], (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            messages: page.messages.map((m) => {
              if (m.id !== event.messageId) return m;

              const reactionIndex = m.reactions.findIndex((r) => r.emoji === event.emoji);
              const updatedReactions = [...m.reactions];

              if (reactionIndex > -1) {
                const r = updatedReactions[reactionIndex]!;
                const isOwnReactionEvent = currentUserId === event.userId;
                const shouldIncrement = !isOwnReactionEvent || !r.reacted;

                updatedReactions[reactionIndex] = {
                  ...r,
                  count: shouldIncrement ? r.count + 1 : r.count,
                  reacted: r.reacted || isOwnReactionEvent,
                };
              } else {
                updatedReactions.push({
                  emoji: event.emoji,
                  count: 1,
                  reacted: currentUserId === event.userId,
                });
              }

              return { ...m, reactions: updatedReactions };
            }),
          })),
        };
      });
    };

    // REACTION_REMOVED
    const handleReactionRemoved = (event: ReactionEvent) => {
      queryClient.setQueryData<InfiniteData<PaginatedMessages>>(['messages', channelId], (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            messages: page.messages.map((m) => {
              if (m.id !== event.messageId) return m;

              const reactionIndex = m.reactions.findIndex((r) => r.emoji === event.emoji);
              if (reactionIndex === -1) return m;

              let updatedReactions = [...m.reactions];
              const r = updatedReactions[reactionIndex]!;
              const isOwnReactionEvent = currentUserId === event.userId;
              const shouldDecrement = !isOwnReactionEvent || r.reacted;

              if (shouldDecrement) {
                if (r.count <= 1) {
                  updatedReactions = updatedReactions.filter((reaction) => reaction.emoji !== event.emoji);
                } else {
                  updatedReactions[reactionIndex] = {
                    ...r,
                    count: r.count - 1,
                    reacted: isOwnReactionEvent ? false : r.reacted,
                  };
                }
              }

              return { ...m, reactions: updatedReactions };
            }),
          })),
        };
      });
    };

    // MENTION_CREATED
    const handleMentionCreated = (event: MentionEvent) => {
      console.log('User received mention event:', event);
      // Can be utilized by UI notifications, sounds or toast notifications
    };

    // Bind listeners
    socket.on(MessageEvents.MESSAGE_RECEIVED, handleMessageReceived);
    socket.on(MessageEvents.MESSAGE_UPDATED, handleMessageUpdated);
    socket.on(MessageEvents.MESSAGE_DELETED, handleMessageDeleted);
    socket.on(MessageEvents.REACTION_ADDED, handleReactionAdded);
    socket.on(MessageEvents.REACTION_REMOVED, handleReactionRemoved);
    socket.on(MessageEvents.MENTION_CREATED, handleMentionCreated);

    // 3. Cleanup on unmount/channel change
    return () => {
      socket.emit(MessageEvents.LEAVE_CHANNEL, channelId);
      socket.off(MessageEvents.MESSAGE_RECEIVED, handleMessageReceived);
      socket.off(MessageEvents.MESSAGE_UPDATED, handleMessageUpdated);
      socket.off(MessageEvents.MESSAGE_DELETED, handleMessageDeleted);
      socket.off(MessageEvents.REACTION_ADDED, handleReactionAdded);
      socket.off(MessageEvents.REACTION_REMOVED, handleReactionRemoved);
      socket.off(MessageEvents.MENTION_CREATED, handleMentionCreated);
    };
  }, [channelId, queryClient]);
};
