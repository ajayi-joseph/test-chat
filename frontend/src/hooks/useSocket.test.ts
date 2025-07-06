import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSocket } from './useSocket';
import { socketService } from '../services/socket.service';
import useMessagesStore from '../store/messages.store';

// Mock the socket service
vi.mock('../services/socket.service', () => ({
  socketService: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    isConnected: vi.fn(),
  },
}));

// Mock the messages store
vi.mock('../store/messages.store', () => ({
  default: vi.fn(),
}));

describe('useSocket', () => {
  const mockAddMessage = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    // Setup store mock to return our mock function
    vi.mocked(useMessagesStore).mockReturnValue(mockAddMessage);
    
    // Default socket service behavior
    vi.mocked(socketService.isConnected).mockReturnValue(false);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('connects to socket on mount', () => {
    renderHook(() => useSocket());

    expect(socketService.connect).toHaveBeenCalledTimes(1);
  });

  it('sets up message listener on mount', () => {
    renderHook(() => useSocket());

    expect(socketService.on).toHaveBeenCalledWith('message:new', expect.any(Function));
  });

  it('checks connection status initially after 100ms', async () => {
    vi.mocked(socketService.isConnected).mockReturnValue(true);

    const { result } = renderHook(() => useSocket());

    // Initially disconnected
    expect(result.current.isConnected).toBe(false);

    // Fast forward 100ms
    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current.isConnected).toBe(true);
  });

  it('monitors connection status every 500ms', () => {
    vi.mocked(socketService.isConnected)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);

    const { result } = renderHook(() => useSocket());

    expect(result.current.isConnected).toBe(false);

    // After 500ms
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current.isConnected).toBe(false);

    // After another 500ms
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current.isConnected).toBe(true);
  });

  it('handles incoming messages', () => {
    renderHook(() => useSocket());

    // Get the message handler that was registered
    const messageHandler = vi.mocked(socketService.on).mock.calls[0][1];

    const mockMessage = {
      id: '123',
      senderId: 1,
      recipientId: 2,
      content: 'Hello!',
      timestamp: '2024-01-01T10:00:00Z',
    };

    // Simulate receiving a message
    act(() => {
      messageHandler(mockMessage);
    });

    expect(mockAddMessage).toHaveBeenCalledWith({
      id: 123, // Note: converted to number
      senderId: 1,
      recipientId: 2,
      content: 'Hello!',
      timestamp: '2024-01-01T10:00:00Z',
    });
  });

  it('sends messages through socket service', () => {
    const { result } = renderHook(() => useSocket());

    const messageData = {
      senderId: 1,
      recipientId: 2,
      content: 'Test message',
    };

    act(() => {
      result.current.sendMessage(messageData);
    });

    expect(socketService.emit).toHaveBeenCalledWith('message:send', messageData);
  });

  it('cleans up on unmount', () => {
    const { unmount } = renderHook(() => useSocket());

    unmount();

    // Should remove message listener
    expect(socketService.off).toHaveBeenCalledWith('message:new');
    
    // Interval should be cleared (we can't directly test this, but no errors should occur)
  });

  it('handles messages with string IDs', () => {
    renderHook(() => useSocket());

    const messageHandler = vi.mocked(socketService.on).mock.calls[0][1];

    const mockMessage = {
      id: 'msg_123_abc', // Non-numeric string
      senderId: 1,
      recipientId: 2,
      content: 'Hello!',
      timestamp: '2024-01-01T10:00:00Z',
    };

    // Mock console.log to verify logging
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    act(() => {
      messageHandler(mockMessage);
    });

    expect(consoleLogSpy).toHaveBeenCalledWith('New message received:', mockMessage);
    
    // parseInt('msg_123_abc') returns NaN
    expect(mockAddMessage).toHaveBeenCalledWith({
      id: NaN,
      senderId: 1,
      recipientId: 2,
      content: 'Hello!',
      timestamp: '2024-01-01T10:00:00Z',
    });

    consoleLogSpy.mockRestore();
  });

  it('memoizes sendMessage callback', () => {
    const { result, rerender } = renderHook(() => useSocket());

    const firstRender = result.current.sendMessage;

    // Rerender
    rerender();

    expect(result.current.sendMessage).toBe(firstRender);
  });

  it('does not recreate effect on every render', () => {
    const { rerender } = renderHook(() => useSocket());

    expect(socketService.connect).toHaveBeenCalledTimes(1);
    expect(socketService.on).toHaveBeenCalledTimes(1);

    // Rerender multiple times
    rerender();
    rerender();

    // Should still only be called once
    expect(socketService.connect).toHaveBeenCalledTimes(1);
    expect(socketService.on).toHaveBeenCalledTimes(1);
  });
});