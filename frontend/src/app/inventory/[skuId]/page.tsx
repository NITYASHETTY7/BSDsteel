"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft, Edit2, ArrowDownCircle, ArrowUpCircle,
  Layers, Warehouse, Package, Hash, Ruler, Scale,
  CheckCircle, AlertTriangle, Clock, RefreshCw, TrendingDown,
  Activity, BoxSelect, Boxes
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import {
  useSkuDetail, useStockLedger, useTransactions,
  useCreateTransaction, useWarehouses
} from "@/hooks/useInventory";
import SlidePanel from "@/components/ui/SlidePanel";
import { Skeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/api";

// ── Transaction type config ───────────────────────────────────────────────────
const TXN_CFG: Record<string, { bg: string; text: string; border: string; icon: any; label: string }> = {
  inward:        { bg: "rgba(52,168,120,0.12)",  text: "#34A878", border: "rgba(52,168,120,0.3)",  icon: ArrowDownCircle, label: "Inward"        },
  outward:       { bg: "rgba(208,41,54,0.12)",   text: "#D02936", border: "rgba(208,41,54,0.3)",   icon: ArrowUpCircle,   label: "Outward"       },
  adjustment:    { bg: "rgba(244,166,35,0.12)",  text: "#F4A623", border: "rgba(244,166,35,0.3)",  icon: RefreshCw,       label: "Adjustment"    },
  opening_stock: { bg: "rgba(99,102,241,0.12)",  text: "#6366F1", border: "rgba(99,102,241,0.3)",  icon: Layers,          label: "Opening Stock" },
};

// ── Reusable form fields ──────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600";

function InputField({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return <Field label={label}><input {...props} className={inputCls} /></Field>;
}

function SelectField({ label, children, ...props }: { label: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Field label={label}>
      <select {...props} className={inputCls + " appearance-none cursor-pointer"}>{children}</select>
    </Field>
  );
}


// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SkuDetailPage() {
  const params  = useParams();
  const router  = useRouter();
  const skuId   = parseInt(params.skuId as string, 10);
  const { user } = useAuthStore();

  const [isTxnPanelOpen,  setIsTxnPanelOpen]  = useState(false);
  const [isEditPanelOpen, setIsEditPanelOpen]  = useState(false);
  const [txnError,   setTxnError]   = useState<string | null>(null);
  const [editError,  setEditError]  = useState<string | null>(null);
  const [toast,      setToast]      = useState<{ msg: string; ok: boolean } | null>(null);
  const [txnType,    setTxnType]    = useState("inward");
  const [unitCost,   setUnitCost]   = useState("");
  const [isSaving,   setIsSaving]   = useState(false);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const { data: sku,          isLoading: skuLoading,  refetch: refetchSku } = useSkuDetail(skuId);
  const { data: ledger,       isLoading: ledgerLoading }  = useStockLedger(skuId);
  const { data: transactions, isLoading: txnsLoading }    = useTransactions({ sku_id: skuId });
  const { data: warehouses }                              = useWarehouses();
  const { mutate: createTxn,  isPending: isTxnPending }   = useCreateTransaction();

  const whName = (id: number) => warehouses?.find(w => w.id === id)?.name ?? `WH-${id}`;

  const canEdit     = user?.role !== "warehouse_staff";
  const canTransact = ["warehouse_staff", "operations", "management"].includes(user?.role ?? "");

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleCreateTxn = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTxnError(null);
    const fd = new FormData(e.currentTarget);
    const payload: any = {
      sku_id:           skuId,
      warehouse_id:     parseInt(fd.get("warehouse_id") as string, 10),
      transaction_type: fd.get("transaction_type"),
      quantity:         parseFloat(fd.get("quantity") as string),
      reference_note:   fd.get("reference_note") as string || undefined,
    };
    if (payload.transaction_type === "inward" || payload.transaction_type === "opening_stock") {
      payload.batch_number = fd.get("batch_number");
      const uc = fd.get("unit_cost") as string;
      if (uc) payload.unit_cost = parseFloat(uc.replace(/,/g, ""));
    } else {
      payload.batch_id = parseInt(fd.get("batch_id") as string, 10);
    }
    createTxn(payload, {
      onSuccess: () => { setIsTxnPanelOpen(false); setUnitCost(""); showToast("Transaction recorded."); },
      onError:   (err: any) => setTxnError(err.response?.data?.detail || "Failed to record transaction."),
    });
  };

  const handleEditSku = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setEditError(null);
    setIsSaving(true);
    const fd = new FormData(e.currentTarget);
    const body: any = {
      thickness_mm:      parseFloat(fd.get("thickness_mm") as string),
      width_mm:          parseFloat(fd.get("width_mm") as string),
      grade:             fd.get("grade") as string,
      reorder_threshold: parseFloat(fd.get("reorder_threshold") as string),
    };
    const len = fd.get("length_mm") as string;
    if (len) body.length_mm = parseFloat(len);
    try {
      await api.patch(`/api/skus/${skuId}`, body);
      showToast("SKU updated successfully.");
      setIsEditPanelOpen(false);
      refetchSku();
    } catch (err: any) {
      const d = err.response?.data?.detail;
      setEditError(Array.isArray(d) ? d.map((x: any) => `${x.loc?.at(-1)}: ${x.msg}`).join(", ") : d ?? "Failed to update SKU.");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (skuLoading) return (
    <div className="p-6 space-y-4 animate-pulse">
      <Skeleton className="h-20 rounded-3xl" />
      <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_,i) => <Skeleton key={i} className="h-28 rounded-3xl" />)}</div>
      <Skeleton className="h-40 rounded-3xl" />
      <Skeleton className="h-64 rounded-3xl" />
    </div>
  );

  if (!sku) return (
    <div className="flex flex-col items-center justify-center py-32 text-slate-400">
      <Package className="w-12 h-12 mb-3 opacity-30" />
      <p className="font-bold uppercase tracking-widest text-sm">SKU not found</p>
    </div>
  );

  // ── Derived values ────────────────────────────────────────────────────────
  const stock     = Number(sku.total_stock);
  const threshold = Number(sku.reorder_threshold);
  const pct       = Math.round((stock / Math.max(threshold, 1)) * 100);
  const barPct    = Math.min((stock / Math.max(threshold * 2, 1)) * 100, 100);

  const status =
    stock < threshold         ? "low"     :
    stock <= threshold * 1.2  ? "marginal": "healthy";

  const STATUS = {
    low:      { label: "Low Stock", color: "#EF4444", bg: "rgba(239,68,68,0.1)",    ring: "rgba(239,68,68,0.25)",   icon: AlertTriangle },
    marginal: { label: "Marginal",  color: "#F59E0B", bg: "rgba(245,158,11,0.1)",   ring: "rgba(245,158,11,0.25)",  icon: Clock },
    healthy:  { label: "Healthy",   color: "#10B981", bg: "rgba(16,185,129,0.1)",   ring: "rgba(16,185,129,0.25)",  icon: CheckCircle },
  }[status];

  const vizMax = (ledger?.batches.reduce((m, b) => Math.max(m, Number(b.quantity_on_hand)), 0) || 1) * 1.2;


  return (
    <div className="flex flex-col min-h-full pb-10 gap-6">

      {/* ── Header ── */}
      <div className="flex items-center gap-4 flex-wrap">
        <button onClick={() => router.push("/inventory")}
          className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 shadow-sm hover:shadow transition-all">
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white font-mono">
              {sku.sku_code}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm"
              style={{ background: STATUS.bg, color: STATUS.color, boxShadow: `0 0 0 1px ${STATUS.ring}` }}>
              <STATUS.icon className="w-3 h-3" />
              {STATUS.label}
            </span>
          </div>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-0.5 capitalize font-medium">
            {sku.product_type.replace(/_/g, " ")}
            <span className="mx-2 text-slate-300 dark:text-slate-700">·</span>
            {sku.thickness_mm}mm × {sku.width_mm}mm
            <span className="mx-2 text-slate-300 dark:text-slate-700">·</span>
            Grade {sku.grade}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {canEdit && (
            <button onClick={() => setIsEditPanelOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs uppercase tracking-widest shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all">
              <Edit2 className="w-3.5 h-3.5" /> Edit SKU
            </button>
          )}
          {canTransact && (
            <button onClick={() => setIsTxnPanelOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-accent/25 hover:shadow-accent/40 hover:bg-accent/90 active:scale-95 transition-all">
              <ArrowDownCircle className="w-4 h-4" /> Record Transaction
            </button>
          )}
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Boxes,   label: "Total Stock",       value: `${stock}`,          unit: sku.unit_of_measure, color: "#6366F1", bg: "rgba(99,102,241,0.08)"  },
          { icon: TrendingDown, label: "Reorder Threshold", value: `${threshold}`, unit: sku.unit_of_measure, color: "#F59E0B", bg: "rgba(245,158,11,0.08)"  },
          { icon: Ruler,   label: "Dimensions",        value: `${sku.thickness_mm} × ${sku.width_mm}`, unit: "mm", color: "#10B981", bg: "rgba(16,185,129,0.08)" },
          { icon: Hash,    label: "Grade / Standard",  value: sku.grade,           unit: "",             color: "#8B5CF6", bg: "rgba(139,92,246,0.08)"  },
        ].map(({ icon: Icon, label, value, unit, color, bg }) => (
          <div key={label}
            className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-shadow group">
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: `radial-gradient(circle at top right, ${bg}, transparent 70%)` }} />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: bg }}>
                  <Icon className="w-3.5 h-3.5" style={{ color }} />
                </div>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</span>
              </div>
              <p className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
                {value}
                {unit && <span className="text-xs font-bold text-slate-400 ml-1">{unit}</span>}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Stock Gauge ── */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-black uppercase tracking-widest text-slate-500">Stock vs Reorder Threshold</span>
          </div>
          <span className="text-sm font-extrabold" style={{ color: STATUS.color }}>{pct}% of threshold</span>
        </div>

        <div className="relative h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          {/* threshold marker */}
          <div className="absolute top-0 bottom-0 w-0.5 bg-slate-300 dark:bg-slate-600 z-10" style={{ left: "50%" }} />
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${barPct}%`, background: `linear-gradient(90deg, ${STATUS.color}99, ${STATUS.color})` }} />
        </div>

        <div className="flex justify-between text-[10px] font-semibold text-slate-400 mt-2">
          <span>0</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full inline-block bg-slate-300 dark:bg-slate-600" />
            Reorder @ {threshold} {sku.unit_of_measure}
          </span>
          <span>{threshold * 2} {sku.unit_of_measure}</span>
        </div>
      </div>

      {/* ── Batch Breakdown ── */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center">
            <Warehouse className="w-4 h-4 text-indigo-500" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-widest">Stock Ledger — Batch Breakdown</h2>
            <p className="text-xs text-slate-400 mt-0.5">Multi-warehouse batch-wise inventory positions</p>
          </div>
        </div>

        {ledgerLoading ? (
          <div className="p-6 space-y-2">{[...Array(3)].map((_,i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
        ) : !ledger?.batches.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <BoxSelect className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-xs font-bold uppercase tracking-widest">No batches recorded</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                {["Batch Number","Warehouse","Received Date","Qty on Hand","Allocation"].map(h => (
                  <th key={h} className="px-6 py-3 text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ledger.batches.map((b, i) => {
                const qty = Number(b.quantity_on_hand);
                const barW = Math.min((qty / vizMax) * 100, 100);
                return (
                  <tr key={b.id} className={`border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${i % 2 === 0 ? "" : "bg-slate-50/30 dark:bg-slate-800/20"}`}>
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-sm text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                        {b.batch_number}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        <Warehouse className="w-3 h-3" />
                        {whName(b.warehouse_id)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                      {format(new Date(b.received_date), "dd MMM yyyy")}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono font-extrabold text-base text-slate-900 dark:text-white">{qty}</span>
                      <span className="text-xs text-slate-400 ml-1">{sku.unit_of_measure}</span>
                    </td>
                    <td className="px-6 py-4 w-40">
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${barW}%`, background: "linear-gradient(90deg,#6366F199,#6366F1)" }} />
                      </div>
                      <p className="text-[9px] text-slate-400 mt-1">{Math.round(barW)}% of max</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>


      {/* ── Transaction Log ── */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
            <Scale className="w-4 h-4 text-accent" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-widest">Transaction Log</h2>
            <p className="text-xs text-slate-400 mt-0.5">Full audit trail with user attribution and timestamps</p>
          </div>
        </div>

        {txnsLoading ? (
          <div className="p-6 space-y-2">{[...Array(4)].map((_,i) => <Skeleton key={i} className="h-10 rounded-xl" />)}</div>
        ) : !transactions?.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Clock className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-xs font-bold uppercase tracking-widest">No transactions yet</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                {["Date / Time","Type","Quantity","Batch","Warehouse","Recorded By","Reference"].map(h => (
                  <th key={h} className="px-6 py-3 text-[9px] font-black uppercase tracking-[0.18em] text-slate-400 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.map((t, i) => {
                const cfg = TXN_CFG[t.transaction_type] ?? TXN_CFG.adjustment;
                const Icon = cfg.icon;
                const qty = Number(t.quantity);
                return (
                  <tr key={t.id} className={`border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${i % 2 === 0 ? "" : "bg-slate-50/30 dark:bg-slate-800/20"}`}>
                    <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 font-mono whitespace-nowrap">
                      {format(new Date(t.created_at), "dd MMM yy, HH:mm")}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider"
                        style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}>
                        <Icon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-mono font-extrabold text-sm ${qty >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                        {qty >= 0 ? "+" : ""}{qty} {sku.unit_of_measure}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500 dark:text-slate-400">{t.batch_id ?? "—"}</td>
                    <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <Warehouse className="w-3 h-3" />{whName(t.warehouse_id)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">User #{t.performed_by_user_id}</td>
                    <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 font-mono">{t.reference_note ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Record Transaction Panel ── */}
      <SlidePanel isOpen={isTxnPanelOpen} onClose={() => { setIsTxnPanelOpen(false); setTxnError(null); }}
        title="Record Transaction"
        subtitle={`${sku.sku_code} · ${stock} ${sku.unit_of_measure} in stock`}>
        <form onSubmit={handleCreateTxn} className="space-y-4">
          {txnError && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-xs font-semibold">
              {txnError}
            </div>
          )}
          <SelectField label="Transaction Type" name="transaction_type" value={txnType} onChange={e => setTxnType(e.target.value)}>
            <option value="inward">Inward (Stock Receipt)</option>
            <option value="outward">Outward (Dispatch)</option>
            <option value="adjustment">Manual Adjustment</option>
            <option value="opening_stock">Opening Stock Import</option>
          </SelectField>
          <SelectField label="Warehouse" name="warehouse_id" required>
            <option value="">Select warehouse…</option>
            {warehouses?.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </SelectField>
          {(txnType === "inward" || txnType === "opening_stock") ? (
            <InputField label="Batch Number" name="batch_number" required type="text" placeholder="e.g. BATCH-2026-001" />
          ) : (
            <SelectField label="Select Batch" name="batch_id" required>
              <option value="">Select batch…</option>
              {ledger?.batches.map(b => (
                <option key={b.id} value={b.id}>{b.batch_number} — {Number(b.quantity_on_hand)} {sku.unit_of_measure}</option>
              ))}
            </SelectField>
          )}
          <InputField label={`Quantity (${sku.unit_of_measure})`} name="quantity" required type="number" step="0.0001"
            placeholder={txnType === "outward" ? "-50.0 (negative for dispatch)" : "50.0"} />
          {(txnType === "inward" || txnType === "opening_stock") && (
            <Field label="Unit Cost ₹ (optional)">
              <input type="text" name="unit_cost" value={unitCost}
                onChange={e => {
                  let v = e.target.value.replace(/[^0-9.]/g, "");
                  const p = v.split(".");
                  const last3 = p[0].slice(-3);
                  const other = p[0].slice(0, -3);
                  const fmt = other ? other.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + last3 : last3;
                  setUnitCost(p.length > 1 ? `${fmt}.${p[1]}` : fmt);
                }}
                placeholder="e.g. 4,500.00" className={inputCls} />
            </Field>
          )}
          <InputField label="Reference / PO Number" name="reference_note" type="text" placeholder="PO-2026-00142" />
          <div className="pt-2">
            <button type="submit" disabled={isTxnPending}
              className="w-full bg-accent text-white font-bold uppercase tracking-widest py-3.5 rounded-xl hover:bg-accent/90 shadow-lg shadow-accent/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
              {isTxnPending
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing…</>
                : <><ArrowDownCircle className="w-4 h-4" /> Confirm Transaction</>}
            </button>
          </div>
        </form>
      </SlidePanel>

      {/* ── Edit SKU Panel ── */}
      <SlidePanel isOpen={isEditPanelOpen} onClose={() => { setIsEditPanelOpen(false); setEditError(null); }}
        title="Edit SKU" subtitle={sku.sku_code}>
        <form onSubmit={handleEditSku} className="space-y-4">
          {editError && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-xs font-semibold">
              {editError}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Thickness (mm)" name="thickness_mm" required type="number" step="0.01" defaultValue={sku.thickness_mm} />
            <InputField label="Width (mm)"     name="width_mm"     required type="number" step="0.01" defaultValue={sku.width_mm} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Length (mm)"    name="length_mm"    type="number" step="0.01" defaultValue={sku.length_mm ?? ""} placeholder="Optional" />
            <InputField label="Grade"          name="grade"        required type="text" defaultValue={sku.grade} />
          </div>
          <InputField label="Reorder Threshold" name="reorder_threshold" required type="number" step="0.01" defaultValue={sku.reorder_threshold} />
          <div className="pt-2">
            <button type="submit" disabled={isSaving}
              className="w-full bg-accent text-white font-bold uppercase tracking-widest py-3.5 rounded-xl hover:bg-accent/90 shadow-lg shadow-accent/20 transition-all disabled:opacity-50 text-sm">
              {isSaving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </SlidePanel>

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-2xl text-white text-xs font-bold uppercase tracking-widest transition-all ${toast.ok ? "bg-emerald-600" : "bg-red-600"}`}>
          {toast.ok ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

    </div>
  );
}
