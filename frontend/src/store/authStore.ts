import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Role = 'warehouse_staff' | 'accounts_team' | 'operations' | 'management';

export interface User {
  id: number;
  full_name: string;
  email: string;
  role: Role;
  is_active: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (updatedUser: Partial<User>) => void;
}

// Note: Storing JWT in memory/localStorage (via zustand persist) for local dev.
// In production, this should ideally be moved to httpOnly secure cookies.
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
      updateUser: (updatedUser) => set((state) => ({
        user: state.user ? { ...state.user, ...updatedUser } : null
      })),
    }),
    {
      name: 'auth-storage',
    }
  )
);
