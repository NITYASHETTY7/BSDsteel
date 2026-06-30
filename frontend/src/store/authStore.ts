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

export interface InventorySettings {
  safetyBuffer: string;
  leadTime: string;
  lowStockNotification: boolean;
  autoReorderMail: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  mfaEnabled: boolean;
  sessionTimeout: number;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (updatedUser: Partial<User>) => void;
  setSecuritySettings: (mfaEnabled: boolean, sessionTimeout: number) => void;
  inventorySettings: InventorySettings;
  setInventorySettings: (settings: InventorySettings) => void;
}

// Note: Storing JWT in memory/localStorage (via zustand persist) for local dev.
// In production, this should ideally be moved to httpOnly secure cookies.
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      mfaEnabled: false,
      sessionTimeout: 30,
      login: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
      updateUser: (updatedUser) => set((state) => ({
        user: state.user ? { ...state.user, ...updatedUser } : null
      })),
      setSecuritySettings: (mfaEnabled, sessionTimeout) => set({ mfaEnabled, sessionTimeout }),
      inventorySettings: {
        safetyBuffer: "15",
        leadTime: "5",
        lowStockNotification: true,
        autoReorderMail: false,
      },
      setInventorySettings: (inventorySettings) => set({ inventorySettings }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
