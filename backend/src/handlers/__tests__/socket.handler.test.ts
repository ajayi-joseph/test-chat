import { SocketHandler } from "../socket.handler";
import { MessageService } from "../../services/message.service";
import { Server, Socket } from "socket.io";

describe("SocketHandler", () => {
  let socketHandler: SocketHandler;
  let mockIo: any;
  let mockSocket: any;
  let messageService: MessageService;

  beforeEach(() => {
    // Create mock IO server
    mockIo = {
      emit: jest.fn(),
    };

    // Create mock socket
    mockSocket = {
      id: "test-socket-id",
      on: jest.fn(),
      broadcast: {
        emit: jest.fn(),
      },
    };

    messageService = new MessageService();
    socketHandler = new SocketHandler(mockIo as Server, messageService);
  });

  describe("handleConnection", () => {
    it("should register all event handlers", () => {
      socketHandler.handleConnection(mockSocket as Socket);

      expect(mockSocket.on).toHaveBeenCalledWith(
        "message:send",
        expect.any(Function)
      );
      expect(mockSocket.on).toHaveBeenCalledWith(
        "typing:start",
        expect.any(Function)
      );
      expect(mockSocket.on).toHaveBeenCalledWith(
        "typing:stop",
        expect.any(Function)
      );
      expect(mockSocket.on).toHaveBeenCalledWith(
        "disconnect",
        expect.any(Function)
      );
      expect(mockSocket.on).toHaveBeenCalledTimes(4);
    });
  });

  describe("message:send event", () => {
    it("should add message and broadcast to all clients", () => {
      const messageData = {
        senderId: 1,
        recipientId: 2,
        content: "Hello World",
      };

      // Setup
      socketHandler.handleConnection(mockSocket);
      const messageHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === "message:send"
      )[1];

      // Execute
      messageHandler(messageData);

      // Verify
      expect(mockIo.emit).toHaveBeenCalledWith(
        "message:new",
        expect.objectContaining({
          senderId: messageData.senderId,
          recipientId: messageData.recipientId,
          content: messageData.content,
          id: expect.stringMatching(/^msg_\d+_[a-z0-9]+$/),
          timestamp: expect.any(String),
        })
      );
    });
  });

  describe("typing:start event", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should broadcast typing start to other clients", () => {
      const typingData = {
        userId: 1,
        recipientId: 2,
        userName: "John",
      };

      socketHandler.handleConnection(mockSocket);
      const typingHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === "typing:start"
      )[1];

      typingHandler(typingData);

      expect(mockSocket.broadcast.emit).toHaveBeenCalledWith(
        "typing:start",
        typingData
      );
    });

    it("should auto-stop typing after 5 seconds", () => {
      const typingData = {
        userId: 1,
        recipientId: 2,
        userName: "John",
      };

      socketHandler.handleConnection(mockSocket);
      const typingHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === "typing:start"
      )[1];

      // Start typing
      typingHandler(typingData);

      // Verify typing started
      expect(mockSocket.broadcast.emit).toHaveBeenCalledWith(
        "typing:start",
        typingData
      );

      // Fast-forward 5 seconds
      jest.advanceTimersByTime(5000);

      // Verify typing stopped automatically
      expect(mockSocket.broadcast.emit).toHaveBeenCalledWith("typing:stop", {
        userId: typingData.userId,
        recipientId: typingData.recipientId,
      });
    });

    it("should reset timer when user types again", () => {
      const typingData = {
        userId: 1,
        recipientId: 2,
        userName: "John",
      };

      socketHandler.handleConnection(mockSocket);
      const typingHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === "typing:start"
      )[1];

      // First typing
      typingHandler(typingData);

      // Wait 3 seconds
      jest.advanceTimersByTime(3000);

      // Type again (should reset timer)
      typingHandler(typingData);

      // Wait another 2 seconds (total 5 from second typing start)
      jest.advanceTimersByTime(2000);

      // Should have 2 typing:start events but no typing:stop yet
      let typingStartCalls = mockSocket.broadcast.emit.mock.calls.filter(
        (call: any) => call[0] === "typing:start"
      );
      let typingStopCalls = mockSocket.broadcast.emit.mock.calls.filter(
        (call: any) => call[0] === "typing:stop"
      );

      expect(typingStartCalls).toHaveLength(2);
      expect(typingStopCalls).toHaveLength(0);

      // Wait the final 3 seconds to complete the 5 second timeout from the second typing
      jest.advanceTimersByTime(3000);

      // Now we should have the typing:stop event
      typingStopCalls = mockSocket.broadcast.emit.mock.calls.filter(
        (call: any) => call[0] === "typing:stop"
      );

      expect(typingStopCalls).toHaveLength(1);
    });
  });

  describe("typing:stop event", () => {
    it("should broadcast typing stop to other clients", () => {
      const typingData = {
        userId: 1,
        recipientId: 2,
        userName: "John",
      };

      socketHandler.handleConnection(mockSocket);
      const stopHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === "typing:stop"
      )[1];

      stopHandler(typingData);

      expect(mockSocket.broadcast.emit).toHaveBeenCalledWith("typing:stop", {
        userId: typingData.userId,
        recipientId: typingData.recipientId,
      });
    });

    it("should clear timeout when user manually stops typing", () => {
      jest.useFakeTimers();

      const typingData = {
        userId: 1,
        recipientId: 2,
        userName: "John",
      };

      socketHandler.handleConnection(mockSocket);
      const startHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === "typing:start"
      )[1];
      const stopHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === "typing:stop"
      )[1];

      // Start typing
      startHandler(typingData);

      // Manually stop after 2 seconds
      jest.advanceTimersByTime(2000);
      stopHandler(typingData);

      // Wait another 5 seconds
      jest.advanceTimersByTime(5000);

      // Should only have one stop event (the manual one)
      const stopCalls = mockSocket.broadcast.emit.mock.calls.filter(
        (call: any) => call[0] === "typing:stop"
      );

      expect(stopCalls).toHaveLength(1);

      jest.useRealTimers();
    });
  });

  describe("disconnect event", () => {
    it("should log disconnection", () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      socketHandler.handleConnection(mockSocket);
      const disconnectHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === "disconnect"
      )[1];

      disconnectHandler();

      expect(consoleSpy).toHaveBeenCalledWith(
        "Client disconnected:",
        "test-socket-id"
      );

      consoleSpy.mockRestore();
    });
  });
});
