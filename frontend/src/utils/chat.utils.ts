export const generateChatId = (userId1: number, userId2: number): string => {
  const sortedIds = [userId1, userId2].sort((a, b) => a - b);
  return `chat-${sortedIds[0]}-${sortedIds[1]}`;
};