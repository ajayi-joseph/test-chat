import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useTyping } from './useTyping';
import { socketService } from '../services/socket.service';
import useUserStore from '../store/user.store';

// Mock dependencies
vi.mock('../services/socket.service', () => ({
  socketService: {
    onTypingStart: vi.fn(),
    onTypingStop: vi.fn(),
    startTyping: vi.fn(),
    stopTyping: vi.fn(),
  },
}));

vi.mock('../store/user.store', () => ({
  default: vi.fn(),
}));

describe('useTyping', () => {
  const mockCurrentUser = { id: 1, name: 'John Doe' };
  const mockUnsubscribe = vi.fn();

  beforeEach(() => {
    // Mock useUserStore
    vi.mocked(useUserStore).mockReturnValue(mockCurrentUser);

    // Mock socket service methods
    vi.mocked(socketService.onTypingStart).mockReturnValue(mockUnsubscribe);
    vi.mocked(socketService.onTypingStop).mockReturnValue(mockUnsubscribe);

    // Clear all mocks
    vi.clearAllMocks();

    // Mock timers
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initialization', () => {
    it('should start with empty typing users', () => {
      const { result } = renderHook(() => useTyping(2));

      expect(result.current.typingUsers).toEqual([]);
      expect(result.current.isAnyoneTyping).toBe(false);
    });

    it('should not register listeners if recipientId is not provided', () => {
      renderHook(() => useTyping());

      expect(socketService.onTypingStart).not.toHaveBeenCalled();
      expect(socketService.onTypingStop).not.toHaveBeenCalled();
    });

    it('should register listeners when recipientId is provided', () => {
      renderHook(() => useTyping(2));

      expect(socketService.onTypingStart).toHaveBeenCalledTimes(1);
      expect(socketService.onTypingStop).toHaveBeenCalledTimes(1);
    });

    it('should unsubscribe listeners on unmount', () => {
      const { unmount } = renderHook(() => useTyping(2));

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalledTimes(2);
    });

    it('should clear typing users when recipientId changes', () => {
      const { result, rerender } = renderHook(
        ({ recipientId }) => useTyping(recipientId),
        { initialProps: { recipientId: 2 } }
      );

      // Simulate someone typing
      const handleTypingStart = vi.mocked(socketService.onTypingStart).mock.calls[0][0];
      act(() => {
        handleTypingStart({ userId: 3, recipientId: 2, userName: 'Jane' });
      });

      expect(result.current.typingUsers).toHaveLength(1);

      // Change recipient
      rerender({ recipientId: 4 });

      // Typing users should be cleared
      expect(result.current.typingUsers).toHaveLength(0);
    });
  });

  describe('typing events from other users', () => {
    it('should add user to typingUsers on typing start', () => {
      const { result } = renderHook(() => useTyping(2));

      const handleTypingStart = vi.mocked(socketService.onTypingStart).mock.calls[0][0];

      act(() => {
        handleTypingStart({ userId: 3, recipientId: 2, userName: 'Jane' });
      });

      expect(result.current.typingUsers).toEqual([
        { userId: 3, userName: 'Jane' }
      ]);
      expect(result.current.isAnyoneTyping).toBe(true);
    });

    it('should not add current user to typingUsers', () => {
      const { result } = renderHook(() => useTyping(2));

      const handleTypingStart = vi.mocked(socketService.onTypingStart).mock.calls[0][0];

      act(() => {
        handleTypingStart({ userId: 1, recipientId: 2, userName: 'John Doe' });
      });

      expect(result.current.typingUsers).toEqual([]);
      expect(result.current.isAnyoneTyping).toBe(false);
    });

    it('should update existing user in typingUsers', () => {
      const { result } = renderHook(() => useTyping(2));

      const handleTypingStart = vi.mocked(socketService.onTypingStart).mock.calls[0][0];

      act(() => {
        handleTypingStart({ userId: 3, recipientId: 2, userName: 'Jane' });
      });

      act(() => {
        handleTypingStart({ userId: 3, recipientId: 2, userName: 'Jane Smith' });
      });

      expect(result.current.typingUsers).toEqual([
        { userId: 3, userName: 'Jane Smith' }
      ]);
    });

    it('should handle multiple users typing', () => {
      const { result } = renderHook(() => useTyping(2));

      const handleTypingStart = vi.mocked(socketService.onTypingStart).mock.calls[0][0];

      act(() => {
        handleTypingStart({ userId: 3, recipientId: 2, userName: 'Jane' });
        handleTypingStart({ userId: 4, recipientId: 2, userName: 'Bob' });
      });

      expect(result.current.typingUsers).toEqual([
        { userId: 3, userName: 'Jane' },
        { userId: 4, userName: 'Bob' }
      ]);
      expect(result.current.isAnyoneTyping).toBe(true);
    });

    it('should remove user on typing stop', () => {
      const { result } = renderHook(() => useTyping(2));

      const handleTypingStart = vi.mocked(socketService.onTypingStart).mock.calls[0][0];
      const handleTypingStop = vi.mocked(socketService.onTypingStop).mock.calls[0][0];

      act(() => {
        handleTypingStart({ userId: 3, recipientId: 2, userName: 'Jane' });
      });

      expect(result.current.typingUsers).toHaveLength(1);

      act(() => {
        handleTypingStop({ userId: 3, recipientId: 2 });
      });

      expect(result.current.typingUsers).toEqual([]);
      expect(result.current.isAnyoneTyping).toBe(false);
    });
  });

  describe('startTyping', () => {
    it('should call socketService.startTyping', () => {
      const { result } = renderHook(() => useTyping(2));

      act(() => {
        result.current.startTyping();
      });

      expect(socketService.startTyping).toHaveBeenCalledWith(1, 2, 'John Doe');
    });

    it('should not start typing if no recipientId', () => {
      const { result } = renderHook(() => useTyping());

      act(() => {
        result.current.startTyping();
      });

      expect(socketService.startTyping).not.toHaveBeenCalled();
    });

    it('should not start typing if already typing', () => {
      const { result } = renderHook(() => useTyping(2));

      act(() => {
        result.current.startTyping();
      });

      vi.mocked(socketService.startTyping).mockClear();

      act(() => {
        result.current.startTyping();
      });

      expect(socketService.startTyping).not.toHaveBeenCalled();
    });

    it('should auto-stop typing after 3 seconds', () => {
      const { result } = renderHook(() => useTyping(2));

      act(() => {
        result.current.startTyping();
      });

      expect(socketService.stopTyping).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(socketService.stopTyping).toHaveBeenCalledWith(1, 2);
    });

    it('should reset timeout when typing again', () => {
      const { result } = renderHook(() => useTyping(2));

      act(() => {
        result.current.startTyping();
      });

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // Stop and start typing again
      act(() => {
        result.current.stopTyping();
        result.current.startTyping();
      });

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // Should not have stopped yet
      expect(socketService.stopTyping).toHaveBeenCalledTimes(1); // Only from manual stop

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Now it should stop from timeout
      expect(socketService.stopTyping).toHaveBeenCalledTimes(2);
    });
  });

  describe('stopTyping', () => {
    it('should call socketService.stopTyping', () => {
      const { result } = renderHook(() => useTyping(2));

      act(() => {
        result.current.startTyping();
      });

      act(() => {
        result.current.stopTyping();
      });

      expect(socketService.stopTyping).toHaveBeenCalledWith(1, 2);
    });

    it('should not stop if not typing', () => {
      const { result } = renderHook(() => useTyping(2));

      act(() => {
        result.current.stopTyping();
      });

      expect(socketService.stopTyping).not.toHaveBeenCalled();
    });

    it('should clear timeout when stopping', () => {
      const { result } = renderHook(() => useTyping(2));

      act(() => {
        result.current.startTyping();
      });

      act(() => {
        result.current.stopTyping();
      });

      // Advance time to when auto-stop would have occurred
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      // Should only be called once (from manual stop)
      expect(socketService.stopTyping).toHaveBeenCalledTimes(1);
    });
  });

  describe('cleanup', () => {
    it('should clear timeout on unmount', () => {
      const { result, unmount } = renderHook(() => useTyping(2));

      act(() => {
        result.current.startTyping();
      });

      unmount();

      // Advance timers - timeout should have been cleared
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      // Should not call stopTyping after unmount
      expect(socketService.stopTyping).not.toHaveBeenCalled();
    });
  });

  describe('dependencies', () => {
    it('should update callbacks when recipientId changes', () => {
      const { result, rerender } = renderHook(
        ({ recipientId }) => useTyping(recipientId),
        { initialProps: { recipientId: 2 } }
      );

      act(() => {
        result.current.startTyping();
      });

      expect(socketService.startTyping).toHaveBeenCalledWith(1, 2, 'John Doe');

      // Stop typing before changing recipient
      act(() => {
        result.current.stopTyping();
      });

      vi.mocked(socketService.startTyping).mockClear();
      vi.mocked(socketService.stopTyping).mockClear();

      rerender({ recipientId: 3 });

      act(() => {
        result.current.startTyping();
      });

      expect(socketService.startTyping).toHaveBeenCalledWith(1, 3, 'John Doe');
    });

    it('should reset typing state when recipientId changes', () => {
      const { result, rerender } = renderHook(
        ({ recipientId }) => useTyping(recipientId),
        { initialProps: { recipientId: 2 } }
      );

      // Start typing for recipient 2
      act(() => {
        result.current.startTyping();
      });

      // Change recipient without stopping
      rerender({ recipientId: 3 });

      // Clear mocks to test fresh
      vi.mocked(socketService.startTyping).mockClear();

      // Should be able to start typing for new recipient
      act(() => {
        result.current.startTyping();
      });

      expect(socketService.startTyping).toHaveBeenCalledWith(1, 3, 'John Doe');
    });
  });
});