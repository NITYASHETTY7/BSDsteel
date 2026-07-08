"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Package, DollarSign, FileText, Settings, ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { useAuthStore, Role } from "@/store/authStore";

const roleAccess: Record<Role, string[]> = {
  warehouse_staff: ["Dashboard", "Inventory"],
  accounts_team: ["Dashboard", "Receivables"],
  operations: ["Dashboard", "Inventory", "Receivables"],
  management: ["Dashboard", "Inventory", "Receivables", "Reports", "Settings"],
};

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Inventory",  href: "/inventory",  icon: Package },
  { name: "Receivables",href: "/receivables", icon: DollarSign },
  { name: "Reports",    href: "/reports",     icon: FileText },
  { name: "Settings",   href: "/settings",    icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const allowedItems = user ? roleAccess[user.role] || [] : [];
  const visibleNavItems = navItems.filter(item => allowedItems.includes(item.name));

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <aside
      className={`${
        isCollapsed ? "w-[68px]" : "w-[224px]"
      } h-full flex flex-col transition-all duration-300 ease-in-out relative z-20 shrink-0 print:hidden`}
      style={{
        background: "rgb(var(--color-panel))",
        borderRight: "1px solid rgb(var(--color-border))",
      }}
    >
      {/* ── Top accent line ── */}
      <div className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: 'linear-gradient(90deg, rgb(var(--color-accent)/0.8), rgb(var(--color-accent)/0.2), transparent)' }}
      />
      {/* ── Logo / Brand ── */}
      <div className={`relative flex items-center h-[57px] shrink-0 overflow-hidden px-4 gap-3`}
        style={{ borderBottom: "1px solid rgb(var(--color-border))" }}>
        {/* Logo mark */}
        <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/25 flex items-center justify-center shrink-0 overflow-hidden">
          <img src="/images/bsd-logo.webp" alt="BSD" className="w-5 h-5 object-contain" />
        </div>

        {!isCollapsed && (
          <div className="overflow-hidden min-w-0">
            <p className="font-display font-bold text-[13px] uppercase tracking-widest text-text-primary leading-none truncate">
              BSD Steel
            </p>
            <p className="text-[9px] uppercase tracking-[0.18em] text-text-muted mt-0.5 truncate">
              Management Portal
            </p>
          </div>
        )}
        {/* Subtle gradient line at bottom of brand header */}
        <div className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, rgb(var(--color-accent)/0.6), transparent)' }}
        />
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 flex flex-col overflow-hidden py-3 px-2">
        {/* Section label + collapse button */}
        <div className={`flex items-center mb-1 px-1 ${isCollapsed ? "justify-center" : "justify-between"}`}>
          {!isCollapsed && (
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-muted/60 px-2">
              Navigation
            </span>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-md text-text-muted hover:text-text-primary transition-all duration-200"
            style={{ background: "transparent" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgb(var(--color-border)/0.4)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            title={isCollapsed ? "Expand" : "Collapse"}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed
              ? <ChevronRight className="w-3.5 h-3.5" style={{ transition: 'transform 0.2s ease' }} />
              : <ChevronLeft  className="w-3.5 h-3.5" style={{ transition: 'transform 0.2s ease' }} />
            }
          </button>
        </div>

        <div className="flex flex-col gap-0.5">
          {visibleNavItems.map(item => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                title={isCollapsed ? item.name : undefined}
                className={`flex items-center gap-3 rounded-xl transition-all duration-200 group relative overflow-hidden
                  ${isCollapsed ? "justify-center px-2 py-3" : "px-3 py-2.5"}
                  ${isActive
                    ? "text-white"
                    : "text-text-muted hover:text-text-primary"
                  }`}
                style={isActive ? {
                  background: "rgb(var(--color-accent))",
                  boxShadow: "0 2px 12px rgba(208,41,54,0.30)",
                  transition: "all 0.2s ease",
                } : { transition: "all 0.15s ease" }}
                onMouseEnter={e => {
                  if (!isActive) e.currentTarget.style.background = "rgb(var(--color-border)/0.35)";
                }}
                onMouseLeave={e => {
                  if (!isActive) e.currentTarget.style.background = "";
                }}
              >
                {/* Active indicator bar */}
                {isActive && !isCollapsed && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-white/60 rounded-r-full" />
                )}
                <Icon className={`shrink-0 transition-transform duration-200 ${
                  isActive ? "w-[17px] h-[17px]" : "w-4 h-4 group-hover:scale-105"
                }`} />
                {!isCollapsed && (
                  <span className={`text-[13px] font-medium truncate ${isActive ? "font-semibold" : ""}`}>
                    {item.name}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── User Profile ── */}
      {user && (
        <div className="px-2 pb-3 relative" style={{ borderTop: "1px solid rgb(var(--color-border))", paddingTop: "12px" }}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className={`w-full flex items-center rounded-xl transition-all duration-200 text-left group ${
              isCollapsed ? "justify-center p-2" : "gap-2.5 px-3 py-2.5"
            }`}
            style={{ background: "transparent" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgb(var(--color-border)/0.35)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            title={isCollapsed ? user.full_name : undefined}
          >
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition-all duration-200 group-hover:scale-105 group-hover:ring-2 group-hover:ring-accent/40"
              style={{
                background: "rgba(208,41,54,0.15)",
                border: "1.5px solid rgba(208,41,54,0.35)",
                color: "rgb(var(--color-accent))",
              }}>
              {user.full_name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden flex-1 min-w-0">
                <p className="text-text-primary font-semibold text-[12px] truncate leading-none mb-0.5">
                  {user.full_name}
                </p>
                <p className="text-[9px] uppercase tracking-[0.15em] text-text-muted truncate">
                  {user.role?.replace(/_/g, " ")}
                </p>
              </div>
            )}
          </button>

          {/* Profile flyout */}
          {showProfileMenu && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowProfileMenu(false)} />
              <div
                className={`absolute bottom-full mb-2 rounded-xl z-40 p-1.5 overflow-hidden
                  ${isCollapsed ? "left-3 w-48" : "left-3 right-3"}`}
                style={{
                  background: "rgb(var(--color-panel))",
                  border: "1px solid rgb(var(--color-border))",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
                  animation: "fadeIn 0.15s ease",
                }}
              >
                <div className="px-3 py-2.5 mb-1" style={{ borderBottom: "1px solid rgb(var(--color-border)/0.5)" }}>
                  <p className="text-text-primary font-bold text-xs truncate">{user.full_name}</p>
                  <p className="text-[9px] uppercase tracking-[0.15em] text-text-muted truncate mt-0.5">
                    {user.role?.replace(/_/g, " ")}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-bold uppercase tracking-widest rounded-lg transition-colors"
                  style={{ color: "#E11D48" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(225,29,72,0.08)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <LogOut className="w-3.5 h-3.5 shrink-0" />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </aside>
  );
}
