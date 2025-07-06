import { useMemo, useRef, useEffect } from "react";
import MessageItem from "../message-item/MessageItem";
import type { Message } from "../../../../../../types";
import { formatTimestamp } from "../../../../../../utils/date.utils";
import { groupMessages } from "../../../../../../utils/messageGrouping.utils";

interface MessageListProps {
  messages: Message[];
  currentUserId: number;
  onScrollToBottom?: () => void;
}

export const MessageList = ({ messages, currentUserId, onScrollToBottom }: MessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Group messages according to requirements
  const groupedMessages = useMemo(() => {
    return groupMessages(messages);
  }, [messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    onScrollToBottom?.();
  }, [messages, onScrollToBottom]);

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {groupedMessages.map((group, groupIndex) => (
        <div key={groupIndex}>
          {/* Timestamp header */}
          {group.showTimestamp && (
            <div className="text-center my-4">
              <span className="text-xs text-gray-400 font-medium">
                {formatTimestamp(new Date(group.messages[0].timestamp))}
              </span>
            </div>
          )}

          {/* Messages in group */}
          {group.messages.map((message, messageIndex) => (
            <MessageItem
              key={message.id}
              message={message}
              isOwn={message.senderId === currentUserId}
              isGrouped={messageIndex > 0}
              isSystemMessage={message.senderId === 0}
            />
          ))}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};