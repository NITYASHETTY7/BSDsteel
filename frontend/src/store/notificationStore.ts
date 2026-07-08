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
    link: "/inventory/1",
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
    link: "/inventory/2",
  },
  {
    id: "notif-7",
    type: "overdue",
    text: "Invoice #INV-1038 for Reliance Industries is overdue",
    subtext: "Outstanding balance: ₹4,80,000. Due date was 10 Jun 2026.",
    time: "3 days ago",
    isRead: true,
    link: "/receivables",
  },
  {
    id: "notif-8",
    type: "payment",
    text: "Payment of ₹1,10,000 received from Shield Logistics",
    subtext: "Partial payment applied to invoice #INV-1035. Remaining: ₹40,000.",
    time: "4 days ago",
    isRead: true,
    link: "/receivables",
  },
  {
    id: "notif-9",
    type: "low_stock",
    text: "Stock low on SKU: CRC-0.8-1000",
    subtext: "Current stock is 2.1 Tonnes, critically below safety threshold of 6.0 Tonnes.",
    time: "5 days ago",
    isRead: true,
    link: "/inventory/3",
  },
  {
    id: "notif-10",
    type: "system",
    text: "New user login detected from unfamiliar device",
    subtext: "User 'accounts_team' logged in from IP 103.21.58.12 at 09:14 AM. Verify if authorised.",
    time: "5 days ago",
    isRead: true,
    link: "/settings",
  },
  {
    id: "notif-11",
    type: "overdue",
    text: "Invoice #INV-1031 for Oscorp Holdings is 60+ days overdue",
    subtext: "Outstanding balance: ₹1,95,000. Immediate follow-up recommended.",
    time: "6 days ago",
    isRead: true,
    link: "/receivables",
  },
  {
    id: "notif-12",
    type: "payment",
    text: "Full payment received from Tata Steel Ltd",
    subtext: "Amount: ₹2,70,000 via NEFT. Invoice #INV-1029 marked as Paid.",
    time: "7 days ago",
    isRead: true,
    link: "/receivables",
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
