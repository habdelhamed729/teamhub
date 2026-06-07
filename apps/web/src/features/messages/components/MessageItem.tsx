import React, { useState, useRef } from 'react';
import { CheckCheck, ChevronDown, Clock } from 'lucide-react';



import type { Message } from '@teamhub/shared';
import { useAuthStore } from '@/app/store/useAuthStore';
import { ReplyPreview } from './ReplyPreview';
import { FileAttachment } from './FileAttachment';
import { MessageContextMenu } from './MessageContextMenu';
import { EmojiReactionBar } from './EmojiReactionBar';
import { toast } from 'sonner';

interface MessageItemProps {
  message: Message;
  parentMessage?: Message | null;
  onReply?: (message: Message) => void;
  onReact?: (messageId: string, emoji: string) => void;
  onDelete?: (messageId: string) => void;
  onScrollToParent?: (parentMessageId: string) => void;
  channelType?: string;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  parentMessage,
  onReply,
  onReact,
  onDelete,
  onScrollToParent,
  channelType,
}) => {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const isOwn = message.sender?.id === currentUserId;
  const isTemp = message.id.startsWith('temp-');
  const time = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const [isHovered, setIsHovered] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    toast.success('Copied to clipboard');
  };

  const handleChevronClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setContextMenu({ x: rect.left, y: rect.bottom + window.scrollY });
  };


  // Grouped reaction count mapping
  const activeReactions = message.reactions || [];

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setContextMenu(null);
      }}
      className={`flex gap-3 px-4 py-2 transition-colors relative group w-full ${
        channelType !== 'dm' ? 'items-end' : 'items-start'
      } ${
        isOwn ? 'flex-row-reverse justify-start' : 'justify-start'
      } ${isTemp ? '' : 'hover:bg-white/[0.02]'}`}
    >
      {/* Avatar (Only shown in group/channel chats, hidden in DMs) */}
      {channelType !== 'dm' && (
        message.sender?.avatar_url ? (
          <img
            src={message.sender.avatar_url}
            alt={message.sender.display_name || 'User avatar'}
            className="h-10 w-10 shrink-0 rounded-xl object-cover shadow-sm border border-white/10"
          />
        ) : (
          <div className="flex h-10 w-10 shrink-0 select-none items-center justify-center rounded-xl bg-primary-accent/15 font-bold text-primary-accent shadow-sm border border-primary-accent/10">
            {message.sender?.display_name?.charAt(0).toUpperCase() ||
              message.sender?.email?.charAt(0).toUpperCase() ||
              '?'}
          </div>
        )
      )}

      {/* Message content block */}
      <div className={`flex flex-col min-w-0 max-w-[70%] relative ${isOwn ? 'items-end' : 'items-start'}`}>
        
        {/* Sender Info (Only show name for others in group) */}
        {channelType !== 'dm' && !isOwn && message.sender && (
          <span className="text-sm font-semibold text-primary-accent mb-1 font-[Roboto]">
            {message.sender.display_name || message.sender.email}
          </span>
        )}

        {/* Message Bubble wrapper with relative positioning for floating bars */}
        <div className={`relative group/bubble flex flex-col w-fit max-w-full ${isOwn ? 'items-end' : 'items-start'}`}>
          
          {/* Quick Chevron / Context Menu Trigger */}
          {isHovered && !isTemp && (
            <button
              onClick={handleChevronClick}
              className={`absolute top-2 ${
                isOwn 
                  ? 'left-2 text-white/80 hover:text-white bg-black/50 hover:bg-black/70' 
                  : 'right-2 text-[#1E1E1E]/60 hover:text-[#1E1E1E] bg-white/60 hover:bg-white/90'
              } z-10 transition-all duration-200 p-0.5 rounded-full shadow-sm border border-black/5`}
              title="Message options"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Bubble content */}
          <div
            ref={bubbleRef}
            onContextMenu={handleContextMenu}
            className={`w-fit max-w-full whitespace-pre-wrap break-words rounded-2xl px-4 py-3 flex flex-col gap-2 shadow-sm border transition-all duration-200 ${
              isOwn
                ? `${isHovered ? 'bg-[#317268] border-[#317268]' : 'bg-msg-own-bg border-[#3B8E81]'} text-white rounded-br-none`
                : `${isHovered ? 'bg-[#F2F4F5] border-[#D1D2D4]' : 'bg-msg-other-bg border-[#E8E8E9]'} text-[#1E1E1E] rounded-bl-none`
            }`}
          >
            {/* 1. Reply Preview block inside bubble */}
            {message.parentMessageId && (message.parentMessage || parentMessage) && (
              <ReplyPreview
                message={
                  message.parentMessage
                    ? {
                        content: message.parentMessage.content,
                        sender: message.parentMessage.sender,
                        attachments: message.parentMessage.attachments,
                      }
                    : {
                        content: parentMessage!.content,
                        sender: parentMessage!.sender,
                        attachments: parentMessage!.attachments,
                      }
                }
                variant="bubble"
                isOwn={isOwn}
                onClick={
                  onScrollToParent && message.parentMessageId
                    ? () => onScrollToParent(message.parentMessageId!)
                    : undefined
                }
              />
            )}

            {/* 2. File Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="flex flex-col gap-2 w-full">
                {message.attachments.map((att) => (
                  <FileAttachment key={att.id} attachment={att} isOwn={isOwn} />
                ))}
              </div>
            )}

            {/* 3. Text Message content */}
            {message.content && (
              <p className="text-[16px] font-normal leading-[1.25] font-[Roboto]">
                {message.content}
              </p>
            )}

            {/* 4. Timestamp & Read receipt */}
            <div className={`flex items-center gap-2 justify-end self-end text-[12px] font-medium font-[Roboto] select-none ${
              isOwn ? 'text-[#e9eaeb]' : 'text-[#d0d1db]'
            }`}>
              <span>{time}</span>
              {isOwn && (
                isTemp ? (
                  <Clock className="w-[14px] h-[14px] text-white/60 shrink-0 animate-pulse" />
                ) : (
                  <CheckCheck className="w-[14px] h-[14px] text-white/80 shrink-0" />
                )
              )}
            </div>
          </div>

          {/* Reaction Button & Reaction Bar on Hover (Morphing In-Place) */}
          {isHovered && !isTemp && onReact && (
            <div className={`absolute -bottom-3.5 ${isOwn ? 'left-0 -translate-x-1/2' : 'right-0 translate-x-1/2'} z-20`}>
              <EmojiReactionBar onReact={(emoji) => onReact(message.id, emoji)} isOwn={isOwn} />
            </div>
          )}
        </div>

        {/* Existing Reactions display pills */}
        {activeReactions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {activeReactions.map((reaction) => (
              <button
                key={reaction.emoji}
                onClick={() => onReact?.(message.id, reaction.emoji)}
                className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors ${
                  reaction.reacted
                    ? 'bg-primary-accent/15 border-primary-accent/30 text-primary-accent'
                    : 'bg-white/5 border-white/10 text-text-secondary hover:bg-white/10'
                }`}
              >
                <span>{reaction.emoji}</span>
                <span>{reaction.count}</span>
              </button>
            ))}
          </div>
        )}


      </div>

      {/* Context Menu */}
      {contextMenu && (
        <MessageContextMenu
          position={contextMenu}
          isOwn={isOwn}
          onReply={() => onReply?.(message)}
          onCopy={handleCopy}
          onDelete={onDelete ? () => onDelete(message.id) : undefined}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
};
