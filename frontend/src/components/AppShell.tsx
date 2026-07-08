"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const AUTH_ROUTES = ["/login", "/forgot-password"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = AUTH_ROUTES.some(r => pathname.startsWith(r));

  if (isAuthRoute) return <>{children}</>;

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-background">
      {/* Background ambient orbs — adapt to theme via opacity */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-accent/10 blur-[140px]" />
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[50%] rounded-full bg-success/10 blur-[120px]" />
      </div>

      {/* Layout */}
      <div className="relative z-10 flex w-full h-full">
        <div className="print:hidden"><Sidebar /></div>
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <div className="print:hidden"><Topbar /></div>
          <main id="print-main" className="flex-1 overflow-y-auto p-6 no-scrollbar print:overflow-visible print:p-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
