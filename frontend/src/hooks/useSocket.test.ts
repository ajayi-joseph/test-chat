import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useSocket } from './useSocket';

// Mock the modules first
vi.mock('../services/socket.service');
vi.mock('../store/user.store');
vi.mock('../store/messages.store');

// Import after mocking
import { socketService } from '../services/socket.service';
import useUserStore from '../store/user.store';
import useMessagesStore from '../store/messages.store';

describe('useSocket', () => {
  const mockUnsubscribe = vi.fn();
  const mockAddMessage = vi.fn();
  const mockCurrentUser = { id: 1, name: 'John Doe' };
  const mockCurrentRecipient = { id: 2, name: 'Jane Smith' };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    // Setup user store mock - it's called with a selector function
    vi.mocked(useUserStore).mockImplementation((selector?: any) => {
      const state = {
        currentUser: mockCurrentUser,
        currentRecipient: mockCurrentRecipient,
      };
      return selector ? selector(state) : state;
    });

    // Setup socket service mocks
    vi.mocked(socketService.connect).mockImplementation(() => ({} as any));
    vi.mocked(socketService.isConnected).mockReturnValue(false);
    vi.mocked(socketService.onNewMessage).mockReturnValue(mockUnsubscribe);
    vi.mocked(socketService.joinConversation).mockImplementation(() => {});
    vi.mocked(socketService.leaveConversation).mockImplementation(() => {});
    vi.mocked(socketService.sendMessage).mockImplementation(() => {});

    // Setup messages store mock
    vi.mocked(useMessagesStore.getState).mockReturnValue({
      conversations: {},
      setConversationMessages: vi.fn(),
      addMessage: mockAddMessage,
    } as any);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should connect to socket on mount', () => {
    renderHook(() => useSocket());

    expect(socketService.connect).toHaveBeenCalledWith(
      'http://localhost:3001',
      mockCurrentUser.id
    );
  });

  it('should update connection status', () => {
    const { result } = renderHook(() => useSocket());

    expect(result.current.isConnected).toBe(false);

    // Mock connection established
    vi.mocked(socketService.isConnected).mockReturnValue(true);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.isConnected).toBe(true);
  });

  it('should join conversation when connected', () => {
    const { rerender } = renderHook(() => useSocket());

    // Initially not connected
    expect(socketService.joinConversation).not.toHaveBeenCalled();

    // Simulate connection
    vi.mocked(socketService.isConnected).mockReturnValue(true);

    // Trigger the periodic check
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Force a re-render to trigger the effect with updated isConnected
    rerender();

    expect(socketService.joinConversation).toHaveBeenCalledWith(
      mockCurrentUser.id, 
      mockCurrentRecipient.id
    );
  });

  it('should handle new messages', () => {
    renderHook(() => useSocket());

    // Get the message handler that was registered
    const messageHandler = vi.mocked(socketService.onNewMessage).mock.calls[0][0];

    const incomingMessage = {
      id: 123,
      senderId: 2,
      recipientId: 1,
      content: 'Hello!',
      timestamp: '2024-01-01T00:00:00Z',
    };

    act(() => {
      messageHandler(incomingMessage);
    });

    expect(mockAddMessage).toHaveBeenCalledWith({
      id: '123',
      senderId: 2,
      recipientId: 1,
      content: 'Hello!',
      timestamp: '2024-01-01T00:00:00Z',
    });
  });

  it('should send messages', () => {
    const { result } = renderHook(() => useSocket());

    act(() => {
      result.current.sendMessage({
        senderId: mockCurrentUser.id,
        recipientId: mockCurrentRecipient.id,
        content: 'Test message',
      });
    });

    expect(socketService.sendMessage).toHaveBeenCalledWith(
      mockCurrentUser.id,
      mockCurrentRecipient.id,
      'Test message'
    );
  });

  it('should cleanup on unmount', () => {
    const { unmount } = renderHook(() => useSocket());

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});