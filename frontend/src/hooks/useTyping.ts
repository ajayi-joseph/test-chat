import { useEffect, useState, useCallback, useRef } from "react";
import { socketService } from "../services/socket.service";
import useUserStore from "../store/user.store";

interface TypingUser {
  userId: number;
  userName: string;
}

export const useTyping = (recipientId?: number) => {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const currentUser = useUserStore((state) => state.currentUser);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  const isTypingRef = useRef(false);

  useEffect(() => {
    if (!recipientId) return;

    const handleTypingStart = (data: {
      userId: number;
      recipientId: number;
      userName: string;
    }) => {
      // Only process typing events for the current conversation
      // and don't show our own typing status
      if (data.userId !== currentUser.id) {
        setTypingUsers((prev) => {
          // Check if user already exists
          const exists = prev.some((user) => user.userId === data.userId);
          if (exists) {
            return prev.map((user) =>
              user.userId === data.userId
                ? { userId: data.userId, userName: data.userName }
                : user
            );
          }
          return [...prev, { userId: data.userId, userName: data.userName }];
        });
      }
    };

    const handleTypingStop = (data: {
      userId: number;
      recipientId: number;
    }) => {
      if (data.userId !== currentUser.id) {
        setTypingUsers((prev) =>
          prev.filter((user) => user.userId !== data.userId)
        );
      }
    };

    const unsubscribeStart = socketService.onTypingStart(handleTypingStart);
    const unsubscribeStop = socketService.onTypingStop(handleTypingStop);

    return () => {
      unsubscribeStart();
      unsubscribeStop();
      // Clear typing users when changing conversations
      setTypingUsers([]);
    };
  }, [currentUser.id, recipientId]);

  const startTyping = useCallback(() => {
    if (!recipientId || isTypingRef.current) return;

    isTypingRef.current = true;
    socketService.startTyping(currentUser.id, recipientId, currentUser.name);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Auto-stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  }, [currentUser.id, currentUser.name, recipientId]);

  const stopTyping = useCallback(() => {
    if (!recipientId || !isTypingRef.current) return;

    isTypingRef.current = false;
    socketService.stopTyping(currentUser.id, recipientId);

    // Clear timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = undefined;
    }
  }, [currentUser.id, recipientId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      // Don't call stopTyping here as it causes issues with deps
    };
  }, []);

  useEffect(() => {
    // Reset typing state when recipient changes
    isTypingRef.current = false;
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = undefined;
    }
  }, [recipientId]);

  return {
    typingUsers,
    startTyping,
    stopTyping,
    isAnyoneTyping: typingUsers.length > 0,
  };
};
