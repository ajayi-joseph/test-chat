import { createMockConversation } from "../mocks/conversation.mocks";
import { CreateMessageDto, Message, MessageType } from "../types";
import { generateMessageId } from "../utils/idGenerator.utils";

export class MessageService {
  private conversations: Map<string, Message[]> = new Map();

  /**
   * Get normalized conversation key
   */
  private getConversationKey(userId1: number, userId2: number): string {
    const [smaller, larger] = userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];
    return `${smaller}_${larger}`;
  }

  /**
   * Get conversation between two users
   * @param userId1 - ID of the first user
   * @param userId2 - ID of the second user
   * @returns Array of messages between the two users
   */
  getConversation(userId1: number, userId2: number): Message[] {
    const key = this.getConversationKey(userId1, userId2);
    
    let messages = this.conversations.get(key);
    
    if (!messages || messages.length === 0) {
      // Add system message first
      messages = [{
        id: generateMessageId(),
        senderId: MessageType.SYSTEM,
        recipientId: 0,
        content: "You matched ❤️",
        timestamp: new Date("2020-01-07T20:18:00.000Z").toISOString(),
      }];
      
      // Add mock conversation
      const mockMessages = createMockConversation(userId1, userId2);
      mockMessages.forEach((msg) => {
        messages!.push({
          ...msg,
          id: generateMessageId(),
        });
      });
      
      // Store the conversation
      this.conversations.set(key, messages);
    }

    return messages;
  }

  /**
   * Add a new message to the conversation
   * @param messageDto - Message data without ID and timestamp
   * @returns The created message with generated ID and timestamp
   */
  addMessage(messageDto: CreateMessageDto): Message {
    const key = this.getConversationKey(messageDto.senderId, messageDto.recipientId);
    
    const newMessage: Message = {
      ...messageDto,
      id: generateMessageId(),
      timestamp: new Date().toISOString(),
    };

    const messages = this.conversations.get(key) || [];
    messages.push(newMessage);
    
    this.conversations.set(key, messages);
    
    return newMessage;
  }


}