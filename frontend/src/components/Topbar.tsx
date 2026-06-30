"use client";

import { useThemeStore } from "@/store/themeStore";
import { Bell, Palette } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";

const pageNames: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/inventory': 'Inventory',
  '/receivables': 'Accounts Receivable',
  '/reports': 'Reports & Analytics',
  '/settings': 'Settings',
  '/notifications': 'Notifications',
};

export default function Topbar() {
  const { theme, setTheme } = useThemeStore();
  const router = useRouter();
  const pathname = usePathname();
  const [showNotif, setShowNotif] = useState(false);

  const cycleTheme = () => {
    if (theme === 'neon-dark') setTheme('classic-light');
    else if (theme === 'classic-light') setTheme('midnight-blue');
    else setTheme('neon-dark');
  };

  const pageName = Object.entries(pageNames).find(([key]) => pathname.startsWith(key))?.[1] || 'BSD Steel';

  const notifications = [
    { id: 1, text: 'Larsen & Toubro Ltd overdue balance: ₹2,40,000', time: '2h ago', dot: 'bg-critical' },
    { id: 2, text: 'New payment received from Acme Corp', time: '4h ago', dot: 'bg-[#3D7A6B]' },
    { id: 3, text: 'Stock low on HRC-1.6-1250', time: '1d ago', dot: 'bg-warning' },
  ];

  return (
    <header className="h-[57px] bg-panel border-b border-border flex items-center justify-between px-6 shrink-0 z-30 relative print:hidden">
      {/* Left: Empty or placeholder */}
      <div className="flex items-center gap-4">
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Theme Cycler Button */}
        <button
          onClick={cycleTheme}
          className="p-2 text-text-muted hover:text-text-primary hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2 mr-1 group"
          title={`Theme: ${theme}. Click to change.`}
        >
          <Palette className="w-4 h-4 transition-transform group-hover:rotate-12" style={{
            color: theme === 'midnight-blue' ? '#38BDF8' : '#D02936'
          }} />
          <span className="text-[10px] uppercase font-bold tracking-widest hidden md:inline-block">
            {theme === 'neon-dark' && 'Neon Dark'}
            {theme === 'classic-light' && 'Classic Light'}
            {theme === 'midnight-blue' && 'Midnight Blue'}
          </span>
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-border mx-1" />

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotif(!showNotif)}
            className="relative p-2 text-text-muted hover:text-text-primary hover:bg-white/5 rounded-lg transition-colors"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-accent rounded-full" />
          </button>
          {showNotif && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotif(false)} />
              <div className="absolute right-0 top-full mt-2 w-72 bg-panel border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                  <p className="text-text-primary font-bold text-xs uppercase tracking-widest">Notifications</p>
                  <span className="text-[9px] bg-accent/10 text-accent px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{notifications.length} new</span>
                </div>
                {notifications.map(n => (
                  <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors border-b border-border/50 last:border-0 cursor-pointer">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${n.dot}`} />
                    <div>
                      <p className="text-text-primary text-xs font-medium">{n.text}</p>
                      <p className="text-text-muted text-[10px] mt-0.5">{n.time}</p>
                    </div>
                  </div>
                ))}
                <div className="px-4 py-2.5 bg-background/40">
                  <button 
                    onClick={() => { setShowNotif(false); router.push("/notifications"); }}
                    className="text-[10px] text-accent uppercase tracking-widest font-bold w-full text-center hover:text-accent/80 transition-colors"
                  >
                    View All Notifications
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
