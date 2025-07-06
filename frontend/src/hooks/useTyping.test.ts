import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTyping } from './useTyping';
import { socketService } from '../services/socket.service';
import useUserStore from '../store/user.store';

// Mock socket service
vi.mock('../services/socket.service', () => ({
  socketService: {
    onTypingStart: vi.fn(),
    onTypingStop: vi.fn(),
    startTyping: vi.fn(),
    stopTyping: vi.fn(),
  },
}));

// Mock user store
vi.mock('../store/user.store', () => ({
  default: vi.fn(),
}));

describe('useTyping', () => {
  const mockCurrentUser = {
    id: 1,
    name: 'John Doe',
    profile: 'profile.jpg',
  };

  const mockUnsubscribeStart = vi.fn();
  const mockUnsubscribeStop = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    // Setup store mock
    vi.mocked(useUserStore).mockReturnValue(mockCurrentUser);
    
    // Setup socket service mocks
    vi.mocked(socketService.onTypingStart).mockReturnValue(mockUnsubscribeStart);
    vi.mocked(socketService.onTypingStop).mockReturnValue(mockUnsubscribeStop);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sets up typing listeners when recipient is provided', () => {
    renderHook(() => useTyping(2));

    expect(socketService.onTypingStart).toHaveBeenCalledWith(expect.any(Function));
    expect(socketService.onTypingStop).toHaveBeenCalledWith(expect.any(Function));
  });

  it('does not set up listeners when no recipient', () => {
    renderHook(() => useTyping(undefined));

    expect(socketService.onTypingStart).not.toHaveBeenCalled();
    expect(socketService.onTypingStop).not.toHaveBeenCalled();
  });

  it('shows typing users when they start typing', () => {
    const { result } = renderHook(() => useTyping(2));

    // Get the typing start handler
    const typingStartHandler = vi.mocked(socketService.onTypingStart).mock.calls[0][0];

    // Simulate another user typing to current user
    act(() => {
      typingStartHandler({
        userId: 3,
        recipientId: 1, // Current user's ID
        userName: 'Jane Smith',
      });
    });

    expect(result.current.typingUsers).toEqual([
      { userId: 3, userName: 'Jane Smith' },
    ]);
  });

  it('removes typing users when they stop typing', () => {
    const { result } = renderHook(() => useTyping(2));

    const typingStartHandler = vi.mocked(socketService.onTypingStart).mock.calls[0][0];
    const typingStopHandler = vi.mocked(socketService.onTypingStop).mock.calls[0][0];

    // Start typing
    act(() => {
      typingStartHandler({
        userId: 3,
        recipientId: 1,
        userName: 'Jane Smith',
      });
    });

    expect(result.current.typingUsers).toHaveLength(1);

    // Stop typing
    act(() => {
      typingStopHandler({
        userId: 3,
        recipientId: 1,
      });
    });

    expect(result.current.typingUsers).toHaveLength(0);
  });

  it('ignores typing events from current user', () => {
    const { result } = renderHook(() => useTyping(2));

    const typingStartHandler = vi.mocked(socketService.onTypingStart).mock.calls[0][0];

    // Current user typing (should be ignored)
    act(() => {
      typingStartHandler({
        userId: 1, // Same as current user
        recipientId: 2,
        userName: 'John Doe',
      });
    });

    expect(result.current.typingUsers).toHaveLength(0);
  });

  it('ignores typing events for different conversations', () => {
    const { result } = renderHook(() => useTyping(2));

    const typingStartHandler = vi.mocked(socketService.onTypingStart).mock.calls[0][0];

    // Typing in a different conversation
    act(() => {
      typingStartHandler({
        userId: 3,
        recipientId: 4, // Different recipient
        userName: 'Jane Smith',
      });
    });

    expect(result.current.typingUsers).toHaveLength(0);
  });

  it('emits typing start event', () => {
    const { result } = renderHook(() => useTyping(2));

    act(() => {
      result.current.startTyping();
    });

    expect(socketService.startTyping).toHaveBeenCalledWith(1, 2, 'John Doe');
  });

  it('throttles typing events to once per second', () => {
    const { result } = renderHook(() => useTyping(2));

    // First call
    act(() => {
      result.current.startTyping();
    });
    expect(socketService.startTyping).toHaveBeenCalledTimes(1);

    // Immediate second call (should be throttled)
    act(() => {
      result.current.startTyping();
    });
    expect(socketService.startTyping).toHaveBeenCalledTimes(1);

    // After 1 second
    act(() => {
      vi.advanceTimersByTime(1001);
      result.current.startTyping();
    });
    expect(socketService.startTyping).toHaveBeenCalledTimes(2);
  });

  it('automatically stops typing after 2 seconds of inactivity', () => {
    const { result } = renderHook(() => useTyping(2));

    act(() => {
      result.current.startTyping();
    });

    // Advance time by 2 seconds
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(socketService.stopTyping).toHaveBeenCalledWith(1, 2);
  });

  it('resets timer when typing continues', () => {
    const { result } = renderHook(() => useTyping(2));

    act(() => {
      result.current.startTyping();
    });

    // After 1.5 seconds, type again
    act(() => {
      vi.advanceTimersByTime(1500);
      result.current.startTyping();
    });

    // After another 1.5 seconds (total 3 seconds from first typing)
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    // Should not have stopped yet (timer was reset)
    expect(socketService.stopTyping).not.toHaveBeenCalled();

    // After another 0.5 seconds (2 seconds from last typing)
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(socketService.stopTyping).toHaveBeenCalledWith(1, 2);
  });

  it('manually stops typing', () => {
    const { result } = renderHook(() => useTyping(2));

    act(() => {
      result.current.startTyping();
    });

    act(() => {
      result.current.stopTyping();
    });

    expect(socketService.stopTyping).toHaveBeenCalledWith(1, 2);

    // Timer should be cleared - advance time and verify no additional stop calls
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(socketService.stopTyping).toHaveBeenCalledTimes(1);
  });

  it('does not emit stop if not currently typing', () => {
    const { result } = renderHook(() => useTyping(2));

    act(() => {
      result.current.stopTyping();
    });

    expect(socketService.stopTyping).not.toHaveBeenCalled();
  });

  it('cleans up on unmount', () => {
    const { result, unmount } = renderHook(() => useTyping(2));

    // Start typing
    act(() => {
      result.current.startTyping();
    });

    unmount();

    expect(mockUnsubscribeStart).toHaveBeenCalled();
    expect(mockUnsubscribeStop).toHaveBeenCalled();
  });

  it('stops typing on unmount if currently typing', () => {
    const { result, unmount } = renderHook(() => useTyping(2));

    act(() => {
      result.current.startTyping();
    });

    unmount();

    expect(socketService.stopTyping).toHaveBeenCalledWith(1, 2);
  });

  it('handles multiple typing users', () => {
    const { result } = renderHook(() => useTyping(2));

    const typingStartHandler = vi.mocked(socketService.onTypingStart).mock.calls[0][0];

    // Multiple users start typing
    act(() => {
      typingStartHandler({
        userId: 3,
        recipientId: 1,
        userName: 'Jane Smith',
      });
      typingStartHandler({
        userId: 4,
        recipientId: 1,
        userName: 'Bob Johnson',
      });
    });

    expect(result.current.typingUsers).toHaveLength(2);
    expect(result.current.typingUsers).toContainEqual({ userId: 3, userName: 'Jane Smith' });
    expect(result.current.typingUsers).toContainEqual({ userId: 4, userName: 'Bob Johnson' });
  });

  it('does not start typing when no recipient', () => {
    const { result } = renderHook(() => useTyping(undefined));

    act(() => {
      result.current.startTyping();
    });

    expect(socketService.startTyping).not.toHaveBeenCalled();
  });

  it('does not stop typing when no recipient', () => {
    const { result } = renderHook(() => useTyping(undefined));

    act(() => {
      result.current.stopTyping();
    });

    expect(socketService.stopTyping).not.toHaveBeenCalled();
  });
});