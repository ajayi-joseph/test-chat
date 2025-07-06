import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { io, Socket } from 'socket.io-client';
import { socketService } from './socket.service';

// Mock socket.io-client
vi.mock('socket.io-client', () => ({
  io: vi.fn(),
}));

describe('SocketService', () => {
  let mockSocket: any;

  beforeEach(() => {
    // Create mock socket
    mockSocket = {
      connected: false,
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
      connect: vi.fn(),
      disconnect: vi.fn(),
      id: 'mock-socket-id',
    };

    // Mock io to return our mock socket
    vi.mocked(io).mockReturnValue(mockSocket as Socket);
    
    // Reset service state
    (socketService as any).socket = null;
    (socketService as any).currentUserId = null;
    (socketService as any).joinedConversations.clear();
    (socketService as any).isConnecting = false;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('connect', () => {
    it('should create new socket connection', () => {
      const socket = socketService.connect('http://localhost:3001', 123);

      expect(io).toHaveBeenCalledWith('http://localhost:3001', {
        transports: ['websocket', 'polling'],
        auth: {},
      });
      expect(socket).toBe(mockSocket);
    });

    it('should not create new connection if already connected', () => {
      mockSocket.connected = true;
      (socketService as any).socket = mockSocket;

      const socket = socketService.connect('http://localhost:3001', 123);

      expect(io).not.toHaveBeenCalled();
      expect(socket).toBe(mockSocket);
    });

    it('should set currentUserId when userId provided', () => {
      socketService.connect('http://localhost:3001', 123);
      
      expect((socketService as any).currentUserId).toBe(123);
    });

    it('should identify user on connection when userId provided', () => {
      socketService.connect('http://localhost:3001', 123);

      // Get all connect handlers
      const connectHandlers = mockSocket.on.mock.calls
        .filter(call => call[0] === 'connect')
        .map(call => call[1]);

      // Simulate connection
      mockSocket.connected = true;
      connectHandlers.forEach(handler => handler?.());

      // Should be called once from the main connect handler
      // and once from the userId-specific handler
      expect(mockSocket.emit).toHaveBeenCalledWith('user:identify', 123);
      expect(mockSocket.emit).toHaveBeenCalledTimes(1);
    });
  });

  describe('disconnect', () => {
    it('should disconnect socket and clear state', () => {
      // Setup connected socket
      (socketService as any).socket = mockSocket;
      (socketService as any).currentUserId = 123;
      (socketService as any).joinedConversations.add('conversation_1_2');

      socketService.disconnect();

      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect((socketService as any).socket).toBeNull();
      expect((socketService as any).currentUserId).toBeNull();
      expect((socketService as any).joinedConversations.size).toBe(0);
    });
  });

  describe('identify', () => {
    it('should emit user:identify event', () => {
      (socketService as any).socket = mockSocket;

      socketService.identify(123);

      expect((socketService as any).currentUserId).toBe(123);
      expect(mockSocket.emit).toHaveBeenCalledWith('user:identify', 123);
    });
  });

  describe('conversation methods', () => {
    beforeEach(() => {
      (socketService as any).socket = mockSocket;
      mockSocket.connected = true;
    });

    it('should join conversation', () => {
      socketService.joinConversation(1, 2);

      expect(mockSocket.emit).toHaveBeenCalledWith('conversation:join', {
        userId: 1,
        recipientId: 2,
      });
      expect((socketService as any).joinedConversations.has('1_2')).toBe(true);
    });

    it('should not join same conversation twice', () => {
      socketService.joinConversation(1, 2);
      mockSocket.emit.mockClear();
      
      socketService.joinConversation(1, 2);

      expect(mockSocket.emit).not.toHaveBeenCalled();
    });

    it('should leave conversation', () => {
      (socketService as any).joinedConversations.add('1_2');

      socketService.leaveConversation(1, 2);

      expect(mockSocket.emit).toHaveBeenCalledWith('conversation:leave', {
        userId: 1,
        recipientId: 2,
      });
      expect((socketService as any).joinedConversations.has('1_2')).toBe(false);
    });
  });

  describe('message methods', () => {
    beforeEach(() => {
      (socketService as any).socket = mockSocket;
      mockSocket.connected = true;
    });

    it('should send message', () => {
      socketService.sendMessage(1, 2, 'Hello');

      expect(mockSocket.emit).toHaveBeenCalledWith('message:send', {
        senderId: 1,
        recipientId: 2,
        content: 'Hello',
      });
    });

    it('should not send message if not connected', () => {
      mockSocket.connected = false;
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      socketService.sendMessage(1, 2, 'Hello');

      expect(mockSocket.emit).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Socket not connected');

      consoleSpy.mockRestore();
    });
  });

  describe('typing methods', () => {
    beforeEach(() => {
      (socketService as any).socket = mockSocket;
      mockSocket.connected = true;
    });

    it('should start typing', () => {
      socketService.startTyping(1, 2, 'John');

      expect(mockSocket.emit).toHaveBeenCalledWith('typing:start', {
        userId: 1,
        recipientId: 2,
        userName: 'John',
      });
    });

    it('should stop typing', () => {
      socketService.stopTyping(1, 2);

      expect(mockSocket.emit).toHaveBeenCalledWith('typing:stop', {
        userId: 1,
        recipientId: 2,
      });
    });

    it('should register typing start listener and return unsubscribe function', () => {
      const callback = vi.fn();
      
      const unsubscribe = socketService.onTypingStart(callback);

      expect(mockSocket.on).toHaveBeenCalledWith('typing:start', callback);
      expect(typeof unsubscribe).toBe('function');
      
      // Test unsubscribe
      unsubscribe();
      expect(mockSocket.off).toHaveBeenCalledWith('typing:start', callback);
    });

    it('should register typing stop listener and return unsubscribe function', () => {
      const callback = vi.fn();
      
      const unsubscribe = socketService.onTypingStop(callback);

      expect(mockSocket.on).toHaveBeenCalledWith('typing:stop', callback);
      expect(typeof unsubscribe).toBe('function');
      
      // Test unsubscribe
      unsubscribe();
      expect(mockSocket.off).toHaveBeenCalledWith('typing:stop', callback);
    });
  });

  describe('onNewMessage', () => {
    it('should register message listener and return unsubscribe function', () => {
      (socketService as any).socket = mockSocket;
      const callback = vi.fn();
      
      const unsubscribe = socketService.onNewMessage(callback);

      expect(mockSocket.on).toHaveBeenCalledWith('message:new', callback);
      expect(typeof unsubscribe).toBe('function');
      
      // Test unsubscribe
      unsubscribe();
      expect(mockSocket.off).toHaveBeenCalledWith('message:new', callback);
    });

    it('should not register listener if no socket', () => {
      const callback = vi.fn();
      
      const unsubscribe = socketService.onNewMessage(callback);

      expect(mockSocket.on).not.toHaveBeenCalled();
      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('isConnected', () => {
    it('should return connection status', () => {
      expect(socketService.isConnected()).toBe(false);

      (socketService as any).socket = mockSocket;
      mockSocket.connected = true;

      expect(socketService.isConnected()).toBe(true);
    });
  });

  describe('reconnection', () => {
    it('should rejoin conversations on reconnect', () => {
      // Connect without userId first
      socketService.connect('http://localhost:3001');
      
      // Set up the state as if we're already connected
      mockSocket.connected = true;
      (socketService as any).currentUserId = 123;
      (socketService as any).joinedConversations.add('1_2');
      (socketService as any).joinedConversations.add('3_4');

      // Get the main connect handler (first one registered)
      const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')?.[1];
      expect(connectHandler).toBeDefined();
      
      // Clear previous emit calls
      mockSocket.emit.mockClear();
      
      // Simulate reconnection by calling the connect handler
      connectHandler?.();

      // Should re-identify and rejoin conversations
      expect(mockSocket.emit).toHaveBeenCalledWith('user:identify', 123);
      expect(mockSocket.emit).toHaveBeenCalledWith('conversation:join', {
        userId: 1,
        recipientId: 2,
      });
      expect(mockSocket.emit).toHaveBeenCalledWith('conversation:join', {
        userId: 3,
        recipientId: 4,
      });
    });

    it('should handle disconnect event', () => {
      socketService.connect('http://localhost:3001');
      
      const disconnectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect')?.[1];
      const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      disconnectHandler?.();
      
      expect(consoleLog).toHaveBeenCalledWith('Socket disconnected');
      expect((socketService as any).isConnecting).toBe(false);
      
      consoleLog.mockRestore();
    });

    it('should handle connection error', () => {
      socketService.connect('http://localhost:3001');
      
      const errorHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect_error')?.[1];
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Connection failed');
      
      errorHandler?.(error);
      
      expect(consoleError).toHaveBeenCalledWith('Socket connection error:', error);
      expect((socketService as any).isConnecting).toBe(false);
      
      consoleError.mockRestore();
    });
  });
});