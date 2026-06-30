"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell, Check, Trash2, ArrowLeft, ArrowUpRight,
  AlertTriangle, CheckCircle, Info, Clock, ExternalLink
} from "lucide-react";

import { useNotificationStore, NotificationItem } from "@/store/notificationStore";

export default function NotificationsPage() {
  const router = useRouter();
  const { notifications, markAsRead, markAllAsRead, deleteNotification } = useNotificationStore();
  const [filter, setFilter] = useState<"all" | "unread" | "overdue" | "low_stock">("all");

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAsRead = (id: string) => markAsRead(id);
  const handleMarkAllAsRead = () => markAllAsRead();
  const handleDelete = (id: string) => deleteNotification(id);

  const filteredNotifs = notifications.filter((n) => {
    if (filter === "unread") return !n.isRead;
    if (filter === "overdue") return n.type === "overdue";
    if (filter === "low_stock") return n.type === "low_stock";
    return true;
  });

  const getBadgeStyles = (type: NotificationItem["type"]) => {
    switch (type) {
      case "overdue":
        return { bg: "rgba(208,41,54,0.12)", text: "#D02936", icon: AlertTriangle };
      case "low_stock":
        return { bg: "rgba(244,166,35,0.12)", text: "#F4A623", icon: AlertTriangle };
      case "payment":
        return { bg: "rgba(61,122,107,0.12)", text: "#3D7A6B", icon: CheckCircle };
      default:
        return { bg: "rgba(74,144,226,0.12)", text: "#4A90E2", icon: Info };
    }
  };

  return (
    <div className="flex flex-col min-h-full pb-8">
      {/* Top Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.push("/dashboard")}
          className="p-2.5 bg-panel border border-border text-text-muted hover:text-text-primary hover:border-border/80 rounded-xl transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-display font-bold text-text-primary tracking-wide uppercase">
            Notifications Center
          </h1>
          <p className="text-text-muted text-sm mt-0.5">
            Manage system events, automated alerts, and pending action items
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-2 px-4 py-2.5 bg-panel border border-border text-text-primary font-bold text-xs uppercase tracking-widest rounded-xl hover:border-white/30 transition-all"
          >
            <Check className="w-4 h-4" /> Mark All as Read
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border pb-4">
        {[
          { label: "All Events", value: "all", count: notifications.length },
          { label: "Unread", value: "unread", count: unreadCount },
          { label: "Overdue Invoices", value: "overdue", count: notifications.filter(n => n.type === 'overdue').length },
          { label: "Low Stock Alerts", value: "low_stock", count: notifications.filter(n => n.type === 'low_stock').length },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border flex items-center gap-2 ${
              filter === tab.value
                ? "bg-accent border-accent text-white shadow-md shadow-accent/15"
                : "bg-panel border-border text-text-muted hover:text-text-primary"
            }`}
          >
            {tab.label}
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
              filter === tab.value ? "bg-white/20 text-white" : "bg-background text-text-muted"
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* List container */}
      <div className="bg-panel border border-border rounded-2xl card-shadow overflow-hidden">
        {filteredNotifs.length === 0 ? (
          <div className="text-center py-20 text-text-muted">
            <Bell className="w-12 h-12 mx-auto mb-4 opacity-15 animate-bounce" style={{ animationDuration: '3s' }} />
            <p className="text-sm uppercase tracking-widest font-bold">No notifications in this filter</p>
            <p className="text-xs text-text-muted/70 mt-1">We'll alert you here when new actions are detected.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {filteredNotifs.map((n) => {
              const cfg = getBadgeStyles(n.type);
              const Icon = cfg.icon;
              return (
                <div
                  key={n.id}
                  className={`p-6 transition-colors flex items-start gap-4 hover:bg-white/[0.01] ${
                    !n.isRead ? "bg-accent/[0.02]" : ""
                  }`}
                >
                  {/* Read/Unread Dot Indicator */}
                  <div className="flex flex-col items-center pt-1 shrink-0">
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        !n.isRead ? "bg-accent shadow-[0_0_8px_rgba(208,41,54,0.6)]" : "bg-transparent"
                      }`}
                    />
                  </div>

                  {/* Type Badge Icon */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: cfg.bg }}
                  >
                    <Icon className="w-5 h-5" style={{ color: cfg.text }} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md"
                        style={{ background: cfg.bg, color: cfg.text }}
                      >
                        {n.type.replace("_", " ")}
                      </span>
                      <span className="text-[10px] text-text-muted font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {n.time}
                      </span>
                    </div>
                    <p className={`text-sm ${!n.isRead ? "font-bold text-text-primary" : "text-text-primary/90"}`}>
                      {n.text}
                    </p>
                    <p className="text-xs text-text-muted mt-1 leading-relaxed">
                      {n.subtext}
                    </p>
                  </div>

                  {/* Action group */}
                  <div className="flex items-center gap-2 shrink-0">

                    {!n.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(n.id)}
                        className="p-2 bg-background border border-border text-[#3D7A6B] hover:bg-[#3D7A6B]/10 hover:border-[#3D7A6B]/30 rounded-lg transition-colors"
                        title="Mark as Read"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(n.id)}
                      className="p-2 bg-background border border-border text-text-muted hover:text-critical hover:bg-critical/10 hover:border-critical/30 rounded-lg transition-colors"
                      title="Delete Notification"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
