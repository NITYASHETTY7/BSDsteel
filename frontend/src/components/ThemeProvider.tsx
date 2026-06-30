"use client";

import { useEffect, useState } from "react";
import { useThemeStore } from "@/store/themeStore";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      const root = document.documentElement;
      root.classList.remove("theme-neon-dark", "theme-classic-light", "theme-midnight-blue");
      root.classList.add(`theme-${theme}`);
    }
  }, [theme, mounted]);

  return <>{children}</>;
}
