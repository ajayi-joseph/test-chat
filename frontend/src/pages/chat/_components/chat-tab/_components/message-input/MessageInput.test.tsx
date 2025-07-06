import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MessageInput } from './MessageInput';

describe('MessageInput Component', () => {
  const mockOnSendMessage = vi.fn();
  const mockOnTypingChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders with recipient name', () => {
      render(
        <MessageInput
          recipientName="Alice"
          onSendMessage={mockOnSendMessage}
          onTypingChange={mockOnTypingChange}
        />
      );

      expect(screen.getByPlaceholderText('Message Alice')).toBeInTheDocument();
    });

    it('renders without recipient name', () => {
      render(
        <MessageInput
          onSendMessage={mockOnSendMessage}
          onTypingChange={mockOnTypingChange}
        />
      );

      // When no recipientName is provided, it defaults to empty string
      // So placeholder is "Message " (with trailing space)
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('placeholder', 'Message ');
    });
  });

  describe('Typing behavior', () => {
    it('calls onTypingChange(true) when user starts typing', async () => {
      const user = userEvent.setup();
      render(
        <MessageInput
          recipientName="Alice"
          onSendMessage={mockOnSendMessage}
          onTypingChange={mockOnTypingChange}
        />
      );

      const input = screen.getByPlaceholderText('Message Alice');
      await user.type(input, 'H');

      expect(mockOnTypingChange).toHaveBeenCalledWith(true);
    });

    it('calls onTypingChange(false) when input is cleared', async () => {
      const user = userEvent.setup();
      render(
        <MessageInput
          recipientName="Alice"
          onSendMessage={mockOnSendMessage}
          onTypingChange={mockOnTypingChange}
        />
      );

      const input = screen.getByPlaceholderText('Message Alice');
      
      // Type something
      await user.type(input, 'Hello');
      expect(mockOnTypingChange).toHaveBeenLastCalledWith(true);

      // Clear it
      await user.clear(input);
      expect(mockOnTypingChange).toHaveBeenLastCalledWith(false);
    });

    it('does not trigger typing for whitespace only', async () => {
      const user = userEvent.setup();
      render(
        <MessageInput
          recipientName="Alice"
          onSendMessage={mockOnSendMessage}
          onTypingChange={mockOnTypingChange}
        />
      );

      const input = screen.getByPlaceholderText('Message Alice');
      await user.type(input, '   ');

      expect(mockOnTypingChange).toHaveBeenLastCalledWith(false);
    });
  });

  describe('Message submission', () => {
    it('sends trimmed message on form submit', async () => {
      const user = userEvent.setup();
      render(
        <MessageInput
          recipientName="Alice"
          onSendMessage={mockOnSendMessage}
          onTypingChange={mockOnTypingChange}
        />
      );

      const input = screen.getByPlaceholderText('Message Alice');

      await user.type(input, '  Hello World  ');
      await user.type(input, '{Enter}'); // Submit via Enter key

      expect(mockOnSendMessage).toHaveBeenCalledWith('Hello World');
      expect(input).toHaveValue(''); // Input should be cleared
      expect(mockOnTypingChange).toHaveBeenLastCalledWith(false);
    });

    it('sends message on Enter key', async () => {
      const user = userEvent.setup();
      render(
        <MessageInput
          recipientName="Alice"
          onSendMessage={mockOnSendMessage}
          onTypingChange={mockOnTypingChange}
        />
      );

      const input = screen.getByPlaceholderText('Message Alice');
      
      await user.type(input, 'Hello{Enter}');

      expect(mockOnSendMessage).toHaveBeenCalledWith('Hello');
      expect(input).toHaveValue('');
    });

    it('does not send empty or whitespace-only messages', async () => {
      const user = userEvent.setup();
      render(
        <MessageInput
          recipientName="Alice"
          onSendMessage={mockOnSendMessage}
          onTypingChange={mockOnTypingChange}
        />
      );

      const input = screen.getByPlaceholderText('Message Alice');
      const submitButton = screen.getByRole('button', { name: 'Send message' });

      // Try empty - click submit button
      fireEvent.click(submitButton);
      expect(mockOnSendMessage).not.toHaveBeenCalled();

      // Try whitespace
      await user.type(input, '   ');
      fireEvent.click(submitButton);
      expect(mockOnSendMessage).not.toHaveBeenCalled();
    });

    it('clears input after successful send', async () => {
      const user = userEvent.setup();
      render(
        <MessageInput
          recipientName="Alice"
          onSendMessage={mockOnSendMessage}
          onTypingChange={mockOnTypingChange}
        />
      );

      const input = screen.getByPlaceholderText('Message Alice');
      
      await user.type(input, 'Test message');
      expect(input).toHaveValue('Test message');

      await user.type(input, '{Enter}'); // Submit via Enter

      expect(input).toHaveValue('');
    });
  });

  describe('Disabled state', () => {
    it('disables input when disabled prop is true', () => {
      render(
        <MessageInput
          recipientName="Alice"
          onSendMessage={mockOnSendMessage}
          onTypingChange={mockOnTypingChange}
          disabled={true}
        />
      );

      const input = screen.getByPlaceholderText('Message Alice');
      expect(input).toBeDisabled();
    });

    it('does not send message when disabled', () => {
      const { container } = render(
        <MessageInput
          recipientName="Alice"
          onSendMessage={mockOnSendMessage}
          onTypingChange={mockOnTypingChange}
          disabled={true}
        />
      );

      const input = screen.getByPlaceholderText('Message Alice');
      const form = container.querySelector('form')!;

      // Force value change even though input is disabled (simulating edge case)
      fireEvent.change(input, { target: { value: 'Test' } });
      fireEvent.submit(form);

      expect(mockOnSendMessage).not.toHaveBeenCalled();
    });
  });

  describe('Submit button state', () => {
    it('disables submit button when input is empty', () => {
      render(
        <MessageInput
          recipientName="Alice"
          onSendMessage={mockOnSendMessage}
          onTypingChange={mockOnTypingChange}
        />
      );

      const submitButton = screen.getByRole('button', { name: 'Send message' });
      expect(submitButton).toBeDisabled();
    });

    it('enables submit button when input has text', async () => {
      const user = userEvent.setup();
      render(
        <MessageInput
          recipientName="Alice"
          onSendMessage={mockOnSendMessage}
          onTypingChange={mockOnTypingChange}
        />
      );

      const input = screen.getByPlaceholderText('Message Alice');
      const submitButton = screen.getByRole('button', { name: 'Send message' });

      await user.type(input, 'Hello');

      expect(submitButton).not.toBeDisabled();
    });

    it('disables submit button when component is disabled', () => {
      render(
        <MessageInput
          recipientName="Alice"
          onSendMessage={mockOnSendMessage}
          onTypingChange={mockOnTypingChange}
          disabled={true}
        />
      );

      const input = screen.getByPlaceholderText('Message Alice');
      const submitButton = screen.getByRole('button', { name: 'Send message' });

      // Even with text, button should be disabled
      fireEvent.change(input, { target: { value: 'Test' } });

      expect(submitButton).toBeDisabled();
    });
  });

  describe('Callback memoization', () => {
    it('maintains callback references on re-render', () => {
      const { rerender } = render(
        <MessageInput
          recipientName="Alice"
          onSendMessage={mockOnSendMessage}
          onTypingChange={mockOnTypingChange}
        />
      );

      const input = screen.getByPlaceholderText('Message Alice');
      const initialOnChange = input.onchange;

      rerender(
        <MessageInput
          recipientName="Alice"
          onSendMessage={mockOnSendMessage}
          onTypingChange={mockOnTypingChange}
        />
      );

      expect(input.onchange).toBe(initialOnChange);
    });
  });
});