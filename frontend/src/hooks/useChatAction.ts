import { useCallback, useRef } from "react";

interface User {
  id: number;
  name: string;
}

interface UseChatActionsProps {
  currentUser: User;
  currentRecipient?: User;
  sendMessage: (data: {
    senderId: number;
    recipientId: number;
    content: string;
  }) => void;
  startTyping: () => void;
  stopTyping: () => void;
}

export const useChatActions = ({
  currentUser,
  currentRecipient,
  sendMessage,
  startTyping,
  stopTyping,
}: UseChatActionsProps) => {
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastTypingRef = useRef<number>(0);

  const handleSendMessage = useCallback((content: string) => {
    // Just some edge case checks :)
    if (!currentRecipient || !content.trim()) return;

    sendMessage({
      senderId: currentUser.id,
      recipientId: currentRecipient.id,
      content: content.trim(),
    });

    // Stop typing when message is sent
    stopTyping();
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }, [currentUser.id, currentRecipient, sendMessage, stopTyping]);

  const handleTypingChange = useCallback((isTyping: boolean) => {
    const now = Date.now();
    
    if (isTyping) {
      // Throttle typing events (only send if 500ms have passed)
      if (now - lastTypingRef.current > 500) {
        startTyping();
        lastTypingRef.current = now;
      }

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set timeout to stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping();
      }, 2000);
    } else {
      // Explicitly stopped typing
      stopTyping();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  }, [startTyping, stopTyping]);

  return {
    handleSendMessage,
    handleTypingChange,
  };
};