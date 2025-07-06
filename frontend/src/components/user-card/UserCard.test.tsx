import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import UserCard from './UserCard';
import type { User } from '../../types';

describe('UserCard Component', () => {
  const mockUser: User = {
    id: 1,
    name: 'John Doe',
    profile: 'https://example.com/avatar.jpg',
  };

  it('renders user name', () => {
    render(<UserCard user={mockUser} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('renders user profile image with correct attributes', () => {
    render(<UserCard user={mockUser} />);
    
    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    expect(image).toHaveAttribute('alt', 'John Doe');
  });
});