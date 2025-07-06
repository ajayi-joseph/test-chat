import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Home from './Home';

// Mock the store
vi.mock('../../store/user.store.ts', () => ({
  default: vi.fn(() => ({
    id: 1,
    name: 'Test User',
    profile: 'https://example.com/avatar.jpg',
  })),
}));

// Mock child components
vi.mock('../../components/user-card/UserCard.tsx', () => ({
  default: ({ user }: { user: any }) => (
    <div data-testid="user-card">{user.name}</div>
  ),
}));

vi.mock('./user-list/UserList.tsx', () => ({
  default: () => <div data-testid="user-list">User List</div>,
}));

// Mock the logo
vi.mock('../../assets/logo.svg', () => ({
  default: 'logo.svg',
}));

describe('Home Component', () => {
  it('renders all main sections', () => {
    render(<Home />);

    // Header content
    expect(screen.getByAltText('Logo')).toBeInTheDocument();
    expect(screen.getByText('Muzz')).toBeInTheDocument();
    expect(screen.getByText('Connect and chat with your friends in a simple and elegant way.')).toBeInTheDocument();
  });

  it('displays current user information', () => {
    render(<Home />);

    expect(screen.getByTestId('user-card')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('Currently logged in as')).toBeInTheDocument();
  });

  it('renders UserList component', () => {
    render(<Home />);

    expect(screen.getByTestId('user-list')).toBeInTheDocument();
  });

  it('has proper heading hierarchy', () => {
    render(<Home />);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Muzz');
  });
});