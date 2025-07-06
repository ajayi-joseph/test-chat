import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useChatActions } from './useChatAction';

describe('useChatActions', () => {
  const mockCurrentUser = { id: 1, name: 'John Doe' };
  const mockRecipient = { id: 2, name: 'Jane Smith' };
  const mockSendMessage = vi.fn();
  const mockStartTyping = vi.fn();
  const mockStopTyping = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('handleSendMessage', () => {
    it('should send message with trimmed content', () => {
      const { result } = renderHook(() =>
        useChatActions({
          currentUser: mockCurrentUser,
          currentRecipient: mockRecipient,
          sendMessage: mockSendMessage,
          startTyping: mockStartTyping,
          stopTyping: mockStopTyping,
        })
      );

      act(() => {
        result.current.handleSendMessage('  Hello World  ');
      });

      expect(mockSendMessage).toHaveBeenCalledWith({
        senderId: 1,
        recipientId: 2,
        content: 'Hello World',
      });
    });

    it('should stop typing when message is sent', () => {
      const { result } = renderHook(() =>
        useChatActions({
          currentUser: mockCurrentUser,
          currentRecipient: mockRecipient,
          sendMessage: mockSendMessage,
          startTyping: mockStartTyping,
          stopTyping: mockStopTyping,
        })
      );

      // Start typing first
      act(() => {
        result.current.handleTypingChange(true);
      });

      // Send message
      act(() => {
        result.current.handleSendMessage('Hello');
      });

      expect(mockStopTyping).toHaveBeenCalled();
    });

    it('should clear typing timeout when message is sent', () => {
      const { result } = renderHook(() =>
        useChatActions({
          currentUser: mockCurrentUser,
          currentRecipient: mockRecipient,
          sendMessage: mockSendMessage,
          startTyping: mockStartTyping,
          stopTyping: mockStopTyping,
        })
      );

      // Start typing to set timeout
      act(() => {
        result.current.handleTypingChange(true);
      });

      // Send message
      act(() => {
        result.current.handleSendMessage('Hello');
      });

      // Advance time - timeout should not trigger
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // stopTyping should only be called once (from handleSendMessage)
      expect(mockStopTyping).toHaveBeenCalledTimes(1);
    });

    it('should not send message if no recipient', () => {
      const { result } = renderHook(() =>
        useChatActions({
          currentUser: mockCurrentUser,
          currentRecipient: undefined,
          sendMessage: mockSendMessage,
          startTyping: mockStartTyping,
          stopTyping: mockStopTyping,
        })
      );

      act(() => {
        result.current.handleSendMessage('Hello');
      });

      expect(mockSendMessage).not.toHaveBeenCalled();
      expect(mockStopTyping).not.toHaveBeenCalled();
    });

    it('should not send empty or whitespace-only messages', () => {
      const { result } = renderHook(() =>
        useChatActions({
          currentUser: mockCurrentUser,
          currentRecipient: mockRecipient,
          sendMessage: mockSendMessage,
          startTyping: mockStartTyping,
          stopTyping: mockStopTyping,
        })
      );

      act(() => {
        result.current.handleSendMessage('');
      });

      act(() => {
        result.current.handleSendMessage('   ');
      });

      expect(mockSendMessage).not.toHaveBeenCalled();
    });

    it('should update when recipient changes', () => {
      const { result, rerender } = renderHook(
        ({ recipient }) =>
          useChatActions({
            currentUser: mockCurrentUser,
            currentRecipient: recipient,
            sendMessage: mockSendMessage,
            startTyping: mockStartTyping,
            stopTyping: mockStopTyping,
          }),
        { initialProps: { recipient: mockRecipient } }
      );

      act(() => {
        result.current.handleSendMessage('Hello');
      });

      expect(mockSendMessage).toHaveBeenCalledWith({
        senderId: 1,
        recipientId: 2,
        content: 'Hello',
      });

      mockSendMessage.mockClear();

      // Change recipient
      const newRecipient = { id: 3, name: 'Bob' };
      rerender({ recipient: newRecipient });

      act(() => {
        result.current.handleSendMessage('Hi');
      });

      expect(mockSendMessage).toHaveBeenCalledWith({
        senderId: 1,
        recipientId: 3,
        content: 'Hi',
      });
    });
  });

  describe('handleTypingChange', () => {
    it('should start typing when isTyping is true', () => {
      const { result } = renderHook(() =>
        useChatActions({
          currentUser: mockCurrentUser,
          currentRecipient: mockRecipient,
          sendMessage: mockSendMessage,
          startTyping: mockStartTyping,
          stopTyping: mockStopTyping,
        })
      );

      act(() => {
        result.current.handleTypingChange(true);
      });

      expect(mockStartTyping).toHaveBeenCalled();
    });

    it('should throttle typing events (500ms)', () => {
      const { result } = renderHook(() =>
        useChatActions({
          currentUser: mockCurrentUser,
          currentRecipient: mockRecipient,
          sendMessage: mockSendMessage,
          startTyping: mockStartTyping,
          stopTyping: mockStopTyping,
        })
      );

      // First call should work
      act(() => {
        result.current.handleTypingChange(true);
      });

      expect(mockStartTyping).toHaveBeenCalledTimes(1);

      // Immediate second call should be throttled
      act(() => {
        result.current.handleTypingChange(true);
      });

      expect(mockStartTyping).toHaveBeenCalledTimes(1);

      // After 300ms, still throttled
      act(() => {
        vi.advanceTimersByTime(300);
        result.current.handleTypingChange(true);
      });

      expect(mockStartTyping).toHaveBeenCalledTimes(1);

      // After 500ms total, should work
      act(() => {
        vi.advanceTimersByTime(201);
        result.current.handleTypingChange(true);
      });

      expect(mockStartTyping).toHaveBeenCalledTimes(2);
    });

    it('should auto-stop typing after 2 seconds of inactivity', () => {
      const { result } = renderHook(() =>
        useChatActions({
          currentUser: mockCurrentUser,
          currentRecipient: mockRecipient,
          sendMessage: mockSendMessage,
          startTyping: mockStartTyping,
          stopTyping: mockStopTyping,
        })
      );

      act(() => {
        result.current.handleTypingChange(true);
      });

      expect(mockStopTyping).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(mockStopTyping).toHaveBeenCalled();
    });

    it('should reset timeout on continued typing', () => {
      const { result } = renderHook(() =>
        useChatActions({
          currentUser: mockCurrentUser,
          currentRecipient: mockRecipient,
          sendMessage: mockSendMessage,
          startTyping: mockStartTyping,
          stopTyping: mockStopTyping,
        })
      );

      act(() => {
        result.current.handleTypingChange(true);
      });

      // After 1.5 seconds, type again
      act(() => {
        vi.advanceTimersByTime(1500);
        result.current.handleTypingChange(true);
      });

      // After another 1.5 seconds (3 total), should not have stopped
      act(() => {
        vi.advanceTimersByTime(1500);
      });

      expect(mockStopTyping).not.toHaveBeenCalled();

      // After 2 more seconds from last typing, should stop
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(mockStopTyping).toHaveBeenCalled();
    });

    it('should stop typing when isTyping is false', () => {
      const { result } = renderHook(() =>
        useChatActions({
          currentUser: mockCurrentUser,
          currentRecipient: mockRecipient,
          sendMessage: mockSendMessage,
          startTyping: mockStartTyping,
          stopTyping: mockStopTyping,
        })
      );

      // Start typing
      act(() => {
        result.current.handleTypingChange(true);
      });

      // Explicitly stop
      act(() => {
        result.current.handleTypingChange(false);
      });

      expect(mockStopTyping).toHaveBeenCalled();
    });

    it('should clear timeout when explicitly stopping', () => {
      const { result } = renderHook(() =>
        useChatActions({
          currentUser: mockCurrentUser,
          currentRecipient: mockRecipient,
          sendMessage: mockSendMessage,
          startTyping: mockStartTyping,
          stopTyping: mockStopTyping,
        })
      );

      // Start typing
      act(() => {
        result.current.handleTypingChange(true);
      });

      // Explicitly stop
      act(() => {
        result.current.handleTypingChange(false);
      });

      // Advance time - timeout should not trigger
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // Should only be called once (from explicit stop)
      expect(mockStopTyping).toHaveBeenCalledTimes(1);
    });
  });

  describe('edge cases', () => {
    it('should handle rapid typing start/stop', () => {
      const { result } = renderHook(() =>
        useChatActions({
          currentUser: mockCurrentUser,
          currentRecipient: mockRecipient,
          sendMessage: mockSendMessage,
          startTyping: mockStartTyping,
          stopTyping: mockStopTyping,
        })
      );

      // Rapid changes
      act(() => {
        result.current.handleTypingChange(true);
        result.current.handleTypingChange(false);
        result.current.handleTypingChange(true);
        result.current.handleTypingChange(false);
      });

      expect(mockStartTyping).toHaveBeenCalledTimes(1); // Throttled
      expect(mockStopTyping).toHaveBeenCalledTimes(2); // Not throttled
    });

    it('should handle typing across recipient changes', () => {
      const { result, rerender } = renderHook(
        ({ recipient }) =>
          useChatActions({
            currentUser: mockCurrentUser,
            currentRecipient: recipient,
            sendMessage: mockSendMessage,
            startTyping: mockStartTyping,
            stopTyping: mockStopTyping,
          }),
        { initialProps: { recipient: mockRecipient } }
      );

      // Start typing
      act(() => {
        result.current.handleTypingChange(true);
      });

      expect(mockStartTyping).toHaveBeenCalledTimes(1);

      // Wait for throttle period to pass
      act(() => {
        vi.advanceTimersByTime(501);
      });

      // Change recipient
      rerender({ recipient: { id: 3, name: 'Bob' } });

      // Type for new recipient (should work as throttle period has passed)
      act(() => {
        result.current.handleTypingChange(true);
      });

      expect(mockStartTyping).toHaveBeenCalledTimes(2);
    });

    it('should maintain separate throttle state across instances', () => {
      const { result, rerender } = renderHook(
        ({ recipient }) =>
          useChatActions({
            currentUser: mockCurrentUser,
            currentRecipient: recipient,
            sendMessage: mockSendMessage,
            startTyping: mockStartTyping,
            stopTyping: mockStopTyping,
          }),
        { initialProps: { recipient: mockRecipient } }
      );

      // Start typing
      act(() => {
        result.current.handleTypingChange(true);
      });

      // Immediately change recipient
      rerender({ recipient: { id: 3, name: 'Bob' } });

      // Try to type for new recipient (will be throttled as lastTypingRef persists)
      act(() => {
        result.current.handleTypingChange(true);
      });

      // Should still only be called once due to throttle
      expect(mockStartTyping).toHaveBeenCalledTimes(1);
    });
  });

  describe('cleanup', () => {
    it('should not cause issues if hook unmounts with active timeout', () => {
      const { result, unmount } = renderHook(() =>
        useChatActions({
          currentUser: mockCurrentUser,
          currentRecipient: mockRecipient,
          sendMessage: mockSendMessage,
          startTyping: mockStartTyping,
          stopTyping: mockStopTyping,
        })
      );

      // Start typing to set timeout
      act(() => {
        result.current.handleTypingChange(true);
      });

      // Unmount
      unmount();

      // Advance time - should not throw
      expect(() => {
        act(() => {
          vi.advanceTimersByTime(2000);
        });
      }).not.toThrow();
    });
  });
});