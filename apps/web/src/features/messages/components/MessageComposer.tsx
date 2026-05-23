import React, { useState } from 'react';
import { Button } from '@/shared/components/Button';
import { Send } from 'lucide-react';
import { useSendMessage } from '../hooks/useMessages';
import { useTypingIndicator } from '../hooks/useTypingIndicator';
import { toast } from 'sonner';

interface Props {
  channelId: string;
}

export const MessageComposer: React.FC<Props> = ({ channelId }) => {
  const [content, setContent] = useState('');
  const sendMessage = useSendMessage(channelId);
  const { registerKeyPress } = useTypingIndicator(channelId);

  const handleSend = () => {
    if (!content.trim()) return;
    
    sendMessage.mutate(
      { content: content.trim() },
      {
        onSuccess: () => setContent(''),
        onError: (err) => toast.error(err.message || 'Failed to send message'),
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

  return (
    <div className="relative">
      <input
        type="text"
        value={content}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={sendMessage.isPending && !content}
        placeholder="Type a message..."
        className="w-full bg-surface-secondary border border-white/10 rounded-xl pl-4 pr-24 py-3 text-text-primary outline-none focus:border-primary-accent/50 focus:bg-surface-elevated transition-colors"
      />
      <div className="absolute right-2 top-2">
        <Button 
          size="sm" 
          onClick={handleSend}
          disabled={!content.trim()} 
          className="flex items-center gap-2 px-3 py-1.5 h-auto"
        >
          <Send className="h-4 w-4" />
          <span className="sr-only sm:not-sr-only sm:inline-block">Send</span>
        </Button>
      </div>
    </div>
  );
};
