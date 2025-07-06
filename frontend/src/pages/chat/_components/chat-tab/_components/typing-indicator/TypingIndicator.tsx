import React from "react";

interface TypingUser {
  userId: number;
  userName: string;
}

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
}

const TypingDots = () => (
  <div className="flex space-x-1 mr-2">
    {[0, 150, 300].map((delay) => (
      <span
        key={delay}
        className="inline-block w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
        style={{ animationDelay: `${delay}ms` }}
      />
    ))}
  </div>
);

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ typingUsers }) => {
  if (typingUsers.length === 0) return null;

  return (
    <div className="px-4 py-2">
      {typingUsers.map((user) => (
        <div
          key={user.userId}
          className="flex items-center text-sm text-gray-500 italic"
        >
          <TypingDots />
          {user.userName} is typing...
        </div>
      ))}
    </div>
  );
};