import React, { useRef, useEffect, useCallback } from 'react';
import { useMessages, useDeleteMessage } from '../hooks/useMessages';
import { useAddReaction, useRemoveReaction } from '../hooks/useReactions';
import { MessageItem } from './MessageItem';
import type { Message, ChannelMember } from '@teamhub/shared';
import { toast } from 'sonner';

interface MessageListProps {
  channelId: string;
  onReply: (message: Message) => void;
  channelType?: string;
  members?: ChannelMember[];
}

export const MessageList: React.FC<MessageListProps> = ({ channelId, onReply, channelType, members }) => {
  const { data, isLoading } = useMessages(channelId);
  const deleteMessage = useDeleteMessage(channelId);
  const addReaction = useAddReaction(channelId);
  const removeReaction = useRemoveReaction(channelId);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const allMessages = data?.pages.flatMap((page) => page.messages) || [];

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [allMessages.length]);

  const handleDelete = (messageId: string) => {
    deleteMessage.mutate(messageId, {
      onSuccess: () => toast.success('Message deleted'),
      onError: (err) => toast.error(err.message || 'Failed to delete message'),
    });
  };

  const handleReact = (messageId: string, emoji: string) => {
    const msg = allMessages.find((m) => m.id === messageId);
    if (!msg) return;

    const existingReaction = msg.reactions?.find((r) => r.emoji === emoji);
    if (existingReaction?.reacted) {
      removeReaction.mutate({ messageId, emoji });
    } else {
      addReaction.mutate({ messageId, emoji });
    }
  };

  /** Scroll the container to the message with the given id and briefly highlight it */
  const scrollToMessage = useCallback((messageId: string) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const el = container.querySelector<HTMLElement>(`[data-message-id="${messageId}"]`);
    if (!el) return;

    el.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Brief highlight flash
    el.classList.add('bg-primary-accent/10', 'rounded-xl', 'transition-colors', 'duration-700');
    setTimeout(() => {
      el.classList.remove('bg-primary-accent/10');
    }, 1500);
  }, []);

  if (isLoading) {
    return <div className="flex-1 p-6 flex items-center justify-center text-text-muted">Loading messages...</div>;
  }

  if (allMessages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center text-text-muted my-10 animate-in fade-in duration-200">
          <h3 className="text-lg font-medium text-text-primary mb-2">No messages yet</h3>
          <p className="text-sm">Be the first to say hello!</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={scrollContainerRef}
      className="flex-1 overflow-y-auto overflow-x-hidden p-4 flex flex-col-reverse gap-2 bg-fixed"
    >
      <div ref={bottomRef} />
      {allMessages.map((msg) => {
        // Resolve parent message object if this message is a reply
        const parentMessage = msg.parentMessageId
          ? allMessages.find((m) => m.id === msg.parentMessageId)
          : null;

        return (
          <div key={msg.id} data-message-id={msg.id}>
            <MessageItem
              message={msg}
              parentMessage={parentMessage}
              onReply={onReply}
              onReact={handleReact}
              onDelete={handleDelete}
              onScrollToParent={scrollToMessage}
              channelType={channelType}
              members={members}
            />
          </div>
        );
      })}
    </div>
  );
};

