import React, { useRef, useEffect } from 'react';
import { useMessages } from '../hooks/useMessages';
import { MessageItem } from './MessageItem';

interface Props {
  channelId: string;
}

export const MessageList: React.FC<Props> = ({ channelId }) => {
  const { data, isLoading } = useMessages(channelId);
  const bottomRef = useRef<HTMLDivElement>(null);

  const allMessages = data?.pages.flatMap(page => page.messages) || [];

  useEffect(() => {
    // Scroll to bottom when messages arrive. Because of flex-col-reverse,
    // we want to make sure the scroll view starts at the bottom.
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [allMessages.length]);

  if (isLoading) {
    return <div className="flex-1 p-6 flex items-center justify-center text-text-muted">Loading messages...</div>;
  }

  if (allMessages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center text-text-muted my-10">
          <h3 className="text-lg font-medium text-text-primary mb-2">No messages yet</h3>
          <p className="text-sm">Be the first to say hello!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col-reverse gap-2 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
      <div ref={bottomRef} />
      {allMessages.map((msg) => (
        <MessageItem key={msg.id} message={msg} />
      ))}
    </div>
  );
};
