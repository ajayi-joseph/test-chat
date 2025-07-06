import { renderHook, act } from '@testing-library/react';
import useMessagesStore, { getConversationKey } from './messages.store';
import type { Message } from '../types';

// Mock messages for testing
const createMockMessage = (id: string, senderId: number, recipientId: number): Message => ({
  id,
  senderId,
  recipientId,
  content: `Test message ${id}`,
  timestamp: new Date().toISOString(),
});

describe('getConversationKey', () => {
  it('should return consistent key regardless of user order', () => {
    expect(getConversationKey(1, 2)).toBe('conversation_1_2');
    expect(getConversationKey(2, 1)).toBe('conversation_1_2');
  });

  it('should handle larger user IDs', () => {
    expect(getConversationKey(100, 50)).toBe('conversation_50_100');
    expect(getConversationKey(50, 100)).toBe('conversation_50_100');
  });
});

describe('useMessagesStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useMessagesStore());
    act(() => {
      result.current.setConversationMessages('test', []);
      // Clear all conversations
      useMessagesStore.setState({ conversations: {} });
    });
  });

  describe('initial state', () => {
    it('should start with empty conversations', () => {
      const { result } = renderHook(() => useMessagesStore());
      expect(result.current.conversations).toEqual({});
    });
  });

  describe('setConversationMessages', () => {
    it('should set messages for a conversation', () => {
      const { result } = renderHook(() => useMessagesStore());
      const messages = [
        createMockMessage('1', 1, 2),
        createMockMessage('2', 2, 1),
      ];
      const key = 'conversation_1_2';

      act(() => {
        result.current.setConversationMessages(key, messages);
      });

      expect(result.current.conversations[key]).toEqual(messages);
    });

    it('should replace existing messages', () => {
      const { result } = renderHook(() => useMessagesStore());
      const oldMessages = [createMockMessage('1', 1, 2)];
      const newMessages = [
        createMockMessage('2', 1, 2),
        createMockMessage('3', 2, 1),
      ];
      const key = 'conversation_1_2';

      act(() => {
        result.current.setConversationMessages(key, oldMessages);
      });

      expect(result.current.conversations[key]).toEqual(oldMessages);

      act(() => {
        result.current.setConversationMessages(key, newMessages);
      });

      expect(result.current.conversations[key]).toEqual(newMessages);
    });

    it('should not affect other conversations', () => {
      const { result } = renderHook(() => useMessagesStore());
      const messages1 = [createMockMessage('1', 1, 2)];
      const messages2 = [createMockMessage('2', 3, 4)];

      act(() => {
        result.current.setConversationMessages('conversation_1_2', messages1);
        result.current.setConversationMessages('conversation_3_4', messages2);
      });

      expect(result.current.conversations['conversation_1_2']).toEqual(messages1);
      expect(result.current.conversations['conversation_3_4']).toEqual(messages2);
    });
  });

  describe('addMessage', () => {
    it('should add message to existing conversation', () => {
      const { result } = renderHook(() => useMessagesStore());
      const existingMessage = createMockMessage('1', 1, 2);
      const newMessage = createMockMessage('2', 2, 1);
      const key = 'conversation_1_2';

      act(() => {
        result.current.setConversationMessages(key, [existingMessage]);
      });

      act(() => {
        result.current.addMessage(newMessage);
      });

      expect(result.current.conversations[key]).toHaveLength(2);
      expect(result.current.conversations[key][0]).toEqual(existingMessage);
      expect(result.current.conversations[key][1]).toEqual(newMessage);
    });

    it('should create new conversation if it does not exist', () => {
      const { result } = renderHook(() => useMessagesStore());
      const message = createMockMessage('1', 5, 6);

      act(() => {
        result.current.addMessage(message);
      });

      const key = 'conversation_5_6';
      expect(result.current.conversations[key]).toHaveLength(1);
      expect(result.current.conversations[key][0]).toEqual(message);
    });

    it('should use consistent key regardless of sender/recipient order', () => {
      const { result } = renderHook(() => useMessagesStore());
      const message1 = createMockMessage('1', 10, 20);
      const message2 = createMockMessage('2', 20, 10);

      act(() => {
        result.current.addMessage(message1);
        result.current.addMessage(message2);
      });

      const key = 'conversation_10_20';
      expect(result.current.conversations[key]).toHaveLength(2);
      expect(result.current.conversations[key][0]).toEqual(message1);
      expect(result.current.conversations[key][1]).toEqual(message2);
    });

    it('should not mutate existing messages array', () => {
      const { result } = renderHook(() => useMessagesStore());
      const message1 = createMockMessage('1', 1, 2);
      const key = 'conversation_1_2';

      act(() => {
        result.current.setConversationMessages(key, [message1]);
      });

      const originalArray = result.current.conversations[key];

      act(() => {
        result.current.addMessage(createMockMessage('2', 2, 1));
      });

      // Original array should not be mutated
      expect(originalArray).toHaveLength(1);
      // New array should have both messages
      expect(result.current.conversations[key]).toHaveLength(2);
      // Should be a different array reference
      expect(result.current.conversations[key]).not.toBe(originalArray);
    });
  });

  describe('integration scenarios', () => {
    it('should handle multiple conversations simultaneously', () => {
      const { result } = renderHook(() => useMessagesStore());
      
      // Set up two conversations
      act(() => {
        result.current.setConversationMessages('conversation_1_2', [
          createMockMessage('1', 1, 2),
        ]);
        result.current.setConversationMessages('conversation_3_4', [
          createMockMessage('2', 3, 4),
        ]);
      });

      // Add messages to both
      act(() => {
        result.current.addMessage(createMockMessage('3', 2, 1));
        result.current.addMessage(createMockMessage('4', 4, 3));
      });

      expect(result.current.conversations['conversation_1_2']).toHaveLength(2);
      expect(result.current.conversations['conversation_3_4']).toHaveLength(2);
    });

    it('should handle system messages (senderId: 0)', () => {
      const { result } = renderHook(() => useMessagesStore());
      const systemMessage: Message = {
        id: 'system-1',
        senderId: 0,
        recipientId: 1,
        content: 'You matched!',
        timestamp: new Date().toISOString(),
      };

      act(() => {
        result.current.addMessage(systemMessage);
      });

      const key = 'conversation_0_1';
      expect(result.current.conversations[key]).toHaveLength(1);
      expect(result.current.conversations[key][0]).toEqual(systemMessage);
    });
  });
});