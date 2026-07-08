"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Calendar, PhoneCall, Clock, Wallet, Users, FileText,
  AlertTriangle, TrendingUp, TrendingDown, ArrowUpRight, CheckCircle2,
  Database, RefreshCw, Search, Calendar as CalendarIcon, ChevronDown, DollarSign, Archive
} from "lucide-react";
import Link from "next/link";
import { GaugeChart } from "@/components/dashboard/GaugeChart";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { useInvoices, useCustomers } from "@/hooks/useReceivables";
import { useAuthStore } from "@/store/authStore";
import { CustomDatePicker } from "@/components/ui/CustomDatePicker";
import SlidePanel from "@/components/ui/SlidePanel";

export default function DashboardPage() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState("Monthly");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isActivityDrawerOpen, setIsActivityDrawerOpen] = useState(false);
  const { user } = useAuthStore();
  const filters = ["Today", "Yesterday", "Weekly", "Monthly"];

  const { data: invoices, isLoading: isLoadingInvoices } = useInvoices();
  const { data: customers, isLoading: isLoadingCustomers } = useCustomers();

  const kpis = useMemo(() => {
    // Always use rich mock values per filter — real API data is supplementary
    if (selectedDate)                      return { totalOutstanding: 125000,  collectedAmount: 40000,   activeCustomers: 12,  invoicesIssued: 8,   pendingCollections: 3  };
    if (activeFilter === "Today")          return { totalOutstanding: 285000,  collectedAmount: 420000,  activeCustomers: 18,  invoicesIssued: 24,  pendingCollections: 5  };
    if (activeFilter === "Yesterday")      return { totalOutstanding: 310000,  collectedAmount: 380000,  activeCustomers: 22,  invoicesIssued: 31,  pendingCollections: 7  };
    if (activeFilter === "Weekly")         return { totalOutstanding: 920000,  collectedAmount: 1650000, activeCustomers: 68,  invoicesIssued: 142, pendingCollections: 18 };
    /* Monthly */                          return { totalOutstanding: 2840000, collectedAmount: 5200000, activeCustomers: 184, invoicesIssued: 412, pendingCollections: 34 };
  }, [activeFilter, selectedDate]);

  // Invoice aging — always mock per filter so all buckets are populated
  const agingBarData = useMemo(() => {
    if (selectedDate)                 return [{ label: "< 30 Days", count: 3,  amount: 120000, color: "#F4A623" }, { label: "30–60 Days", count: 2,  amount: 68000,  color: "#34A878" }, { label: "90+ Days", count: 1,  amount: 32000,  color: "#D02936" }];
    if (activeFilter === "Today")     return [{ label: "< 30 Days", count: 6,  amount: 185000, color: "#F4A623" }, { label: "30–60 Days", count: 3,  amount: 92000,  color: "#34A878" }, { label: "90+ Days", count: 2,  amount: 48000,  color: "#D02936" }];
    if (activeFilter === "Yesterday") return [{ label: "< 30 Days", count: 5,  amount: 112000, color: "#F4A623" }, { label: "30–60 Days", count: 3,  amount: 74000,  color: "#34A878" }, { label: "90+ Days", count: 1,  amount: 38000,  color: "#D02936" }];
    if (activeFilter === "Weekly")    return [{ label: "< 30 Days", count: 14, amount: 385000, color: "#F4A623" }, { label: "30–60 Days", count: 8,  amount: 248000, color: "#34A878" }, { label: "90+ Days", count: 4,  amount: 112000, color: "#D02936" }];
    /* Monthly */                     return [{ label: "< 30 Days", count: 21, amount: 680000, color: "#F4A623" }, { label: "30–60 Days", count: 13, amount: 445000, color: "#34A878" }, { label: "90+ Days", count: 7,  amount: 215000, color: "#D02936" }];
  }, [activeFilter, selectedDate]);

  // Format time helper
  const formatActivityTime = (dateStr: string) => {
    const d = new Date(dateStr);
    if (d.toDateString() === new Date().toDateString()) {
      return `Today, ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  // Recent activities — always mock per filter
  const recentActivities = useMemo(() => {
    if (activeFilter === "Today" || selectedDate) return [
      { id: '1', name: 'Acme Corp',         action: 'Payment Received', time: 'Today, 10:48 AM',  isPaid: true,  amount: '₹1,80,000' },
      { id: '2', name: 'Larsen & Toubro',   action: 'Invoice Issued',   time: 'Today, 09:30 AM',  isPaid: false, amount: '₹2,40,000' },
      { id: '3', name: 'Wayne Enterprises', action: 'Payment Received', time: 'Today, 08:55 AM',  isPaid: true,  amount: '₹95,000'   },
      { id: '4', name: 'Tata Steel Ltd',    action: 'Invoice Issued',   time: 'Today, 08:10 AM',  isPaid: false, amount: '₹3,20,000' },
    ];
    if (activeFilter === "Yesterday") return [
      { id: '1', name: 'Shield Logistics',  action: 'Payment Received', time: 'Yesterday, 5:45 PM',  isPaid: true,  amount: '₹1,10,000' },
      { id: '2', name: 'Oscorp Holdings',   action: 'Invoice Issued',   time: 'Yesterday, 3:20 PM',  isPaid: false, amount: '₹2,20,000' },
      { id: '3', name: 'Stark Industries',  action: 'Payment Received', time: 'Yesterday, 1:00 PM',  isPaid: true,  amount: '₹1,50,000' },
      { id: '4', name: 'LexCorp Pvt Ltd',   action: 'Invoice Issued',   time: 'Yesterday, 10:30 AM', isPaid: false, amount: '₹80,000'   },
    ];
    if (activeFilter === "Weekly") return [
      { id: '1', name: 'Acme Corp',         action: 'Payment Received', time: 'Today, 10:48 AM',    isPaid: true,  amount: '₹1,80,000' },
      { id: '2', name: 'Larsen & Toubro',   action: 'Invoice Issued',   time: 'Today, 09:30 AM',    isPaid: false, amount: '₹2,40,000' },
      { id: '3', name: 'Shield Logistics',  action: 'Payment Received', time: 'Yesterday, 5:45 PM', isPaid: true,  amount: '₹1,10,000' },
      { id: '4', name: 'Stark Industries',  action: 'Invoice Issued',   time: '3 days ago',         isPaid: false, amount: '₹3,50,000' },
    ];
    // Monthly
    return [
      { id: '1', name: 'Acme Corp',         action: 'Payment Received', time: 'Today, 10:48 AM', isPaid: true,  amount: '₹1,80,000' },
      { id: '2', name: 'Larsen & Toubro',   action: 'Invoice Issued',   time: 'Yesterday',       isPaid: false, amount: '₹2,40,000' },
      { id: '3', name: 'Wayne Enterprises', action: 'Payment Received', time: '3 days ago',      isPaid: true,  amount: '₹3,50,000' },
      { id: '4', name: 'Tata Steel Ltd',    action: 'Invoice Issued',   time: '5 days ago',      isPaid: false, amount: '₹1,25,000' },
    ];
  }, [activeFilter, selectedDate]);

  // All activities for slide drawer — always mock
  const allActivities = useMemo(() => {
    if (activeFilter === "Today" || selectedDate) return [
      { id: '1', name: 'Acme Corp',         action: 'Payment Received', time: 'Today, 10:48 AM', isPaid: true,  amount: '₹1,80,000' },
      { id: '2', name: 'Larsen & Toubro',   action: 'Invoice Issued',   time: 'Today, 09:30 AM', isPaid: false, amount: '₹2,40,000' },
      { id: '3', name: 'Wayne Enterprises', action: 'Payment Received', time: 'Today, 08:55 AM', isPaid: true,  amount: '₹95,000'   },
      { id: '4', name: 'Tata Steel Ltd',    action: 'Invoice Issued',   time: 'Today, 08:10 AM', isPaid: false, amount: '₹3,20,000' },
      { id: '5', name: 'Mahindra & Mah.',   action: 'Payment Received', time: 'Today, 07:40 AM', isPaid: true,  amount: '₹2,10,000' },
    ];
    if (activeFilter === "Yesterday") return [
      { id: '1', name: 'Shield Logistics',  action: 'Payment Received', time: 'Yesterday, 5:45 PM',  isPaid: true,  amount: '₹1,10,000' },
      { id: '2', name: 'Oscorp Holdings',   action: 'Invoice Issued',   time: 'Yesterday, 3:20 PM',  isPaid: false, amount: '₹2,20,000' },
      { id: '3', name: 'Stark Industries',  action: 'Payment Received', time: 'Yesterday, 1:00 PM',  isPaid: true,  amount: '₹1,50,000' },
      { id: '4', name: 'LexCorp Pvt Ltd',   action: 'Invoice Issued',   time: 'Yesterday, 10:30 AM', isPaid: false, amount: '₹80,000'   },
      { id: '5', name: 'Reliance Ind.',     action: 'Invoice Issued',   time: 'Yesterday, 9:00 AM',  isPaid: false, amount: '₹4,20,000' },
    ];
    if (activeFilter === "Weekly") return [
      { id: '1', name: 'Acme Corp',         action: 'Payment Received', time: 'Today, 10:48 AM',    isPaid: true,  amount: '₹1,80,000' },
      { id: '2', name: 'Larsen & Toubro',   action: 'Invoice Issued',   time: 'Today, 09:30 AM',    isPaid: false, amount: '₹2,40,000' },
      { id: '3', name: 'Shield Logistics',  action: 'Payment Received', time: 'Yesterday, 5:45 PM', isPaid: true,  amount: '₹1,10,000' },
      { id: '4', name: 'Stark Industries',  action: 'Invoice Issued',   time: '3 days ago',         isPaid: false, amount: '₹3,50,000' },
      { id: '5', name: 'Oscorp Holdings',   action: 'Payment Received', time: '4 days ago',         isPaid: true,  amount: '₹2,75,000' },
      { id: '6', name: 'Wayne Enterprises', action: 'Invoice Issued',   time: '5 days ago',         isPaid: false, amount: '₹1,60,000' },
    ];
    // Monthly
    return [
      { id: '1', name: 'Acme Corp',         action: 'Payment Received', time: 'Today, 10:48 AM', isPaid: true,  amount: '₹1,80,000' },
      { id: '2', name: 'Larsen & Toubro',   action: 'Invoice Issued',   time: 'Yesterday',       isPaid: false, amount: '₹2,40,000' },
      { id: '3', name: 'Wayne Enterprises', action: 'Payment Received', time: '3 days ago',      isPaid: true,  amount: '₹3,50,000' },
      { id: '4', name: 'Tata Steel Ltd',    action: 'Invoice Issued',   time: '5 days ago',      isPaid: false, amount: '₹1,25,000' },
      { id: '5', name: 'Mahindra & Mah.',   action: 'Payment Received', time: '8 days ago',      isPaid: true,  amount: '₹2,10,000' },
      { id: '6', name: 'Reliance Ind.',     action: 'Invoice Issued',   time: '10 days ago',     isPaid: false, amount: '₹4,80,000' },
      { id: '7', name: 'Shield Logistics',  action: 'Payment Received', time: '14 days ago',     isPaid: true,  amount: '₹90,000'   },
      { id: '8', name: 'Oscorp Holdings',   action: 'Invoice Issued',   time: '18 days ago',     isPaid: false, amount: '₹1,95,000' },
    ];
  }, [activeFilter, selectedDate]);

  // Follow-ups — always mock per filter
  const followUps = useMemo(() => {
    if (activeFilter === "Today") return [
      { id: '1', client: 'Larsen & Toubro Ltd',  type: 'Collections', amount: '₹2.4L', daysOverdue: 8,  urgency: 'low'  as const },
      { id: '2', client: 'Tata Steel Ltd',       type: 'Collections', amount: '₹1.8L', daysOverdue: 14, urgency: 'low'  as const },
      { id: '3', client: 'Mahindra & Mahindra',  type: 'Collections', amount: '₹3.1L', daysOverdue: 22, urgency: 'low'  as const },
    ];
    if (activeFilter === "Yesterday") return [
      { id: '1', client: 'Larsen & Toubro Ltd',  type: 'Collections', amount: '₹2.4L', daysOverdue: 9,  urgency: 'low'  as const },
      { id: '2', client: 'Oscorp Holdings',      type: 'Collections', amount: '₹1.6L', daysOverdue: 38, urgency: 'mid'  as const },
      { id: '3', client: 'Tata Steel Ltd',       type: 'Collections', amount: '₹2.9L', daysOverdue: 55, urgency: 'mid'  as const },
    ];
    if (activeFilter === "Weekly") return [
      { id: '1', client: 'Larsen & Toubro Ltd',  type: 'Collections', amount: '₹2.4L', daysOverdue: 16, urgency: 'low'  as const },
      { id: '2', client: 'Mahindra & Mahindra',  type: 'Collections', amount: '₹3.1L', daysOverdue: 42, urgency: 'mid'  as const },
      { id: '3', client: 'Reliance Industries',  type: 'Collections', amount: '₹4.2L', daysOverdue: 68, urgency: 'high' as const },
    ];
    // Monthly / selectedDate
    return [
      { id: '1', client: 'Larsen & Toubro Ltd',  type: 'Collections', amount: '₹2.4L', daysOverdue: 16, urgency: 'low'  as const },
      { id: '2', client: 'Acme Corp',            type: 'Collections', amount: '₹3.0L', daysOverdue: 41, urgency: 'mid'  as const },
      { id: '3', client: 'Reliance Industries',  type: 'Collections', amount: '₹5.5L', daysOverdue: 78, urgency: 'high' as const },
    ];
  }, [activeFilter, selectedDate]);

  const formatCurrency = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000)   return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000)     return `₹${(val / 1000).toFixed(1)}k`;
    return `₹${val}`;
  };

  const isLoading = isLoadingInvoices || isLoadingCustomers;

  let stockValue = "₹2.10Cr";
  let stockTrend = "+0.1% DoD";
  let turnover = "3.2x";
  let turnoverTrend = "Steady";
  let outstandingTrend = "↑ 1.2% vs Yesterday";
  let outstandingTrendUp = false;

  if (activeFilter === "Today")          { stockValue = "₹2.18Cr"; stockTrend = "+0.3% DoD";  turnover = "3.4x"; turnoverTrend = "Steady";    outstandingTrend = "↑ 0.6% vs Yesterday";    outstandingTrendUp = false; }
  else if (activeFilter === "Yesterday") { stockValue = "₹2.25Cr"; stockTrend = "+0.5% DoD";  turnover = "3.6x"; turnoverTrend = "Steady";    outstandingTrend = "↑ 0.8% vs Previous Day"; outstandingTrendUp = false; }
  else if (activeFilter === "Weekly")    { stockValue = "₹2.60Cr"; stockTrend = "+1.5% WoW";  turnover = "4.2x"; turnoverTrend = "Improving"; outstandingTrend = "↓ 3.4% vs Last Week";    outstandingTrendUp = true;  }
  else if (activeFilter === "Monthly")   { stockValue = "₹3.10Cr"; stockTrend = "+4.2% MoM";  turnover = "4.8x"; turnoverTrend = "Optimal";   outstandingTrend = "↓ 7.1% vs Last Month";   outstandingTrendUp = true;  }
  else if (selectedDate)                 { stockValue = "₹2.15Cr"; stockTrend = "Stable";     turnover = "3.4x"; turnoverTrend = "Stable";    outstandingTrend = "↑ 1.1% vs Prev Day";     outstandingTrendUp = false; }

  const kpiCards = [
    {
      value: formatCurrency(kpis.totalOutstanding),
      label: "Total Outstanding Receivables",
      icon: Wallet,
      iconColor: outstandingTrendUp ? "#3D7A6B" : "#D02936",
      iconBg: outstandingTrendUp ? "rgba(61,122,107,0.12)" : "rgba(208,41,54,0.12)",
      trend: outstandingTrend,
      trendUp: outstandingTrendUp,
    },
    {
      value: stockValue,
      label: "Current Stock Value",
      icon: Database,
      iconColor: "#3D7A6B",
      iconBg: "rgba(61,122,107,0.12)",
      trend: stockTrend,
      trendUp: stockTrend.includes('-') ? false : true,
    },
    {
      value: turnover,
      label: "Inventory Turnover",
      icon: RefreshCw,
      iconColor: "#4A90E2",
      iconBg: "rgba(74,144,226,0.12)",
      trend: turnoverTrend,
      trendUp: true,
    },
    {
      value: kpis.pendingCollections.toString(),
      label: "Pending Collection Accounts",
      icon: AlertTriangle,
      iconColor: "#F4A623",
      iconBg: "rgba(244,166,35,0.12)",
      trend: "Needs action",
      trendUp: false,
    },
  ];

  let collectionTarget = 2000000;
  const gaugeTitle = "Collection Progress";
  if (activeFilter === "Today")          { collectionTarget = 600000;  }
  else if (activeFilter === "Yesterday") { collectionTarget = 600000;  }
  else if (activeFilter === "Weekly")    { collectionTarget = 2500000; }
  else if (activeFilter === "Monthly")   { collectionTarget = 8000000; }
  if (selectedDate)                      { collectionTarget = 200000;  }

  return (
    <div className="flex flex-col min-h-full pb-8">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h1 className="text-xl font-display font-bold tracking-widest text-text-primary uppercase leading-none">
            Dashboard
          </h1>
          <p className="text-text-muted text-[13px] mt-1.5">
            Welcome back,{" "}
            <span className="text-text-primary font-semibold">{user?.full_name || "User"}</span>
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2">
          <div
            className="flex items-center p-1 gap-0.5 rounded-xl"
            style={{ background: "rgb(var(--color-panel))", border: "1px solid rgb(var(--color-border))" }}
          >
            {filters.map(f => (
              <button
                key={f}
                onClick={() => { setActiveFilter(f); setSelectedDate(null); }}
                className="px-3.5 py-1.5 text-[11px] font-bold rounded-lg transition-all duration-200 uppercase tracking-wider"
                style={
                  activeFilter === f
                    ? { background: "rgb(var(--color-accent))", color: "#fff", boxShadow: "0 2px 8px rgba(208,41,54,0.30)" }
                    : { color: "rgb(var(--color-text-muted))" }
                }
                onMouseEnter={e => { if (activeFilter !== f) e.currentTarget.style.color = "rgb(var(--color-text-primary))"; }}
                onMouseLeave={e => { if (activeFilter !== f) e.currentTarget.style.color = "rgb(var(--color-text-muted))"; }}
              >
                {f}
              </button>
            ))}
          </div>
          <div style={{ background: "rgb(var(--color-panel))", border: "1px solid rgb(var(--color-border))", borderRadius: "12px" }}>
            <CustomDatePicker
              selectedDate={selectedDate}
              onDateSelect={(date) => { setSelectedDate(date); setActiveFilter(""); }}
            />
          </div>
        </div>
      </div>

      {/* ── KPI Cards Row ── */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {kpiCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className="relative overflow-hidden rounded-2xl p-5 group cursor-default"
              style={{
                background: "rgb(var(--color-panel))",
                border: "1px solid rgb(var(--color-border))",
                boxShadow: "var(--shadow-card)",
                transition: "transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease",
                zIndex: 10,
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-card-hover)";
                (e.currentTarget as HTMLDivElement).style.borderColor = `${card.iconColor}40`;
                (e.currentTarget as HTMLDivElement).style.zIndex = "20";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.transform = "";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-card)";
                (e.currentTarget as HTMLDivElement).style.borderColor = "rgb(var(--color-border))";
                (e.currentTarget as HTMLDivElement).style.zIndex = "10";
              }}
            >
              {/* Top color bar */}
              <div
                className="absolute top-0 left-0 w-full h-[3px] rounded-t-2xl"
                style={{ background: `linear-gradient(90deg, ${card.iconColor}00, ${card.iconColor}90, ${card.iconColor}00)` }}
              />

              {/* Icon + Trend */}
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: card.iconBg, border: `1px solid ${card.iconColor}25` }}
                >
                  <Icon className="w-4 h-4" style={{ color: card.iconColor }} />
                </div>
                <div
                  className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg"
                  style={{
                    color: card.trendUp ? "rgb(var(--color-success))" : "#F4A623",
                    background: card.trendUp ? "rgba(var(--color-success), 0.08)" : "rgba(244,166,35,0.08)",
                  }}
                >
                  {card.trendUp === true  && <TrendingUp  className="w-3 h-3" />}
                  {card.trendUp === false && <TrendingDown className="w-3 h-3" />}
                  <span className="max-w-[80px] truncate">{card.trend}</span>
                </div>
              </div>

              {/* Value */}
              <div className="text-[28px] font-display font-bold text-text-primary tracking-tight leading-none mb-2">
                {isLoading ? <span className="opacity-20 text-2xl">—</span> : card.value}
              </div>

              {/* Label */}
              <div className="text-[10px] text-text-muted uppercase tracking-[0.12em] font-medium leading-relaxed">
                {card.label}
              </div>

              {/* Bottom accent line */}
              <div
                className="absolute bottom-0 left-0 h-[2px] rounded-b-2xl transition-all duration-300"
                style={{
                  background: `linear-gradient(90deg, ${card.iconColor}60, ${card.iconColor}20)`,
                  width: "40%",
                }}
              />
            </div>
          );
        })}
      </div>

      {/* ── Middle Row: Gauge + Aging Bar Chart ── */}
      <div className="grid grid-cols-3 gap-5 mb-5">

        {/* Collection Target Gauge */}
        <div
          className="col-span-1 rounded-2xl p-5 flex flex-col"
          style={{
            background: "rgb(var(--color-panel))",
            border: "1px solid rgb(var(--color-border))",
            boxShadow: "var(--shadow-card)",
            transition: "transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
            (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-card-hover)";
            (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(208,41,54,0.30)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLDivElement).style.transform = "";
            (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-card)";
            (e.currentTarget as HTMLDivElement).style.borderColor = "rgb(var(--color-border))";
          }}
        >
          {/* Card header */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-text-muted/70">{gaugeTitle}</p>
            </div>
            <span
              className="text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
              style={{
                background: "rgb(var(--surface-sunken))",
                border: "1px solid rgb(var(--color-border))",
                color: "rgb(var(--color-text-muted))",
              }}
            >
              {selectedDate ? format(selectedDate, "dd MMM yyyy") : activeFilter}
            </span>
          </div>

          {/* Gauge */}
          <div className="flex-1 flex items-center justify-center py-1">
            <GaugeChart value={kpis.collectedAmount} max={collectionTarget} />
          </div>

          {/* Progress bar */}
          <div className="mt-1">
            <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider mb-1.5"
              style={{ color: "rgb(var(--color-text-muted))" }}>
              <span>Remaining: {formatCurrency(Math.max(collectionTarget - kpis.collectedAmount, 0))}</span>
              <span>Target: {formatCurrency(collectionTarget)}</span>
            </div>
            <div
              className="h-1.5 w-full rounded-full overflow-hidden"
              style={{ background: "rgb(var(--surface-sunken))" }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min((kpis.collectedAmount / collectionTarget) * 100, 100)}%`,
                  background: (kpis.collectedAmount / collectionTarget) < 0.5
                    ? "#D02936"
                    : (kpis.collectedAmount / collectionTarget) < 0.75
                    ? "#F4A623"
                    : "#34A878",
                }}
              />
            </div>
            <p
              className="text-center text-[10px] font-bold mt-2.5 uppercase tracking-widest"
              style={{
                color: (kpis.collectedAmount / collectionTarget) < 0.5
                  ? "#D02936"
                  : (kpis.collectedAmount / collectionTarget) < 0.75
                  ? "#F4A623"
                  : "#34A878",
              }}
            >
              {kpis.collectedAmount > collectionTarget
                ? "Target Exceeded ✓"
                : `${Math.round((kpis.collectedAmount / collectionTarget) * 100)}% of Target Reached`}
            </p>
          </div>

          {/* Legend */}
          <div
            className="flex justify-between gap-1 mt-4 pt-3"
            style={{ borderTop: "1px solid rgb(var(--color-border)/0.4)" }}
          >
            {[["#D02936", "Low <50%"], ["#F4A623", "Mid 50–75%"], ["#34A878", "Goal 75%+"]].map(([color, label]) => (
              <div key={label} className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
                <span className="text-[9px] text-text-muted uppercase tracking-wider">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Invoice Aging Bar Chart */}
        <div
          className="col-span-2 rounded-2xl p-5 flex flex-col"
          style={{
            background: "rgb(var(--color-panel))",
            border: "1px solid rgb(var(--color-border))",
            boxShadow: "var(--shadow-card)",
            transition: "transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
            (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-card-hover)";
            (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(208,41,54,0.28)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLDivElement).style.transform = "";
            (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-card)";
            (e.currentTarget as HTMLDivElement).style.borderColor = "rgb(var(--color-border))";
          }}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-text-muted/70">Invoice Aging</p>
              <p className="text-text-primary font-bold text-[15px] mt-0.5 leading-tight">Outstanding by Age Bucket</p>
            </div>
            {/* Total outstanding badge */}
            <div className="text-right">
              <p className="text-[10px] text-text-muted uppercase tracking-wider font-medium">Total Outstanding</p>
              <p className="text-[18px] font-display font-bold text-text-primary leading-tight">
                {formatCurrency(agingBarData.reduce((s, d) => s + d.amount, 0))}
              </p>
            </div>
          </div>

          {/* Two-column layout: stat cards left, chart right */}
          <div className="flex gap-4 flex-1">

            {/* Left: stat cards stacked */}
            <div className="flex flex-col gap-2.5 w-[220px] shrink-0">
              {agingBarData.map(d => {
                const total = agingBarData.reduce((s, x) => s + d.amount, 0) || 1;
                const pct = Math.round((d.amount / (agingBarData.reduce((s, x) => s + x.amount, 0) || 1)) * 100);
                return (
                  <div
                    key={d.label}
                    className="flex flex-col gap-1.5 rounded-xl p-3"
                    style={{
                      background: "rgb(var(--surface-sunken))",
                      border: `1px solid ${d.color}28`,
                    }}
                  >
                    {/* Label + count */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{d.label}</span>
                      </div>
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                        style={{ background: `${d.color}18`, color: d.color }}
                      >
                        {d.count} inv
                      </span>
                    </div>
                    {/* Amount */}
                    <p className="text-[17px] font-display font-bold leading-none" style={{ color: d.color }}>
                      {formatCurrency(d.amount)}
                    </p>
                    {/* Mini progress bar */}
                    <div className="h-1 w-full rounded-full" style={{ background: "rgb(var(--color-border))" }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: d.color, opacity: 0.75 }}
                      />
                    </div>
                    <p className="text-[9px] text-text-muted">{pct}% of total outstanding</p>
                  </div>
                );
              })}
            </div>

            {/* Right: bar chart */}
            <div className="flex-1 min-h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={agingBarData} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-border))" vertical={false} />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "rgb(var(--color-text-muted))", fontSize: 10 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "rgb(var(--color-text-muted))", fontSize: 10 }}
                    tickFormatter={formatCurrency}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgb(var(--color-panel))",
                      borderColor: "rgb(var(--color-border))",
                      color: "rgb(var(--color-text-primary))",
                      borderRadius: "10px",
                      fontSize: "12px",
                    }}
                    itemStyle={{ color: "rgb(var(--color-text-primary))" }}
                    labelStyle={{ color: "rgb(var(--color-text-muted))", fontWeight: 600 }}
                    formatter={(v: any, name: any, props: any) => [
                      `${formatCurrency(Number(v))}  ·  ${props.payload.count} invoices`,
                      "Outstanding",
                    ]}
                    cursor={{ fill: "rgb(var(--color-border)/0.3)", radius: 6 }}
                  />
                  <Bar dataKey="amount" radius={[8, 8, 0, 0]} maxBarSize={60}>
                    {agingBarData.map((d, i) => (
                      <Cell key={i} fill={d.color} fillOpacity={0.88} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Row: Follow-ups + Activity ── */}
      <div className="grid grid-cols-2 gap-5">

        {/* Upcoming Follow-ups */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: "rgb(var(--color-panel))",
            border: "1px solid rgb(var(--color-border))",
            boxShadow: "var(--shadow-card)",
            transition: "transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
            (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-card-hover)";
            (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(208,41,54,0.25)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLDivElement).style.transform = "";
            (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-card)";
            (e.currentTarget as HTMLDivElement).style.borderColor = "rgb(var(--color-border))";
          }}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-text-muted/70">Upcoming Follow-ups</p>
              <p className="text-text-primary font-bold text-[15px] mt-0.5 leading-tight">Overdue Collections</p>
            </div>
            <span
              className="text-[10px] font-bold px-2 py-1 rounded-lg"
              style={{ background: "rgba(208,41,54,0.10)", color: "#D02936", border: "1px solid rgba(208,41,54,0.22)" }}
            >
              {followUps.length} pending
            </span>
          </div>

          <div className="space-y-2.5">
            {followUps.map((item: any) => {
              const urgency: 'low' | 'mid' | 'high' = item.urgency ?? (item.daysOverdue < 30 ? 'low' : item.daysOverdue < 60 ? 'mid' : 'high');
              const urgencyMap: Record<'low'|'mid'|'high', { color: string; bg: string; border: string; label: string; icon: string }> = {
                low:  { color: "#F4A623", bg: "rgba(244,166,35,0.10)",  border: "rgba(244,166,35,0.22)",  label: "Remind",   icon: "📧" },
                mid:  { color: "#E07B20", bg: "rgba(224,123,32,0.10)",  border: "rgba(224,123,32,0.22)",  label: "Call",     icon: "📞" },
                high: { color: "#D02936", bg: "rgba(208,41,54,0.10)",   border: "rgba(208,41,54,0.22)",   label: "Escalate", icon: "🚨" },
              };
              const urgencyConfig = urgencyMap[urgency] ?? urgencyMap.low;

              return (
                <div
                  key={item.id}
                  className="rounded-xl overflow-hidden"
                  style={{
                    background: "rgb(var(--surface-sunken))",
                    border: `1px solid ${urgencyConfig.border}`,
                    transition: "border-color 0.2s ease, background 0.2s ease",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.background = "rgb(var(--color-panel))";
                    (e.currentTarget as HTMLDivElement).style.borderColor = urgencyConfig.color + "50";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.background = "rgb(var(--surface-sunken))";
                    (e.currentTarget as HTMLDivElement).style.borderColor = urgencyConfig.border;
                  }}
                >
                  {/* Urgency top strip */}
                  <div className="h-0.5 w-full" style={{ background: urgencyConfig.color, opacity: 0.6 }} />

                  <div className="flex items-center gap-3 px-3.5 py-3">
                    {/* Icon */}
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-[16px]"
                      style={{ background: urgencyConfig.bg }}
                    >
                      {urgencyConfig.icon}
                    </div>

                    {/* Client info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-semibold text-text-primary truncate leading-none">{item.client}</p>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Clock className="w-2.5 h-2.5 shrink-0" style={{ color: urgencyConfig.color }} />
                        <span className="text-[10px] font-medium" style={{ color: urgencyConfig.color }}>
                          {item.daysOverdue} days overdue
                        </span>
                        <span className="text-text-muted/40 text-[10px]">·</span>
                        <span className="text-[10px] text-text-muted">{item.type}</span>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="text-right shrink-0">
                      <p className="text-[15px] font-display font-bold" style={{ color: urgencyConfig.color }}>
                        {item.amount}
                      </p>
                      <p className="text-[9px] text-text-muted mt-0.5 uppercase tracking-wider">outstanding</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Latest Activity */}
        <div
          className="rounded-2xl p-5 flex flex-col"
          style={{
            background: "rgb(var(--color-panel))",
            border: "1px solid rgb(var(--color-border))",
            boxShadow: "var(--shadow-card)",
            transition: "transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
            (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-card-hover)";
            (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(208,41,54,0.25)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLDivElement).style.transform = "";
            (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-card)";
            (e.currentTarget as HTMLDivElement).style.borderColor = "rgb(var(--color-border))";
          }}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-text-muted/70">Latest Activity</p>
              <p className="text-text-primary font-bold text-[15px] mt-0.5 leading-tight">Recent Transactions</p>
            </div>
            <a
              href="/audit"
              className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest transition-opacity mt-0.5"
              style={{ color: "rgb(var(--color-accent))" }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.7")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >
              See All <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>

          <div className="flex flex-col gap-1.5">
            {recentActivities.map((item: any) => {
              const initial = item.name.charAt(0).toUpperCase();
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                  style={{ transition: "background 0.15s ease", cursor: "default" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgb(var(--surface-sunken))")}
                  onMouseLeave={e => (e.currentTarget.style.background = "")}
                >
                  {/* Avatar */}
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0"
                    style={
                      item.isPaid
                        ? { background: "rgba(52,168,120,0.14)", color: "#34A878", border: "1.5px solid rgba(52,168,120,0.28)" }
                        : { background: "rgba(208,41,54,0.12)", color: "rgb(var(--color-accent))", border: "1.5px solid rgba(208,41,54,0.22)" }
                    }
                  >
                    {initial}
                  </div>

                  {/* Name + badge */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-text-primary truncate leading-none">{item.name}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span
                        className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md"
                        style={
                          item.isPaid
                            ? { background: "rgba(52,168,120,0.12)", color: "#34A878" }
                            : { background: "rgba(208,41,54,0.10)", color: "rgb(var(--color-accent))" }
                        }
                      >
                        {item.isPaid
                          ? <TrendingUp className="w-2.5 h-2.5" />
                          : <FileText   className="w-2.5 h-2.5" />
                        }
                        {item.action}
                      </span>
                    </div>
                  </div>

                  {/* Amount + time */}
                  <div className="text-right shrink-0">
                    <p
                      className="text-[13px] font-display font-bold leading-none"
                      style={{ color: item.isPaid ? "#34A878" : "rgb(var(--color-text-primary))" }}
                    >
                      {item.isPaid ? "+" : ""}{item.amount ?? "—"}
                    </p>
                    <p className="text-[10px] font-mono text-text-muted mt-0.5">{item.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Slide-out drawer for audit logs / transactions */}
      <SlidePanel
        isOpen={isActivityDrawerOpen}
        onClose={() => setIsActivityDrawerOpen(false)}
        title="Audit Logs & Transactions"
        subtitle="Full history of inventory, invoice, and payment movements"
      >
        <div className="space-y-3 py-2">
          {allActivities.map((item, idx) => (
            <div
              key={idx}
              className="flex items-start gap-4 p-4 rounded-xl"
              style={{
                background: "rgb(var(--surface-sunken))",
                border: "1px solid rgb(var(--color-border))",
                transition: "border-color 0.2s ease",
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(208,41,54,0.25)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "rgb(var(--color-border))")}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-bold shrink-0"
                style={
                  item.isPaid
                    ? { background: "rgba(52,168,120,0.12)", color: "#34A878", border: "1px solid rgba(52,168,120,0.22)" }
                    : { background: "rgba(208,41,54,0.10)", color: "rgb(var(--color-accent))", border: "1px solid rgba(208,41,54,0.20)" }
                }
              >
                {item.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <h4 className="text-[13px] font-bold text-text-primary truncate">{item.name}</h4>
                  <span className="text-[10px] font-mono text-text-muted shrink-0">{item.time}</span>
                </div>
                <p className="text-[11px] text-text-muted mt-0.5">{item.action} of steel order</p>
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className="text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded"
                    style={
                      item.isPaid
                        ? { color: "#34A878", background: "rgba(52,168,120,0.10)", border: "1px solid rgba(52,168,120,0.20)" }
                        : { color: "#F4A623", background: "rgba(244,166,35,0.10)", border: "1px solid rgba(244,166,35,0.20)" }
                    }
                  >
                    {item.isPaid ? "Credited" : "Pending"}
                  </span>
                  <span className="text-[12px] font-mono font-bold text-text-primary ml-auto">{item.amount || "—"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SlidePanel>
    </div>
  );
}
