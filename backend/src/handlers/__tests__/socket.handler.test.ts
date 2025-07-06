import { Server } from "socket.io";
import { SocketHandler } from "../socket.handler";
import { MessageService } from "../../services/message.service";

// Mock socket.io
jest.mock("socket.io");

interface MockSocket {
  id: string;
  userId?: number;
  rooms: Set<string>;
  emit: jest.Mock;
  to: jest.Mock;
  join: jest.Mock;
  leave: jest.Mock;
  on: jest.Mock;
  removeAllListeners: jest.Mock;
}

interface Message {
  id: string;
  senderId: number;
  recipientId: number;
  content: string;
  timestamp: string;
}

describe("SocketHandler", () => {
  let mockIo: jest.Mocked<Server>;
  let mockSocket: MockSocket;
  let socketHandler: SocketHandler;
  let mockMessageService: jest.Mocked<MessageService>;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    // Suppress console.log during tests
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock IO server
    mockIo = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    } as any;

    // Create mock socket
    mockSocket = {
      id: "test-socket-id",
      rooms: new Set(),
      emit: jest.fn(),
      to: jest.fn().mockReturnThis(),
      join: jest.fn((room: string) => {
        mockSocket.rooms.add(room);
      }),
      leave: jest.fn((room: string) => {
        mockSocket.rooms.delete(room);
      }),
      on: jest.fn(),
      removeAllListeners: jest.fn(),
    };

    // Make socket.to return an object with emit method
    mockSocket.to.mockReturnValue({
      emit: jest.fn(),
    });

    // Create mock message service
    mockMessageService = {
      addMessage: jest.fn().mockImplementation((data) => ({
        id: "msg-" + Math.random().toString(36).substr(2, 9),
        ...data,
        timestamp: new Date().toISOString(),
      })),
    } as any;

    // Initialize socket handler
    socketHandler = new SocketHandler(mockIo, mockMessageService);
  });

  afterEach(() => {
    // Restore console.log
    consoleLogSpy.mockRestore();
  });

  describe("Connection handling", () => {
    test("should handle client connection", () => {
      socketHandler.handleConnection(mockSocket as any);
      
      // Verify event listeners were registered
      expect(mockSocket.on).toHaveBeenCalledWith("user:identify", expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith("conversation:join", expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith("conversation:leave", expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith("message:send", expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith("typing:start", expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith("typing:stop", expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith("disconnect", expect.any(Function));
    });

    test("should handle user identification", () => {
      socketHandler.handleConnection(mockSocket as any);
      
      // Get the callback for user:identify
      const identifyCallback = mockSocket.on.mock.calls.find(
        (call) => call[0] === "user:identify"
      )[1];

      const userId = 123;
      identifyCallback(userId);

      expect(mockSocket.userId).toBe(userId);
      expect(mockSocket.emit).toHaveBeenCalledWith("user:identified", {
        userId,
        socketId: mockSocket.id,
      });
    });
  });

  describe("Conversation management", () => {
    test("should join conversation room", () => {
      socketHandler.handleConnection(mockSocket as any);
      
      const joinCallback = mockSocket.on.mock.calls.find(
        (call) => call[0] === "conversation:join"
      )[1];

      const data = { userId: 1, recipientId: 2 };
      joinCallback(data);

      expect(mockSocket.join).toHaveBeenCalledWith("conversation_1_2");
      expect(mockSocket.to).toHaveBeenCalledWith("conversation_1_2");
      expect(mockSocket.to().emit).toHaveBeenCalledWith("user:joined", { userId: 1 });
    });

    test("should join room with consistent naming", () => {
      socketHandler.handleConnection(mockSocket as any);
      
      const joinCallback = mockSocket.on.mock.calls.find(
        (call) => call[0] === "conversation:join"
      )[1];

      // Test with reversed user IDs - should produce same room name
      const data1 = { userId: 2, recipientId: 1 };
      joinCallback(data1);

      expect(mockSocket.join).toHaveBeenCalledWith("conversation_1_2");
    });

    test("should leave conversation room", () => {
      socketHandler.handleConnection(mockSocket as any);
      
      const leaveCallback = mockSocket.on.mock.calls.find(
        (call) => call[0] === "conversation:leave"
      )[1];

      const data = { userId: 1, recipientId: 2 };
      leaveCallback(data);

      expect(mockSocket.leave).toHaveBeenCalledWith("conversation_1_2");
    });
  });

  describe("Message handling", () => {
    test("should send message to conversation room", () => {
      socketHandler.handleConnection(mockSocket as any);
      
      const sendCallback = mockSocket.on.mock.calls.find(
        (call) => call[0] === "message:send"
      )[1];

      const messageData = {
        senderId: 1,
        recipientId: 2,
        content: "Hello, World!",
      };

      const expectedMessage: Message = {
        id: "msg-123",
        ...messageData,
        timestamp: new Date().toISOString(),
      };

      mockMessageService.addMessage.mockReturnValueOnce(expectedMessage);

      sendCallback(messageData);

      expect(mockMessageService.addMessage).toHaveBeenCalledWith(messageData);
      expect(mockIo.to).toHaveBeenCalledWith("conversation_1_2");
      expect(mockIo.to("conversation_1_2").emit).toHaveBeenCalledWith(
        "message:new",
        expectedMessage
      );
    });
  });

  describe("Typing indicators", () => {
    let typingStartCallback: Function;
    let typingStopCallback: Function;

    beforeEach(() => {
      socketHandler.handleConnection(mockSocket as any);
      
      typingStartCallback = mockSocket.on.mock.calls.find(
        (call) => call[0] === "typing:start"
      )[1];
      
      typingStopCallback = mockSocket.on.mock.calls.find(
        (call) => call[0] === "typing:stop"
      )[1];
    });

    test("should broadcast typing start to room", () => {
      const typingData = {
        userId: 1,
        recipientId: 2,
        userName: "User 1",
      };

      typingStartCallback(typingData);

      expect(mockSocket.to).toHaveBeenCalledWith("conversation_1_2");
      expect(mockSocket.to().emit).toHaveBeenCalledWith("typing:start", typingData);
    });

    test("should broadcast typing stop to room", () => {
      const typingData = {
        userId: 1,
        recipientId: 2,
        userName: "User 1",
      };

      typingStopCallback(typingData);

      expect(mockSocket.to).toHaveBeenCalledWith("conversation_1_2");
      expect(mockSocket.to().emit).toHaveBeenCalledWith("typing:stop", {
        userId: 1,
        recipientId: 2,
      });
    });

    test("should auto-stop typing after timeout", () => {
      jest.useFakeTimers();

      const typingData = {
        userId: 1,
        recipientId: 2,
        userName: "User 1",
      };

      typingStartCallback(typingData);

      // Fast-forward time by 5 seconds
      jest.advanceTimersByTime(5000);

      expect(mockSocket.to).toHaveBeenCalledWith("conversation_1_2");
      expect(mockSocket.to().emit).toHaveBeenCalledWith("typing:stop", {
        userId: 1,
        recipientId: 2,
      });

      jest.useRealTimers();
    });

    test("should clear typing timeout on manual stop", () => {
      jest.useFakeTimers();

      const typingData = {
        userId: 1,
        recipientId: 2,
        userName: "User 1",
      };

      typingStartCallback(typingData);
      
      // Clear all mock calls after start
      mockSocket.to.mockClear();
      (mockSocket.to() as any).emit.mockClear();

      // Manually stop before timeout
      typingStopCallback(typingData);

      // Capture how many times emit was called for the manual stop
      const manualStopCalls = (mockSocket.to() as any).emit.mock.calls.length;

      // Fast-forward time past the timeout
      jest.advanceTimersByTime(5000);

      // Should still have same number of calls (no additional auto-stop)
      expect((mockSocket.to() as any).emit).toHaveBeenCalledTimes(manualStopCalls);

      jest.useRealTimers();
    });

    test("should handle multiple users typing in same room", () => {
      const user1Data = {
        userId: 1,
        recipientId: 2,
        userName: "User 1",
      };

      const user2Data = {
        userId: 3,
        recipientId: 2,
        userName: "User 3",
      };

      typingStartCallback(user1Data);
      typingStartCallback(user2Data);

      // Both should trigger broadcasts
      expect(mockSocket.to).toHaveBeenCalledWith("conversation_1_2");
      expect(mockSocket.to).toHaveBeenCalledWith("conversation_2_3");
    });
  });

  describe("Disconnection handling", () => {
    test("should clean up typing state on disconnect", () => {
      jest.useFakeTimers();

      socketHandler.handleConnection(mockSocket as any);
      
      // Set user ID
      mockSocket.userId = 1;

      const typingStartCallback = mockSocket.on.mock.calls.find(
        (call) => call[0] === "typing:start"
      )[1];
      
      const disconnectCallback = mockSocket.on.mock.calls.find(
        (call) => call[0] === "disconnect"
      )[1];

      // Start typing
      const typingData = {
        userId: 1,
        recipientId: 2,
        userName: "User 1",
      };
      typingStartCallback(typingData);

      // Clear previous calls
      mockSocket.to.mockClear();

      // Disconnect
      disconnectCallback();

      // Should emit typing stop
      expect(mockSocket.to).toHaveBeenCalledWith("conversation_1_2");
      expect(mockSocket.to().emit).toHaveBeenCalledWith("typing:stop", {
        userId: 1,
        recipientId: 0,
      });

      jest.useRealTimers();
    });

    test("should handle disconnect without typing", () => {
      socketHandler.handleConnection(mockSocket as any);
      
      const disconnectCallback = mockSocket.on.mock.calls.find(
        (call) => call[0] === "disconnect"
      )[1];

      // Disconnect without any typing activity
      expect(() => disconnectCallback()).not.toThrow();
    });
  });

  describe("Edge cases", () => {
    test("should handle typing stop without prior start", () => {
      socketHandler.handleConnection(mockSocket as any);
      
      const typingStopCallback = mockSocket.on.mock.calls.find(
        (call) => call[0] === "typing:stop"
      )[1];

      const typingData = {
        userId: 1,
        recipientId: 2,
        userName: "User 1",
      };

      // Should not throw
      expect(() => typingStopCallback(typingData)).not.toThrow();
    });

    test("should handle multiple typing starts from same user", () => {
      jest.useFakeTimers();

      socketHandler.handleConnection(mockSocket as any);
      
      const typingStartCallback = mockSocket.on.mock.calls.find(
        (call) => call[0] === "typing:start"
      )[1];

      const typingData = {
        userId: 1,
        recipientId: 2,
        userName: "User 1",
      };

      // Start typing twice
      typingStartCallback(typingData);
      jest.advanceTimersByTime(2000);
      
      // Clear previous mock calls before second typing start
      mockSocket.to.mockClear();
      (mockSocket.to() as any).emit.mockClear();
      
      typingStartCallback(typingData);

      // Clear emit calls after second start
      mockSocket.to.mockClear();
      (mockSocket.to() as any).emit.mockClear();

      // Advance past original timeout (3 more seconds to reach 5 seconds from first start)
      jest.advanceTimersByTime(3000);

      // Should not emit stop (timeout was reset by second start)
      expect((mockSocket.to() as any).emit).not.toHaveBeenCalled();

      // Advance to new timeout (2 more seconds to reach 5 seconds from second start)
      jest.advanceTimersByTime(2000);

      // Now should emit stop
      expect((mockSocket.to() as any).emit).toHaveBeenCalledWith("typing:stop", {
        userId: 1,
        recipientId: 2,
      });

      jest.useRealTimers();
    });
  });
});