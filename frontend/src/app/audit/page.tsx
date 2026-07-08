"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, TrendingUp, FileText, Clock, SlidersHorizontal } from "lucide-react";

const MOCK_LOGS = [
  { id: 'm1',  name: 'Acme Corp',          action: 'Payment Received', category: 'Payment',  time: 'Today, 10:30 AM',   isPaid: true,  amount: 200000,  status: 'Credited' },
  { id: 'm2',  name: 'Stark Industries',   action: 'Invoice Issued',   category: 'Invoice',  time: 'Today, 09:15 AM',   isPaid: false, amount: 150000,  status: 'Pending'  },
  { id: 'm3',  name: 'Wayne Enterprises',  action: 'Payment Received', category: 'Payment',  time: 'Yesterday, 4:00 PM',isPaid: true,  amount: 350000,  status: 'Credited' },
  { id: 'm4',  name: 'LexCorp',            action: 'Invoice Issued',   category: 'Invoice',  time: 'Yesterday, 11:30 AM',isPaid: false, amount: 80000,   status: 'Pending'  },
  { id: 'm5',  name: 'Oscorp Holdings',    action: 'Invoice Issued',   category: 'Invoice',  time: '2 days ago',         isPaid: false, amount: 220000,  status: 'Pending'  },
  { id: 'm6',  name: 'Stark Industries',   action: 'Payment Received', category: 'Payment',  time: '3 days ago',         isPaid: true,  amount: 120000,  status: 'Credited' },
  { id: 'm7',  name: 'Shield Logistics',   action: 'Invoice Issued',   category: 'Invoice',  time: '4 days ago',         isPaid: false, amount: 95000,   status: 'Pending'  },
  { id: 'm8',  name: 'Daily Bugle Press',  action: 'Payment Received', category: 'Payment',  time: '5 days ago',         isPaid: true,  amount: 40000,   status: 'Credited' },
  { id: 'm9',  name: 'Larsen & Toubro',    action: 'Invoice Issued',   category: 'Invoice',  time: '12 days ago',        isPaid: false, amount: 240000,  status: 'Pending'  },
  { id: 'm10', name: 'BuildIt Steel',      action: 'Payment Received', category: 'Payment',  time: '20 days ago',        isPaid: true,  amount: 500000,  status: 'Credited' },
  { id: 'm11', name: 'Acme Corp',          action: 'Invoice Issued',   category: 'Invoice',  time: '25 days ago',        isPaid: false, amount: 400000,  status: 'Pending'  },
  { id: 'm12', name: 'Larsen & Toubro',    action: 'Invoice Issued',   category: 'Invoice',  time: '29 days ago',        isPaid: false, amount: 150000,  status: 'Pending'  },
  { id: 'm13', name: 'Mahindra Steel',     action: 'Payment Received', category: 'Payment',  time: '7 days ago',         isPaid: true,  amount: 310000,  status: 'Credited' },
  { id: 'm14', name: 'Reliance Ind.',      action: 'Invoice Issued',   category: 'Invoice',  time: '9 days ago',         isPaid: false, amount: 480000,  status: 'Pending'  },
  { id: 'm15', name: 'Tata Steel Ltd',     action: 'Payment Received', category: 'Payment',  time: '15 days ago',        isPaid: true,  amount: 270000,  status: 'Credited' },
];

const fmtINR = (v: number) => {
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)}Cr`;
  if (v >= 100000)   return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000)     return `₹${(v / 1000).toFixed(0)}k`;
  return `₹${v.toLocaleString('en-IN')}`;
};

export default function AuditLogsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Credited" | "Pending">("All");

  const filtered = useMemo(() => {
    let base = MOCK_LOGS;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      base = base.filter(l =>
        l.name.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        l.category.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "All") {
      base = base.filter(l => l.status === statusFilter);
    }
    return base;
  }, [searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const totalTx   = MOCK_LOGS.length;
    const credited  = MOCK_LOGS.filter(l => l.isPaid);
    const pending   = MOCK_LOGS.filter(l => !l.isPaid);
    const totalIn   = credited.reduce((s, l) => s + l.amount, 0);
    const totalOut  = pending.reduce((s, l) => s + l.amount, 0);
    return { totalTx, creditedCount: credited.length, pendingCount: pending.length, totalIn, totalOut };
  }, []);

  const statusTabs: Array<"All" | "Credited" | "Pending"> = ["All", "Credited", "Pending"];

  return (
    <div className="flex flex-col min-h-full pb-10">

      {/* ── Page Header ── */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.push("/dashboard")}
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200"
          style={{
            background: "rgb(var(--color-panel))",
            border: "1px solid rgb(var(--color-border))",
            color: "rgb(var(--color-text-muted))",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgb(var(--color-accent))";
            (e.currentTarget as HTMLButtonElement).style.color = "rgb(var(--color-accent))";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgb(var(--color-border))";
            (e.currentTarget as HTMLButtonElement).style.color = "rgb(var(--color-text-muted))";
          }}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-display font-bold text-text-primary tracking-widest uppercase leading-none">
            Audit Logs &amp; Transactions
          </h1>
          <p className="text-text-muted text-[13px] mt-1">
            Full 30-day history of inventory, invoice, and payment movements
          </p>
        </div>
      </div>

      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        {[
          { label: "Total Transactions", value: String(stats.totalTx),         sub: "Last 30 days",         color: "#4A90E2", icon: SlidersHorizontal },
          { label: "Total Received",     value: fmtINR(stats.totalIn),          sub: `${stats.creditedCount} payments`, color: "#34A878", icon: TrendingUp  },
          { label: "Total Invoiced",     value: fmtINR(stats.totalOut),         sub: `${stats.pendingCount} invoices`,  color: "#F4A623", icon: FileText    },
          { label: "Pending Amount",     value: fmtINR(stats.totalOut),         sub: "Awaiting collection",  color: "#D02936", icon: Clock       },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div
              key={i}
              className="rounded-2xl p-4"
              style={{
                background: "rgb(var(--color-panel))",
                border: "1px solid rgb(var(--color-border))",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: `${s.color}18`, border: `1px solid ${s.color}28` }}
                >
                  <Icon className="w-4 h-4" style={{ color: s.color }} />
                </div>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
              </div>
              <p className="text-[22px] font-display font-bold text-text-primary leading-none">{s.value}</p>
              <p className="text-[10px] text-text-muted uppercase tracking-wider mt-1">{s.label}</p>
              <p className="text-[10px] mt-0.5" style={{ color: s.color }}>{s.sub}</p>
            </div>
          );
        })}
      </div>

      {/* ── Main Card ── */}
      <div
        className="rounded-2xl flex flex-col flex-1"
        style={{
          background: "rgb(var(--color-panel))",
          border: "1px solid rgb(var(--color-border))",
          boxShadow: "var(--shadow-card)",
        }}
      >
        {/* Toolbar */}
        <div
          className="flex items-center gap-3 px-5 py-4"
          style={{ borderBottom: "1px solid rgb(var(--color-border))" }}
        >
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Search by company, action…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-[13px] text-text-primary rounded-lg outline-none transition-all"
              style={{
                background: "rgb(var(--surface-sunken))",
                border: "1px solid rgb(var(--color-border))",
              }}
              onFocus={e => (e.currentTarget.style.borderColor = "rgb(var(--color-accent))")}
              onBlur={e  => (e.currentTarget.style.borderColor = "rgb(var(--color-border))")}
            />
          </div>

          {/* Status tab pills */}
          <div
            className="flex items-center p-1 gap-0.5 rounded-lg shrink-0"
            style={{ background: "rgb(var(--surface-sunken))", border: "1px solid rgb(var(--color-border))" }}
          >
            {statusTabs.map(tab => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className="px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all duration-200"
                style={
                  statusFilter === tab
                    ? {
                        background: tab === "Credited" ? "rgba(52,168,120,0.15)" : tab === "Pending" ? "rgba(244,166,35,0.15)" : "rgb(var(--color-accent))",
                        color:      tab === "Credited" ? "#34A878"               : tab === "Pending" ? "#F4A623"               : "#fff",
                        boxShadow: tab === "All" ? "0 2px 8px rgba(208,41,54,0.25)" : "none",
                      }
                    : { color: "rgb(var(--color-text-muted))" }
                }
                onMouseEnter={e => { if (statusFilter !== tab) (e.currentTarget as HTMLButtonElement).style.color = "rgb(var(--color-text-primary))"; }}
                onMouseLeave={e => { if (statusFilter !== tab) (e.currentTarget as HTMLButtonElement).style.color = "rgb(var(--color-text-muted))"; }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Result count */}
          <span
            className="text-[11px] font-semibold px-2.5 py-1 rounded-lg shrink-0"
            style={{ background: "rgb(var(--surface-sunken))", color: "rgb(var(--color-text-muted))", border: "1px solid rgb(var(--color-border))" }}
          >
            {filtered.length} entries
          </span>
        </div>

        {/* Table header */}
        <div
          className="grid px-5 py-2.5"
          style={{
            gridTemplateColumns: "2.5rem 1fr 140px 120px 100px",
            gap: "1rem",
            borderBottom: "1px solid rgb(var(--color-border))",
            background: "rgb(var(--surface-sunken))",
          }}
        >
          {["", "Company / Action", "Date & Time", "Status", "Amount"].map((h, i) => (
            <span key={i} className="text-[9px] font-bold uppercase tracking-[0.18em] text-text-muted/70"
              style={{ textAlign: i >= 3 ? "right" : "left" }}>
              {h}
            </span>
          ))}
        </div>

        {/* Rows */}
        <div className="flex flex-col divide-y" style={{ borderColor: "rgb(var(--color-border)/0.5)" }}>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-text-muted gap-2">
              <Search className="w-8 h-8 opacity-20" />
              <p className="text-[12px] uppercase tracking-widest opacity-50">No logs match your search</p>
            </div>
          ) : (
            filtered.map(item => {
              const initial = item.name.charAt(0).toUpperCase();
              return (
                <div
                  key={item.id}
                  className="grid px-5 py-3.5 items-center"
                  style={{
                    gridTemplateColumns: "2.5rem 1fr 140px 120px 100px",
                    gap: "1rem",
                    transition: "background 0.15s ease",
                    cursor: "default",
                    borderBottom: "1px solid rgb(var(--color-border)/0.35)",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgb(var(--surface-sunken))")}
                  onMouseLeave={e => (e.currentTarget.style.background = "")}
                >
                  {/* Avatar */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                    style={
                      item.isPaid
                        ? { background: "rgba(52,168,120,0.14)", color: "#34A878", border: "1.5px solid rgba(52,168,120,0.28)" }
                        : { background: "rgba(208,41,54,0.12)", color: "rgb(var(--color-accent))", border: "1.5px solid rgba(208,41,54,0.22)" }
                    }
                  >
                    {initial}
                  </div>

                  {/* Company + action */}
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-text-primary truncate leading-none">{item.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {item.isPaid
                        ? <TrendingUp className="w-3 h-3 shrink-0" style={{ color: "#34A878" }} />
                        : <FileText   className="w-3 h-3 shrink-0 text-text-muted" />
                      }
                      <p className="text-[11px] text-text-muted truncate">{item.action} of steel order</p>
                    </div>
                  </div>

                  {/* Time */}
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-text-muted/50 shrink-0" />
                    <span className="text-[11px] font-mono text-text-muted truncate">{item.time}</span>
                  </div>

                  {/* Status badge */}
                  <div className="flex justify-end">
                    <span
                      className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-md"
                      style={
                        item.isPaid
                          ? { background: "rgba(52,168,120,0.12)", color: "#34A878",  border: "1px solid rgba(52,168,120,0.22)" }
                          : { background: "rgba(244,166,35,0.12)", color: "#F4A623",  border: "1px solid rgba(244,166,35,0.22)" }
                      }
                    >
                      {item.status}
                    </span>
                  </div>

                  {/* Amount */}
                  <div className="text-right">
                    <p
                      className="text-[13px] font-display font-bold leading-none"
                      style={{ color: item.isPaid ? "#34A878" : "rgb(var(--color-text-primary))" }}
                    >
                      {item.isPaid ? "+" : ""}{fmtINR(item.amount)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          className="px-5 py-3 flex items-center justify-between"
          style={{ borderTop: "1px solid rgb(var(--color-border))", background: "rgb(var(--surface-sunken))" }}
        >
          <p className="text-[10px] text-text-muted">
            Showing <span className="font-semibold text-text-primary">{filtered.length}</span> of{" "}
            <span className="font-semibold text-text-primary">{MOCK_LOGS.length}</span> transactions
          </p>
          <p className="text-[10px] text-text-muted">Last 30 days · Auto-refreshed</p>
        </div>
      </div>
    </div>
  );
}
