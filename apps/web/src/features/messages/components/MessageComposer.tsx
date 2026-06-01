import React, { useRef, useState } from 'react';
import { Camera, Paperclip, Send, X, Loader2 } from 'lucide-react';
import { useSendMessage } from '../hooks/useMessages';
import { useTypingIndicator } from '../hooks/useTypingIndicator';
import { useAttachments } from '@/shared/hooks/useAttachments';
import { toast } from 'sonner';
import { ReplyPreview } from './ReplyPreview';
import type { Message, Attachment } from '@teamhub/shared';

interface MessageComposerProps {
  channelId: string;
  replyingTo: Message | null;
  onCancelReply: () => void;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  channelId,
  replyingTo,
  onCancelReply,
}) => {
  const [content, setContent] = useState('');
  const [uploadedAttachments, setUploadedAttachments] = useState<Attachment[]>([]);
  
  const sendMessage = useSendMessage(channelId);
  const { registerKeyPress } = useTypingIndicator(channelId);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Hook for uploading attachments
  const { uploadAttachment, deleteAttachment, isUploading, uploadProgress } = useAttachments({
    target: 'message',
    targetId: channelId,
  });

  const handleSend = () => {
    const trimmed = content.trim();
    if (!trimmed && uploadedAttachments.length === 0) return;

    setContent('');
    setUploadedAttachments([]);
    onCancelReply();
    inputRef.current?.focus();

    sendMessage.mutate(
      {
        content: trimmed,
        parentMessageId: replyingTo?.id,
        attachmentIds: uploadedAttachments.map((a) => a.id),
      },
      {
        onSuccess: () => {
          inputRef.current?.focus();
        },
        onError: (err) => {
          toast.error(err.message || 'Failed to send message');
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContent(e.target.value);
    registerKeyPress();
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
      // Errors are already handled by useAttachments
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
    <div className="flex flex-col gap-2.5 w-full bg-[#1A1D21] border border-white/5 rounded-2xl p-3 shadow-xl">
      
      {/* 1. Reply Preview Container */}
      {replyingTo && (
        <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-150">
          <ReplyPreview
            message={replyingTo}
            variant="composer"
            onCancel={onCancelReply}
          />
        </div>
      )}

      {/* 2. File Uploading & Uploaded Files Drawer */}
      {(uploadedAttachments.length > 0 || isUploading) && (
        <div className="flex flex-wrap gap-2 py-1 max-h-32 overflow-y-auto">
          {/* List of uploaded files */}
          {uploadedAttachments.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-2 px-2.5 py-1.5 bg-[#0B0C0E] border border-white/5 rounded-lg text-white text-xs max-w-[200px]"
            >
              <span className="truncate flex-1 font-[Roboto]">{file.file_name}</span>
              <button
                onClick={() => handleCancelAttachment(file.id)}
                className="text-white/60 hover:text-white transition-colors"
                title="Remove attachment"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {/* Loader when uploading */}
          {isUploading && (
            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-[#0B0C0E] border border-dashed border-primary-accent/30 rounded-lg text-white/80 text-xs">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-accent" />
              <span>Uploading {uploadProgress}%</span>
            </div>
          )}
        </div>
      )}

      {/* Hidden file pickers */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* 3. Input & Send Button Layout */}
      <div className="flex items-end gap-3 w-full">
        {/* Main Input area bar */}
        <div className="flex-1 flex items-center gap-2 bg-[#0B0C0E]/50 border border-white/5 focus-within:border-primary-accent/40 focus-within:bg-[#0B0C0E]/80 rounded-xl px-3.5 py-2.5 transition-all">
          
          {/* Camera Button */}
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="text-white/60 hover:text-primary-accent p-1 rounded hover:bg-white/5 transition-colors shrink-0"
            title="Take photo"
            type="button"
          >
            <Camera className="w-5 h-5" />
          </button>

          {/* Document Attachment Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-white/60 hover:text-primary-accent p-1 rounded hover:bg-white/5 transition-colors shrink-0 mr-1"
            title="Attach file"
            type="button"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Input text */}
          <input
            ref={inputRef}
            type="text"
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={replyingTo ? "Type a reply..." : "Type a message..."}
            className="flex-1 bg-transparent border-none text-white text-base outline-none placeholder-white/30"
          />
        </div>

        {/* Send Button container box */}
        <button
          onClick={handleSend}
          disabled={isSendDisabled || isUploading}
          className="bg-[#0B0C0E] border border-white/5 rounded-xl p-3.5 text-primary-accent hover:bg-primary-accent hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-[#0B0C0E] disabled:hover:text-primary-accent transition-all duration-150 hover:shadow-lg hover:shadow-primary-accent/5 active:scale-95 shrink-0"
          title="Send message"
          type="button"
        >
          <Send className="w-[18px] h-[18px]" />
        </button>
      </div>

    </div>
  );
};
