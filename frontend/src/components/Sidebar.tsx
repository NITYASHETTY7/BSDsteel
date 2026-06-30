"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Package, DollarSign, FileText, Settings, ChevronLeft, ChevronRight, Layers, LogOut } from "lucide-react";
import { useAuthStore, Role } from "@/store/authStore";

const roleAccess: Record<Role, string[]> = {
  warehouse_staff: ["Dashboard", "Inventory"],
  accounts_team: ["Dashboard", "Receivables"],
  operations: ["Dashboard", "Inventory", "Receivables"],
  management: ["Dashboard", "Inventory", "Receivables", "Reports", "Settings"],
};

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Inventory", href: "/inventory", icon: Package },
  { name: "Receivables", href: "/receivables", icon: DollarSign },
  { name: "Reports", href: "/reports", icon: FileText },
  { name: "Settings", href: "/settings", icon: Settings },
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
        isCollapsed ? "w-[72px]" : "w-[230px]"
      } bg-panel border-r border-border h-full flex flex-col transition-all duration-300 relative z-20 shrink-0`}
    >
      {/* Logo Area */}
      <div className={`flex items-center gap-3 px-4 h-[57px] border-b border-border shrink-0 overflow-hidden`}>
        <div className="w-8 h-8 rounded-lg bg-white/5 border border-border flex items-center justify-center shrink-0 overflow-hidden">
          <img src="/images/bsd-logo.webp" alt="BSD" className="w-6 h-6 object-contain" />
        </div>
        {!isCollapsed && (
          <div className="overflow-hidden">
            <p className="text-text-primary font-display font-bold text-sm uppercase tracking-wide truncate">BSD Steel</p>
            <p className="text-text-muted text-[9px] uppercase tracking-widest truncate">Management Portal</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 mt-4 px-2 pb-4">
        {!isCollapsed && (
          <p className="text-[9px] text-text-muted uppercase tracking-widest font-bold px-3 mb-2">Navigation</p>
        )}
        {visibleNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              title={isCollapsed ? item.name : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${
                isActive 
                  ? "bg-accent text-white shadow-md shadow-accent/20" 
                  : "text-text-muted hover:bg-white/5 hover:text-text-primary"
              } ${isCollapsed ? "justify-center" : "justify-start"}`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!isCollapsed && (
                <span className="font-medium text-sm truncate">{item.name}</span>
              )}
            </Link>
          );
        })}

        {/* Collapse Button under navigation items */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`flex items-center gap-3 px-3 py-2.5 mt-auto rounded-lg text-text-muted hover:bg-white/5 hover:text-text-primary transition-all duration-200 ${
            isCollapsed ? "justify-center" : "justify-start"
          }`}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {!isCollapsed && (
            <span className="font-medium text-sm">Collapse Sidebar</span>
          )}
        </button>
      </nav>

      {/* User Section at Bottom */}
      {user && (
        <div className="px-3 pb-4 border-t border-border pt-3 relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className={`w-full flex items-center bg-background/50 hover:bg-white/5 border border-transparent hover:border-border/30 rounded-lg px-3 py-2.5 transition-all text-left group ${
              isCollapsed ? "justify-center px-1" : "gap-3"
            }`}
            title={isCollapsed ? user.full_name : undefined}
          >
            <div className="w-7 h-7 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-[10px] font-bold text-accent shrink-0 group-hover:scale-105 transition-transform">
              {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden flex-1">
                <p className="text-text-primary font-semibold text-xs truncate">{user.full_name}</p>
                <p className="text-text-muted text-[9px] uppercase tracking-widest truncate">{user.role?.replace('_', ' ')}</p>
              </div>
            )}
          </button>

          {showProfileMenu && (
            <>
              {/* Click outside backdrop */}
              <div className="fixed inset-0 z-30" onClick={() => setShowProfileMenu(false)} />
              
              {/* Flyout Bubble */}
              <div className={`absolute bottom-full mb-2 bg-panel border border-border rounded-xl shadow-2xl z-40 p-2 animate-in fade-in slide-in-from-bottom-2 duration-200 ${
                isCollapsed ? "left-3 w-44" : "left-3 w-[206px]"
              }`}>
                <div className="px-3 py-2 border-b border-border/50 mb-1">
                  <p className="text-text-primary font-bold text-xs truncate">{user.full_name}</p>
                  <p className="text-text-muted text-[8px] uppercase tracking-widest truncate">{user.role?.replace('_', ' ')}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-500/10 rounded-lg transition-colors uppercase tracking-widest"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
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
