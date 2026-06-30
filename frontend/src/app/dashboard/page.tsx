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
    let totalOutstanding = 0;
    let collectedAmount = 0;
    let activeCustomers = customers?.length || 0;
    let invoicesIssued = invoices?.length || 0;
    let pendingCollections = 0;

    // Filter list if invoices exist in database
    const matched = invoices ? invoices.filter(inv => {
      const invDate = new Date(inv.invoice_date || (inv as any).created_at || Date.now());
      const now = new Date();
      if (selectedDate) return invDate.toDateString() === selectedDate.toDateString();
      if (activeFilter === "Today") return invDate.toDateString() === now.toDateString();
      if (activeFilter === "Yesterday") {
        const yesterday = new Date();
        yesterday.setDate(now.getDate() - 1);
        return invDate.toDateString() === yesterday.toDateString();
      }
      if (activeFilter === "Weekly") {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        return invDate >= sevenDaysAgo;
      }
      if (activeFilter === "Monthly") {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        return invDate >= thirtyDaysAgo;
      }
      return true;
    }) : [];
    if (invoices && invoices.length > 0) {
      const customersSet = new Set<number>();
      const now = new Date();
      
      const filteredInvoices = invoices.filter(inv => {
        const invDate = new Date(inv.invoice_date || (inv as any).created_at || Date.now());
        if (selectedDate) return invDate.toDateString() === selectedDate.toDateString();
        if (activeFilter === "Today") return invDate.toDateString() === now.toDateString();
        if (activeFilter === "Yesterday") {
          const yesterday = new Date(now);
          yesterday.setDate(now.getDate() - 1);
          return invDate.toDateString() === yesterday.toDateString();
        }
        if (activeFilter === "Weekly") {
          const sevenDaysAgo = new Date(now);
          sevenDaysAgo.setDate(now.getDate() - 7);
          return invDate >= sevenDaysAgo;
        }
        if (activeFilter === "Monthly") {
          const thirtyDaysAgo = new Date(now);
          thirtyDaysAgo.setDate(now.getDate() - 30);
          return invDate >= thirtyDaysAgo;
        }
        return true;
      });

      filteredInvoices.forEach((inv: any) => {
        const total = Number(inv.total_amount);
        const paid = Number(inv.amount_paid);
        if (inv.customer_id) customersSet.add(inv.customer_id);
        invoicesIssued++;
        
        if (inv.status !== 'paid') totalOutstanding += (total - paid);
        collectedAmount += paid;
        if (inv.status === 'overdue' || inv.status === 'unpaid' || inv.status === 'partially_paid') pendingCollections++;
      });
      activeCustomers = customersSet.size;

      // Ensure nothing is zero for POC Demo when filtering returns empty
      if (collectedAmount === 0 || totalOutstanding === 0 || invoicesIssued === 0) {
        if (selectedDate)                      { totalOutstanding = 125000; collectedAmount = 40000;  activeCustomers = 12; invoicesIssued = 8;   pendingCollections = 3;  }
        else if (activeFilter === "Today")     { totalOutstanding = 45000;  collectedAmount = 80000;  activeCustomers = 5;  invoicesIssued = 12;  pendingCollections = 2;  }
        else if (activeFilter === "Yesterday") { totalOutstanding = 62000;  collectedAmount = 50000;  activeCustomers = 8;  invoicesIssued = 15;  pendingCollections = 4;  }
        else if (activeFilter === "Weekly")    { totalOutstanding = 320000; collectedAmount = 180000; activeCustomers = 45; invoicesIssued = 98;  pendingCollections = 12; }
        else                                   { totalOutstanding = 845000; collectedAmount = 1400000; activeCustomers = 142;invoicesIssued = 384; pendingCollections = 42; }
      }
    } else {
      // High fidelity interactive mock fallbacks
      if (selectedDate)                      { totalOutstanding = 125000; collectedAmount = 40000;  activeCustomers = 12; invoicesIssued = 8;   pendingCollections = 3;  }
      else if (activeFilter === "Today")     { totalOutstanding = 45000;  collectedAmount = 80000;  activeCustomers = 5;  invoicesIssued = 12;  pendingCollections = 2;  }
      else if (activeFilter === "Yesterday") { totalOutstanding = 62000;  collectedAmount = 50000;  activeCustomers = 8;  invoicesIssued = 15;  pendingCollections = 4;  }
      else if (activeFilter === "Weekly")    { totalOutstanding = 320000; collectedAmount = 180000; activeCustomers = 45; invoicesIssued = 98;  pendingCollections = 12; }
      else                                   { totalOutstanding = 845000; collectedAmount = 1400000; activeCustomers = 142;invoicesIssued = 384; pendingCollections = 42; }
    }
    return { totalOutstanding, collectedAmount, activeCustomers, invoicesIssued, pendingCollections };
  }, [invoices, customers, activeFilter, selectedDate]);

  // Invoice aging as a clean bar chart
  const agingBarData = useMemo(() => {
    const matched = invoices ? invoices.filter(inv => {
      const invDate = new Date(inv.invoice_date || (inv as any).created_at || Date.now());
      const now = new Date();
      if (selectedDate) return invDate.toDateString() === selectedDate.toDateString();
      if (activeFilter === "Today") return invDate.toDateString() === now.toDateString();
      if (activeFilter === "Yesterday") {
        const yesterday = new Date();
        yesterday.setDate(now.getDate() - 1);
        return invDate.toDateString() === yesterday.toDateString();
      }
      if (activeFilter === "Weekly") {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        return invDate >= sevenDaysAgo;
      }
      if (activeFilter === "Monthly") {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        return invDate >= thirtyDaysAgo;
      }
      return true;
    }) : [];

    if (!invoices || invoices.length === 0 || matched.length === 0) {
      if (selectedDate)                      { return [{ label: "< 30 Days", count: 2, amount: 85000, color: "#F4A623" }, { label: "30–60 Days", count: 1, amount: 40000, color: "#3D7A6B" }, { label: "90+ Days", count: 0, amount: 0, color: "#D02936" }]; }
      else if (activeFilter === "Today")     { return [{ label: "< 30 Days", count: 3, amount: 45000, color: "#F4A623" }, { label: "30–60 Days", count: 0, amount: 0, color: "#3D7A6B" }, { label: "90+ Days", count: 0, amount: 0, color: "#D02936" }]; }
      else if (activeFilter === "Yesterday") { return [{ label: "< 30 Days", count: 3, amount: 40000, color: "#F4A623" }, { label: "30–60 Days", count: 1, amount: 22000, color: "#3D7A6B" }, { label: "90+ Days", count: 0, amount: 0, color: "#D02936" }]; }
      else if (activeFilter === "Weekly")    { return [{ label: "< 30 Days", count: 8, amount: 120000, color: "#F4A623" }, { label: "30–60 Days", count: 4, amount: 150000, color: "#3D7A6B" }, { label: "90+ Days", count: 1, amount: 50000, color: "#D02936" }]; }
      return [
        { label: "< 30 Days",  count: 15, amount: 345000, color: "#F4A623" },
        { label: "30–60 Days", count: 8,  amount: 400000, color: "#3D7A6B" },
        { label: "90+ Days",   count: 4,  amount: 100000, color: "#D02936" },
      ];
    }

    const now = new Date();
    let u30 = 0, d3060 = 0, d90 = 0;
    let uAmt = 0, dAmt = 0, d9Amt = 0;
    matched.filter(i => i.status !== 'paid').forEach(inv => {
      const days = Math.ceil((now.getTime() - new Date(inv.due_date).getTime()) / 86400000);
      const outstanding = Number(inv.total_amount) - Number(inv.amount_paid);
      if (days <= 30)      { u30++;   uAmt  += outstanding; }
      else if (days <= 60) { d3060++; dAmt  += outstanding; }
      else                 { d90++;   d9Amt += outstanding; }
    });
    return [
      { label: "< 30 Days",  count: u30,   amount: uAmt,  color: "#F4A623" },
      { label: "30–60 Days", count: d3060, amount: dAmt,  color: "#3D7A6B" },
      { label: "90+ Days",   count: d90,   amount: d9Amt, color: "#D02936" },
    ];
  }, [invoices, activeFilter, selectedDate]);

  // Format time: time for today, date for older
  const formatActivityTime = (dateStr: string) => {
    const d = new Date(dateStr);
    if (d.toDateString() === new Date().toDateString()) {
      return `Today, ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  const recentActivities = useMemo(() => {
    const matched = invoices ? invoices.filter(inv => {
      const invDate = new Date(inv.invoice_date || (inv as any).created_at || Date.now());
      const now = new Date();
      if (selectedDate) return invDate.toDateString() === selectedDate.toDateString();
      if (activeFilter === "Today") return invDate.toDateString() === now.toDateString();
      if (activeFilter === "Yesterday") {
        const yesterday = new Date();
        yesterday.setDate(now.getDate() - 1);
        return invDate.toDateString() === yesterday.toDateString();
      }
      if (activeFilter === "Weekly") {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        return invDate >= sevenDaysAgo;
      }
      if (activeFilter === "Monthly") {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        return invDate >= thirtyDaysAgo;
      }
      return true;
    }) : [];

    if (!invoices || invoices.length === 0 || matched.length === 0) {
      if (activeFilter === "Today" || selectedDate) return [
        { id: '1', name: 'Acme Corp',        action: 'Payment Received', time: 'Today, 10:30 AM', isPaid: true  },
        { id: '2', name: 'Stark Industries', action: 'Invoice Issued',   time: 'Today, 09:15 AM', isPaid: false },
      ];
      if (activeFilter === "Yesterday") return [
        { id: '3', name: 'Wayne Enterprises', action: 'Payment Received', time: 'Yesterday', isPaid: true  },
        { id: '4', name: 'Oscorp',            action: 'Invoice Issued',   time: 'Yesterday',isPaid: false },
      ];
      return [
        { id: '1', name: 'Acme Corp',         action: 'Payment Received', time: 'Today, 10:30 AM', isPaid: true  },
        { id: '2', name: 'Stark Industries',  action: 'Invoice Issued',   time: 'Yesterday',   isPaid: false },
        { id: '3', name: 'Wayne Enterprises', action: 'Payment Received', time: '2 days ago',  isPaid: true  },
        { id: '4', name: 'LexCorp',           action: 'Invoice Issued',   time: '3 days ago',  isPaid: false },
      ];
    }
    return matched.slice(0, 4).map(inv => ({
      id: String(inv.id),
      name: inv.customer?.business_name || inv.customer?.contact_person || 'Unknown Customer',
      action: inv.status === 'paid' ? 'Payment Received' : 'Invoice Issued',
      time: formatActivityTime((inv as any).created_at || inv.invoice_date || new Date().toISOString()),
      isPaid: inv.status === 'paid',
    }));
  }, [invoices, activeFilter, selectedDate]);

  const allActivities = useMemo(() => {
    const matched = invoices ? invoices.filter(inv => {
      const invDate = new Date(inv.invoice_date || (inv as any).created_at || Date.now());
      const now = new Date();
      if (selectedDate) return invDate.toDateString() === selectedDate.toDateString();
      if (activeFilter === "Today") return invDate.toDateString() === now.toDateString();
      if (activeFilter === "Yesterday") {
        const yesterday = new Date();
        yesterday.setDate(now.getDate() - 1);
        return invDate.toDateString() === yesterday.toDateString();
      }
      if (activeFilter === "Weekly") {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        return invDate >= sevenDaysAgo;
      }
      if (activeFilter === "Monthly") {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        return invDate >= thirtyDaysAgo;
      }
      return true;
    }) : [];

    if (!invoices || invoices.length === 0 || matched.length === 0) {
      return [
        { id: '1', name: 'Acme Corp',         action: 'Payment Received', time: 'Today, 10:30 AM', isPaid: true,  amount: '₹2,00,000' },
        { id: '2', name: 'Stark Industries',  action: 'Invoice Issued',   time: 'Today, 09:15 AM', isPaid: false, amount: '₹1,50,000' },
        { id: '3', name: 'Wayne Enterprises', action: 'Payment Received', time: 'Yesterday',       isPaid: true,  amount: '₹3,50,000' },
        { id: '4', name: 'LexCorp',           action: 'Invoice Issued',   time: 'Yesterday',       isPaid: false, amount: '₹80,000' },
        { id: '5', name: 'Oscorp Holdings',   action: 'Invoice Issued',   time: '2 days ago',  isPaid: false, amount: '₹2,20,000' },
        { id: '6', name: 'Stark Industries',  action: 'Payment Received', time: '3 days ago',  isPaid: true,  amount: '₹1,20,000' },
        { id: '7', name: 'Shield Logistics',  action: 'Invoice Issued',   time: '4 days ago',  isPaid: false, amount: '₹95,000' },
        { id: '8', name: 'Daily Bugle Press', action: 'Payment Received', time: '5 days ago',  isPaid: true,  amount: '₹40,000' },
      ];
    }
    return matched.map(inv => ({
      id: String(inv.id),
      name: inv.customer?.business_name || inv.customer?.contact_person || 'Unknown Customer',
      action: inv.status === 'paid' ? 'Payment Received' : 'Invoice Issued',
      time: formatActivityTime((inv as any).created_at || inv.invoice_date || new Date().toISOString()),
      isPaid: inv.status === 'paid',
      amount: `₹${Number(inv.total_amount || 0).toLocaleString('en-IN')}`,
    }));
  }, [invoices, activeFilter, selectedDate]);

  const followUps = useMemo(() => {
    const matched = invoices ? invoices.filter(inv => {
      const invDate = new Date(inv.invoice_date || (inv as any).created_at || Date.now());
      const now = new Date();
      if (selectedDate) return invDate.toDateString() === selectedDate.toDateString();
      if (activeFilter === "Today") return invDate.toDateString() === now.toDateString();
      if (activeFilter === "Yesterday") {
        const yesterday = new Date();
        yesterday.setDate(now.getDate() - 1);
        return invDate.toDateString() === yesterday.toDateString();
      }
      if (activeFilter === "Weekly") {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        return invDate >= sevenDaysAgo;
      }
      if (activeFilter === "Monthly") {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        return invDate >= thirtyDaysAgo;
      }
      return true;
    }) : [];

    if (!invoices || invoices.length === 0 || matched.length === 0) {
      if (activeFilter === "Today" || activeFilter === "Yesterday" || selectedDate) return [
        { id: '1', client: 'Larsen & Toubro Ltd', type: 'Collections', amount: '₹2.4L', daysOverdue: 16 },
        { id: '2', client: 'Acme Corp',           type: 'Collections', amount: '₹3.0L', daysOverdue: 41 },
        { id: '3', client: 'Acme Corp',           type: 'Collections', amount: '₹2.5L', daysOverdue: 66 },
      ];
      return [
        { id: '1', client: 'Larsen & Toubro Ltd', type: 'Collections', amount: '₹2.4L', daysOverdue: 16 },
        { id: '2', client: 'Acme Corp',           type: 'Collections', amount: '₹3.0L', daysOverdue: 41 },
        { id: '3', client: 'Acme Corp',           type: 'Collections', amount: '₹2.5L', daysOverdue: 66 },
      ];
    }
    return matched.filter(inv => inv.status === 'overdue').slice(0, 3).map(inv => ({
      id: String(inv.id),
      client: inv.customer?.business_name || 'Unknown',
      type: 'Collections',
      amount: `₹${((inv.total_amount - inv.amount_paid) / 100000).toFixed(1)}L`,
      daysOverdue: Math.ceil((new Date().getTime() - new Date(inv.due_date).getTime()) / 86400000),
    }));
  }, [invoices, activeFilter, selectedDate]);

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
  let outstandingTrend = "↑ 8.2% vs Yesterday";

  if (activeFilter === "Yesterday") { stockValue = "₹2.25Cr"; stockTrend = "+0.5% DoD"; turnover = "3.6x"; outstandingTrend = "↑ 8.2% vs Previous Day"; }
  else if (activeFilter === "Weekly") { stockValue = "₹2.60Cr"; stockTrend = "+1.5% WoW"; turnover = "4.2x"; turnoverTrend = "Improving"; outstandingTrend = "↑ 8.2% vs Last Week"; }
  else if (activeFilter === "Monthly") { stockValue = "₹3.10Cr"; stockTrend = "+4.2% MoM"; turnover = "4.8x"; turnoverTrend = "Optimal"; outstandingTrend = "↑ 8.2% vs Last Month"; }
  else if (selectedDate) { stockValue = "₹2.15Cr"; stockTrend = "Stable"; turnover = "3.4x"; outstandingTrend = "↑ 8.2% vs Previous Day"; }

  const kpiCards = [
    {
      value: formatCurrency(kpis.totalOutstanding),
      label: "Total Outstanding Receivables",
      icon: Wallet,
      iconColor: "#D02936",
      iconBg: "rgba(208,41,54,0.12)",
      trend: outstandingTrend,
      trendUp: false,
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

  let collectionTarget = 500000;
  let gaugeTitle = "Collection Progress";
  if (activeFilter === "Today") { collectionTarget = 100000; }
  else if (activeFilter === "Yesterday") { collectionTarget = 100000; }
  else if (activeFilter === "Weekly") { collectionTarget = 500000; }
  else if (activeFilter === "Monthly") { collectionTarget = 2000000; }
  if (selectedDate) { collectionTarget = 100000; }

  return (
    <div className="flex flex-col min-h-full pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-wider text-text-primary uppercase">
            Dashboard
          </h1>
          <p className="text-text-muted text-sm mt-0.5">
            Welcome back, <span className="text-text-primary font-semibold">{user?.full_name || 'User'}</span>
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-panel border border-border rounded-xl p-1 gap-1">
            {filters.map(f => (
              <button
                key={f}
                onClick={() => { setActiveFilter(f); setSelectedDate(null); }}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 uppercase tracking-wider ${
                  activeFilter === f
                    ? "bg-accent text-white shadow-md shadow-accent/20"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="bg-panel border border-border rounded-xl">
            <CustomDatePicker
              selectedDate={selectedDate}
              onDateSelect={(date) => { setSelectedDate(date); setActiveFilter(""); }}
            />
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {kpiCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="bg-panel border border-border rounded-2xl p-5 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-accent/40 z-10 hover:z-20 group">
              <div className="absolute top-0 left-0 w-full h-0.5 rounded-t-2xl"
                style={{ background: `linear-gradient(90deg, transparent, ${card.iconColor}50, transparent)` }} />
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: card.iconBg }}
                >
                  <Icon className="w-5 h-5" style={{ color: card.iconColor }} />
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: card.trendUp === null ? '#64748b' : card.trendUp ? '#3D7A6B' : '#F4A623' }}>
                  {card.trendUp === true  && <TrendingUp className="w-3 h-3" />}
                  {card.trendUp === false && <TrendingDown className="w-3 h-3" />}
                  {card.trend}
                </div>
              </div>
              <div className="text-3xl font-display font-bold text-text-primary tracking-tight mb-1">
                {isLoading ? <span className="opacity-20">—</span> : card.value}
              </div>
              <div className="text-[10px] text-text-muted uppercase tracking-widest font-medium">{card.label}</div>
            </div>
          );
        })}
      </div>

      {/* Middle Row: Gauge + Aging Bar Chart */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Collection Target Gauge */}
        <div className="col-span-1 bg-panel border border-border rounded-2xl p-6 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-accent/30 z-10 hover:z-20">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold text-text-muted uppercase tracking-widest">{gaugeTitle}</h2>
            <span className="text-[10px] text-text-muted bg-white/5 border border-border px-2 py-0.5 rounded-full uppercase tracking-wider">
              {selectedDate ? format(selectedDate, 'dd MMM yyyy') : activeFilter}
            </span>
          </div>
          <div className="flex-1 flex items-center justify-center py-2">
            <GaugeChart value={kpis.collectedAmount} max={collectionTarget} />
          </div>
          {/* Progress bar below gauge */}
          {/* Progress bar below gauge */}
          <div className="mt-2">
            <div className="flex justify-between text-[10px] text-text-muted mb-2 font-bold uppercase tracking-wider">
              <span>Remaining: ₹{formatCurrency(Math.max(collectionTarget - kpis.collectedAmount, 0)).replace('₹', '')}</span>
              <span>Target: ₹{formatCurrency(collectionTarget).replace('₹', '')}</span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  (kpis.collectedAmount / collectionTarget) < 0.5 ? "bg-[#D02936]" : 
                  (kpis.collectedAmount / collectionTarget) < 0.75 ? "bg-[#F4A623]" : "bg-[#3D7A6B]"
                }`}
                style={{ width: `${Math.min((kpis.collectedAmount / collectionTarget) * 100, 100)}%` }}
              />
            </div>
            <p className="text-center text-[10px] font-bold mt-3 uppercase tracking-widest"
               style={{ color: (kpis.collectedAmount / collectionTarget) < 0.5 ? "#D02936" : (kpis.collectedAmount / collectionTarget) < 0.75 ? "#F4A623" : "#3D7A6B" }}>
              {kpis.collectedAmount > collectionTarget ? "TARGET EXCEEDED" : `${Math.round((kpis.collectedAmount / collectionTarget) * 100)}% OF TARGET REACHED`}
            </p>
          </div>
          {/* Color Indicators Legend */}
          <div className="flex justify-between gap-1 text-[9px] text-text-muted uppercase tracking-wider mt-4 pt-3.5 border-t border-border/30">
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#D02936]" />
              <span>Low (&lt;50%)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#F4A623]" />
              <span>Mid (50-75%)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#3D7A6B]" />
              <span>Goal (75%+)</span>
            </div>
          </div>
        </div>

        {/* Invoice Aging Bar Chart */}
        <div className="col-span-2 bg-panel border border-border rounded-2xl p-6 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-accent/30 z-10 hover:z-20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xs font-bold text-text-muted uppercase tracking-widest">Invoice Aging</h2>
              <p className="text-text-primary font-bold text-sm mt-0.5">Outstanding by Age Bucket</p>
            </div>
            <div className="flex items-center gap-3">
              {agingBarData.map(d => (
                <div key={d.label} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-[10px] text-text-muted font-medium">{d.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Count badges */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {agingBarData.map(d => (
              <div key={d.label} className="bg-background/50 border border-border rounded-xl p-3 text-center">
                <p className="text-2xl font-display font-bold text-text-primary">{d.count}</p>
                <p className="text-[9px] text-text-muted uppercase tracking-widest mt-0.5">Invoices</p>
                <p className="text-xs font-bold mt-1" style={{ color: d.color }}>{formatCurrency(d.amount)}</p>
              </div>
            ))}
          </div>

          <div className="flex-1 min-h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agingBarData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-border))" vertical={false} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: 'rgb(var(--color-text-muted))', fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgb(var(--color-text-muted))', fontSize: 10 }} tickFormatter={formatCurrency} />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: 'rgb(var(--color-panel))', 
                    borderColor: 'rgb(var(--color-border))', 
                    color: 'rgb(var(--color-text-primary))',
                    borderRadius: '10px', 
                    fontSize: '12px' 
                  }}
                  itemStyle={{ color: 'rgb(var(--color-text-primary))' }}
                  labelStyle={{ color: 'rgb(var(--color-text-muted))' }}
                  formatter={(v: any) => [formatCurrency(Number(v)), 'Amount']}
                  labelFormatter={l => l}
                />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]} maxBarSize={50}>
                  {agingBarData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row: Follow-ups + Activity */}
      <div className="grid grid-cols-2 gap-6">
        {/* Upcoming Follow-ups */}
        <div className="bg-panel border border-border rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-accent/30 z-10 hover:z-20">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xs font-bold text-text-muted uppercase tracking-widest">Upcoming Follow-ups</h2>
              <p className="text-text-primary font-bold text-sm mt-0.5">Overdue Collections</p>
            </div>
          </div>

          {followUps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-text-muted">
              <CheckCircle2 className="w-8 h-8 mb-3 opacity-30" />
              <p className="text-xs uppercase tracking-widest">All clear — no follow-ups</p>
            </div>
          ) : (
            <div className="space-y-3">
              {followUps.map(item => (
                <div key={item.id} className="flex items-center gap-4 bg-background/40 border border-border rounded-xl p-4 hover:border-accent/30 transition-all group cursor-pointer relative">
                  <div 
                    className="w-9 h-9 rounded-xl bg-critical/10 border border-critical/20 flex items-center justify-center shrink-0"
                    title={item.daysOverdue < 30 ? "Remind" : item.daysOverdue <= 60 ? "Call" : "Escalate"}
                  >
                    <span className="text-lg">
                      {item.daysOverdue < 30 ? "📧" : item.daysOverdue <= 60 ? "📞" : "🚨"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-text-primary truncate">{item.client}</h3>
                    <p className="text-xs text-text-muted">{item.type}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-accent">{item.amount}</p>
                    <div className="flex items-center justify-end gap-1 text-critical text-[10px] font-bold mt-0.5">
                      <Clock className="w-3 h-3" />
                      {item.daysOverdue}d overdue
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Latest Activity */}
        <div className="bg-panel border border-border rounded-2xl p-6 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-accent/30 z-10 hover:z-20">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xs font-bold text-text-muted uppercase tracking-widest">Latest Activity</h2>
              <p className="text-text-primary font-bold text-sm mt-0.5">Recent Transactions</p>
            </div>
            <a 
              href="/audit"
              className="text-[10px] text-accent hover:text-accent/80 font-bold uppercase tracking-widest flex items-center gap-1 transition-colors"
            >
              See All <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>

          {recentActivities.length === 0 ? (
            <div className="text-sm text-text-muted italic py-4">No recent activity found.</div>
          ) : (
            <div className="space-y-2">
              {recentActivities.map(item => {
                const initial = item.name.charAt(0).toUpperCase();
                return (
                  <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.03] transition-colors group">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      item.isPaid
                        ? 'bg-[#3D7A6B]/15 text-[#3D7A6B] border border-[#3D7A6B]/25'
                        : 'bg-accent/10 text-accent border border-accent/20'
                    }`}>
                      {initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate">{item.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {item.isPaid
                          ? <TrendingUp className="w-3 h-3 text-[#3D7A6B]" />
                          : <FileText className="w-3 h-3 text-text-muted" />
                        }
                        <p className="text-[10px] text-text-muted uppercase tracking-wider font-medium">{item.action}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-text-muted shrink-0">{item.time}</span>
                  </div>
                );
              })}
            </div>
          )}
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
            <div key={idx} className="flex items-start gap-4 p-4 bg-background/50 border border-border rounded-xl hover:border-accent/30 transition-all">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                item.isPaid
                  ? 'bg-[#3D7A6B]/10 text-[#3D7A6B] border border-[#3D7A6B]/20'
                  : 'bg-accent/15 text-accent border border-accent/20'
              }`}>
                {item.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <h4 className="text-sm font-bold text-text-primary truncate">{item.name}</h4>
                  <span className="text-[10px] font-mono text-text-muted shrink-0">{item.time}</span>
                </div>
                <p className="text-xs text-text-muted mt-0.5">{item.action} of steel order</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[9px] uppercase font-bold tracking-widest text-[#3D7A6B] bg-[#3D7A6B]/10 border border-[#3D7A6B]/20 px-2 py-0.5 rounded">
                    {item.isPaid ? 'Credited' : 'Pending'}
                  </span>
                  <span className="text-xs font-mono font-bold text-text-primary ml-auto">{item.amount || "—"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SlidePanel>
    </div>
  );
}
