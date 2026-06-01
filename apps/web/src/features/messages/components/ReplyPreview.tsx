import React from 'react';
import { X } from 'lucide-react';
import type { Message } from '@teamhub/shared';

interface ReplyPreviewProps {
  /** The message being replied to */
  message: Pick<Message, 'content' | 'sender'>;
  /** Visual variant: 'bubble' inside a message bubble, 'composer' in the composer area */
  variant?: 'bubble' | 'composer';
  /** Whether this is inside the current user's (own) message bubble */
  isOwn?: boolean;
  /** If provided, shows a close (X) button and calls this on click */
  onCancel?: () => void;
}

export const ReplyPreview: React.FC<ReplyPreviewProps> = ({
  message,
  variant = 'bubble',
  isOwn = false,
  onCancel,
}) => {
  const senderName = message.sender?.display_name || message.sender?.email || 'Unknown';

  // Colors depend on context: own message bubble vs other's bubble vs composer
  const isComposer = variant === 'composer';

  const containerClasses = isComposer || isOwn
    ? 'bg-reply-own-bg border-l-[3px] border-reply-own-border'
    : 'bg-reply-other-bg border-l-[3px] border-reply-other-border';

  const nameClasses = isComposer || isOwn
    ? 'text-primary-accent'
    : 'text-[#D00000]';

  const textClasses = isComposer
    ? 'text-[#E8E8E9]'
    : isOwn
      ? 'text-white'
      : 'text-[#1E1E1E]';

  return (
    <div className={`flex flex-col gap-1.5 overflow-hidden rounded-lg px-3 py-2 w-full ${containerClasses}`}>
      <div className="flex items-center justify-between">
        <span className={`text-base font-normal leading-normal font-[Roboto] ${nameClasses}`}>
          {senderName}
        </span>
        {onCancel && (
          <button
            onClick={onCancel}
            className="p-0.5 rounded hover:bg-white/10 transition-colors text-text-muted hover:text-text-primary"
            aria-label="Cancel reply"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <p className={`text-base font-normal leading-normal font-[Roboto] line-clamp-2 ${textClasses}`}>
        {message.content}
      </p>
    </div>
  );
};
