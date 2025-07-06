import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { User } from '../types';
import { useChatActions } from './useChatAction';

describe('useChatActions', () => {
  const mockCurrentUser: User = {
    id: 1,
    name: 'John Doe',
    profile: 'profile1.jpg',
  };

  const mockRecipient: User = {
    id: 2,
    name: 'Jane Smith',
    profile: 'profile2.jpg',
  };

  const mockSendMessage = vi.fn();
  const mockStartTyping = vi.fn();
  const mockStopTyping = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('handleSendMessage', () => {
    it('sends message when recipient is present', () => {
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
        result.current.handleSendMessage('Hello there!');
      });

      expect(mockSendMessage).toHaveBeenCalledWith({
        senderId: 1,
        recipientId: 2,
        content: 'Hello there!',
      });
      expect(mockSendMessage).toHaveBeenCalledTimes(1);
    });

    it('does not send message when recipient is undefined', () => {
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
        result.current.handleSendMessage('Hello there!');
      });

      expect(mockSendMessage).not.toHaveBeenCalled();
    });

    it('sends empty message content', () => {
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

      expect(mockSendMessage).toHaveBeenCalledWith({
        senderId: 1,
        recipientId: 2,
        content: '',
      });
    });
  });

  describe('handleTypingChange', () => {
    it('calls startTyping when isTyping is true', () => {
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

      expect(mockStartTyping).toHaveBeenCalledTimes(1);
      expect(mockStopTyping).not.toHaveBeenCalled();
    });

    it('calls stopTyping when isTyping is false', () => {
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
        result.current.handleTypingChange(false);
      });

      expect(mockStopTyping).toHaveBeenCalledTimes(1);
      expect(mockStartTyping).not.toHaveBeenCalled();
    });
  });

  describe('callback memoization', () => {
    it('handleSendMessage remains stable when dependencies do not change', () => {
      const { result, rerender } = renderHook(() =>
        useChatActions({
          currentUser: mockCurrentUser,
          currentRecipient: mockRecipient,
          sendMessage: mockSendMessage,
          startTyping: mockStartTyping,
          stopTyping: mockStopTyping,
        })
      );

      const firstRender = result.current.handleSendMessage;

      // Rerender with same props
      rerender();

      expect(result.current.handleSendMessage).toBe(firstRender);
    });

    it('handleSendMessage changes when recipient changes', () => {
      const { result, rerender } = renderHook(
        (props) => useChatActions(props),
        {
          initialProps: {
            currentUser: mockCurrentUser,
            currentRecipient: mockRecipient,
            sendMessage: mockSendMessage,
            startTyping: mockStartTyping,
            stopTyping: mockStopTyping,
          },
        }
      );

      const firstRender = result.current.handleSendMessage;

      const newRecipient: User = {
        id: 3,
        name: 'New User',
        profile: 'profile3.jpg',
      };

      // Rerender with new recipient
      rerender({
        currentUser: mockCurrentUser,
        currentRecipient: newRecipient,
        sendMessage: mockSendMessage,
        startTyping: mockStartTyping,
        stopTyping: mockStopTyping,
      });

      expect(result.current.handleSendMessage).not.toBe(firstRender);
    });
  });
});