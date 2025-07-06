import { useEffect, useCallback, useState, useRef } from "react";
import { socketService } from "../services/socket.service";
import useMessagesStore from "../store/messages.store";
import useUserStore from "../store/user.store";
import type { Message } from "../types";

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const currentUser = useUserStore((state) => state.currentUser);
  const currentRecipient = useUserStore((state) => state.currentRecipient);
  const cleanupRef = useRef<(() => void)[]>([]);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    // Prevent double initialization in development
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    // Connect to socket with user identification
    socketService.connect("http://localhost:3001", currentUser.id);

    // Check connection status
    const checkConnection = setInterval(() => {
      const connected = socketService.isConnected();
      setIsConnected((prev) => {
        // Only update if changed to prevent unnecessary re-renders
        if (prev !== connected) {
          return connected;
        }
        return prev;
      });
    }, 1000);

    // Handle new messages
    const unsubscribeNewMessage = socketService.onNewMessage((message: any) => {
      // Messages will only be received for conversations we've joined
      const newMessage: Message = {
        id: typeof message.id === "string" ? message.id : message.id.toString(),
        senderId: message.senderId,
        recipientId: message.recipientId,
        content: message.content,
        timestamp: message.timestamp,
      };

      // Use getState to avoid stale closure
      useMessagesStore.getState().addMessage(newMessage);
    });

    cleanupRef.current.push(unsubscribeNewMessage);

    // Initial connection check
    const initialCheck = setTimeout(() => {
      setIsConnected(socketService.isConnected());
    }, 100);

    return () => {
      isInitializedRef.current = false;
      clearInterval(checkConnection);
      clearTimeout(initialCheck);
      cleanupRef.current.forEach((cleanup) => cleanup());
      cleanupRef.current = [];
    };
  }, []);

  // Join/leave conversation when recipient changes or connection status changes
  useEffect(() => {
    if (currentRecipient?.id && isConnected) {
      // Join the conversation room
      console.log(
        `Joining conversation: user ${currentUser.id} with recipient ${currentRecipient.id}`
      );
      socketService.joinConversation(currentUser.id, currentRecipient.id);

      // Cleanup: leave conversation when component unmounts or recipient changes
      return () => {
        if (socketService.isConnected()) {
          socketService.leaveConversation(currentUser.id, currentRecipient.id);
        }
      };
    }
  }, [currentUser.id, currentRecipient?.id, isConnected]);

  const sendMessage = useCallback(
    (data: { senderId: number; recipientId: number; content: string }) => {
      socketService.sendMessage(data.senderId, data.recipientId, data.content);
    },
    []
  );

  return {
    sendMessage,
    isConnected,
  };
};
