import React from 'react';
import { X, Paperclip } from 'lucide-react';
import type { Message, Attachment } from '@teamhub/shared';

interface ReplyPreviewProps {
  /** The message being replied to */
  message: Pick<Message, 'content' | 'sender'> & {
    attachments?: Attachment[];
  };
  /** Visual variant: 'bubble' inside a message bubble, 'composer' in the composer area */
  variant?: 'bubble' | 'composer';
  /** Whether this is inside the current user's (own) message bubble */
  isOwn?: boolean;
  /** If provided, shows a close (X) button and calls this on click */
  onCancel?: () => void;
  /** If provided (bubble variant), clicking the preview scrolls/navigates to the parent message */
  onClick?: () => void;
}

export const ReplyPreview: React.FC<ReplyPreviewProps> = ({
  message,
  variant = 'bubble',
  isOwn = false,
  onCancel,
  onClick,
}) => {
  const senderName = message.sender?.display_name || message.sender?.email || 'Unknown';
  const firstAttachment = message.attachments?.[0];
  const fileName = firstAttachment?.file_name;

  // Colors depend on context: own message bubble vs other's bubble vs composer
  const isComposer = variant === 'composer';

  const containerClasses = isComposer || isOwn
    ? 'bg-[#276259] border-l-[3px] border-[#1c4942]'
    : 'bg-[#a3a3a3] border-l-[3px] border-[#4f4f4f]';

  const nameClasses = isComposer || isOwn
    ? 'text-primary-accent'
    : 'text-[#D00000]';

  const fileNameClasses = isComposer
    ? 'text-[#E8E8E9]/70'
    : isOwn
      ? 'text-white/70'
      : 'text-[#1E1E1E]/60';

  const textClasses = isComposer
    ? 'text-[#E8E8E9]'
    : isOwn
      ? 'text-white'
      : 'text-[#1E1E1E]';

  const isClickable = variant === 'bubble' && !!onClick;

  return (
    <div
      className={`flex flex-col gap-1.5 overflow-hidden rounded-lg px-3 py-2 w-full ${containerClasses} ${isClickable ? 'cursor-pointer hover:brightness-90 transition-[filter] duration-150' : ''}`}
      onClick={isClickable ? onClick : undefined}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => e.key === 'Enter' && onClick?.() : undefined}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span className={`text-[15px] font-medium leading-none font-[Roboto] truncate ${nameClasses}`}>
            {senderName}
          </span>
          {fileName && (
            <span className={`text-xs font-normal flex items-center gap-0.5 truncate shrink-0 max-w-[60%] ${fileNameClasses}`}>
              • <span className="italic truncate">{fileName}</span>
            </span>
          )}
        </div>
        {onCancel && (
          <button
            onClick={(e) => { e.stopPropagation(); onCancel(); }}
            className="p-0.5 rounded hover:bg-white/10 transition-colors text-text-muted hover:text-text-primary shrink-0"
            aria-label="Cancel reply"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {(message.content || fileName) && (
        <p className={`text-[14px] font-normal leading-normal font-[Roboto] line-clamp-2 ${textClasses}`}>
          {message.content || (
            <span className="flex items-center gap-1 opacity-90">
              <Paperclip className="h-3.5 w-3.5 shrink-0" />
              <span className="italic truncate">{fileName}</span>
            </span>
          )}
        </p>
      )}
    </div>
  );
};

