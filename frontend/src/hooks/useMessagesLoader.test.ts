import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useMessagesLoader } from './useMessagesLoader';
import useMessagesStore from '../store/messages.store';

// Mock fetch using globalThis (works in both Node and browser environments)
const fetchMock = vi.fn();
globalThis.fetch = fetchMock;

describe('useMessagesLoader', () => {
  const mockMessages = [
    {
      id: '1',
      senderId: 1,
      recipientId: 2,
      content: 'Hello',
      timestamp: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      senderId: 2,
      recipientId: 1,
      content: 'Hi there',
      timestamp: '2024-01-01T00:01:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store
    useMessagesStore.setState({ conversations: {} });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should load messages successfully', async () => {
    // Mock successful response
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ messages: mockMessages }),
    } as Response);

    // Render hook
    renderHook(() => useMessagesLoader({ userId: 1, recipientId: 2 }));

    // Wait for fetch to be called
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3001/api/messages?userId=1&recipientId=2'
      );
    });

    // Check store was updated
    await waitFor(() => {
      const state = useMessagesStore.getState();
      expect(state.conversations['conversation_1_2']).toEqual(mockMessages);
    });
  });

  it('should not load if recipientId is 0', () => {
    renderHook(() => useMessagesLoader({ userId: 1, recipientId: 0 }));
    
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('should not load if recipientId is missing', () => {
    renderHook(() => useMessagesLoader({ userId: 1, recipientId: undefined as any }));
    
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('should handle fetch errors', async () => {
    // Mock error response
    fetchMock.mockResolvedValueOnce({
      ok: false,
      statusText: 'Internal Server Error',
    } as Response);

    // Spy on console.error
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    renderHook(() => useMessagesLoader({ userId: 1, recipientId: 2 }));

    // Wait for error handling
    await waitFor(() => {
      expect(consoleError).toHaveBeenCalled();
    });

    // Check store was set to empty array
    const state = useMessagesStore.getState();
    expect(state.conversations['conversation_1_2']).toEqual([]);

    consoleError.mockRestore();
  });

  it('should handle API error response', async () => {
    // Mock response with error field
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ error: 'Not authorized' }),
    } as Response);

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    renderHook(() => useMessagesLoader({ userId: 1, recipientId: 2 }));

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(
        'Failed to load messages:',
        expect.any(Error)
      );
    });

    const state = useMessagesStore.getState();
    expect(state.conversations['conversation_1_2']).toEqual([]);

    consoleError.mockRestore();
  });

  it('should use custom baseUrl', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ messages: [] }),
    } as Response);

    renderHook(() => 
      useMessagesLoader({ 
        userId: 1, 
        recipientId: 2,
        baseUrl: 'https://api.example.com'
      })
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.example.com/api/messages?userId=1&recipientId=2'
      );
    });
  });

  it('should reload when recipientId changes', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ messages: mockMessages }),
    } as Response);

    const { rerender } = renderHook(
      ({ userId, recipientId }) => useMessagesLoader({ userId, recipientId }),
      { initialProps: { userId: 1, recipientId: 2 } }
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    // Change recipientId
    rerender({ userId: 1, recipientId: 3 });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(fetchMock).toHaveBeenLastCalledWith(
        'http://localhost:3001/api/messages?userId=1&recipientId=3'
      );
    });
  });

  it('should normalize conversation key', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ messages: mockMessages }),
    } as Response);

    // Use reversed userId/recipientId
    renderHook(() => useMessagesLoader({ userId: 2, recipientId: 1 }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    // Should still store in conversation_1_2 (normalized)
    const state = useMessagesStore.getState();
    expect(state.conversations['conversation_1_2']).toEqual(mockMessages);
  });

  it('should prevent duplicate loads', async () => {
    // Create a promise we can control
    let resolvePromise: (value: any) => void;
    const controlledPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    fetchMock.mockReturnValueOnce(controlledPromise as Promise<Response>);

    const { rerender } = renderHook(
      ({ userId, recipientId }) => useMessagesLoader({ userId, recipientId }),
      { initialProps: { userId: 1, recipientId: 2 } }
    );

    // Try to trigger multiple loads
    rerender({ userId: 1, recipientId: 2 });
    rerender({ userId: 1, recipientId: 2 });

    // Should only call fetch once
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Resolve the promise
    resolvePromise!({
      ok: true,
      json: async () => ({ messages: mockMessages }),
    });

    await waitFor(() => {
      const state = useMessagesStore.getState();
      expect(state.conversations['conversation_1_2']).toEqual(mockMessages);
    });
  });
});