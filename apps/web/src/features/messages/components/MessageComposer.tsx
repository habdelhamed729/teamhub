import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Camera, Paperclip, Send, X, Loader2 } from 'lucide-react';
import { useSendMessage } from '../hooks/useMessages';
import { useTypingIndicator } from '../hooks/useTypingIndicator';
import { useAttachments } from '@/shared/hooks/useAttachments';
import { toast } from 'sonner';
import { ReplyPreview } from './ReplyPreview';
import { useChannelMembers } from '@/features/channels/hooks/useChannelMembers';
import { useAuthStore } from '@/app/store/useAuthStore';
import type { Message, Attachment } from '@teamhub/shared';

interface MessageComposerProps {
  channelId: string;
  replyingTo: Message | null;
  onCancelReply: () => void;
  workspaceId?: string;
  channelType?: 'public' | 'private' | 'dm';
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  channelId,
  replyingTo,
  onCancelReply,
  workspaceId,
  channelType,
}) => {
  const [content, setContent] = useState('');
  const [uploadedAttachments, setUploadedAttachments] = useState<Attachment[]>([]);
  
  // Mentions autocomplete state
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionIndex, setMentionIndex] = useState(-1); // index of @ in text
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState(0);

  const sendMessage = useSendMessage(channelId);
  const { registerKeyPress } = useTypingIndicator(channelId);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const currentUser = useAuthStore((state) => state.user);
  
  // Query channel members
  const { data: members } = useChannelMembers(workspaceId || '', channelId);

  // Hook for uploading attachments
  const { uploadAttachment, deleteAttachment, isUploading, uploadProgress } = useAttachments({
    target: 'message',
    targetId: channelId,
  });

  // Close mention list when channel changes
  useEffect(() => {
    setShowMentionSuggestions(false);
  }, [channelId]);

  // Compute autocomplete list
  const mentionSuggestions = useMemo(() => {
    if (!showMentionSuggestions) return [];
    
    const list = [];
    
    // Add @all option in group channels
    const isGroup = channelType !== 'dm';
    if (isGroup && ('all'.startsWith(mentionSearch) || mentionSearch === '')) {
      list.push({
        id: 'all',
        display_name: 'all',
        isAll: true,
        email: 'Notify everyone in this channel',
      });
    }
    
    // Add matching members (excluding self)
    const filteredMembers = (members || [])
      .map(m => m.user)
      .filter((u): u is typeof u & { id: string } => !!u && u.id !== currentUser?.id)
      .filter(u => {
        const name = (u.display_name || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        return name.includes(mentionSearch) || email.includes(mentionSearch);
      });
      
    list.push(...filteredMembers);
    return list.slice(0, 8);
  }, [showMentionSuggestions, mentionSearch, members, channelType, currentUser]);

  const handleSelectMention = (suggestion: any) => {
    const textBeforeAt = content.substring(0, mentionIndex);
    const textAfterAt = content.substring(inputRef.current?.selectionStart || content.length);
    
    const insertName = suggestion.isAll ? 'all' : (suggestion.display_name || suggestion.email);
    const newContent = `${textBeforeAt}@${insertName} ${textAfterAt}`;
    
    setContent(newContent);
    setShowMentionSuggestions(false);
    
    // Set focus back and place cursor after the inserted mention
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const cursorPosition = mentionIndex + insertName.length + 2; // +2 for @ and space
        inputRef.current.setSelectionRange(cursorPosition, cursorPosition);
      }
    }, 50);
  };

  const handleSend = () => {
    const trimmed = content.trim();
    if (!trimmed && uploadedAttachments.length === 0) return;

    setContent('');
    setUploadedAttachments([]);
    onCancelReply();
    inputRef.current?.focus();

    // Parse human-readable mentions to programmatic @<UUID> mentions
    let parsedContent = trimmed;
    const sortedMembers = [...(members || [])]
      .filter((m) => !!m.user)
      .sort((a, b) => {
        const lenA = (a.user!.display_name || a.user!.email).length;
        const lenB = (b.user!.display_name || b.user!.email).length;
        return lenB - lenA;
      });

    for (const member of sortedMembers) {
      const u = member.user!;
      if (u.display_name) {
        const escapedName = u.display_name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(`@${escapedName}\\b`, 'gi');
        parsedContent = parsedContent.replace(regex, `@${u.id}`);
      }
      const escapedEmail = u.email.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const emailRegex = new RegExp(`@${escapedEmail}\\b`, 'gi');
      parsedContent = parsedContent.replace(emailRegex, `@${u.id}`);
    }

    sendMessage.mutate(
      {
        content: parsedContent,
        parentMessageId: replyingTo?.id,
        parentMessage: replyingTo
          ? { id: replyingTo.id, content: replyingTo.content, sender: replyingTo.sender, attachments: replyingTo.attachments }
          : undefined,
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
    if (showMentionSuggestions && mentionSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveSuggestionIdx((prev) => (prev + 1) % mentionSuggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveSuggestionIdx((prev) => (prev - 1 + mentionSuggestions.length) % mentionSuggestions.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        handleSelectMention(mentionSuggestions[activeSuggestionIdx]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowMentionSuggestions(false);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setContent(value);
    registerKeyPress();
    
    // Check if we should trigger mentions suggestion list
    setTimeout(() => {
      if (!inputRef.current) return;
      const selectionStart = inputRef.current.selectionStart || 0;
      const textBeforeCursor = value.substring(0, selectionStart);
      const lastAtIdx = textBeforeCursor.lastIndexOf('@');
      
      if (lastAtIdx !== -1) {
        const textAfterAt = textBeforeCursor.substring(lastAtIdx + 1);
        const hasSpaceAfterAt = /\s/.test(textAfterAt);
        const charBeforeAt = lastAtIdx > 0 ? textBeforeCursor[lastAtIdx - 1] : ' ';
        const isValidTrigger = !hasSpaceAfterAt && (charBeforeAt === ' ' || charBeforeAt === '\n');
        
        if (isValidTrigger) {
          setShowMentionSuggestions(true);
          setMentionSearch(textAfterAt.toLowerCase());
          setMentionIndex(lastAtIdx);
          setActiveSuggestionIdx(0);
          return;
        }
      }
      setShowMentionSuggestions(false);
    }, 10);
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
    <div className="flex flex-col gap-2.5 w-full bg-[#1A1D21] border border-white/5 rounded-2xl p-3 shadow-xl relative">
      
      {/* Mention Suggestions Popover */}
      {showMentionSuggestions && mentionSuggestions.length > 0 && (
        <div className="absolute bottom-full left-0 mb-2 z-50 w-72 max-h-60 overflow-y-auto rounded-xl border border-white/10 bg-[#1A1D21] shadow-2xl p-1.5 flex flex-col gap-0.5">
          {mentionSuggestions.map((s, idx) => {
            const isActive = idx === activeSuggestionIdx;
            return (
              <button
                key={s.id}
                onClick={() => handleSelectMention(s)}
                onMouseEnter={() => setActiveSuggestionIdx(idx)}
                className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2.5 transition-colors ${
                  isActive ? 'bg-primary-accent text-slate-950 font-medium' : 'text-white/85 hover:bg-white/5'
                }`}
                type="button"
              >
                {s.isAll ? (
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center font-bold text-xs ${
                    isActive ? 'bg-slate-950/20 text-slate-950' : 'bg-primary-accent/20 text-primary-accent'
                  }`}>
                    @
                  </div>
                ) : s.avatar_url ? (
                  <img src={s.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover shrink-0" />
                ) : (
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center font-bold text-xs ${
                    isActive ? 'bg-slate-950/20 text-slate-950' : 'bg-primary-accent/20 text-primary-accent'
                  }`}>
                    {(s.display_name || s.email)?.[0]?.toUpperCase()}
                  </div>
                )}
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm truncate">
                    {s.isAll ? 'all' : (s.display_name || s.email)}
                  </span>
                  <span className={`text-[10px] truncate ${isActive ? 'text-slate-950/70' : 'text-white/50'}`}>
                    {s.isAll ? s.email : s.email}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

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

