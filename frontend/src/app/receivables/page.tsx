"use client";

import { useState, useMemo, Fragment } from "react";
import {
  useInvoices, useRecordPayment, useSendReminder,
  useCreateInvoice, useCustomers, Invoice
} from "@/hooks/useReceivables";
import { format } from "date-fns";
import {
  Plus, X, Clock, CheckCircle, Download,
  IndianRupee, FileText, AlertTriangle, ChevronDown,
  ChevronUp, MessageCircle, Filter, TrendingDown,
  Building2, Calendar, ArrowUpRight
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { usePdfExport } from "@/hooks/usePdfExport";

/* ─── Aging helper ─────────────────────────────────── */
function getAging(dueDateStr: string) {
  const days = Math.ceil((new Date().getTime() - new Date(dueDateStr).getTime()) / 86400000);
  if (days <= 0)  return { label: "Current",     days, color: "#10B981", bg: "rgba(16,185,129,0.12)"  };
  if (days <= 30) return { label: `${days}D`,     days, color: "#F59E0B", bg: "rgba(245,158,11,0.12)"  };
  if (days <= 60) return { label: `${days}D`,     days, color: "#EF4444", bg: "rgba(239,68,68,0.12)"   };
  return             { label: `${days}D`,     days, color: "#9F1239", bg: "rgba(159,18,57,0.15)"   };
}

const ST: Record<string, { label: string; color: string; bg: string; ring: string }> = {
  paid:           { label: "Paid",         color: "#10B981", bg: "rgba(16,185,129,0.1)",  ring: "rgba(16,185,129,0.3)"  },
  overdue:        { label: "Overdue",      color: "#EF4444", bg: "rgba(239,68,68,0.1)",   ring: "rgba(239,68,68,0.3)"   },
  partially_paid: { label: "Part. Paid",   color: "#F59E0B", bg: "rgba(245,158,11,0.1)",  ring: "rgba(245,158,11,0.3)"  },
  unpaid:         { label: "Unpaid",       color: "#94A3B8", bg: "rgba(148,163,184,0.08)",ring: "rgba(148,163,184,0.2)" },
};

const inputCls = "w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all placeholder:text-slate-400";
const labelCls = "block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 mb-1.5";


/* ─── Main Page ─────────────────────────────────────── */
export default function ReceivablesPage() {
  const { user } = useAuthStore();
  const { data: invoices, isLoading } = useInvoices();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isCreatingPanel, setIsCreatingPanel] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [agingFilter, setAgingFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const { exportInvoices } = usePdfExport();
  const canEdit = user?.role === "accounts_team" || user?.role === "management";
  const canRecordPayment = !user?.role || user?.role !== "warehouse_staff"; // show Actions unless explicitly warehouse_staff

  const kpis = useMemo(() => {
    if (!invoices) return { outstanding: 0, overdue: 0, collected: 0, total: 0 };
    return invoices.reduce((acc, inv) => {
      const bal = Number(inv.total_amount) - Number(inv.amount_paid);
      const days = Math.ceil((new Date().getTime() - new Date(inv.due_date).getTime()) / 86400000);
      if (inv.status !== "paid") { acc.outstanding += bal; if (days > 0) acc.overdue += bal; }
      acc.collected += Number(inv.amount_paid);
      acc.total++;
      return acc;
    }, { outstanding: 0, overdue: 0, collected: 0, total: 0 });
  }, [invoices]);

  const aging = useMemo(() => {
    if (!invoices) return { current: 0, d30: 0, d60: 0, d90: 0 };
    const a = { current: 0, d30: 0, d60: 0, d90: 0 };
    invoices.filter(i => i.status !== "paid").forEach(inv => {
      const days = Math.ceil((new Date().getTime() - new Date(inv.due_date).getTime()) / 86400000);
      const amt = Number(inv.total_amount) - Number(inv.amount_paid);
      if (days <= 0) a.current += amt;
      else if (days <= 30) a.d30 += amt;
      else if (days <= 60) a.d60 += amt;
      else a.d90 += amt;
    });
    return a;
  }, [invoices]);

  const filtered = useMemo(() => {
    if (!invoices) return [];
    return invoices.filter(inv => {
      if (statusFilter !== "all" && inv.status !== statusFilter) return false;
      if (branchFilter !== "all" && inv.branch !== branchFilter) return false;
      if (agingFilter !== "all") {
        const d = Math.ceil((new Date().getTime() - new Date(inv.due_date).getTime()) / 86400000);
        if (agingFilter === "current" && d > 0) return false;
        if (agingFilter === "0-30" && (d <= 0 || d > 30)) return false;
        if (agingFilter === "30-60" && (d <= 30 || d > 60)) return false;
        if (agingFilter === "60+" && d <= 60) return false;
      }
      return true;
    });
  }, [invoices, statusFilter, branchFilter, agingFilter]);

  const fmt = (n: number) => n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${n.toLocaleString("en-IN")}`;

  return (
    <div className="flex flex-col min-h-full pb-10 gap-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-accent mb-1.5 flex items-center gap-2">
            <span className="w-4 h-[2px] bg-accent rounded-full" />
            Receivables
          </p>
          <h1 className="text-[32px] font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-500 dark:from-slate-100 dark:to-slate-400 leading-tight">
            Accounts Receivable
          </h1>
          <p className="text-slate-400 text-[13px] mt-1 font-medium">Live ledger · Automated aging · Collection tracking</p>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2.5">
            <button onClick={() => invoices && exportInvoices(invoices as Invoice[])}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs uppercase tracking-widest shadow-sm hover:shadow-md transition-all">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
            <button onClick={() => setIsCreatingPanel(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-accent/25 hover:shadow-accent/40 hover:bg-accent/90 active:scale-95 transition-all">
              <Plus className="w-4 h-4" /> New Invoice
            </button>
          </div>
        )}
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Outstanding", value: fmt(kpis.outstanding), icon: IndianRupee,    color: "#EF4444", bg: "rgba(239,68,68,0.08)",    sub: "Across all open invoices" },
          { label: "Overdue Balance",   value: fmt(kpis.overdue),     icon: AlertTriangle,  color: "#F59E0B", bg: "rgba(245,158,11,0.08)",   sub: "Past due date"            },
          { label: "Payments Received", value: fmt(kpis.collected),   icon: CheckCircle,    color: "#10B981", bg: "rgba(16,185,129,0.08)",   sub: "Total collected"          },
          { label: "Total Invoices",    value: String(kpis.total),    icon: FileText,       color: "#6366F1", bg: "rgba(99,102,241,0.08)",   sub: "All time"                 },
        ].map(({ label, value, icon: Icon, color, bg, sub }) => (
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
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {isLoading ? <span className="opacity-20">—</span> : value}
              </p>
              <p className="text-[10px] text-slate-400 mt-1 font-medium">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Aging Strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Current (Not Yet Due)", amount: aging.current, color: "#10B981", key: "current", icon: "●" },
          { label: "1–30 Days Overdue",     amount: aging.d30,     color: "#F59E0B", key: "0-30",    icon: "●" },
          { label: "31–60 Days Overdue",    amount: aging.d60,     color: "#EF4444", key: "30-60",   icon: "●" },
          { label: "61+ Days Overdue",      amount: aging.d90,     color: "#9F1239", key: "60+",     icon: "●" },
        ].map(({ label, amount, color, key }) => {
          const active = agingFilter === key;
          return (
            <button key={key} onClick={() => setAgingFilter(active ? "all" : key)}
              className={`rounded-2xl p-4 text-left transition-all border ${active
                ? "bg-white dark:bg-slate-900 shadow-md"
                : "bg-white/60 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-900 hover:shadow-sm border-slate-100 dark:border-slate-800"}`}
              style={active ? { borderColor: color, boxShadow: `0 0 0 1px ${color}40, 0 4px 12px ${color}15` } : {}}>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                <span className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400 leading-tight">{label}</span>
              </div>
              <p className="text-xl font-extrabold text-slate-900 dark:text-white">{fmt(amount)}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Outstanding</p>
            </button>
          );
        })}
      </div>

      {/* ── Table Card ── */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">

        {/* Filter bar */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />

          {/* Status pills */}
          <div className="flex items-center gap-1.5">
            {[
              { v: "all",            l: "All"      },
              { v: "unpaid",         l: "Unpaid"   },
              { v: "partially_paid", l: "Partial"  },
              { v: "overdue",        l: "Overdue"  },
              { v: "paid",           l: "Paid"     },
            ].map(({ v, l }) => (
              <button key={v} onClick={() => setStatusFilter(v)}
                className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold tracking-wide transition-all ${
                  statusFilter === v
                    ? "bg-accent text-white shadow-sm shadow-accent/30"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200"
                }`}>{l}</button>
            ))}
          </div>

          <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1 shrink-0" />

          {/* Branch dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 shrink-0">Branch</span>
            <select
              value={branchFilter}
              onChange={e => setBranchFilter(e.target.value)}
              className="bg-slate-100 dark:bg-slate-800 border-0 text-slate-700 dark:text-slate-300 text-[11px] font-bold rounded-full px-3.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-accent/30 appearance-none cursor-pointer pr-7 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMiIgaGVpZ2h0PSIxMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM5NGEzYjgiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJtNiA5IDYgNiA2LTYiLz48L3N2Zz4=')] bg-no-repeat bg-[right_0.5rem_center]"
            >
              <option value="all">All Branches</option>
              <option value="Peenya">Peenya</option>
              <option value="New Bamboo Bazar">New Bamboo Bazar</option>
              <option value="Hosur">Hosur</option>
            </select>
          </div>

          {agingFilter !== "all" && (
            <button onClick={() => setAgingFilter("all")}
              className="ml-auto flex items-center gap-1 text-[10px] text-accent font-bold uppercase tracking-wider hover:underline">
              <X className="w-3 h-3" /> Clear Aging
            </button>
          )}
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="p-6 space-y-3">{[...Array(5)].map((_,i) => <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <FileText className="w-10 h-10 mb-3 opacity-20" />
            <p className="text-xs font-bold uppercase tracking-widest">No invoices match filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
          <table className="w-full text-left min-w-[900px]">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                {["Invoice #", "Customer", "Branch", "Due Date", "Aging", "Invoice Amt", "Balance Due", "Status", ...(canRecordPayment ? ["Actions"] : [])].map(h => (
                  <th key={h} className="px-4 py-3 text-[9px] font-black uppercase tracking-[0.18em] text-slate-400 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv, idx) => {
                const bal = Number(inv.total_amount) - Number(inv.amount_paid);
                const ag = getAging(inv.due_date);
                const st = ST[inv.status] ?? ST.unpaid;
                const isExpanded = expandedId === inv.id;
                return (
                  <Fragment key={inv.id}>
                    <tr className={`border-t border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 hover:-translate-y-0.5 hover:shadow-md hover:z-10 hover:relative transition-all duration-150 group ${idx % 2 === 1 ? "bg-slate-50/30 dark:bg-slate-800/10" : ""}`}>
                      <td className="px-4 py-3.5 cursor-pointer" onClick={() => inv.items?.length > 0 && setExpandedId(isExpanded ? null : inv.id)}>
                        <div className="flex items-center gap-2">
                          {inv.items?.length > 0
                            ? isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-accent" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                            : <span className="w-3.5 h-3.5" />}
                          <span className="font-mono font-bold text-sm text-slate-800 dark:text-slate-100 hover:text-accent transition-colors">{inv.invoice_number}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 leading-tight">{inv.customer?.business_name ?? "—"}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{inv.customer?.contact_person}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        {inv.branch
                          ? <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-medium"><Building2 className="w-3 h-3" />{inv.branch}</span>
                          : <span className="text-slate-300 dark:text-slate-600">—</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
                          <Calendar className="w-3 h-3" />{format(new Date(inv.due_date), "dd MMM yyyy")}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {inv.status === "paid" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10">
                            <CheckCircle className="w-2.5 h-2.5" /> Cleared
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold"
                            style={{ background: ag.bg, color: ag.color }}>
                            <Clock className="w-2.5 h-2.5" />{ag.label}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-sm font-mono font-semibold text-slate-700 dark:text-slate-300 text-right whitespace-nowrap">
                        ₹{Number(inv.total_amount).toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <span className="font-mono font-extrabold text-sm" style={{ color: bal > 0 ? "#EF4444" : "#10B981" }}>
                          ₹{bal.toLocaleString("en-IN")}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap"
                          style={{ background: st.bg, color: st.color, boxShadow: `0 0 0 1px ${st.ring}` }}>
                          {st.label}
                        </span>
                      </td>
                      {canRecordPayment && (
                        <td className="px-4 py-3.5">
                          {inv.status !== "paid" ? (
                            <button onClick={() => setSelectedInvoice(inv as any)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all whitespace-nowrap"
                              style={{ background: "rgb(var(--color-accent)/0.1)", color: "rgb(var(--color-accent))", border: "1px solid rgb(var(--color-accent)/0.3)" }}
                              onMouseEnter={e => (e.currentTarget.style.background = "rgb(var(--color-accent)/0.2)")}
                              onMouseLeave={e => (e.currentTarget.style.background = "rgb(var(--color-accent)/0.1)")}
                            >
                              <ArrowUpRight className="w-3 h-3" /> Record Pay
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium">—</span>
                          )}
                        </td>
                      )}
                    </tr>
                    {isExpanded && inv.items && inv.items.length > 0 && (
                      <tr className="border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
                        <td colSpan={canRecordPayment ? 9 : 8} className="px-8 py-4">
                          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Line Items</p>
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="text-[9px] uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-700">
                                {["Description","SI No.","T × L × W","Sec. Weight","Sheets"].map(h => (
                                  <th key={h} className="pb-2 font-bold pr-6">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {inv.items.map((item, i) => (
                                <tr key={i} className="border-b border-slate-100 dark:border-slate-800 last:border-0 text-slate-600 dark:text-slate-400">
                                  <td className="py-2 pr-6">{item.item_description || "—"}</td>
                                  <td className="py-2 pr-6 font-mono text-[10px]">{item.si_no || "—"}</td>
                                  <td className="py-2 pr-6 font-mono text-[10px]">{item.t_l_w || "—"}</td>
                                  <td className="py-2 pr-6 font-mono text-[10px]">{item.section_weight} kg</td>
                                  <td className="py-2 font-mono text-[10px]">{item.number_of_sheets}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        )}

        {/* Footer */}
        {!isLoading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
            <p className="text-[10px] text-slate-400">
              Showing <span className="font-bold text-slate-600 dark:text-slate-300">{filtered.length}</span> of <span className="font-bold text-slate-600 dark:text-slate-300">{invoices?.length}</span> invoices
            </p>
            <p className="text-[10px] text-slate-400">
              Total balance: <span className="font-bold text-red-500">{fmt(filtered.reduce((s, i) => s + Number(i.total_amount) - Number(i.amount_paid), 0))}</span>
            </p>
          </div>
        )}
      </div>

      <PaymentSlidePanel invoice={selectedInvoice} isOpen={!!selectedInvoice} onClose={() => setSelectedInvoice(null)} />
      <CreateInvoiceSlidePanel isOpen={isCreatingPanel} onClose={() => setIsCreatingPanel(false)} />
    </div>
  );
}


/* ─── Payment Panel ─────────────────────────────────── */
function PaymentSlidePanel({ invoice, isOpen, onClose }: { invoice: Invoice | null; isOpen: boolean; onClose: () => void }) {
  const { mutate: recordPayment, isPending } = useRecordPayment();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<any>("bank_transfer");

  if (!isOpen || !invoice) return null;
  const balance = Number(invoice.total_amount) - Number(invoice.amount_paid);

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-[440px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 z-50 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-widest">Record Payment</h2>
            <p className="text-xs text-slate-400 mt-0.5">Invoice #{invoice.invoice_number}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-6 py-5 bg-red-50 dark:bg-red-500/10 border-b border-red-100 dark:border-red-500/20">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-red-400 mb-1">Balance Due</p>
          <p className="text-3xl font-extrabold text-red-600 dark:text-red-400">₹{balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
          <p className="text-xs text-slate-400 mt-1">{invoice.customer?.business_name}</p>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div><label className={labelCls}>Amount Received (₹)</label>
            <input
              type="text"
              inputMode="decimal"
              required
              value={amount}
              onChange={e => {
                // Strip non-numeric except dot
                let raw = e.target.value.replace(/[^0-9.]/g, "");
                if (!raw) {
                  setAmount("");
                  return;
                }
                const parts = raw.split(".");
                const intPart = parts[0].replace(/^0+/, "") || "0";
                const decPart = parts.length > 1 ? "." + parts.slice(1).join("") : "";
                // Indian comma formatting: XX,XX,XXX
                const formatted = Number(intPart).toLocaleString("en-IN");
                setAmount(formatted + decPart);
              }}
              className={inputCls}
              placeholder={`Max: ₹${balance.toLocaleString("en-IN")}`}
            />
          </div>
          <div><label className={labelCls}>Payment Method</label>
            <select value={method} onChange={e => setMethod(e.target.value)} className={inputCls + " appearance-none cursor-pointer"}>
              <option value="bank_transfer">Bank Transfer (NEFT / RTGS)</option>
              <option value="cheque">Cheque</option>
              <option value="upi">UPI</option>
              <option value="cash">Cash</option>
            </select>
          </div>
        </div>
        <div className="px-6 py-5 border-t border-slate-100 dark:border-slate-800">
          <button onClick={(e) => {
            e.preventDefault();
            if (!amount) return;
            const numericAmount = Number(amount.replace(/,/g, ""));
            recordPayment(
              { invoiceId: invoice.id, paymentData: { invoice_id: invoice.id, amount: numericAmount, payment_method: method } },
              { onSuccess: () => { onClose(); setAmount(""); } }
            );
          }}
            disabled={isPending || !amount || Number(amount.replace(/,/g,"")) <= 0 || Number(amount.replace(/,/g,"")) > balance}
            className="w-full bg-accent text-white font-bold uppercase tracking-widest py-3.5 rounded-xl hover:bg-accent/90 shadow-lg shadow-accent/20 transition-all disabled:opacity-50 text-sm">
            {isPending ? "Recording…" : "Record Payment"}
          </button>
        </div>
      </div>
    </>
  );
}

/* ─── Create Invoice Panel ──────────────────────────── */
function CreateInvoiceSlidePanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { mutate: createInvoice, isPending } = useCreateInvoice();
  const { data: customers } = useCustomers();
  const uniqueCustomers = useMemo(() => {
    if (!customers) return [];
    const map = new Map<string, any>();
    customers.forEach(c => map.set(c.business_name.replace(/[.,]/g, "").trim().toLowerCase(), c));
    return Array.from(map.values());
  }, [customers]);

  const [customerName, setCustomerName] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [branch, setBranch] = useState("New Bamboo Bazar");
  const [dueDate, setDueDate] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [items, setItems] = useState<any[]>([]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dueDate || !totalAmount) return;
    const matched = uniqueCustomers.find(c => c.business_name.toLowerCase() === customerName.toLowerCase());
    createInvoice({
      customer_id: matched?.id ?? 0,
      customer_name: customerName,
      invoice_number: invoiceNumber || `INV-AUTO-${Math.floor(1000 + Math.random() * 9000)}`,
      due_date: new Date(dueDate).toISOString(),
      total_amount: Number(totalAmount.replace(/,/g, "")),
      branch: branch || undefined,
      items: items.map(it => ({
        t_l_w: it.t_l_w, section_weight: Number(it.section_weight),
        si_no: it.si_no, item_description: it.item_description,
        weight: Number(it.weight), number_of_sheets: Number(it.number_of_sheets),
        weight_per_sheet: Number(it.weight_per_sheet),
      }))
    } as any, {
      onSuccess: () => { onClose(); setCustomerName(""); setInvoiceNumber(""); setBranch("New Bamboo Bazar"); setDueDate(""); setTotalAmount(""); setItems([]); }
    });
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-[560px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 z-50 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-widest">New Invoice</h2>
            <p className="text-xs text-slate-400 mt-0.5">Create invoice with line items</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <form id="inv-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Customer</label>
                <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} required className={inputCls} placeholder="Customer name" list="cust-list" />
                <datalist id="cust-list">{uniqueCustomers.map(c => <option key={c.id} value={c.business_name} />)}</datalist>
              </div>
              <div>
                <label className={labelCls}>Branch</label>
                <select value={branch} onChange={e => setBranch(e.target.value)} required className={inputCls + " appearance-none cursor-pointer"}>
                  <option value="New Bamboo Bazar">New Bamboo Bazar</option>
                  <option value="Peenya">Peenya</option>
                  <option value="Hosur">Hosur</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Invoice Number</label>
                <input type="text" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} className={inputCls} placeholder="INV-XXXX (auto if blank)" />
              </div>
              <div>
                <label className={labelCls}>Due Date</label>
                <input type="date" required value={dueDate} onChange={e => setDueDate(e.target.value)} className={inputCls + " [color-scheme:light] dark:[color-scheme:dark]"} />
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Line Items (Optional)</p>
                <button type="button" onClick={() => setItems([...items, { t_l_w: "", section_weight: 0, si_no: "", item_description: "", weight: 0, number_of_sheets: 0, weight_per_sheet: 0 }])}
                  className="text-[10px] text-accent font-bold uppercase tracking-wider flex items-center gap-1 hover:underline">
                  <Plus className="w-3 h-3" /> Add Item
                </button>
              </div>
              {items.length === 0 ? (
                <div className="text-center py-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 text-[10px] uppercase tracking-widest">No items — click Add Item</div>
              ) : items.map((item, i) => (
                <div key={i} className="relative bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 mb-3 group">
                  <button type="button" onClick={() => setItems(items.filter((_,idx) => idx !== i))}
                    className="absolute top-2 right-2 p-1 rounded text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div><label className={labelCls}>Description</label><input type="text" value={item.item_description} onChange={e => { const n=[...items]; n[i]={...n[i],item_description:e.target.value}; setItems(n); }} className={inputCls} placeholder="Optional" /></div>
                    <div><label className={labelCls}>SI No.</label><input type="text" value={item.si_no} onChange={e => { const n=[...items]; n[i]={...n[i],si_no:e.target.value}; setItems(n); }} className={inputCls} placeholder="Optional" /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div><label className={labelCls}>T × L × W</label><input type="text" value={item.t_l_w} onChange={e => { const n=[...items]; n[i]={...n[i],t_l_w:e.target.value}; setItems(n); }} className={inputCls} /></div>
                    <div><label className={labelCls}>Sec. Weight</label><input type="number" step="0.01" value={item.section_weight} onChange={e => { const n=[...items]; n[i]={...n[i],section_weight:e.target.value}; setItems(n); }} className={inputCls} /></div>
                    <div><label className={labelCls}>No. of Sheets</label><input type="number" value={item.number_of_sheets} onChange={e => { const n=[...items]; n[i]={...n[i],number_of_sheets:e.target.value}; setItems(n); }} className={inputCls} /></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
              <label className={labelCls}>Total Invoice Amount (₹)</label>
              <input type="text" required value={totalAmount} onChange={e => {
                let v = e.target.value.replace(/[^0-9.]/g, "");
                const p = v.split(".");
                const last3 = p[0].slice(-3);
                const other = p[0].slice(0, -3);
                const fmt = other ? other.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + last3 : last3;
                setTotalAmount(p.length > 1 ? `${fmt}.${p[1]}` : fmt);
              }} className={inputCls} placeholder="0.00" />
            </div>
          </form>
        </div>
        <div className="px-6 py-5 border-t border-slate-100 dark:border-slate-800">
          <button type="submit" form="inv-form" disabled={isPending || !customerName || !dueDate || !totalAmount}
            className="w-full bg-accent text-white font-bold uppercase tracking-widest py-3.5 rounded-xl hover:bg-accent/90 shadow-lg shadow-accent/20 transition-all disabled:opacity-50 text-sm">
            {isPending ? "Creating…" : "Create Invoice"}
          </button>
        </div>
      </div>
    </>
  );
}
