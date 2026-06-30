import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface NotificationItem {
  id: string;
  type: "overdue" | "low_stock" | "payment" | "system";
  text: string;
  subtext: string;
  time: string;
  isRead: boolean;
  link: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    type: "overdue",
    text: "Invoice #INV-1042 for Larsen & Toubro Ltd is overdue",
    subtext: "Outstanding balance: ₹2,40,000. Due date was 15 Jun 2026.",
    time: "2 hours ago",
    isRead: false,
    link: "/receivables",
  },
  {
    id: "notif-2",
    type: "payment",
    text: "New payment received from Acme Corp",
    subtext: "Amount: ₹2,50,000 via UPI. Applied to invoice #INV-1039.",
    time: "4 hours ago",
    isRead: false,
    link: "/receivables",
  },
  {
    id: "notif-3",
    type: "low_stock",
    text: "Stock low on SKU: HRC-1.6-1250",
    subtext: "Current stock is 4.5 Tonnes, which is below the safety threshold of 10.0 Tonnes.",
    time: "1 day ago",
    isRead: false,
    link: "/inventory/1", // Mock detail link
  },
  {
    id: "notif-4",
    type: "system",
    text: "WhatsApp API automated reminder dispatched to Wayne Enterprises",
    subtext: "Delivery status: Delivered successfully via WhatsApp Business API.",
    time: "1 day ago",
    isRead: true,
    link: "/receivables",
  },
  {
    id: "notif-5",
    type: "system",
    text: "Monthly automated data export compiled",
    subtext: "Compliance ledger for GSTIN audit is ready for download in PDF/Excel formats.",
    time: "2 days ago",
    isRead: true,
    link: "/reports",
  },
  {
    id: "notif-6",
    type: "low_stock",
    text: "Stock low on SKU: HRS-2.5-1500",
    subtext: "Current stock is 6.2 Sheets, below the safety threshold of 8.0 Sheets.",
    time: "3 days ago",
    isRead: true,
    link: "/inventory/2", // Mock detail link
  },
];

interface NotificationState {
  notifications: NotificationItem[];
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: INITIAL_NOTIFICATIONS,
      markAsRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          ),
        })),
      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        })),
      deleteNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),
    }),
    {
      name: 'notification-storage',
    }
  )
);
