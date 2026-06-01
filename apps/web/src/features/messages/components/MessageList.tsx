import React, { useRef, useEffect } from 'react';
import { useMessages, useDeleteMessage } from '../hooks/useMessages';
import { useAddReaction, useRemoveReaction } from '../hooks/useReactions';
import { MessageItem } from './MessageItem';
import type { Message } from '@teamhub/shared';
import { toast } from 'sonner';

interface MessageListProps {
  channelId: string;
  onReply: (message: Message) => void;
  channelType?: string;
}

export const MessageList: React.FC<MessageListProps> = ({ channelId, onReply, channelType }) => {
  const { data, isLoading } = useMessages(channelId);
  const deleteMessage = useDeleteMessage(channelId);
  const addReaction = useAddReaction(channelId);
  const removeReaction = useRemoveReaction(channelId);
  const bottomRef = useRef<HTMLDivElement>(null);

  const allMessages = data?.pages.flatMap((page) => page.messages) || [];

  useEffect(() => {
    // Scroll to bottom when messages arrive. Because of flex-col-reverse,
    // we want to make sure the scroll view starts at the bottom.
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
    <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 flex flex-col-reverse gap-2 bg-fixed">
      <div ref={bottomRef} />
      {allMessages.map((msg) => {
        // Resolve parent message object if this message is a reply
        const parentMessage = msg.parentMessageId
          ? allMessages.find((m) => m.id === msg.parentMessageId)
          : null;

        return (
          <MessageItem
            key={msg.id}
            message={msg}
            parentMessage={parentMessage}
            onReply={onReply}
            onReact={handleReact}
            onDelete={handleDelete}
            channelType={channelType}
          />
        );
      })}
    </div>
  );
};
