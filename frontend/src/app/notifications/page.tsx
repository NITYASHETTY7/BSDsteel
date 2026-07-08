"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell, Check, Trash2, ArrowLeft, AlertTriangle,
  CheckCircle2, Info, Clock, Package, MessageSquare,
  ArrowUpRight, BellOff,
} from "lucide-react";
import { useNotificationStore, NotificationItem } from "@/store/notificationStore";

type FilterType = "all" | "unread" | "overdue" | "low_stock" | "payment" | "system";

const TYPE_CONFIG: Record<NotificationItem["type"], {
  label: string;
  icon: React.FC<{ className?: string }>;
  color: string;
  bg: string;
  border: string;
}> = {
  overdue:   { label: "Overdue",   icon: AlertTriangle,   color: "#D02936", bg: "rgba(208,41,54,0.12)",  border: "rgba(208,41,54,0.25)"  },
  low_stock: { label: "Low Stock", icon: Package,         color: "#F4A623", bg: "rgba(244,166,35,0.12)", border: "rgba(244,166,35,0.25)" },
  payment:   { label: "Payment",   icon: CheckCircle2,    color: "#34A878", bg: "rgba(52,168,120,0.12)", border: "rgba(52,168,120,0.25)" },
  system:    { label: "System",    icon: MessageSquare,   color: "#4A90E2", bg: "rgba(74,144,226,0.12)", border: "rgba(74,144,226,0.25)" },
};

export default function NotificationsPage() {
  const router = useRouter();
  const { notifications, markAsRead, markAllAsRead, deleteNotification } = useNotificationStore();
  const [filter, setFilter] = useState<FilterType>("all");

  const unreadCount   = notifications.filter(n => !n.isRead).length;
  const overdueCount  = notifications.filter(n => n.type === "overdue").length;
  const stockCount    = notifications.filter(n => n.type === "low_stock").length;
  const paymentCount  = notifications.filter(n => n.type === "payment").length;
  const systemCount   = notifications.filter(n => n.type === "system").length;

  const filtered = notifications.filter(n => {
    if (filter === "unread")    return !n.isRead;
    if (filter === "overdue")   return n.type === "overdue";
    if (filter === "low_stock") return n.type === "low_stock";
    if (filter === "payment")   return n.type === "payment";
    if (filter === "system")    return n.type === "system";
    return true;
  });

  const TABS: { label: string; value: FilterType; count: number; color?: string }[] = [
    { label: "All Events",     value: "all",       count: notifications.length },
    { label: "Unread",         value: "unread",    count: unreadCount,  color: "#D02936" },
    { label: "Overdue",        value: "overdue",   count: overdueCount, color: "#D02936" },
    { label: "Low Stock",      value: "low_stock", count: stockCount,   color: "#F4A623" },
    { label: "Payments",       value: "payment",   count: paymentCount, color: "#34A878" },
    { label: "System",         value: "system",    count: systemCount,  color: "#4A90E2" },
  ];

  return (
    <div className="flex flex-col min-h-full pb-10">

      {/* ── Page Header ── */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.push("/dashboard")}
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200"
          style={{ background: "rgb(var(--color-panel))", border: "1px solid rgb(var(--color-border))", color: "rgb(var(--color-text-muted))" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgb(var(--color-accent))"; (e.currentTarget as HTMLElement).style.color = "rgb(var(--color-accent))"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgb(var(--color-border))"; (e.currentTarget as HTMLElement).style.color = "rgb(var(--color-text-muted))"; }}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex-1">
          <h1 className="text-xl font-display font-bold text-text-primary tracking-widest uppercase leading-none">
            Notifications Center
          </h1>
          <p className="text-text-muted text-[13px] mt-1">
            Manage system events, automated alerts, and pending action items
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-200"
            style={{ background: "rgb(var(--color-panel))", border: "1px solid rgb(var(--color-border))", color: "rgb(var(--color-text-muted))" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#34A878"; (e.currentTarget as HTMLElement).style.color = "#34A878"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgb(var(--color-border))"; (e.currentTarget as HTMLElement).style.color = "rgb(var(--color-text-muted))"; }}
          >
            <Check className="w-3.5 h-3.5" /> Mark All as Read
          </button>
        )}
      </div>

      {/* ── Main Layout: Filter sidebar + list ── */}
      <div className="flex gap-5 flex-1 min-h-0">

        {/* Filter sidebar */}
        <div
          className="w-44 shrink-0 rounded-2xl p-2 flex flex-col gap-0.5 h-fit"
          style={{ background: "rgb(var(--color-panel))", border: "1px solid rgb(var(--color-border))", boxShadow: "var(--shadow-card)" }}
        >
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-muted/60 px-3 pt-2 pb-1.5">
            Filter by type
          </p>
          {TABS.map(tab => {
            const isActive = filter === tab.value;
            const activeColor = tab.color ?? "rgb(var(--color-accent))";
            return (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all duration-150 text-[12px] font-medium"
                style={{
                  background: isActive ? `${activeColor}15` : "transparent",
                  color: isActive ? activeColor : "rgb(var(--color-text-muted))",
                  fontWeight: isActive ? 600 : 400,
                  border: isActive ? `1px solid ${activeColor}25` : "1px solid transparent",
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "rgb(var(--color-border)/0.35)"; }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <span>{tab.label}</span>
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-md min-w-[20px] text-center"
                  style={{
                    background: isActive ? `${activeColor}20` : "rgb(var(--surface-sunken))",
                    color: isActive ? activeColor : "rgb(var(--color-text-muted))",
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Notification list */}
        <div
          className="flex-1 rounded-2xl overflow-hidden flex flex-col"
          style={{ background: "rgb(var(--color-panel))", border: "1px solid rgb(var(--color-border))", boxShadow: "var(--shadow-card)" }}
        >
          {/* Empty state */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-text-muted gap-3">
              <BellOff className="w-9 h-9 opacity-20" />
              <p className="text-[12px] uppercase tracking-widest opacity-50 font-semibold">No notifications here</p>
              <p className="text-[11px] opacity-40">We'll alert you when new events are detected.</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "rgb(var(--color-border)/0.4)" }}>
              {filtered.map(n => {
                const cfg = TYPE_CONFIG[n.type];
                const Icon = cfg.icon;
                return (
                  <div
                    key={n.id}
                    className="flex items-start gap-4 px-5 py-4 transition-colors"
                    style={{ background: !n.isRead ? `${cfg.color}05` : "" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgb(var(--surface-sunken))")}
                    onMouseLeave={e => (e.currentTarget.style.background = !n.isRead ? `${cfg.color}05` : "")}
                  >
                    {/* Unread dot */}
                    <div className="pt-1.5 shrink-0 w-3 flex justify-center">
                      {!n.isRead && (
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ background: cfg.color, boxShadow: `0 0 6px ${cfg.color}80` }}
                        />
                      )}
                    </div>

                    {/* Type icon */}
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
                    >
                      <span style={{ color: cfg.color }}>
                        <Icon className="w-4 h-4" />
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Type badge + time */}
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span
                          className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md"
                          style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
                        >
                          {cfg.label}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-text-muted font-mono">
                          <Clock className="w-2.5 h-2.5" />
                          {n.time}
                        </span>
                        {!n.isRead && (
                          <span
                            className="text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
                            style={{ background: "rgba(208,41,54,0.10)", color: "#D02936" }}
                          >
                            New
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <p
                        className="text-[13px] leading-snug mb-1"
                        style={{ fontWeight: n.isRead ? 400 : 600, color: "rgb(var(--color-text-primary))" }}
                      >
                        {n.text}
                      </p>

                      {/* Body */}
                      <p className="text-[12px] text-text-muted leading-relaxed">{n.subtext}</p>

                      {/* CTA link */}
                      {n.link && (
                        <button
                          onClick={() => router.push(n.link)}
                          className="flex items-center gap-1 mt-2 text-[10px] font-bold uppercase tracking-wider transition-opacity"
                          style={{ color: cfg.color }}
                          onMouseEnter={e => (e.currentTarget.style.opacity = "0.7")}
                          onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                        >
                          View details <ArrowUpRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                      {!n.isRead && (
                        <button
                          onClick={() => markAsRead(n.id)}
                          title="Mark as read"
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150"
                          style={{ background: "rgb(var(--surface-sunken))", border: "1px solid rgb(var(--color-border))", color: "#34A878" }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(52,168,120,0.12)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(52,168,120,0.30)"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgb(var(--surface-sunken))"; (e.currentTarget as HTMLElement).style.borderColor = "rgb(var(--color-border))"; }}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(n.id)}
                        title="Dismiss"
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150"
                        style={{ background: "rgb(var(--surface-sunken))", border: "1px solid rgb(var(--color-border))", color: "rgb(var(--color-text-muted))" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(208,41,54,0.10)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(208,41,54,0.28)"; (e.currentTarget as HTMLElement).style.color = "#D02936"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgb(var(--surface-sunken))"; (e.currentTarget as HTMLElement).style.borderColor = "rgb(var(--color-border))"; (e.currentTarget as HTMLElement).style.color = "rgb(var(--color-text-muted))"; }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer */}
          {filtered.length > 0 && (
            <div
              className="px-5 py-3 flex items-center justify-between mt-auto"
              style={{ borderTop: "1px solid rgb(var(--color-border))", background: "rgb(var(--surface-sunken))" }}
            >
              <p className="text-[10px] text-text-muted">
                <span className="font-semibold text-text-primary">{filtered.length}</span> notification{filtered.length !== 1 ? "s" : ""}
                {unreadCount > 0 && <span className="ml-2" style={{ color: "#D02936" }}>· {unreadCount} unread</span>}
              </p>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[10px] font-bold uppercase tracking-widest transition-opacity"
                  style={{ color: "#34A878" }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = "0.7")}
                  onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                >
                  Mark all read
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
