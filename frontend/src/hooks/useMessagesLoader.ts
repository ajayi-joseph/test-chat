import { useEffect, useRef } from "react";
import useMessagesStore, { getConversationKey } from "../store/messages.store";

interface UseMessagesLoaderProps {
  userId: number;
  recipientId: number;
  baseUrl?: string;
}

export const useMessagesLoader = ({
  userId,
  recipientId,
  baseUrl = "http://localhost:3001",
}: UseMessagesLoaderProps) => {
  const loadingRef = useRef(false);

  useEffect(() => {
    if (!recipientId || recipientId === 0 || loadingRef.current) return;

    const conversationKey = getConversationKey(userId, recipientId);

    const loadMessages = async () => {
      loadingRef.current = true;

      // Get store actions
      const { setConversationMessages } = useMessagesStore.getState();

      try {
        const response = await fetch(
          `${baseUrl}/api/messages?userId=${userId}&recipientId=${recipientId}`
        );

        if (!response.ok) {
          throw new Error(`Failed to load messages: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        setConversationMessages(conversationKey, data.messages);
      } catch (error) {
        console.error("Failed to load messages:", error);
        setConversationMessages(conversationKey, []);
      } finally {
        loadingRef.current = false;
      }
    };

    loadMessages();
  }, [userId, recipientId]);
};
