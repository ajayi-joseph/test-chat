import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import MessageItem from './MessageItem';
import type { Message } from '../../../../../../types';

describe('MessageItem Component', () => {
  const mockMessage: Message = {
    id: '1',
    senderId: 1,
    recipientId: 2,
    content: 'Hello world',
    timestamp: '2024-01-15T14:30:00Z',
  };

  beforeEach(() => {
    // Mock date to ensure consistent time formatting in tests
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T14:30:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Regular messages', () => {
    it('renders own message with correct styling', () => {
      render(
        <MessageItem
          message={mockMessage}
          isOwn={true}
          isGrouped={false}
        />
      );

      const messageContainer = screen.getByText('Hello world').parentElement;
      expect(messageContainer).toHaveClass('bg-[#FF4963]', 'text-white', 'rounded-tr-sm');
      
      // Check alignment
      const wrapper = messageContainer?.parentElement;
      expect(wrapper).toHaveClass('justify-end');
    });

    it('renders other user message with correct styling', () => {
      render(
        <MessageItem
          message={mockMessage}
          isOwn={false}
          isGrouped={false}
        />
      );

      const messageContainer = screen.getByText('Hello world').parentElement;
      expect(messageContainer).toHaveClass('bg-gray-100', 'text-gray-800', 'rounded-tl-sm');
      
      // Check alignment
      const wrapper = messageContainer?.parentElement;
      expect(wrapper).toHaveClass('justify-start');
    });

    it('applies grouped spacing', () => {
      const { rerender } = render(
        <MessageItem
          message={mockMessage}
          isOwn={true}
          isGrouped={false}
        />
      );

      let wrapper = screen.getByText('Hello world').parentElement?.parentElement;
      expect(wrapper).toHaveClass('mt-3');

      rerender(
        <MessageItem
          message={mockMessage}
          isOwn={true}
          isGrouped={true}
        />
      );

      wrapper = screen.getByText('Hello world').parentElement?.parentElement;
      expect(wrapper).toHaveClass('mt-0.5');
    });

    it('formats timestamp correctly', () => {
      // Test with a known timestamp
      const testMessage = {
        ...mockMessage,
        timestamp: '2024-01-15T14:30:00',
      };

      render(
        <MessageItem
          message={testMessage}
          isOwn={true}
          isGrouped={false}
        />
      );

      // The time should be formatted as "2:30 pm" or similar
      // Note: The exact format might vary based on locale
      expect(screen.getByText(/2:30/i)).toBeInTheDocument();
    });

    it('displays time in 12-hour format with am/pm', () => {
      const morningMessage = {
        ...mockMessage,
        timestamp: '2024-01-15T09:05:00',
      };

      const { rerender } = render(
        <MessageItem
          message={morningMessage}
          isOwn={true}
          isGrouped={false}
        />
      );

      expect(screen.getByText(/9:05 am/i)).toBeInTheDocument();

      const eveningMessage = {
        ...mockMessage,
        timestamp: '2024-01-15T21:05:00',
      };

      rerender(
        <MessageItem
          message={eveningMessage}
          isOwn={true}
          isGrouped={false}
        />
      );

      expect(screen.getByText(/9:05 pm/i)).toBeInTheDocument();
    });
  });

  describe('System messages', () => {
    it('renders system message with special styling', () => {
      render(
        <MessageItem
          message={mockMessage}
          isOwn={false}
          isGrouped={false}
          isSystemMessage={true}
        />
      );

      const systemMessage = screen.getByText('Hello world');
      expect(systemMessage.parentElement).toHaveClass('text-center', 'my-6');
      
      // Should not have regular message styling
      expect(systemMessage.parentElement).not.toHaveClass('bg-gray-100');
    });

    it('renders "You matched" message with heart emoji', () => {
      const matchMessage = {
        ...mockMessage,
        content: 'You matched with Alice ❤️',
      };

      render(
        <MessageItem
          message={matchMessage}
          isOwn={false}
          isGrouped={false}
        />
      );

      // Check that the heart is separated and styled
      expect(screen.getByText('You matched with Alice')).toBeInTheDocument();
      expect(screen.getByText('❤️')).toHaveClass('text-red-500');
      
      // Should have system message styling
      const container = screen.getByText('You matched with Alice').parentElement;
      expect(container).toHaveClass('text-center', 'my-6');
    });

    it('handles "You matched" without heart emoji', () => {
      const matchMessage = {
        ...mockMessage,
        content: 'You matched with Bob',
      };

      render(
        <MessageItem
          message={matchMessage}
          isOwn={false}
          isGrouped={false}
        />
      );

      expect(screen.getByText('You matched with Bob')).toBeInTheDocument();
      expect(screen.getByText('❤️')).toHaveClass('text-red-500');
    });

    it('treats message with "You matched" as system message regardless of isSystemMessage prop', () => {
      const matchMessage = {
        ...mockMessage,
        content: 'You matched with Charlie ❤️',
      };

      render(
        <MessageItem
          message={matchMessage}
          isOwn={true} // Even if marked as own message
          isGrouped={false}
          isSystemMessage={false} // Even if not marked as system
        />
      );

      // Should still render as system message
      const container = screen.getByText('You matched with Charlie').parentElement;
      expect(container).toHaveClass('text-center', 'my-6');
    });
  });

  describe('Message content', () => {
    it('renders long messages correctly', () => {
      const longMessage = {
        ...mockMessage,
        content: 'This is a very long message that should wrap properly within the max width constraints of the message bubble',
      };

      render(
        <MessageItem
          message={longMessage}
          isOwn={true}
          isGrouped={false}
        />
      );

      expect(screen.getByText(longMessage.content)).toBeInTheDocument();
      expect(screen.getByText(longMessage.content).parentElement).toHaveClass('max-w-[75%]');
    });

    it('renders messages with special characters', () => {
      const specialMessage = {
        ...mockMessage,
        content: 'Hello! 😊 How are you? <3 & >_<',
      };

      render(
        <MessageItem
          message={specialMessage}
          isOwn={false}
          isGrouped={false}
        />
      );

      expect(screen.getByText('Hello! 😊 How are you? <3 & >_<')).toBeInTheDocument();
    });
  });

  describe('Time styling', () => {
    it('applies correct time styling for own messages', () => {
      render(
        <MessageItem
          message={mockMessage}
          isOwn={true}
          isGrouped={false}
        />
      );

      // The time is in a div with text-[11px] class
      const messageContainer = screen.getByText('Hello world').parentElement;
      const timeElement = messageContainer?.querySelector('.text-\\[11px\\]');
      expect(timeElement).toHaveClass('text-white/70');
    });

    it('applies correct time styling for other messages', () => {
      render(
        <MessageItem
          message={mockMessage}
          isOwn={false}
          isGrouped={false}
        />
      );

      // The time is in a div with text-[11px] class
      const messageContainer = screen.getByText('Hello world').parentElement;
      const timeElement = messageContainer?.querySelector('.text-\\[11px\\]');
      expect(timeElement).toHaveClass('text-gray-500');
    });
  });
});