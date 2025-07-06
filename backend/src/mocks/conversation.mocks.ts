import { Message } from "../types";

export function createMockConversation(
  user1: number,
  user2: number
): Omit<Message, "id">[] {
  return [
    {
      senderId: user2,
      recipientId: user1,
      content: "Hey! Did you also go to Oxford?",
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    },
    {
      senderId: user1,
      recipientId: user2,
      content: "Yes 😎 Are you going to the food festival on Sunday?",
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    },
    {
      senderId: user2,
      recipientId: user1,
      content: "I am! 😊 See you there for a coffee?",
      timestamp: new Date(Date.now() - 10 * 1000).toISOString(),
    },
  ];
}
