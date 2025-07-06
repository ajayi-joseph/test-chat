import { MessageService } from "../message.service";
import { CreateMessageDto, Message, MessageType } from "../../types";
import { generateMessageId } from "../../utils/idGenerator.utils";
import { createMockConversation } from "../../mocks/conversation.mocks";

// Mock the dependencies
jest.mock("../../utils/idGenerator.utils");
jest.mock("../../mocks/conversation.mocks");

describe("MessageService", () => {
  let messageService: MessageService;
  let mockGenerateMessageId: jest.MockedFunction<typeof generateMessageId>;
  let mockCreateMockConversation: jest.MockedFunction<typeof createMockConversation>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Setup mocks
    mockGenerateMessageId = generateMessageId as jest.MockedFunction<typeof generateMessageId>;
    mockCreateMockConversation = createMockConversation as jest.MockedFunction<typeof createMockConversation>;

    // Mock ID generator to return predictable IDs
    let idCounter = 0;
    mockGenerateMessageId.mockImplementation(() => `msg-${++idCounter}`);

    // Mock conversation creator
    mockCreateMockConversation.mockImplementation((userId1: number, userId2: number) => [
      {
        senderId: userId1,
        recipientId: userId2,
        content: "Hey! How are you?",
        timestamp: new Date("2020-01-07T20:20:00.000Z").toISOString(),
      },
      {
        senderId: userId2,
        recipientId: userId1,
        content: "I'm good, thanks! You?",
        timestamp: new Date("2020-01-07T20:21:00.000Z").toISOString(),
      },
    ]);

    // Create new service instance
    messageService = new MessageService();
  });

  describe("getConversation", () => {
    test("should return conversation with system message and mock messages on first call", () => {
      const userId1 = 1;
      const userId2 = 2;

      const messages = messageService.getConversation(userId1, userId2);

      // Should have system message + 2 mock messages
      expect(messages).toHaveLength(3);

      // Check system message
      expect(messages[0]).toEqual({
        id: "msg-1",
        senderId: MessageType.SYSTEM,
        recipientId: 0,
        content: "You matched ❤️",
        timestamp: new Date("2020-01-07T20:18:00.000Z").toISOString(),
      });

      // Check mock messages
      expect(messages[1]).toMatchObject({
        id: "msg-2",
        senderId: userId1,
        recipientId: userId2,
        content: "Hey! How are you?",
      });

      expect(messages[2]).toMatchObject({
        id: "msg-3",
        senderId: userId2,
        recipientId: userId1,
        content: "I'm good, thanks! You?",
      });

      // Verify mocks were called
      expect(mockCreateMockConversation).toHaveBeenCalledWith(userId1, userId2);
      expect(mockGenerateMessageId).toHaveBeenCalledTimes(3);
    });

    test("should return same conversation on subsequent calls", () => {
      const userId1 = 1;
      const userId2 = 2;

      const firstCall = messageService.getConversation(userId1, userId2);
      const secondCall = messageService.getConversation(userId1, userId2);

      expect(firstCall).toBe(secondCall); // Same reference
      expect(mockCreateMockConversation).toHaveBeenCalledTimes(1); // Only called once
    });

    test("should handle reversed user IDs correctly", () => {
      const userId1 = 1;
      const userId2 = 2;

      const conversation1 = messageService.getConversation(userId1, userId2);
      const conversation2 = messageService.getConversation(userId2, userId1);

      expect(conversation1).toBe(conversation2); // Same conversation
      expect(mockCreateMockConversation).toHaveBeenCalledTimes(1);
    });

    test("should create separate conversations for different user pairs", () => {
      const conversation1 = messageService.getConversation(1, 2);
      const conversation2 = messageService.getConversation(3, 4);

      expect(conversation1).not.toBe(conversation2);
      expect(mockCreateMockConversation).toHaveBeenCalledTimes(2);
      expect(mockCreateMockConversation).toHaveBeenCalledWith(1, 2);
      expect(mockCreateMockConversation).toHaveBeenCalledWith(3, 4);
    });
  });

  describe("addMessage", () => {
    test("should add message to existing conversation", () => {
      const userId1 = 1;
      const userId2 = 2;

      // Initialize conversation
      const initialMessages = messageService.getConversation(userId1, userId2);
      const initialLength = initialMessages.length;

      // Add new message
      const messageDto: CreateMessageDto = {
        senderId: userId1,
        recipientId: userId2,
        content: "New message!",
      };

      const newMessage = messageService.addMessage(messageDto);

      // Check returned message
      expect(newMessage).toMatchObject({
        id: expect.stringMatching(/^msg-\d+$/),
        senderId: userId1,
        recipientId: userId2,
        content: "New message!",
        timestamp: expect.any(String),
      });

      // Verify message was added to conversation
      const updatedMessages = messageService.getConversation(userId1, userId2);
      expect(updatedMessages).toHaveLength(initialLength + 1);
      expect(updatedMessages[updatedMessages.length - 1]).toEqual(newMessage);
    });

    test("should create new conversation if it doesn't exist", () => {
      const messageDto: CreateMessageDto = {
        senderId: 5,
        recipientId: 6,
        content: "First message!",
      };

      // Add message to non-existent conversation
      const newMessage = messageService.addMessage(messageDto);

      // Get conversation
      const messages = messageService.getConversation(5, 6);

      // Should only have the new message (no system message or mocks)
      expect(messages).toHaveLength(1);
      expect(messages[0]).toEqual(newMessage);
    });

    test("should work with reversed user IDs", () => {
      const userId1 = 1;
      const userId2 = 2;

      // Initialize conversation
      messageService.getConversation(userId1, userId2);

      // Add message with reversed IDs
      const messageDto: CreateMessageDto = {
        senderId: userId2,
        recipientId: userId1,
        content: "Reply message!",
      };

      const newMessage = messageService.addMessage(messageDto);

      // Should be added to same conversation
      const messages = messageService.getConversation(userId1, userId2);
      expect(messages[messages.length - 1]).toEqual(newMessage);
    });

    test("should generate unique IDs for each message", () => {
      const messageDto1: CreateMessageDto = {
        senderId: 1,
        recipientId: 2,
        content: "Message 1",
      };

      const messageDto2: CreateMessageDto = {
        senderId: 1,
        recipientId: 2,
        content: "Message 2",
      };

      const message1 = messageService.addMessage(messageDto1);
      const message2 = messageService.addMessage(messageDto2);

      expect(message1.id).not.toEqual(message2.id);
      expect(mockGenerateMessageId).toHaveBeenCalledTimes(2);
    });

    test("should add timestamp to message", () => {
      const now = new Date("2024-01-01T12:00:00.000Z");
      jest.useFakeTimers();
      jest.setSystemTime(now);

      const messageDto: CreateMessageDto = {
        senderId: 1,
        recipientId: 2,
        content: "Test message",
      };

      const message = messageService.addMessage(messageDto);

      expect(message.timestamp).toEqual(now.toISOString());

      jest.useRealTimers();
    });
  });

});