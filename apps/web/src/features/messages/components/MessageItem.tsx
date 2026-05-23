import React from 'react';
import type { Message } from '@teamhub/shared';
import { useAuthStore } from '@/app/store/useAuthStore';

interface Props {
  message: Message;
}

export const MessageItem: React.FC<Props> = ({ message }) => {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const isOwn = message.sender?.id === currentUserId;
  const isTemp = message.id.startsWith('temp-');
  const time = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div
      className={`flex gap-4 p-4 transition-colors group ${isOwn ? 'flex-row-reverse justify-end' : ''} ${isTemp ? 'opacity-70' : 'hover:bg-white/5'}`}
    >
      {!isOwn && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-accent/10 font-bold text-primary-accent">
          {message.sender?.display_name?.charAt(0).toUpperCase() || message.sender?.email?.charAt(0).toUpperCase() || '?'}
        </div>
      )}
      <div className={`min-w-0 max-w-[75%] ${isOwn ? 'text-right' : 'flex-1'}`}>
        <div className={`flex items-center gap-2 mb-1 ${isOwn ? 'flex-row-reverse justify-end' : ''}`}>
          {!isOwn && (
            <span className="font-semibold text-text-primary">{message.sender?.display_name || message.sender?.email}</span>
          )}
          <span className="text-xs text-text-muted">{time}</span>
        </div>
        <div
          className={`whitespace-pre-wrap break-words text-sm rounded-xl px-3 py-2 ${
            isOwn ? 'bg-primary-accent/20 text-text-primary' : 'text-text-secondary'
          }`}
        >
          {message.content}
        </div>
      </div>
    </div>
  );
};
