import { useEffect, useRef } from "react";
import useMessagesStore, {
  getConversationKey,
} from "../../../../store/messages.store";
import useUserStore from "../../../../store/user.store";
import { useSocket } from "../../../../hooks/useSocket";
import { useTyping } from "../../../../hooks/useTyping";
import { useMessagesLoader } from "../../../../hooks/useMessagesLoader";
import { ChatContainer } from "./_components/chat-container/ChatContainer";
import { useChatActions } from "../../../../hooks/useChatAction";
import type { Message } from "../../../../types";


const ChatTab = () => {
const currentUser = useUserStore((state) => state.currentUser);
const currentRecipient = useUserStore((state) => state.currentRecipient);

const conversationKey = getConversationKey(currentUser.id, currentRecipient!.id);

const EMPTY_MESSAGES: Message[] = [];

// Get messages with stable fallback
const messages = useMessagesStore(
  (state) => state.conversations[conversationKey] || EMPTY_MESSAGES
);

  // Hooks
  const { sendMessage } = useSocket();
  
  const { typingUsers, startTyping, stopTyping } = useTyping(
    currentRecipient?.id
  );

  // Load messages when recipient changes
  useMessagesLoader({
    userId: currentUser.id,
    recipientId: currentRecipient?.id || 0,
  });

  // Chat actions
  const { handleSendMessage, handleTypingChange } = useChatActions({
    currentUser,
    currentRecipient: currentRecipient ?? undefined,
    sendMessage,
    startTyping,
    stopTyping,
  });

  // Store stopTyping ref to use in cleanup
  const stopTypingRef = useRef(stopTyping);
  stopTypingRef.current = stopTyping;

  // Clean up typing state when recipient changes
  useEffect(() => {
    return () => {
      stopTypingRef.current();
    };
  }, [currentRecipient?.id]);

  return (
    <ChatContainer
      messages={messages}
      currentUserId={currentUser.id}
      recipientName={currentRecipient?.name}
      typingUsers={typingUsers}
      onSendMessage={handleSendMessage}
      onTypingChange={handleTypingChange}
      disabled={!currentRecipient}
    />
  );
};

export default ChatTab;
