import type { Message, MessageGroup } from "../types";

const ONE_HOUR = 60 * 60 * 1000;
const TWENTY_SECONDS = 20 * 1000;

export const groupMessages = (messages: Message[]): MessageGroup[] => {
  if (messages.length === 0) return [];

  const sortedMessages = [...messages].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const groups: MessageGroup[] = [];
  let currentGroup: Message[] = [sortedMessages[0]];
  let showTimestamp = true;

  for (let i = 1; i < sortedMessages.length; i++) {
    const currentMsg = sortedMessages[i];
    const prevMsg = sortedMessages[i - 1];
    
    const currentTime = new Date(currentMsg.timestamp).getTime();
    const prevTime = new Date(prevMsg.timestamp).getTime();
    const timeDiff = currentTime - prevTime;

    // Check if we need a new group
    if (timeDiff > ONE_HOUR) {
      // Messages are more than an hour apart
      groups.push({ messages: currentGroup, showTimestamp });
      currentGroup = [currentMsg];
      showTimestamp = true;
    } else if (
      currentMsg.senderId === prevMsg.senderId &&
      timeDiff <= TWENTY_SECONDS &&
      currentMsg.senderId !== 0 // Don't group system messages
    ) {
      // Same sender within 20 seconds - add to current group
      currentGroup.push(currentMsg);
    } else {
      // Different sender or more than 20 seconds - new group
      groups.push({ messages: currentGroup, showTimestamp });
      currentGroup = [currentMsg];
      showTimestamp = false;
    }
  }

  // Add the last group
  if (currentGroup.length > 0) {
    groups.push({ messages: currentGroup, showTimestamp });
  }

  return groups;
};