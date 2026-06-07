import React, { useRef, useState, useEffect } from 'react';
import { X, Send, Paperclip, Camera, Loader2 } from 'lucide-react';
import { useReplies, useSendReply } from '../hooks/useReplies';
import { useAttachments } from '@/shared/hooks/useAttachments';
import { MessageItem } from './MessageItem';
import { TypingIndicatorDisplay } from './TypingIndicatorDisplay';
import type { Message, Attachment } from '@teamhub/shared';
import { toast } from 'sonner';

interface ThreadSidebarProps {
  parentMessage: Message;
  channelId: string;
  channelType?: string;
  onClose: () => void;
}

export const ThreadSidebar: React.FC<ThreadSidebarProps> = ({
  parentMessage,
  channelId,
  channelType,
  onClose,
}) => {
  const [content, setContent] = useState('');
  const [uploadedAttachments, setUploadedAttachments] = useState<Attachment[]>([]);
  const repliesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Fetch replies
  const { data, isLoading } = useReplies(parentMessage.id);
  const replies = data?.pages.flatMap((page) => page.messages) || [];

  // Mutation to send a reply
  const sendReply = useSendReply(parentMessage.id, channelId);

  // Hook for uploading attachments
  const { uploadAttachment, deleteAttachment, isUploading, uploadProgress } = useAttachments({
    target: 'message',
    targetId: channelId,
  });

  // Scroll to bottom when replies arrive
  useEffect(() => {
    repliesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [replies.length]);

  const handleSend = () => {
    const trimmed = content.trim();
    if (!trimmed && uploadedAttachments.length === 0) return;

    setContent('');
    setUploadedAttachments([]);

    sendReply.mutate(
      {
        content: trimmed,
        attachmentIds: uploadedAttachments.map((a) => a.id),
      },
      {
        onError: (err) => {
          toast.error(err.message || 'Failed to send reply');
        },
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file) return;

    try {
      const att = await uploadAttachment(file);
      setUploadedAttachments((prev) => [...prev, att]);
    } catch (error) {
      // Handled by useAttachments
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const handleCancelAttachment = async (id: string) => {
    try {
      await deleteAttachment(id);
      setUploadedAttachments((prev) => prev.filter((a) => a.id !== id));
    } catch (error) {
      // Handled by useAttachments
    }
  };

  const isSendDisabled = !content.trim() && uploadedAttachments.length === 0;

  return (
    <div className="w-96 border-l border-white/5 bg-surface-secondary flex flex-col shrink-0 animate-in slide-in-from-right-8 h-full">
      {/* Header */}
      <div className="h-[83px] border-b border-white/5 flex items-center justify-between px-6 bg-[#2A2F36] shrink-0">
        <div>
          <h3 className="font-semibold text-text-primary text-base">Thread</h3>
          <p className="text-xs text-text-muted">Reply to message</p>
        </div>
        <button
          onClick={onClose}
          className="text-white/70 hover:text-white hover:bg-white/5 p-2 rounded-xl transition-colors"
          title="Close Thread"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Scrollable replies feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Original Parent Message Card */}
        <div className="p-3 bg-surface-primary/40 rounded-2xl border border-white/5 mb-4 shadow-inner">
          <p className="text-xs font-semibold text-primary-accent mb-2 uppercase tracking-wider">Original Message</p>
          <MessageItem
            message={parentMessage}
            channelType={channelType}
            // Disable actions on the original message inside sidebar
            onReply={undefined}
            onReact={undefined}
            onDelete={undefined}
          />
        </div>

        <div className="border-t border-white/5 my-2" />

        {/* Replies List */}
        {isLoading ? (
          <div className="text-sm text-text-muted text-center py-8">Loading replies...</div>
        ) : replies.length === 0 ? (
          <div className="text-sm text-text-muted text-center py-8">No replies yet. Start the conversation!</div>
        ) : (
          <div className="space-y-3">
            {replies.map((reply) => (
              <MessageItem
                key={reply.id}
                message={reply}
                channelType={channelType}
                onReply={undefined} // Disable nested threads
                onReact={undefined}
                onDelete={undefined}
              />
            ))}
            <div ref={repliesEndRef} />
          </div>
        )}
      </div>

      {/* Composer Area */}
      <div className="p-4 bg-surface-elevated shrink-0 border-t border-white/5">
        <TypingIndicatorDisplay channelId={channelId} />
        
        <div className="flex flex-col gap-2.5 w-full bg-[#1A1D21] border border-white/5 rounded-2xl p-3 shadow-xl">
          {/* File attachments drawer */}
          {(uploadedAttachments.length > 0 || isUploading) && (
            <div className="flex flex-wrap gap-2 py-1 max-h-24 overflow-y-auto">
              {uploadedAttachments.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-2 px-2.5 py-1 bg-[#0B0C0E] border border-white/5 rounded-lg text-white text-[11px] max-w-[150px]"
                >
                  <span className="truncate flex-1 font-[Roboto]">{file.file_name}</span>
                  <button
                    onClick={() => handleCancelAttachment(file.id)}
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {isUploading && (
                <div className="flex items-center gap-2 px-2.5 py-1 bg-[#0B0C0E] border border-dashed border-primary-accent/30 rounded-lg text-white/80 text-[11px]">
                  <Loader2 className="w-3 h-3 animate-spin text-primary-accent" />
                  <span>{uploadProgress}%</span>
                </div>
              )}
            </div>
          )}

          {/* Hidden inputs */}
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />

          {/* Composer Input Bar */}
          <div className="flex items-end gap-2.5 w-full">
            <div className="flex-1 flex items-center gap-1.5 bg-[#0B0C0E]/50 border border-white/5 focus-within:border-primary-accent/40 focus-within:bg-[#0B0C0E]/80 rounded-xl px-3 py-2 transition-all">
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="text-white/60 hover:text-primary-accent p-0.5 rounded hover:bg-white/5 transition-colors shrink-0"
                type="button"
              >
                <Camera className="w-4 h-4" />
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-white/60 hover:text-primary-accent p-0.5 rounded hover:bg-white/5 transition-colors shrink-0 mr-1"
                type="button"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <input
                type="text"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a reply..."
                className="flex-1 bg-transparent border-none text-white text-sm outline-none placeholder-white/30"
              />
            </div>

            <button
              onClick={handleSend}
              disabled={isSendDisabled || isUploading}
              className="bg-[#0B0C0E] border border-white/5 rounded-xl p-2.5 text-primary-accent hover:bg-primary-accent hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-[#0B0C0E] disabled:hover:text-primary-accent transition-all active:scale-95 shrink-0"
              type="button"
            >
              <Send className="w-[14px] h-[14px]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
