import { describe, it, expect } from 'vitest';
import { generateChatId } from './chat.utils';

describe('chatUtils', () => {
  describe('generateChatId', () => {
    it('generates consistent ID regardless of parameter order', () => {
      const id1 = generateChatId(1, 2);
      const id2 = generateChatId(2, 1);
      
      expect(id1).toBe(id2);
      expect(id1).toBe('chat-1-2');
    });

    it('generates correct format with lower ID first', () => {
      expect(generateChatId(5, 10)).toBe('chat-5-10');
      expect(generateChatId(10, 5)).toBe('chat-5-10');
    });

    it('handles same user IDs', () => {
      expect(generateChatId(3, 3)).toBe('chat-3-3');
    });

    it('handles zero as user ID', () => {
      expect(generateChatId(0, 5)).toBe('chat-0-5');
      expect(generateChatId(5, 0)).toBe('chat-0-5');
    });

    it('handles negative user IDs', () => {
      expect(generateChatId(-1, 5)).toBe('chat--1-5');
      expect(generateChatId(5, -1)).toBe('chat--1-5');
    });

    it('handles large numbers', () => {
      expect(generateChatId(999999, 1000000)).toBe('chat-999999-1000000');
    });

    it('works with various number combinations', () => {
      const testCases = [
        { input: [1, 99], expected: 'chat-1-99' },
        { input: [42, 7], expected: 'chat-7-42' },
        { input: [100, 200], expected: 'chat-100-200' },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(generateChatId(input[0], input[1])).toBe(expected);
        expect(generateChatId(input[1], input[0])).toBe(expected);
      });
    });
  });
});