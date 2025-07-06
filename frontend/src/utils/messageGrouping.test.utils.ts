import { describe, it, expect } from 'vitest';
import { groupMessages } from './messageGrouping.utils';
import type { Message } from '../types';

describe('messageGrouping', () => {
  describe('groupMessages', () => {
    const createMessage = (
      id: string,
      senderId: number,
      timestamp: string,
      content: string = 'Test message'
    ): Message => ({
      id,
      senderId,
      recipientId: 1,
      content,
      timestamp,
    });

    it('returns empty array for empty messages', () => {
      expect(groupMessages([])).toEqual([]);
    });

    it('handles single message', () => {
      const message = createMessage('1', 1, '2024-01-15T10:00:00Z');
      const result = groupMessages([message]);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        messages: [message],
        showTimestamp: true,
      });
    });

    it('groups messages from same sender within 20 seconds', () => {
      const messages = [
        createMessage('1', 1, '2024-01-15T10:00:00Z'),
        createMessage('2', 1, '2024-01-15T10:00:15Z'), // 15 seconds later
        createMessage('3', 1, '2024-01-15T10:00:19Z'), // 19 seconds from first
      ];

      const result = groupMessages(messages);

      expect(result).toHaveLength(1);
      expect(result[0].messages).toHaveLength(3);
      expect(result[0].showTimestamp).toBe(true);
    });

    it('creates new group when messages exceed 20 seconds', () => {
      const messages = [
        createMessage('1', 1, '2024-01-15T10:00:00Z'),
        createMessage('2', 1, '2024-01-15T10:00:21Z'), // 21 seconds later
      ];

      const result = groupMessages(messages);

      expect(result).toHaveLength(2);
      expect(result[0].messages).toHaveLength(1);
      expect(result[1].messages).toHaveLength(1);
      expect(result[1].showTimestamp).toBe(false);
    });

    it('creates new group for different senders', () => {
      const messages = [
        createMessage('1', 1, '2024-01-15T10:00:00Z'),
        createMessage('2', 2, '2024-01-15T10:00:05Z'), // Different sender, 5 seconds later
      ];

      const result = groupMessages(messages);

      expect(result).toHaveLength(2);
      expect(result[0].messages[0].senderId).toBe(1);
      expect(result[1].messages[0].senderId).toBe(2);
    });

    it('creates new group when messages are more than 1 hour apart', () => {
      const messages = [
        createMessage('1', 1, '2024-01-15T10:00:00Z'),
        createMessage('2', 1, '2024-01-15T11:00:01Z'), // 1 hour 1 second later
      ];

      const result = groupMessages(messages);

      expect(result).toHaveLength(2);
      expect(result[0].showTimestamp).toBe(true);
      expect(result[1].showTimestamp).toBe(true);
    });

    it('sorts messages by timestamp before grouping', () => {
      const messages = [
        createMessage('3', 1, '2024-01-15T10:00:20Z'),
        createMessage('1', 1, '2024-01-15T10:00:00Z'),
        createMessage('2', 1, '2024-01-15T10:00:10Z'),
      ];

      const result = groupMessages(messages);

      expect(result).toHaveLength(1);
      expect(result[0].messages[0].id).toBe('1');
      expect(result[0].messages[1].id).toBe('2');
      expect(result[0].messages[2].id).toBe('3');
    });

    it('never groups system messages (senderId === 0)', () => {
      const messages = [
        createMessage('1', 0, '2024-01-15T10:00:00Z', 'System: User joined'),
        createMessage('2', 0, '2024-01-15T10:00:05Z', 'System: User left'),
        createMessage('3', 1, '2024-01-15T10:00:06Z', 'Hello'),
      ];

      const result = groupMessages(messages);

      expect(result).toHaveLength(3);
      expect(result[0].messages).toHaveLength(1);
      expect(result[1].messages).toHaveLength(1);
      expect(result[2].messages).toHaveLength(1);
    });

    it('handles complex conversation flow', () => {
      const messages = [
        // Initial message
        createMessage('1', 1, '2024-01-15T10:00:00Z', 'Hello'),
        // Quick follow-up from same sender
        createMessage('2', 1, '2024-01-15T10:00:10Z', 'How are you?'),
        // Response from different user
        createMessage('3', 2, '2024-01-15T10:00:30Z', 'I\'m good!'),
        createMessage('4', 2, '2024-01-15T10:00:35Z', 'And you?'),
        // System message
        createMessage('5', 0, '2024-01-15T10:00:40Z', 'System: User typing'),
        // Reply after system
        createMessage('6', 1, '2024-01-15T10:00:45Z', 'Great!'),
        // Much later message
        createMessage('7', 1, '2024-01-15T11:30:00Z', 'Still there?'),
      ];

      const result = groupMessages(messages);

      expect(result).toHaveLength(5);
      
      // Group 1: Messages 1 & 2 from user 1
      expect(result[0].messages).toHaveLength(2);
      expect(result[0].showTimestamp).toBe(true);
      
      // Group 2: Messages 3 & 4 from user 2
      expect(result[1].messages).toHaveLength(2);
      expect(result[1].showTimestamp).toBe(false);
      
      // Group 3: System message (never grouped)
      expect(result[2].messages).toHaveLength(1);
      expect(result[2].messages[0].senderId).toBe(0);
      
      // Group 4: Message 6 from user 1
      expect(result[3].messages).toHaveLength(1);
      
      // Group 5: Message 7 (>1 hour later)
      expect(result[4].messages).toHaveLength(1);
      expect(result[4].showTimestamp).toBe(true);
    });

    it('handles messages at exact boundary times', () => {
      const messages = [
        createMessage('1', 1, '2024-01-15T10:00:00Z'),
        createMessage('2', 1, '2024-01-15T10:00:20Z'), // Exactly 20 seconds
        createMessage('3', 1, '2024-01-15T11:00:00Z'), // Exactly 1 hour
      ];

      const result = groupMessages(messages);

      // Exactly 20 seconds should still group (<=)
      expect(result).toHaveLength(2);
      expect(result[0].messages).toHaveLength(2);
      
      // Exactly 1 hour should not group (>)
      expect(result[1].messages).toHaveLength(1);
    });

    it('preserves original message array', () => {
      const messages = [
        createMessage('2', 1, '2024-01-15T10:00:10Z'),
        createMessage('1', 1, '2024-01-15T10:00:00Z'),
      ];
      
      const originalMessages = [...messages];
      groupMessages(messages);
      
      // Original array should not be modified
      expect(messages).toEqual(originalMessages);
    });

    it('handles rapid fire messages from same sender', () => {
      const messages = Array.from({ length: 10 }, (_, i) => 
        createMessage(`${i}`, 1, `2024-01-15T10:00:${i.toString().padStart(2, '0')}Z`)
      );

      const result = groupMessages(messages);

      // All messages within 20 seconds should be grouped
      expect(result).toHaveLength(1);
      expect(result[0].messages).toHaveLength(10);
    });
  });
});