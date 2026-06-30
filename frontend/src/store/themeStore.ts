import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeType = 'neon-dark' | 'classic-light' | 'midnight-blue';

interface ThemeState {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'neon-dark',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'bsd-steel-theme',
    }
  )
);
