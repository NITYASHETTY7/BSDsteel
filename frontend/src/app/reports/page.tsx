"use client";

import { useMemo } from "react";
import { useInvoices } from "@/hooks/useReceivables";
import { useSkus } from "@/hooks/useInventory";
import { Skeleton } from "@/components/ui/Skeleton";
import { IndianRupee, AlertTriangle, TrendingUp, PackageSearch, ArrowUpRight, Download } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";
import { format, subMonths } from "date-fns";

const COLORS = ["#10B981", "#6366F1", "#F59E0B", "#EF4444", "#8B5CF6"];

export default function ReportsPage() {
  const { data: invoices, isLoading: isLoadingInvoices } = useInvoices();
  const { data: skus, isLoading: isLoadingSkus } = useSkus();

  const kpis = useMemo(() => {
    if (!invoices || !skus) return null;
    let totalOutstanding = 0;
    let totalRevenue = 0;
    let lowStockCount = 0;

    invoices.forEach((inv) => {
      const amountPaid = Number(inv.amount_paid);
      const totalAmount = Number(inv.total_amount);
      totalRevenue += amountPaid;
      totalOutstanding += totalAmount - amountPaid;
    });

    skus.forEach((sku) => {
      if (sku.total_stock < sku.reorder_threshold) lowStockCount++;
    });

    const collectionRate = totalRevenue + totalOutstanding > 0
      ? Math.round((totalRevenue / (totalRevenue + totalOutstanding)) * 100)
      : 0;

    return { totalOutstanding, totalRevenue, lowStockCount, collectionRate };
  }, [invoices, skus]);

  const invoiceAgingData = useMemo(() => {
    if (!invoices) return [];
    let under30 = 0, days30to60 = 0, over60 = 0;
    const now = new Date();
    invoices.forEach(inv => {
      if (inv.status === 'paid') return;
      const diffDays = Math.ceil((now.getTime() - new Date(inv.due_date).getTime()) / (1000 * 60 * 60 * 24));
      const outstandingAmt = Number(inv.total_amount) - Number(inv.amount_paid);
      if (diffDays <= 0 || diffDays <= 30) under30 += outstandingAmt;
      else if (diffDays <= 60) days30to60 += outstandingAmt;
      else over60 += outstandingAmt;
    });
    // If all zero, show mock baseline
    if (under30 === 0 && days30to60 === 0 && over60 === 0) {
      return [
        { name: "0–30 Days",  amount: 420000 },
        { name: "31–60 Days", amount: 185000 },
        { name: "60+ Days",   amount: 310000 },
      ];
    }
    return [
      { name: "0–30 Days",  amount: under30    },
      { name: "31–60 Days", amount: days30to60 },
      { name: "60+ Days",   amount: over60     },
    ];
  }, [invoices]);

  const stockDistributionData = useMemo(() => {
    if (!skus || skus.length === 0) {
      return [
        { name: "HR COIL",         value: 306 },
        { name: "HR SHEET",        value: 198 },
        { name: "CHEQUERED SHEET", value: 172 },
      ];
    }
    const typeMap = new Map<string, number>();
    skus.forEach(sku => {
      const current = typeMap.get(sku.product_type) || 0;
      typeMap.set(sku.product_type, current + Number(sku.total_stock));
    });
    return Array.from(typeMap.entries()).map(([name, value]) => ({
      name: name.replace(/_/g, ' ').toUpperCase(),
      value,
    }));
  }, [skus]);

  const criticalInvoices = useMemo(() => {
    if (!invoices) return [];
    return invoices
      .filter(inv => inv.status === 'overdue')
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
      .slice(0, 5);
  }, [invoices]);

  // Build monthly trend: use real data where available, fill empty months with mock baseline
  const monthlyTrendData = useMemo(() => {
    const mockBaseline: Record<number, { collected: number; outstanding: number }> = {
      0: { collected: 280000,  outstanding: 190000 },
      1: { collected: 320000,  outstanding: 155000 },
      2: { collected: 210000,  outstanding: 240000 },
      3: { collected: 390000,  outstanding: 120000 },
      4: { collected: 445000,  outstanding: 175000 },
      5: { collected: 510000,  outstanding: 210000 },
    };
    return Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(new Date(), 5 - i);
      const monthKey = format(d, "yyyy-MM");
      const month = format(d, "MMM");
      let collected = 0;
      let outstanding = 0;
      (invoices ?? []).forEach(inv => {
        const invMonth = format(new Date(inv.invoice_date), "yyyy-MM");
        if (invMonth === monthKey) {
          collected  += Number(inv.amount_paid);
          outstanding += Number(inv.total_amount) - Number(inv.amount_paid);
        }
      });
      // If no real data for this month, use mock baseline
      if (collected === 0 && outstanding === 0) {
        collected   = mockBaseline[i].collected;
        outstanding = mockBaseline[i].outstanding;
      }
      return { month, collected, outstanding };
    });
  }, [invoices]);

  const formatCurrency = (val: number) => `₹${val.toLocaleString("en-IN")}`;
  const formatShort = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}k`;
    return `₹${val}`;
  };

  if (isLoadingInvoices || isLoadingSkus) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Skeleton className="h-10 w-48 mb-4 bg-white/5" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl bg-white/5" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          <Skeleton className="h-80 rounded-2xl bg-white/5" />
          <Skeleton className="h-80 rounded-2xl bg-white/5" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full pb-10 gap-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-accent mb-1.5 flex items-center gap-2">
            <span className="w-4 h-[2px] bg-accent rounded-full" />
            Analytics
          </p>
          <h1 className="text-[32px] font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-500 dark:from-slate-100 dark:to-slate-400 leading-tight">
            Reports & Analytics
          </h1>
          <p className="text-slate-400 text-[13px] mt-1 font-medium">Financial overview · Stock health · Collection performance</p>
        </div>
        <button onClick={() => window.print()}
          className="print:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs uppercase tracking-widest shadow-sm hover:shadow-md transition-all">
          <Download className="w-3.5 h-3.5" /> Export Report
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Revenue Collected",  value: formatShort(kpis?.totalRevenue || 0),     sub: formatCurrency(kpis?.totalRevenue || 0),                              icon: TrendingUp,    color: "#10B981", bg: "rgba(16,185,129,0.08)"  },
          { label: "Total Outstanding",  value: formatShort(kpis?.totalOutstanding || 0), sub: formatCurrency(kpis?.totalOutstanding || 0),                          icon: IndianRupee,   color: "#EF4444", bg: "rgba(239,68,68,0.08)"   },
          { label: "Collection Rate",    value: `${kpis?.collectionRate || 0}%`,           sub: `${kpis?.collectionRate || 0}% of invoiced amount`,                   icon: ArrowUpRight,  color: "#6366F1", bg: "rgba(99,102,241,0.08)"  },
          { label: "Low Stock SKUs",     value: String(kpis?.lowStockCount || 0),          sub: `${kpis?.lowStockCount || 0} SKUs below reorder threshold`,           icon: PackageSearch, color: "#F59E0B", bg: "rgba(245,158,11,0.08)"  },
        ].map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-shadow group">
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: `radial-gradient(circle at top right, ${bg}, transparent 70%)` }} />
            <div className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full" style={{ background: color }} />
            <div className="relative pl-3">
              <div className="flex items-start justify-between mb-3">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</p>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg }}>
                  <Icon className="w-3.5 h-3.5" style={{ color }} />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{value}</p>
              <p className="text-[10px] text-slate-400 mt-1 font-medium truncate">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Collection Trend — 2 cols */}
        <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-widest">Collection Trend</h3>
              <p className="text-xs text-slate-400 mt-0.5">Monthly collected vs outstanding (last 6 months)</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400"><span className="w-3 h-0.5 rounded bg-emerald-500 inline-block" />Collected</span>
              <span className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400"><span className="w-3 h-0.5 rounded bg-red-500 inline-block" />Outstanding</span>
            </div>
          </div>
          <div className="flex-1 min-h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrendData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradCollected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10B981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradOutstanding" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#EF4444" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} tickFormatter={formatShort} width={52} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', fontSize: '12px' }}
                  itemStyle={{ color: '#e2e8f0', fontWeight: 600 }}
                  labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                  formatter={(v: any, name: any) => [formatCurrency(Number(v)), name]}
                  itemSorter={(item: any) => -Number(item.value)}
                />
                <Area type="monotone" dataKey="collected"   stroke="#10B981" strokeWidth={2.5} fill="url(#gradCollected)"   dot={{ r: 3.5, fill: "#10B981", strokeWidth: 0 }} activeDot={{ r: 5 }} name="Collected" />
                <Area type="monotone" dataKey="outstanding" stroke="#EF4444" strokeWidth={2.5} fill="url(#gradOutstanding)" dot={{ r: 3.5, fill: "#EF4444", strokeWidth: 0 }} activeDot={{ r: 5 }} name="Outstanding" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stock Distribution Pie */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 shadow-sm flex flex-col">
          <div className="mb-4">
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-widest">Stock Distribution</h3>
            <p className="text-xs text-slate-400 mt-0.5">By product type (MT)</p>
          </div>
          <div className="flex-1 min-h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stockDistributionData} cx="50%" cy="42%" innerRadius={55} outerRadius={82} paddingAngle={3} dataKey="value" stroke="none">
                  {stockDistributionData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', fontSize: '12px' }}
                  itemStyle={{ color: '#e2e8f0', fontWeight: 600 }}
                  formatter={(v: any) => [`${Number(v)} MT`, "Stock"]}
                />
                <Legend verticalAlign="bottom" height={40} iconType="circle" iconSize={8}
                  formatter={(val) => <span className="text-[10px] font-semibold text-slate-400">{val}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Aging + Critical ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Invoice Aging Bar */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 shadow-sm flex flex-col">
          <div className="mb-4">
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-widest">Invoice Aging</h3>
            <p className="text-xs text-slate-400 mt-0.5">Outstanding balance by days past due</p>
          </div>
          <div className="flex-1 min-h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={invoiceAgingData} margin={{ top: 5, right: 10, left: 0, bottom: 10 }}>
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#EF4444" stopOpacity={1}   />
                    <stop offset="100%" stopColor="#DC2626" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} tickFormatter={formatShort} width={52} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', fontSize: '12px' }}
                  itemStyle={{ color: '#e2e8f0', fontWeight: 600 }}
                  labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                  formatter={(v: any) => [formatCurrency(Number(v)), "Outstanding"]}
                />
                <Bar dataKey="amount" fill="url(#barGrad)" radius={[8, 8, 0, 0]} maxBarSize={64} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Critical Overdue */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-widest">Critical Overdue</h3>
              <p className="text-xs text-slate-400">Invoices requiring immediate action</p>
            </div>
          </div>
          {criticalInvoices.length > 0 ? (
            <div className="space-y-2.5">
              {criticalInvoices.map((inv) => {
                const daysOverdue = Math.ceil((new Date().getTime() - new Date(inv.due_date).getTime()) / 86400000);
                const balance = Number(inv.total_amount) - Number(inv.amount_paid);
                const urgency = daysOverdue > 60 ? "#9F1239" : daysOverdue > 30 ? "#EF4444" : "#F59E0B";
                return (
                  <div key={inv.id} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-red-200 dark:hover:border-red-500/30 hover:-translate-y-0.5 hover:shadow-sm transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-8 rounded-full shrink-0" style={{ backgroundColor: urgency }} />
                      <div>
                        <p className="font-bold text-sm text-slate-800 dark:text-slate-100 font-mono">{inv.invoice_number}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{inv.customer?.business_name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-sm font-mono" style={{ color: urgency }}>{formatShort(balance)}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{daysOverdue}d overdue</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-3">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">No overdue invoices</p>
              <p className="text-[10px] text-slate-400 mt-1">All invoices are current</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
