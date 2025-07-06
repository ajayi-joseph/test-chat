import React from 'react';
import type { Message } from '../../../../../../types';
import { ChatFooter } from '../chat-footer/ChatFooter';
import { MessageList } from '../message-list/MessageList.';


interface ChatContainerProps {
  messages: Message[];
  currentUserId: number;
  recipientName?: string;
  typingUsers: Array<{ userId: number; userName: string }>;
  onSendMessage: (message: string) => void;
  onTypingChange: (isTyping: boolean) => void;
  disabled?: boolean;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({
  messages,
  currentUserId,
  recipientName,
  typingUsers,
  onSendMessage,
  onTypingChange,
  disabled,
}) => {
  return (
    <div className="flex flex-col h-full bg-white">
      <MessageList messages={messages} currentUserId={currentUserId} />
      
      <ChatFooter
        typingUsers={typingUsers}
        recipientName={recipientName}
        onSendMessage={onSendMessage}
        onTypingChange={onTypingChange}
        disabled={disabled}
      />
    </div>
  );
};