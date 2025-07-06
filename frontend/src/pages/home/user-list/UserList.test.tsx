import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import UserList from './UserList';
import type { User } from '../../../types';

// Mock stores
const mockSetCurrentUser = vi.fn();
const mockSetCurrentRecipient = vi.fn();
const mockSetCurrentPage = vi.fn();

vi.mock('../../../store/user.store.ts', () => ({
  default: vi.fn((selector) => {
    const state = {
      currentUser: { id: 1, name: 'Current User', profile: 'current.jpg' },
      setCurrentUser: mockSetCurrentUser,
      setCurrentRecipient: mockSetCurrentRecipient,
    };
    return selector(state);
  }),
}));

vi.mock('../../../store/page.store.ts', () => ({
  default: vi.fn(() => mockSetCurrentPage),
}));

// Mock components
vi.mock('../../../components/user-card/UserCard.tsx', () => ({
  default: ({ user }: { user: User }) => (
    <div data-testid={`user-card-${user.id}`}>{user.name}</div>
  ),
}));

vi.mock('../../../components/button/Button.tsx', () => ({
  default: ({ children, onClick, disabled }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      data-testid={`button-${children.toString().toLowerCase().replace(/\s+/g, '-')}`}
    >
      {children}
    </button>
  ),
}));

// Mock user data
const mockUsers: User[] = [
  { id: 1, name: 'Current User', profile: 'current.jpg' },
  { id: 2, name: 'Alice', profile: 'alice.jpg' },
  { id: 3, name: 'Bob', profile: 'bob.jpg' },
];

// Helper to render with React Query
const renderWithQuery = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('UserList Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock fetch
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockUsers),
      } as Response)
    );
  });

  it('fetches and displays users', async () => {
    renderWithQuery(<UserList />);

    await waitFor(() => {
      // Users appear in both lists
      expect(screen.getAllByText('Current User').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Alice')).toHaveLength(2);
      expect(screen.getAllByText('Bob')).toHaveLength(2);
    });

    expect(fetch).toHaveBeenCalledWith('/api/user/all.json');
  });

  it('renders both user lists', async () => {
    renderWithQuery(<UserList />);

    await waitFor(() => {
      expect(screen.getByText('Select Current User')).toBeInTheDocument();
      expect(screen.getByText('Message Someone')).toBeInTheDocument();
    });
  });

  describe('Switch User functionality', () => {
    it('switches to a different user', async () => {
      renderWithQuery(<UserList />);

      await waitFor(() => {
        const switchButtons = screen.getAllByTestId('button-switch-to');
        expect(switchButtons).toHaveLength(2); // Alice and Bob
      });

      const aliceButton = screen.getAllByTestId('button-switch-to')[0];
      fireEvent.click(aliceButton);

      expect(mockSetCurrentUser).toHaveBeenCalledWith(mockUsers[1]); // Alice
      expect(mockSetCurrentRecipient).toHaveBeenCalledWith(null);
    });

    it('shows "Current User" for the active user', async () => {
      renderWithQuery(<UserList />);

      await waitFor(() => {
        const currentUserButtons = screen.getAllByTestId('button-current-user');
        expect(currentUserButtons).toHaveLength(1);
      });
    });

    it('disables button for current user', async () => {
      renderWithQuery(<UserList />);

      await waitFor(() => {
        const currentUserButton = screen.getAllByTestId('button-current-user')[0];
        expect(currentUserButton).toBeDisabled();
      });
    });
  });

  describe('Message User functionality', () => {
    it('sets recipient and navigates to chat', async () => {
      renderWithQuery(<UserList />);

      await waitFor(() => {
        const messageButtons = screen.getAllByTestId('button-message');
        expect(messageButtons).toHaveLength(3); // All users
      });

      // Click message button for Alice (index 1, since current user is 0)
      const aliceMessageButton = screen.getAllByTestId('button-message')[1];
      fireEvent.click(aliceMessageButton);

      expect(mockSetCurrentRecipient).toHaveBeenCalledWith(mockUsers[1]); // Alice
      expect(mockSetCurrentPage).toHaveBeenCalledWith('chat');
    });

    it('disables message button for current user', async () => {
      renderWithQuery(<UserList />);

      await waitFor(() => {
        const messageButtons = screen.getAllByTestId('button-message');
        expect(messageButtons[0]).toBeDisabled(); // First user is current user
      });
    });
  });

  describe('Error handling', () => {
    it('handles fetch errors gracefully', async () => {
      globalThis.fetch = vi.fn(() => Promise.reject(new Error('Network error')));

      renderWithQuery(<UserList />);

      // Should still render headers but no users
      await waitFor(() => {
        expect(screen.getByText('Select Current User')).toBeInTheDocument();
        expect(screen.getByText('Message Someone')).toBeInTheDocument();
      });

      // No user cards should be rendered
      expect(screen.queryByTestId('user-card-1')).not.toBeInTheDocument();
    });

    it('handles empty user list', async () => {
      globalThis.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        } as Response)
      );

      renderWithQuery(<UserList />);

      await waitFor(() => {
        expect(screen.getByText('Select Current User')).toBeInTheDocument();
        expect(screen.getByText('Message Someone')).toBeInTheDocument();
      });

      // No buttons should be rendered
      expect(screen.queryByText('Switch to')).not.toBeInTheDocument();
      expect(screen.queryByText('Message')).not.toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('renders all users in both sections', async () => {
      renderWithQuery(<UserList />);

      await waitFor(() => {
        // Check that all users appear twice (once in each section)
        const aliceElements = screen.getAllByText('Alice');
        expect(aliceElements).toHaveLength(2);
        
        const bobElements = screen.getAllByText('Bob');
        expect(bobElements).toHaveLength(2);
        
        const currentUserElements = screen.getAllByText('Current User');
        // Current User appears in text and button (×2 sections)
        expect(currentUserElements.length).toBeGreaterThanOrEqual(2);
      });
    });
  });
});