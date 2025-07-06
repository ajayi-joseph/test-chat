import type { Message } from "../../../../../../types";

type MessageProps = {
  message: Message;
  isOwn: boolean;
  isGrouped: boolean;
  isSystemMessage?: boolean;
};

const MessageItem = ({ message, isOwn, isGrouped, isSystemMessage }: MessageProps) => {
  // Format time for individual messages
  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    }).toLowerCase();
  };

  // Special styling for "You matched" message
  if (isSystemMessage || message.content.includes("You matched")) {
    return (
      <div className="text-center my-6">
        <h4 className="text-gray-700 font-semibold ">
          {message.content.replace("❤️", "")} <span className="text-red-500">❤️</span>
        </h4>
      </div>
    );
  }

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} ${isGrouped ? "mt-0.5" : "mt-3"}`}>
      <div
        className={`
          max-w-[75%] px-4 py-3 rounded-2xl text-[15px]
          ${isOwn 
            ? "bg-[#FF4963] text-white rounded-tr-sm" 
            : "bg-gray-100 text-gray-800 rounded-tl-sm"
          }
        `}
      >
        <div>{message.content}</div>
        <div className={`text-[11px] mt-1 ${isOwn ? "text-white/70" : "text-gray-500"}`}>
          {formatMessageTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
};

export default MessageItem;