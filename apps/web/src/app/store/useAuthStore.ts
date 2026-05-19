import { create } from 'zustand';
import type { User } from '@teamhub/shared';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (user: User) => void;
  updateUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    (set) => ({
      user: null,
      isAuthenticated: false,

      setAuth: (user) => set({ user, isAuthenticated: true }),

      updateUser: (user) => set({ user }),

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },
    })
  
);
