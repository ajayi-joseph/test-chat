import { create } from "zustand";
import type { Message } from "../types";

interface MessagesStore {
  // All conversations stored by key
  conversations: Record<string, Message[]>;

  // Actions
  setConversationMessages: (key: string, messages: Message[]) => void;
  addMessage: (message: Message) => void;
}

// Helper to get conversation key
export const getConversationKey = (userId1: number, userId2: number): string => {
  const [smaller, larger] =
    userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];
  return `conversation_${smaller}_${larger}`;
};

const useMessagesStore = create<MessagesStore>((set) => ({
  conversations: {},

  setConversationMessages: (key, messages) =>
    set((state) => ({
      conversations: {
        ...state.conversations,
        [key]: messages,
      },
    })),

  addMessage: (message) => {
    const key = getConversationKey(message.senderId, message.recipientId);
    set((state) => {
      const messages = state.conversations[key] || [];

      return {
        conversations: {
          ...state.conversations,
          [key]: [...messages, message],
        },
      };
    });
  },
}));

export default useMessagesStore;