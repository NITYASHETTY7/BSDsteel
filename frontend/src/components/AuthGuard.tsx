"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore, Role } from "@/store/authStore";

const roleAccess: Record<Role, string[]> = {
  warehouse_staff: ["/", "/dashboard", "/inventory"],
  accounts_team: ["/", "/dashboard", "/receivables"],
  operations: ["/", "/dashboard", "/inventory", "/receivables"],
  management: ["/", "/dashboard", "/inventory", "/receivables", "/reports", "/settings"],
};

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, token, user, sessionTimeout, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/forgot-password");

      if (!isAuthenticated && !isAuthRoute) {
        router.push("/login");
      } else if (isAuthenticated && isAuthRoute) {
        router.push("/");
      } else if (isAuthenticated && !isAuthRoute && user) {
        // Common pages accessible by all authenticated users
        const COMMON_PAGES = ["/notifications", "/audit"];
        
        // RBAC Prefix Check (e.g. /inventory allows /inventory/1)
        const allowedPrefixes = roleAccess[user.role] || [];
        const isAllowed = allowedPrefixes.some(prefix => 
          pathname === prefix || pathname.startsWith(prefix + "/")
        ) || COMMON_PAGES.includes(pathname);

        if (!isAllowed) {
          router.push("/"); // Redirect to dashboard if unauthorized
        }
      }
    }
  }, [isAuthenticated, isMounted, pathname, router, user]);

  // Session Timeout logic
  useEffect(() => {
    if (!isAuthenticated || !isMounted) return;

    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        logout();
      }, (sessionTimeout || 30) * 60 * 1000);
    };

    const events = ["mousemove", "keydown", "scroll", "click"];
    events.forEach(e => window.addEventListener(e, resetTimer));
    resetTimer(); // init

    return () => {
      clearTimeout(timeoutId);
      events.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, [isAuthenticated, isMounted, sessionTimeout, logout]);

  // Avoid hydration mismatch by not rendering until mounted
  if (!isMounted) {
    return <div className="min-h-screen bg-background" />;
  }

  // If trying to access protected route while unauthenticated, don't render children yet
  if (!isAuthenticated && !pathname.startsWith("/login")) {
    return <div className="min-h-screen bg-background" />;
  }

  return <>{children}</>;
}
