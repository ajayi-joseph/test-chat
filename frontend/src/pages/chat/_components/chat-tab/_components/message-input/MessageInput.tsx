import React, { useState, useCallback } from "react";

interface MessageInputProps {
  recipientName?: string;
  onSendMessage: (message: string) => void;
  onTypingChange: (isTyping: boolean) => void;
  disabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  recipientName = "",
  onSendMessage,
  onTypingChange,
  disabled = false,
}) => {
  const [message, setMessage] = useState("");

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setMessage(value);
      onTypingChange(value.trim().length > 0);
    },
    [onTypingChange]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!message.trim() || disabled) return;

      onSendMessage(message.trim());
      setMessage("");
      onTypingChange(false);
    },
    [message, onSendMessage, onTypingChange, disabled]
  );

  return (
    <form onSubmit={handleSubmit} className="relative">
      <input
        type="text"
        placeholder={`Message ${recipientName}`}
        className="w-full rounded-full border border-gray-200 px-5 py-3 pr-12 
                   focus:outline-none focus:border-gray-300 text-[15px]"
        value={message}
        onChange={handleInputChange}
        disabled={disabled}
      />
      <button
        type="submit"
         aria-label="Send message"
        className="absolute right-2 top-1/2 -translate-y-1/2 text-2xl"
        disabled={!message.trim() || disabled}
      >
        <span className={message.trim() ? "opacity-100" : "opacity-30"}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-6 w-6 ${
              message.trim() ? "text-[#FF4963]" : "text-gray-500"
            } transition-colors`}
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
          </svg>
        </span>
      </button>
    </form>
  );
};
