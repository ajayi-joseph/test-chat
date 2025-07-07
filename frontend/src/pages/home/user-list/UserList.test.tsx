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
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockUsers),
      } as Response)
    );
  });

  it('fetches and displays users in both sections', async () => {
    renderWithQuery(<UserList />);

    await waitFor(() => {
      expect(screen.getByText('Select Current User')).toBeInTheDocument();
      expect(screen.getByText('Message Someone')).toBeInTheDocument();
      expect(screen.getAllByText('Alice')).toHaveLength(2);
      expect(screen.getAllByText('Bob')).toHaveLength(2);
    });

    expect(fetch).toHaveBeenCalledWith('/api/user/all.json');
  });

  it('allows switching users and shows current user state', async () => {
    renderWithQuery(<UserList />);

    await waitFor(() => {
      // Current user button is disabled and shows "Current User"
      const currentUserButton = screen.getAllByTestId('button-current-user')[0];
      expect(currentUserButton).toBeDisabled();
      
      // Other users show "Switch to" and are enabled
      const switchButtons = screen.getAllByTestId('button-switch-to');
      expect(switchButtons).toHaveLength(2);
    });

    // Switch to Alice
    const aliceButton = screen.getAllByTestId('button-switch-to')[0];
    fireEvent.click(aliceButton);

    expect(mockSetCurrentUser).toHaveBeenCalledWith(mockUsers[1]);
    expect(mockSetCurrentRecipient).toHaveBeenCalledWith(null);
  });

  it('allows messaging other users but not yourself', async () => {
    renderWithQuery(<UserList />);

    await waitFor(() => {
      const messageButtons = screen.getAllByTestId('button-message');
      expect(messageButtons[0]).toBeDisabled(); // Current user
      expect(messageButtons[1]).not.toBeDisabled(); // Alice
    });

    // Message Alice
    const aliceMessageButton = screen.getAllByTestId('button-message')[1];
    fireEvent.click(aliceMessageButton);

    expect(mockSetCurrentRecipient).toHaveBeenCalledWith(mockUsers[1]);
    expect(mockSetCurrentPage).toHaveBeenCalledWith('chat');
  });

  it('handles fetch errors gracefully', async () => {
    globalThis.fetch = vi.fn(() => Promise.reject(new Error('Network error')));

    renderWithQuery(<UserList />);

    await waitFor(() => {
      expect(screen.getByText('Select Current User')).toBeInTheDocument();
      expect(screen.getByText('Message Someone')).toBeInTheDocument();
    });

    // No user cards should be rendered
    expect(screen.queryByTestId('user-card-1')).not.toBeInTheDocument();
  });
});