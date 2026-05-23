import { useEffect, useState, useRef, useCallback } from 'react';
import { getSocket } from '@/shared/services/socket';
import { useAuthStore } from '@/app/store/useAuthStore';
import { MessageEvents } from '@teamhub/shared';
import type { TypingEvent } from '@teamhub/shared';

export const useTypingIndicator = (channelId: string) => {
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({}); // userId -> displayName
  const currentUser = useAuthStore((state) => state.user);
  const timeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});
  const isCurrentlyTypingRef = useRef(false);
  const stopTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!channelId) return;

    const socket = getSocket();

    const handleUserTyping = (event: TypingEvent) => {
      // Ignore typing events from other channels or from the current user
      if (event.channelId !== channelId || event.userId === currentUser?.id) {
        return;
      }

      setTypingUsers((prev) => {
        const next = { ...prev };
        if (event.isTyping) {
          next[event.userId] = event.displayName;

          // Clear any existing timeout for this user
          if (timeoutsRef.current[event.userId]) {
            clearTimeout(timeoutsRef.current[event.userId]);
          }

          // Fallback timeout to clear typing state if the user stops typing or disconnects
          timeoutsRef.current[event.userId] = setTimeout(() => {
            setTypingUsers((current) => {
              const updated = { ...current };
              delete updated[event.userId];
              return updated;
            });
          }, 5000);
        } else {
          if (timeoutsRef.current[event.userId]) {
            clearTimeout(timeoutsRef.current[event.userId]);
            delete timeoutsRef.current[event.userId];
          }
          delete next[event.userId];
        }
        return next;
      });
    };

    socket.on(MessageEvents.USER_TYPING, handleUserTyping);

    return () => {
      socket.off(MessageEvents.USER_TYPING, handleUserTyping);
      Object.values(timeoutsRef.current).forEach(clearTimeout);
      timeoutsRef.current = {};
      setTypingUsers({});
    };
  }, [channelId, currentUser?.id]);

  const emitTyping = useCallback(
    (isTyping: boolean) => {
      if (!channelId || !currentUser) return;

      const socket = getSocket();
      socket.emit(MessageEvents.USER_TYPING, {
        channelId,
        isTyping,
        displayName: currentUser.display_name,
      });
      isCurrentlyTypingRef.current = isTyping;
    },
    [channelId, currentUser]
  );

  const registerKeyPress = useCallback(() => {
    if (!isCurrentlyTypingRef.current) {
      emitTyping(true);
    }

    if (stopTypingTimeoutRef.current) {
      clearTimeout(stopTypingTimeoutRef.current);
    }

    stopTypingTimeoutRef.current = setTimeout(() => {
      emitTyping(false);
    }, 2500);
  }, [emitTyping]);

  useEffect(() => {
    return () => {
      if (stopTypingTimeoutRef.current) {
        clearTimeout(stopTypingTimeoutRef.current);
      }
    };
  }, []);

  return {
    typingUsers: Object.values(typingUsers),
    registerKeyPress,
  };
};
