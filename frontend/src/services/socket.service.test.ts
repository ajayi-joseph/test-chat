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
      disconnect: vi.fn(),
      id: 'mock-socket-id',
    };

    // Mock io to return our mock socket
    vi.mocked(io).mockReturnValue(mockSocket as Socket);
    
    // Reset service state
    (socketService as any).socket = null;
    (socketService as any).currentUserId = null;
    (socketService as any).joinedConversations = new Set();
    (socketService as any).isConnecting = false;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('connect', () => {
    it('should create new socket connection', () => {
      const socket = socketService.connect('http://localhost:3001');

      expect(io).toHaveBeenCalledWith('http://localhost:3001', {
        transports: ['websocket', 'polling'],
      });
      expect(socket).toBe(mockSocket);
    });

    it('should prevent multiple connection attempts', () => {
      (socketService as any).isConnecting = true;
      (socketService as any).socket = mockSocket;

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const socket = socketService.connect();

      expect(io).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Socket connection already in progress');
      expect(socket).toBe(mockSocket);

      consoleSpy.mockRestore();
    });

    it('should not create new connection if already connected', () => {
      mockSocket.connected = true;
      (socketService as any).socket = mockSocket;

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const socket = socketService.connect();

      expect(io).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Socket already connected');
      expect(socket).toBe(mockSocket);

      consoleSpy.mockRestore();
    });

    it('should identify user if already connected with different userId', () => {
      mockSocket.connected = true;
      (socketService as any).socket = mockSocket;
      (socketService as any).currentUserId = 100;

      socketService.connect('http://localhost:3001', 123);

      expect(mockSocket.emit).toHaveBeenCalledWith('user:identify', 123);
    });

    it('should set up event handlers', () => {
      socketService.connect();

      expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('connect_error', expect.any(Function));
    });

    it('should set currentUserId and add connect handler when userId provided', () => {
      socketService.connect('http://localhost:3001', 123);

      expect((socketService as any).currentUserId).toBe(123);
      // Should have 2 connect handlers (main + userId specific)
      const connectCalls = mockSocket.on.mock.calls.filter((call: any[]) => call[0] === 'connect');
      expect(connectCalls).toHaveLength(2);
    });
  });

  describe('connect event handlers', () => {
    it('should handle successful connection', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      socketService.connect();

      const connectHandler = mockSocket.on.mock.calls.find((call: any[]) => call[0] === 'connect')?.[1];
      mockSocket.connected = true;
      
      connectHandler?.();

      expect(consoleSpy).toHaveBeenCalledWith('Socket connected:', 'mock-socket-id');
      expect((socketService as any).isConnecting).toBe(false);

      consoleSpy.mockRestore();
    });

    it('should identify user on connect if currentUserId exists', () => {
      socketService.connect();
      (socketService as any).currentUserId = 123;

      const connectHandler = mockSocket.on.mock.calls.find((call: any[]) => call[0] === 'connect')?.[1];
      mockSocket.connected = true;
      
      connectHandler?.();

      expect(mockSocket.emit).toHaveBeenCalledWith('user:identify', 123);
    });

    it('should rejoin conversations after reconnection', () => {
      socketService.connect();
      (socketService as any).joinedConversations.add('1_2');
      (socketService as any).joinedConversations.add('3_4');

      const connectHandler = mockSocket.on.mock.calls.find((call: any[]) => call[0] === 'connect')?.[1];
      mockSocket.connected = true;
      
      connectHandler?.();

      expect(mockSocket.emit).toHaveBeenCalledWith('conversation:join', { userId: 1, recipientId: 2 });
      expect(mockSocket.emit).toHaveBeenCalledWith('conversation:join', { userId: 3, recipientId: 4 });
    });

    it('should handle disconnect', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      socketService.connect();

      const disconnectHandler = mockSocket.on.mock.calls.find((call: any[]) => call[0] === 'disconnect')?.[1];
      disconnectHandler?.();

      expect(consoleSpy).toHaveBeenCalledWith('Socket disconnected');
      expect((socketService as any).isConnecting).toBe(false);

      consoleSpy.mockRestore();
    });

    it('should handle connection error', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      socketService.connect();

      const errorHandler = mockSocket.on.mock.calls.find((call: any[]) => call[0] === 'connect_error')?.[1];
      const error = new Error('Connection failed');
      
      errorHandler?.(error);

      expect(consoleError).toHaveBeenCalledWith('Socket connection error:', error);
      expect((socketService as any).isConnecting).toBe(false);

      consoleError.mockRestore();
    });
  });

  describe('disconnect', () => {
    it('should disconnect socket and clear state', () => {
      (socketService as any).socket = mockSocket;
      (socketService as any).currentUserId = 123;
      (socketService as any).joinedConversations.add('1_2');

      socketService.disconnect();

      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect((socketService as any).socket).toBeNull();
      expect((socketService as any).currentUserId).toBeNull();
      expect((socketService as any).joinedConversations.size).toBe(0);
    });

    it('should handle disconnect when no socket', () => {
      expect(() => socketService.disconnect()).not.toThrow();
    });
  });

  describe('identify', () => {
    it('should emit user:identify event', () => {
      (socketService as any).socket = mockSocket;
      mockSocket.connected = true;

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
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      socketService.joinConversation(1, 2);

      expect(mockSocket.emit).toHaveBeenCalledWith('conversation:join', { userId: 1, recipientId: 2 });
      expect((socketService as any).joinedConversations.has('1_2')).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith('Joined conversation: 1_2');

      consoleSpy.mockRestore();
    });

    it('should not join same conversation twice', () => {
      socketService.joinConversation(1, 2);
      mockSocket.emit.mockClear();
      
      socketService.joinConversation(1, 2);

      expect(mockSocket.emit).not.toHaveBeenCalled();
    });

    it('should queue join if not connected', () => {
      mockSocket.connected = false;
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      socketService.joinConversation(1, 2);

      expect(mockSocket.emit).not.toHaveBeenCalled();
      expect((socketService as any).joinedConversations.has('1_2')).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith('Queued conversation join: 1_2 (waiting for connection)');

      consoleSpy.mockRestore();
    });

    it('should leave conversation', () => {
      (socketService as any).joinedConversations.add('1_2');
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      socketService.leaveConversation(1, 2);

      expect(mockSocket.emit).toHaveBeenCalledWith('conversation:leave', { userId: 1, recipientId: 2 });
      expect((socketService as any).joinedConversations.has('1_2')).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Left conversation: 1_2');

      consoleSpy.mockRestore();
    });

    it('should normalize conversation keys', () => {
      socketService.joinConversation(2, 1);
      expect((socketService as any).joinedConversations.has('1_2')).toBe(true);

      socketService.joinConversation(1, 2);
      expect((socketService as any).joinedConversations.size).toBe(1);
    });
  });

  describe('messaging', () => {
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

    it('should not send if not connected', () => {
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

    it('should start typing and join conversation', () => {
      socketService.startTyping(1, 2, 'John');

      expect(mockSocket.emit).toHaveBeenCalledWith('conversation:join', { userId: 1, recipientId: 2 });
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
  });

  describe('event listeners', () => {
    beforeEach(() => {
      (socketService as any).socket = mockSocket;
    });

    it('should register and unregister typing start listener', () => {
      const callback = vi.fn();
      
      const unsubscribe = socketService.onTypingStart(callback);

      expect(mockSocket.on).toHaveBeenCalledWith('typing:start', callback);
      
      unsubscribe();
      expect(mockSocket.off).toHaveBeenCalledWith('typing:start', callback);
    });

    it('should register and unregister typing stop listener', () => {
      const callback = vi.fn();
      
      const unsubscribe = socketService.onTypingStop(callback);

      expect(mockSocket.on).toHaveBeenCalledWith('typing:stop', callback);
      
      unsubscribe();
      expect(mockSocket.off).toHaveBeenCalledWith('typing:stop', callback);
    });

    it('should register and unregister new message listener', () => {
      const callback = vi.fn();
      
      const unsubscribe = socketService.onNewMessage(callback);

      expect(mockSocket.on).toHaveBeenCalledWith('message:new', callback);
      
      unsubscribe();
      expect(mockSocket.off).toHaveBeenCalledWith('message:new', callback);
    });

    it('should handle listeners when no socket', () => {
      (socketService as any).socket = null;
      const callback = vi.fn();

      socketService.on('test', callback);
      expect(callback).not.toHaveBeenCalled();

      socketService.off('test', callback);
      // Should not throw
    });
  });

  describe('utility methods', () => {
    it('should check connection status', () => {
      expect(socketService.isConnected()).toBe(false);

      (socketService as any).socket = mockSocket;
      mockSocket.connected = true;

      expect(socketService.isConnected()).toBe(true);
    });

    it('should get current user ID', () => {
      expect(socketService.getCurrentUserId()).toBeNull();

      (socketService as any).currentUserId = 123;
      expect(socketService.getCurrentUserId()).toBe(123);
    });
  });
});