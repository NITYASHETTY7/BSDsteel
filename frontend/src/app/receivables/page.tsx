"use client";

import { useState, useMemo, Fragment } from "react";
import {
  useInvoices, useRecordPayment, useSendReminder,
  useCreateInvoice, useCreateCustomer, useCustomers, Invoice
} from "@/hooks/useReceivables";
import { format } from "date-fns";
import {
  DollarSign, MessageCircle, Plus, X, AlertCircle,
  Clock, CheckCircle, TrendingDown, Filter, Download,
  IndianRupee, Users, FileText, AlertTriangle, ChevronDown, ChevronUp
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { usePdfExport } from "@/hooks/usePdfExport";

/* ─── Aging Bucket Helper ──────────────────────────── */
function getAgingBucket(dueDateStr: string): { label: string; days: number; color: string; bg: string } {
  const days = Math.ceil((new Date().getTime() - new Date(dueDateStr).getTime()) / 86400000);
  if (days <= 0)  return { label: "Current (Not Yet Due)",   days, color: "#3D7A6B", bg: "rgba(61,122,107,0.12)"  };
  if (days <= 30) return { label: "1–30 Days Overdue", days, color: "#F4A623", bg: "rgba(244,166,35,0.12)"  };
  if (days <= 60) return { label: "31–60 Days Overdue",days, color: "#D02936", bg: "rgba(208,41,54,0.12)"   };
  return             { label: "61+ Days Overdue",  days, color: "#9F1239", bg: "rgba(159,18,57,0.15)"   };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  paid:            { label: "Paid",           color: "#3D7A6B", bg: "rgba(61,122,107,0.12)",  border: "rgba(61,122,107,0.3)"  },
  overdue:         { label: "Overdue",        color: "#D02936", bg: "rgba(208,41,54,0.12)",   border: "rgba(208,41,54,0.3)"   },
  partially_paid:  { label: "Part. Paid",     color: "#F4A623", bg: "rgba(244,166,35,0.12)",  border: "rgba(244,166,35,0.3)"  },
  unpaid:          { label: "Unpaid",         color: "#94A3B8", bg: "rgba(148,163,184,0.1)",  border: "rgba(148,163,184,0.2)" },
};

export default function ReceivablesPage() {
  const { user } = useAuthStore();
  const { data: invoices, isLoading } = useInvoices();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isCreatingPanel, setIsCreatingPanel] = useState(false);
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [agingFilter, setAgingFilter] = useState<string>("all");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const { exportInvoices } = usePdfExport();

  const { mutate: createInvoice, isPending: isCreatingInvoice } = useCreateInvoice();
  const { mutate: createCustomer } = useCreateCustomer();

  const canEdit = user?.role === "accounts_team" || user?.role === "management";

  /* ─── KPIs ─────────────────────────────────────────── */
  const kpis = useMemo(() => {
    if (!invoices) return { outstanding: 0, overdue: 0, collected: 0, totalInvoices: 0 };
    return invoices.reduce((acc, inv) => {
      const bal = Number(inv.total_amount) - Number(inv.amount_paid);
      const days = Math.ceil((new Date().getTime() - new Date(inv.due_date).getTime()) / 86400000);
      if (inv.status !== "paid") {
        acc.outstanding += bal;
        if (days > 0) acc.overdue += bal;
      }
      acc.collected += Number(inv.amount_paid);
      acc.totalInvoices++;
      return acc;
    }, { outstanding: 0, overdue: 0, collected: 0, totalInvoices: 0 });
  }, [invoices]);

  /* ─── Aging Summary ─────────────────────────────────── */
  const agingSummary = useMemo(() => {
    if (!invoices) return { current: 0, d30: 0, d60: 0, d90: 0 };
    const acc = { current: 0, d30: 0, d60: 0, d90: 0 };
    invoices.filter(i => i.status !== "paid").forEach(inv => {
      const days = Math.ceil((new Date().getTime() - new Date(inv.due_date).getTime()) / 86400000);
      const amt = Number(inv.total_amount) - Number(inv.amount_paid);
      if (days <= 0)       acc.current += amt;
      else if (days <= 30) acc.d30 += amt;
      else if (days <= 60) acc.d60 += amt;
      else                 acc.d90 += amt;
    });
    return acc;
  }, [invoices]);

  /* ─── Filtered Invoices ─────────────────────────────── */
  const filteredInvoices = useMemo(() => {
    if (!invoices) return [];
    return invoices.filter(inv => {
      if (statusFilter !== "all" && inv.status !== statusFilter) return false;
      if (branchFilter !== "all" && inv.branch !== branchFilter) return false;
      if (agingFilter !== "all") {
        const days = Math.ceil((new Date().getTime() - new Date(inv.due_date).getTime()) / 86400000);
        if (agingFilter === "current" && days > 0)   return false;
        if (agingFilter === "0-30"    && (days <= 0 || days > 30))  return false;
        if (agingFilter === "30-60"   && (days <= 30 || days > 60)) return false;
        if (agingFilter === "60+"     && days <= 60) return false;
      }
      return true;
    });
  }, [invoices, statusFilter, agingFilter]);

  const fmt = (n: number) => n >= 100000 ? `₹${(n/100000).toFixed(1)}L` : `₹${n.toLocaleString("en-IN")}`;

  return (
    <div className="flex flex-col min-h-full pb-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary tracking-wide uppercase">
            Accounts Receivable
          </h1>
          <p className="text-text-muted text-sm mt-0.5">Live ledger · Automated aging · Collection tracking</p>
        </div>
        {canEdit && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => invoices && exportInvoices(invoices as Invoice[])}
              className="flex items-center gap-2 px-4 py-2.5 bg-panel border border-border text-text-muted hover:text-text-primary font-bold text-xs uppercase tracking-widest rounded-xl transition-all"
            >
              <Download className="w-3.5 h-3.5" /> Export
            </button>
            <button
              onClick={() => setIsCreatingPanel(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-accent text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-accent/90 shadow-md shadow-accent/20 transition-all"
            >
              <Plus className="w-4 h-4" /> New Invoice
            </button>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Outstanding", value: fmt(kpis.outstanding), icon: IndianRupee, color: "#D02936", bg: "rgba(208,41,54,0.1)" },
          { label: "Overdue Balance",   value: fmt(kpis.overdue),     icon: AlertTriangle, color: "#F4A623", bg: "rgba(244,166,35,0.1)" },
          { label: "Payments Received", value: fmt(kpis.collected),   icon: CheckCircle,   color: "#3D7A6B", bg: "rgba(61,122,107,0.1)" },
          { label: "Total Invoices",    value: String(kpis.totalInvoices), icon: FileText, color: "#4A90E2", bg: "rgba(74,144,226,0.1)" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-panel border border-border rounded-2xl p-5 card-shadow relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${color}60, transparent)` }} />
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold">{label}</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: bg }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
            </div>
            <p className="text-2xl font-display font-bold text-text-primary">{isLoading ? "—" : value}</p>
          </div>
        ))}
      </div>

      {/* Aging Buckets Strip */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "Current (Not Yet Due)",   amount: agingSummary.current, color: "#3D7A6B", key: "current" },
          { label: "1–30 Days Overdue", amount: agingSummary.d30,    color: "#F4A623", key: "0-30"    },
          { label: "31–60 Days Overdue",amount: agingSummary.d60,    color: "#D02936", key: "30-60"   },
          { label: "61+ Days Overdue",  amount: agingSummary.d90,    color: "#9F1239", key: "60+"     },
        ].map(({ label, amount, color, key }) => (
          <button
            key={key}
            onClick={() => setAgingFilter(agingFilter === key ? "all" : key)}
            className={`bg-panel border rounded-xl p-4 text-left transition-all hover:border-white/20 ${
              agingFilter === key ? "border-2" : "border-border"
            }`}
            style={agingFilter === key ? { borderColor: color } : {}}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-[10px] text-text-muted uppercase tracking-widest font-bold">{label}</span>
            </div>
            <p className="text-lg font-display font-bold text-text-primary">{fmt(amount)}</p>
            <p className="text-[9px] text-text-muted mt-0.5">Outstanding</p>
          </button>
        ))}
      </div>

      {/* Filters + Table */}
      <div className="bg-panel border border-border rounded-2xl card-shadow overflow-hidden">
        {/* Filter bar */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
          <Filter className="w-3.5 h-3.5 text-text-muted" />
          <span className="text-[10px] text-text-muted uppercase tracking-widest font-bold mr-2">Status:</span>
          {["all", "unpaid", "partially_paid", "overdue", "paid"].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                statusFilter === s
                  ? "bg-accent text-white"
                  : "bg-background text-text-muted hover:text-text-primary border border-border"
              }`}
            >
              {s === "all" ? "All" : s.replace("_", " ")}
            </button>
          ))}
          <div className="w-px h-6 bg-border/50 mx-2"></div>
          <span className="text-[10px] text-text-muted uppercase tracking-widest font-bold mr-1">Branch:</span>
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="bg-background border border-border text-text-primary text-[10px] font-bold uppercase tracking-wider rounded-lg px-2 py-1.5 focus:outline-none focus:border-accent appearance-none cursor-pointer"
          >
            <option value="all">All</option>
            {invoices && Array.from(new Set(invoices.map(i => i.branch).filter(Boolean))).map(b => (
              <option key={b as string} value={b as string}>{b as string}</option>
            ))}
          </select>
          {agingFilter !== "all" && (
            <button
              onClick={() => setAgingFilter("all")}
              className="ml-auto flex items-center gap-1 text-[10px] text-accent font-bold uppercase tracking-wider"
            >
              <X className="w-3 h-3" /> Clear Aging Filter
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_,i) => <div key={i} className="h-14 bg-border/30 rounded-xl animate-pulse" />)}
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-muted">
            <DollarSign className="w-10 h-10 mb-3 opacity-20" />
            <p className="text-xs uppercase tracking-widest font-bold">No invoices match current filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-text-muted border-b border-border bg-background/30">
                  <th className="px-6 py-3 font-bold">Invoice #</th>
                  <th className="px-6 py-3 font-bold">Customer</th>
                  <th className="px-6 py-3 font-bold">Branch</th>
                  <th className="px-6 py-3 font-bold">Due Date</th>
                  <th className="px-6 py-3 font-bold">Aging</th>
                  <th className="px-6 py-3 font-bold text-right">Invoice Amt</th>
                  <th className="px-6 py-3 font-bold text-right">Balance Due</th>
                  <th className="px-6 py-3 font-bold text-center">Status</th>
                  {canEdit && <th className="px-6 py-3 font-bold text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map(inv => {
                  const balance = Number(inv.total_amount) - Number(inv.amount_paid);
                  const aging = getAgingBucket(inv.due_date);
                  const st = STATUS_CONFIG[inv.status] || STATUS_CONFIG.unpaid;
                  return (
                    <Fragment key={inv.id}>
                    <tr className="border-b border-border/50 hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4 cursor-pointer" onClick={() => inv.items?.length > 0 && setExpandedInvoiceId(expandedInvoiceId === inv.id ? null : inv.id)}>
                        <div className="flex items-center gap-2">
                          {inv.items?.length > 0 ? (
                            expandedInvoiceId === inv.id ? <ChevronUp className="w-4 h-4 text-accent" /> : <ChevronDown className="w-4 h-4 text-accent" />
                          ) : <div className="w-4 h-4" />}
                          <span className="font-mono font-bold text-sm text-text-primary hover:text-accent transition-colors">{inv.invoice_number}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-text-primary">{inv.customer?.business_name || "—"}</p>
                        <p className="text-[10px] text-text-muted">{inv.customer?.contact_person}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-text-muted">{inv.branch || "—"}</td>
                      <td className="px-6 py-4 text-sm text-text-muted font-mono">
                        {format(new Date(inv.due_date), "dd MMM yyyy")}
                      </td>
                      <td className="px-6 py-4">
                        {inv.status !== "paid" && (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider"
                            style={{ background: aging.bg, color: aging.color }}
                          >
                            <Clock className="w-2.5 h-2.5" />
                            {aging.days > 0 ? `${aging.days}d` : "Current"}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-text-primary text-right font-medium font-mono">
                        ₹{Number(inv.total_amount).toLocaleString("en-IN")}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-bold font-mono" style={{ color: balance > 0 ? "#D02936" : "#3D7A6B" }}>
                          ₹{balance.toLocaleString("en-IN")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className="inline-flex items-center px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest"
                          style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}
                        >
                          {st.label}
                        </span>
                      </td>
                      {canEdit && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {inv.status !== "paid" && (
                              <>
                                <button
                                  onClick={() => setSelectedInvoice(inv as any)}
                                  className="px-3 py-1.5 bg-accent/10 border border-accent/30 text-accent font-bold text-[10px] uppercase tracking-wider rounded-lg hover:bg-accent/20 transition-colors"
                                >
                                  Pay
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                    {expandedInvoiceId === inv.id && inv.items && inv.items.length > 0 && (
                      <tr className="bg-panel border-b border-border/50 animate-in slide-in-from-top-2 duration-200">
                        <td colSpan={canEdit ? 9 : 8} className="px-10 py-4">
                          <div className="bg-background/50 rounded-xl p-4 border border-white/5 shadow-inner">
                            <h4 className="text-[10px] uppercase tracking-widest font-bold text-text-muted mb-3">Line Items</h4>
                            <table className="w-full text-left text-xs">
                              <thead>
                                <tr className="text-text-muted border-b border-white/10 uppercase tracking-widest">
                                  <th className="py-2 font-bold">Description</th>
                                  <th className="py-2 font-bold">SI No.</th>
                                  <th className="py-2 font-bold">T × L × W</th>
                                  <th className="py-2 font-bold text-right">Sec. Weight</th>
                                  <th className="py-2 font-bold text-right">Sheets</th>
                                </tr>
                              </thead>
                              <tbody>
                                {inv.items.map((item, idx) => (
                                  <tr key={idx} className="border-b border-white/5 last:border-0 text-text-primary">
                                    <td className="py-2">{item.item_description || "—"}</td>
                                    <td className="py-2 font-mono text-[10px]">{item.si_no || "—"}</td>
                                    <td className="py-2 font-mono text-[10px]">{item.t_l_w || "—"}</td>
                                    <td className="py-2 text-right font-mono text-[10px]">{item.section_weight} kg</td>
                                    <td className="py-2 text-right font-mono text-[10px]">{item.number_of_sheets}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
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
      </div>

      {/* Payment Panel */}
      <PaymentSlidePanel
        invoice={selectedInvoice}
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
      />

      {/* Create Invoice Panel */}
      <CreateInvoiceSlidePanel
        isOpen={isCreatingPanel}
        onClose={() => setIsCreatingPanel(false)}
      />
    </div>
  );
}

/* ─── Reminder Button ──────────────────────────────── */
function ReminderButton({ invoiceId, customerName }: { invoiceId: number; customerName?: string }) {
  const { mutate: sendReminder, isPending } = useSendReminder();
  const [sent, setSent] = useState(false);

  const handleRemind = () => {
    sendReminder({ invoiceId, channel: "whatsapp" }, {
      onSuccess: () => { setSent(true); setTimeout(() => setSent(false), 4000); }
    });
  };

  return (
    <button
      onClick={handleRemind}
      disabled={isPending || sent}
      className={`px-3 py-1.5 border font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all flex items-center gap-1 disabled:opacity-60 ${
        sent
          ? "bg-[#25D366]/10 border-[#25D366]/30 text-[#25D366]"
          : "bg-[#25D366]/10 border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/20"
      }`}
    >
      <MessageCircle className="w-3 h-3" />
      {isPending ? "…" : sent ? "Sent!" : "Remind"}
    </button>
  );
}

/* ─── Payment Slide Panel ─────────────────────────── */
function PaymentSlidePanel({ invoice, isOpen, onClose }: { invoice: Invoice | null; isOpen: boolean; onClose: () => void }) {
  const { mutate: recordPayment, isPending } = useRecordPayment();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<any>("bank_transfer");

  if (!isOpen || !invoice) return null;
  const balance = Number(invoice.total_amount) - Number(invoice.amount_paid);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    recordPayment({
      invoiceId: invoice.id,
      paymentData: { invoice_id: invoice.id, amount: Number(amount), payment_method: method }
    }, { onSuccess: () => { onClose(); setAmount(""); } });
  };

  const inputCls = "w-full bg-background border border-border rounded-lg px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all";

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-[440px] bg-panel border-l border-border z-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-background/30">
          <div>
            <h2 className="text-base font-display font-bold text-text-primary tracking-widest uppercase">Record Payment</h2>
            <p className="text-text-muted text-xs mt-0.5">Invoice #{invoice.invoice_number}</p>
          </div>
          <button onClick={onClose} className="p-2 text-text-muted hover:text-text-primary hover:bg-white/5 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Balance highlight */}
        <div className="px-6 py-4 bg-accent/5 border-b border-accent/10">
          <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold mb-1">Balance Due</p>
          <p className="text-3xl font-display font-bold text-accent">
            ₹{balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-text-muted mt-1">{invoice.customer?.business_name}</p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <form id="pay-form" onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-[10px] text-text-muted uppercase tracking-widest font-bold">Amount Received (₹)</label>
              <input type="number" step="0.01" required max={balance} value={amount}
                onChange={e => setAmount(e.target.value)} className={inputCls}
                placeholder={`Max: ₹${balance.toLocaleString("en-IN")}`} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] text-text-muted uppercase tracking-widest font-bold">Payment Method</label>
              <select value={method} onChange={e => setMethod(e.target.value)}
                className={inputCls + " appearance-none"}>
                <option value="bank_transfer">Bank Transfer (NEFT / RTGS)</option>
                <option value="cheque">Cheque</option>
                <option value="upi">UPI</option>
                <option value="cash">Cash</option>
              </select>
            </div>
          </form>
        </div>

        <div className="px-6 py-5 border-t border-border">
          <button type="submit" form="pay-form"
            disabled={isPending || !amount || Number(amount) <= 0 || Number(amount) > balance}
            className="w-full bg-accent text-white font-display font-bold uppercase tracking-widest py-3.5 rounded-xl hover:bg-accent/90 shadow-lg shadow-accent/20 transition-all disabled:opacity-50">
            {isPending ? "Recording…" : "Record Payment"}
          </button>
        </div>
      </div>
    </>
  );
}

/* ─── Create Invoice Panel ────────────────────────── */
function CreateInvoiceSlidePanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { mutate: createInvoice, isPending } = useCreateInvoice();
  const { data: customers } = useCustomers();
  
  // Deduplicate customers by business_name to prevent redundant list entries
  const uniqueCustomers = useMemo(() => {
    if (!customers) return [];
    const map = new Map<string, any>();
    customers.forEach(c => {
      const normalizedName = c.business_name.replace(/[.,]/g, "").trim().toLowerCase();
      map.set(normalizedName, c);
    });
    return Array.from(map.values());
  }, [customers]);

  const [customerName, setCustomerName] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [branch, setBranch] = useState("New Bamboo Bazar");
  const [dueDate, setDueDate] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [items, setItems] = useState<any[]>([]);

  if (!isOpen) return null;

  const inputCls = "w-full bg-background border border-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all";
  const labelCls = "block text-[10px] text-text-muted uppercase tracking-widest font-bold mb-1.5";

  const handleAddItem = () => setItems([...items, { t_l_w: "", section_weight: 0, si_no: "", item_description: "", weight: 0, number_of_sheets: 0, weight_per_sheet: 0 }]);
  const handleItemChange = (i: number, field: string, val: any) => { const n = [...items]; n[i] = { ...n[i], [field]: val }; setItems(n); };
  const handleRemoveItem = (i: number) => setItems(items.filter((_,idx) => idx !== i));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dueDate || !totalAmount) return;
    
    // Find customer ID by name, or use 0 as fallback if creating a new one
    const matchedCustomer = uniqueCustomers.find(c => c.business_name.toLowerCase() === customerName.toLowerCase());
    const finalCustomerId = matchedCustomer ? matchedCustomer.id : (customerId ? Number(customerId) : 0);

    createInvoice({
      customer_id: finalCustomerId,
      customer_name: customerName, // Pass name in case backend supports creating on the fly
      invoice_number: invoiceNumber || `INV-AUTO-${Math.floor(1000 + Math.random() * 9000)}`,
      due_date: new Date(dueDate).toISOString(),
      total_amount: Number(totalAmount.replace(/,/g, '')),
      branch: branch || undefined,
      items: items.map(item => ({
        t_l_w: item.t_l_w, section_weight: Number(item.section_weight),
        si_no: item.si_no, item_description: item.item_description,
        weight: Number(item.weight), number_of_sheets: Number(item.number_of_sheets),
        weight_per_sheet: Number(item.weight_per_sheet),
      }))
    } as any, {
      onSuccess: () => { onClose(); setCustomerId(""); setInvoiceNumber(""); setBranch(""); setDueDate(""); setTotalAmount(""); setItems([]); }
    });
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-[580px] bg-panel border-l border-border z-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-background/30">
          <div>
            <h2 className="text-base font-display font-bold text-text-primary tracking-widest uppercase">New Invoice</h2>
            <p className="text-text-muted text-xs mt-0.5">Create invoice with line items</p>
          </div>
          <button onClick={onClose} className="p-2 text-text-muted hover:text-text-primary hover:bg-white/5 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <form id="invoice-form" onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Customer</label>
                <input 
                  type="text" 
                  value={customerName} 
                  onChange={e => setCustomerName(e.target.value)} 
                  required 
                  className={inputCls} 
                  placeholder="Customer name" 
                  list="customer-list"
                />
                <datalist id="customer-list">
                  {uniqueCustomers.map(c => <option key={c.id} value={c.business_name} />)}
                </datalist>
              </div>
              <div>
                <label className={labelCls}>Branch</label>
                <select value={branch} onChange={e => setBranch(e.target.value)} required className={inputCls + " appearance-none"}>
                  <option value="New Bamboo Bazar">New Bamboo Bazar</option>
                  <option value="Peenya">Peenya</option>
                  <option value="Hosur">Hosur</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Invoice Number</label>
                <input type="text" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} className={inputCls} placeholder="INV-XXXX (Optional)" />
              </div>
              <div>
                <label className={labelCls}>Due Date</label>
                <input type="date" required value={dueDate} onChange={e => setDueDate(e.target.value)} className={inputCls} style={{ colorScheme: "dark" }} />
              </div>
            </div>

            {/* Line Items */}
            <div className="border-t border-border pt-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-widest">Line Items (Optional)</h3>
                <button type="button" onClick={handleAddItem} className="text-xs text-accent hover:text-accent/80 font-bold uppercase tracking-wider transition-colors flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Add Item
                </button>
              </div>
              <div className="space-y-3">
                {items.length === 0 ? (
                  <div className="text-center py-6 border border-border border-dashed rounded-xl text-text-muted text-[10px] uppercase tracking-widest">
                    No items — click Add Item
                  </div>
                ) : items.map((item, index) => (
                  <div key={index} className="bg-background/50 border border-border rounded-xl p-4 relative group">
                    <button type="button" onClick={() => handleRemoveItem(index)}
                      className="absolute top-2 right-2 p-1 text-text-muted hover:text-critical opacity-0 group-hover:opacity-100 transition-all">
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div><label className={labelCls}>Description</label><input type="text" value={item.item_description} onChange={e => handleItemChange(index,"item_description",e.target.value)} className={inputCls} placeholder="Optional" /></div>
                      <div><label className={labelCls}>SI No.</label><input type="text" value={item.si_no} onChange={e => handleItemChange(index,"si_no",e.target.value)} className={inputCls} placeholder="Optional" /></div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div><label className={labelCls}>T × L × W</label><input type="text" value={item.t_l_w} onChange={e => handleItemChange(index,"t_l_w",e.target.value)} className={inputCls} placeholder="Optional" /></div>
                      <div><label className={labelCls}>Sec. Weight</label><input type="number" step="0.01" value={item.section_weight} onChange={e => handleItemChange(index,"section_weight",e.target.value)} className={inputCls} /></div>
                      <div><label className={labelCls}>No. of Sheets</label><input type="number" value={item.number_of_sheets} onChange={e => handleItemChange(index,"number_of_sheets",e.target.value)} className={inputCls} /></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-border pt-5">
              <label className={labelCls}>Total Invoice Amount (₹)</label>
              <input 
                type="text" 
                required 
                value={totalAmount} 
                onChange={e => {
                  let val = e.target.value.replace(/[^0-9.]/g, '');
                  const parts = val.split('.');
                  val = parts[0] + (parts.length > 1 ? '.' + parts[1] : '');
                  const intPart = parts[0];
                  const lastThree = intPart.slice(-3);
                  const other = intPart.slice(0, -3);
                  const fmtInt = other ? other.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree : lastThree;
                  setTotalAmount(parts.length > 1 ? `${fmtInt}.${parts[1]}` : fmtInt);
                }} 
                className={inputCls} 
                placeholder="0.00" 
              />
            </div>
          </form>
        </div>

        <div className="px-6 py-5 border-t border-border">
          <button type="submit" form="invoice-form"
            disabled={isPending || !customerName || !dueDate || !totalAmount}
            className="w-full bg-accent text-white font-display font-bold uppercase tracking-widest py-3.5 rounded-xl hover:bg-accent/90 shadow-lg shadow-accent/20 transition-all disabled:opacity-50">
            {isPending ? "Creating…" : "Create Invoice"}
          </button>
        </div>
      </div>
    </>
  );
}
