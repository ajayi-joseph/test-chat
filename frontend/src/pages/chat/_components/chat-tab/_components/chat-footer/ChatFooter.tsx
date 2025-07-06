import React from 'react';
import { MessageInput } from '../message-input/MessageInput';
import { TypingIndicator } from '../typing-indicator/TypingIndicator';

interface TypingUser {
  userId: number;
  userName: string;
}

interface ChatFooterProps {
  typingUsers: TypingUser[];
  recipientName?: string;
  onSendMessage: (message: string) => void;
  onTypingChange: (isTyping: boolean) => void;
  disabled?: boolean;
}

export const ChatFooter: React.FC<ChatFooterProps> = ({
  typingUsers,
  recipientName,
  onSendMessage,
  onTypingChange,
  disabled,
}) => {
  return (
    <section className="flex-shrink-0">
      <TypingIndicator typingUsers={typingUsers} />
      <div className="p-4 pb-6 bg-white border-t border-gray-100">
        <MessageInput
          recipientName={recipientName}
          onSendMessage={onSendMessage}
          onTypingChange={onTypingChange}
          disabled={disabled}
        />
      </div>
    </section>
  );
};