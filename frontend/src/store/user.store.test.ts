import { describe, it, expect, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import useUserStore from './user.store';
import type { User } from '../types';

describe('useUserStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    const { result } = renderHook(() => useUserStore());
    act(() => {
      result.current.setCurrentUser({
        id: 1,
        name: "Alisha",
        profile: "https://randomuser.me/api/portraits/women/89.jpg",
      });
      result.current.setCurrentRecipient(null);
    });
  });

  describe('initial state', () => {
    it('has default current user', () => {
      const { result } = renderHook(() => useUserStore());

      expect(result.current.currentUser).toEqual({
        id: 1,
        name: "Alisha",
        profile: "https://randomuser.me/api/portraits/women/89.jpg",
      });
    });

    it('has no recipient initially', () => {
      const { result } = renderHook(() => useUserStore());

      expect(result.current.currentRecipient).toBeNull();
    });
  });

  describe('setCurrentUser', () => {
    it('updates current user', () => {
      const { result } = renderHook(() => useUserStore());

      const newUser: User = {
        id: 2,
        name: "Bob",
        profile: "https://randomuser.me/api/portraits/men/45.jpg",
      };

      act(() => {
        result.current.setCurrentUser(newUser);
      });

      expect(result.current.currentUser).toEqual(newUser);
    });
  });

  describe('setCurrentRecipient', () => {
    it('sets a recipient', () => {
      const { result } = renderHook(() => useUserStore());

      const recipient: User = {
        id: 3,
        name: "Charlie",
        profile: "https://randomuser.me/api/portraits/men/67.jpg",
      };

      act(() => {
        result.current.setCurrentRecipient(recipient);
      });

      expect(result.current.currentRecipient).toEqual(recipient);
    });

    it('can clear recipient by setting null', () => {
      const { result } = renderHook(() => useUserStore());

      const recipient: User = {
        id: 3,
        name: "Charlie",
        profile: "https://randomuser.me/api/portraits/men/67.jpg",
      };

      // Set a recipient first
      act(() => {
        result.current.setCurrentRecipient(recipient);
      });

      expect(result.current.currentRecipient).toEqual(recipient);

      // Clear it
      act(() => {
        result.current.setCurrentRecipient(null);
      });

      expect(result.current.currentRecipient).toBeNull();
    });
  });

  describe('persistence across instances', () => {
    it('shares state between multiple hook instances', () => {
      const { result: instance1 } = renderHook(() => useUserStore());
      const { result: instance2 } = renderHook(() => useUserStore());

      const newUser: User = {
        id: 99,
        name: "Test User",
        profile: "https://example.com/profile.jpg",
      };

      act(() => {
        instance1.current.setCurrentUser(newUser);
      });

      // Both instances should reflect the change
      expect(instance1.current.currentUser).toEqual(newUser);
      expect(instance2.current.currentUser).toEqual(newUser);
    });
  });
});