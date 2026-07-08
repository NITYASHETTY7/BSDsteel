"use client";

import { useThemeStore } from "@/store/themeStore";
import { Bell, Sun, Moon, Layers } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";



const themeConfig: Record<string, { label: string; Icon: React.FC<{ className?: string }> }> = {
  "neon-dark":    { label: "Neon Dark",    Icon: ({ className }) => <Moon    className={className} /> },
  "classic-light":{ label: "Classic Light", Icon: ({ className }) => <Sun     className={className} /> },
  "midnight-blue":{ label: "Midnight Blue", Icon: ({ className }) => <Layers  className={className} /> },
};

export default function Topbar() {
  const { theme, setTheme } = useThemeStore();
  const router = useRouter();
  const [showNotif, setShowNotif] = useState(false);

  const cycleTheme = () => {
    if (theme === "neon-dark")     setTheme("classic-light");
    else if (theme === "classic-light") setTheme("midnight-blue");
    else setTheme("neon-dark");
  };

  const notifications = [
    { id: 1, text: "Larsen & Toubro Ltd overdue balance: ₹2,40,000", time: "2h ago",  dot: "#E11D48" },
    { id: 2, text: "New payment received from Acme Corp",             time: "4h ago",  dot: "#34A878" },
    { id: 3, text: "Stock low on HRC-1.6-1250",                      time: "1d ago",  dot: "#F4A623" },
  ];

  const ThemeIcon = themeConfig[theme]?.Icon ?? Sun;
  const themeLabel = themeConfig[theme]?.label ?? theme;

  return (
    <header
      className="h-[57px] flex items-center justify-between px-5 shrink-0 z-30 relative print:hidden"
      style={{
        background: "rgb(var(--color-panel))",
        boxShadow: "0 1px 0 rgb(var(--color-border))",
      }}
    >
      {/* ── Left: empty flex to maintain header balance ── */}
      <div className="flex-1" />

      {/* ── Right: Controls ── */}
      <div className="flex items-center gap-1">

        {/* Theme cycle button — click to cycle through themes */}
        <button
          onClick={cycleTheme}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 text-text-muted hover:text-text-primary group"
          style={{ border: "1px solid transparent" }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "rgb(var(--color-border)/0.4)";
            e.currentTarget.style.borderColor = "rgb(var(--color-border))";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "";
            e.currentTarget.style.borderColor = "transparent";
          }}
          title={`Theme: ${themeLabel} — click to switch`}
        >
          <span style={{ color: theme === "midnight-blue" ? "#38BDF8" : theme === "classic-light" ? "#D02936" : "#94A3B8" }}>
            <ThemeIcon className="w-[15px] h-[15px] transition-transform duration-300 group-hover:rotate-12" />
          </span>
          <span className="text-[11px] font-semibold tracking-wide hidden md:inline">
            {themeLabel}
          </span>
        </button>

        {/* Divider */}
        <div className="w-px h-4 mx-1" style={{ background: "rgb(var(--color-border))" }} />

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => { setShowNotif(!showNotif); }}
            className="relative p-2 rounded-lg text-text-muted hover:text-text-primary transition-all duration-200"
            onMouseEnter={e => (e.currentTarget.style.background = "rgb(var(--color-border)/0.4)")}
            onMouseLeave={e => (e.currentTarget.style.background = "")}
            aria-label="Notifications"
          >
            <Bell className="w-[15px] h-[15px]" />
            {/* Unread dot */}
            <span
              className="absolute top-1.5 right-1.5 w-[6px] h-[6px] rounded-full animate-pulse"
              style={{ background: "rgb(var(--color-accent))", boxShadow: "0 0 0 1.5px rgb(var(--color-panel))" }}
            />
          </button>

          {showNotif && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotif(false)} />
              <div
                className="absolute right-0 top-full mt-2 w-[300px] rounded-xl z-50 overflow-hidden"
                style={{
                  background: "rgb(var(--color-panel))",
                  border: "1px solid rgb(var(--color-border))",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.22)",
                  animation: "fadeIn 0.15s ease",
                }}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: "1px solid rgb(var(--color-border))" }}>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-primary">
                    Notifications
                  </p>
                  <span
                    className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{ background: "rgb(var(--color-accent)/0.12)", color: "rgb(var(--color-accent))" }}
                  >
                    {notifications.length} new
                  </span>
                </div>

                {/* Items */}
                {notifications.map((n, idx) => (
                  <div
                    key={n.id}
                    className="flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors"
                    style={{ borderBottom: idx < notifications.length - 1 ? "1px solid rgb(var(--color-border)/0.4)" : "none", borderLeft: "none", paddingLeft: "16px" }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = "rgb(var(--color-border)/0.25)";
                      e.currentTarget.style.borderLeft = "2px solid " + n.dot;
                      e.currentTarget.style.paddingLeft = "14px";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = "";
                      e.currentTarget.style.borderLeft = "none";
                      e.currentTarget.style.paddingLeft = "16px";
                    }}
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                      style={{ background: n.dot }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-text-primary font-medium leading-snug">{n.text}</p>
                      <p className="text-[10px] text-text-muted mt-0.5">{n.time}</p>
                    </div>
                  </div>
                ))}

                {/* Footer */}
                <div
                  className="px-4 py-2.5"
                  style={{ background: "rgb(var(--surface-sunken))" }}
                >
                  <button
                    onClick={() => { setShowNotif(false); router.push("/notifications"); }}
                    className="text-[10px] font-bold uppercase tracking-widest w-full text-center transition-colors"
                    style={{ color: "rgb(var(--color-accent))" }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = "0.75")}
                    onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
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
