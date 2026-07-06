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

const COLORS = ["#D02936", "#3D7A6B", "#F4A623", "#38BDF8", "#A78BFA"];

// Mock monthly trend data
const monthlyTrendData = Array.from({ length: 6 }, (_, i) => {
  const d = subMonths(new Date(), 5 - i);
  return {
    month: format(d, "MMM"),
    collected: Math.floor(Math.random() * 300000) + 100000,
    outstanding: Math.floor(Math.random() * 200000) + 50000,
  };
});

const CustomTooltipStyle = {
  backgroundColor: 'var(--tooltip-bg, #1A2035)',
  borderColor: '#2A314A',
  color: '#F8FAFC',
  borderRadius: '10px',
  fontSize: '12px',
};

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
    return [
      { name: "0–30 Days", amount: under30 },
      { name: "31–60 Days", amount: days30to60 },
      { name: "60+ Days", amount: over60 },
    ];
  }, [invoices]);

  const stockDistributionData = useMemo(() => {
    if (!skus) return [];
    const typeMap = new Map<string, number>();
    skus.forEach(sku => {
      const current = typeMap.get(sku.product_type) || 0;
      typeMap.set(sku.product_type, current + Number(sku.total_stock));
    });
    return Array.from(typeMap.entries()).map(([name, value]) => ({
      name: name.replace('_', ' ').toUpperCase(),
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
    <div className="flex flex-col h-full overflow-y-auto pb-10 no-scrollbar">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 shrink-0 border-b border-border mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-wider text-text-primary uppercase">
            Reports & Analytics
          </h1>
          <p className="text-text-muted text-sm mt-1">Financial overview and stock health summary</p>
        </div>
        <button 
          onClick={() => window.print()}
          className="print:hidden flex items-center gap-2 bg-panel border border-border text-text-muted hover:text-text-primary hover:border-white/20 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          Export Report
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 print:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Total Revenue Collected",
            value: formatShort(kpis?.totalRevenue || 0),
            full: formatCurrency(kpis?.totalRevenue || 0),
            icon: TrendingUp,
            color: "#3D7A6B",
            bg: "rgba(61,122,107,0.12)",
            border: "rgba(61,122,107,0.3)",
            trend: "+12.4%",
          },
          {
            label: "Total Outstanding",
            value: formatShort(kpis?.totalOutstanding || 0),
            full: formatCurrency(kpis?.totalOutstanding || 0),
            icon: IndianRupee,
            color: "#D02936",
            bg: "rgba(208,41,54,0.12)",
            border: "rgba(208,41,54,0.3)",
            trend: "-3.1%",
          },
          {
            label: "Collection Rate",
            value: `${kpis?.collectionRate || 0}%`,
            full: `${kpis?.collectionRate || 0}% of invoiced amount collected`,
            icon: ArrowUpRight,
            color: "#F4A623",
            bg: "rgba(244,166,35,0.12)",
            border: "rgba(244,166,35,0.3)",
            trend: "+5.2%",
          },
          {
            label: "Low Stock SKUs",
            value: String(kpis?.lowStockCount || 0),
            full: `${kpis?.lowStockCount || 0} SKUs below reorder threshold`,
            icon: PackageSearch,
            color: "#38BDF8",
            bg: "rgba(56,189,248,0.12)",
            border: "rgba(56,189,248,0.3)",
            trend: "Needs attention",
          },
        ].map(({ label, value, full, icon: Icon, color, bg, border, trend }) => (
          <div key={label}
            className="bg-panel/40 backdrop-blur-md border border-white/10 rounded-2xl p-5 relative overflow-hidden group hover:border-white/20 transition-all shadow-xl"
            style={{ borderColor: border }}
          >
            <div className="absolute top-0 left-0 w-full h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${color}60, transparent)` }} />
            <div className="flex items-start justify-between mb-3">
              <p className="text-text-muted text-[10px] uppercase tracking-widest font-bold leading-tight">{label}</p>
              <div className="p-1.5 rounded-lg" style={{ background: bg }}>
                <Icon className="w-3.5 h-3.5" style={{ color }} />
              </div>
            </div>
            <p className="text-3xl font-display font-bold text-text-primary mb-1">{value}</p>
            <p className="text-text-muted text-[10px]">{full}</p>
            <p className="text-[10px] font-bold mt-2" style={{ color }}>{trend}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 print:grid-cols-3 gap-6 mb-8">
        {/* Monthly Collection Trend - takes 2 cols */}
        <div className="lg:col-span-2 print:col-span-2 bg-panel/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex flex-col shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-display font-bold text-text-primary uppercase tracking-widest">Collection Trend</h3>
              <p className="text-text-muted text-xs mt-0.5">Last 6 months collected vs outstanding</p>
            </div>
          </div>
          <div className="flex-1 min-h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A314A" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} tickFormatter={formatShort} />
                <Tooltip 
                  contentStyle={CustomTooltipStyle} 
                  itemStyle={{ color: '#E2E8F0', fontWeight: 'bold' }}
                  labelStyle={{ color: '#94A3B8', marginBottom: '4px' }}
                  formatter={(value: any, name: any) => [formatCurrency(Number(value)), name]}
                  itemSorter={(item: any) => -item.value}
                />
                <Line type="monotone" dataKey="collected" stroke="#3D7A6B" strokeWidth={3} dot={{ r: 4, fill: "#3D7A6B", strokeWidth: 2 }} activeDot={{ r: 6 }} name="Collected" />
                <Line type="monotone" dataKey="outstanding" stroke="#D02936" strokeWidth={3} dot={{ r: 4, fill: "#D02936", strokeWidth: 2 }} activeDot={{ r: 6 }} name="Outstanding" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-6 mt-3">
            <div className="flex items-center gap-2"><div className="w-3 h-0.5 bg-[#3D7A6B] rounded" /><span className="text-[10px] text-text-muted">Collected</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-0.5 bg-accent rounded" /><span className="text-[10px] text-text-muted">Outstanding</span></div>
          </div>
        </div>

        {/* Stock Distribution Pie */}
        <div className="bg-panel/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex flex-col shadow-xl">
          <div className="mb-6">
            <h3 className="text-sm font-display font-bold text-text-primary uppercase tracking-widest">Stock Distribution</h3>
            <p className="text-text-muted text-xs mt-0.5">By product type (MT)</p>
          </div>
          <div className="flex-1 min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stockDistributionData}
                  cx="50%" cy="45%"
                  innerRadius={55} outerRadius={80}
                  paddingAngle={4} dataKey="value" stroke="none"
                >
                  {stockDistributionData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={CustomTooltipStyle} 
                  itemStyle={{ color: '#E2E8F0', fontWeight: 'bold' }}
                  labelStyle={{ color: '#94A3B8' }}
                  formatter={(v: unknown) => [Number(v ?? 0), "MT"]} 
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle"
                  formatter={(value) => <span className="text-[10px] text-text-muted">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Invoice Aging Bar + Critical Table Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Invoice Aging Bar Chart */}
        <div className="bg-panel/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex flex-col shadow-xl">
          <div className="mb-6">
            <h3 className="text-sm font-display font-bold text-text-primary uppercase tracking-widest">Invoice Aging</h3>
            <p className="text-text-muted text-xs mt-0.5">Outstanding balance by days past due</p>
          </div>
          <div className="flex-1 min-h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={invoiceAgingData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A314A" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} tickFormatter={formatShort} />
                <Tooltip 
                  contentStyle={CustomTooltipStyle} 
                  itemStyle={{ color: '#E2E8F0', fontWeight: 'bold' }}
                  labelStyle={{ color: '#94A3B8', marginBottom: '4px' }}
                  formatter={(v: unknown) => [formatCurrency(Number(v ?? 0)), "Amount"]} 
                />
                <Bar dataKey="amount" fill="#D02936" radius={[6, 6, 0, 0]} maxBarSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Critical Overdue Invoices */}
        <div className="bg-panel/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-critical/10 border border-critical/20 flex items-center justify-center">
              <AlertTriangle className="text-critical w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-display font-bold text-text-primary uppercase tracking-widest">Critical Overdue</h3>
              <p className="text-text-muted text-xs">Invoices requiring immediate action</p>
            </div>
          </div>
          
          {criticalInvoices.length > 0 ? (
            <div className="space-y-3">
              {criticalInvoices.map((inv) => {
                const daysOverdue = Math.ceil((new Date().getTime() - new Date(inv.due_date).getTime()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={inv.id} className="flex items-center justify-between p-3 bg-background/40 border border-white/5 rounded-xl hover:border-white/10 transition-colors">
                    <div>
                      <p className="text-text-primary text-xs font-bold">{inv.invoice_number}</p>
                      <p className="text-text-muted text-[10px] mt-0.5">{inv.customer?.business_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-accent text-xs font-bold">{formatCurrency(Number(inv.total_amount) - Number(inv.amount_paid))}</p>
                      <p className="text-critical text-[10px] mt-0.5">{daysOverdue}d overdue</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-text-muted">
              <AlertTriangle className="w-8 h-8 mb-3 opacity-20" />
              <p className="text-xs uppercase tracking-widest">No critical overdue invoices</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
