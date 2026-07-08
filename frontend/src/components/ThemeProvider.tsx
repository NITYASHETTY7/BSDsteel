"use client";

import { useEffect, useState } from "react";
import { useThemeStore } from "@/store/themeStore";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      const root = document.documentElement;
      root.classList.remove("theme-neon-dark", "theme-classic-light", "theme-midnight-blue", "dark");
      root.classList.add(`theme-${theme}`);
      if (theme !== 'classic-light') {
        root.classList.add("dark");
      }
    }
  }, [theme, mounted]);

  return <>{children}</>;
}
