import React from 'react';
import { useTypingIndicator } from '../hooks/useTypingIndicator';

interface Props {
  channelId: string;
}

export const TypingIndicatorDisplay: React.FC<Props> = ({ channelId }) => {
  const { typingUsers } = useTypingIndicator(channelId);

  if (typingUsers.length === 0) return null;

  const text = typingUsers.length === 1 
    ? `${typingUsers[0]} is typing...`
    : typingUsers.length === 2 
      ? `${typingUsers[0]} and ${typingUsers[1]} are typing...`
      : 'Several people are typing...';

  return (
    <div className="text-xs text-text-muted absolute -top-6 left-4 animate-in fade-in z-10 font-medium">
      {text}
    </div>
  );
};
