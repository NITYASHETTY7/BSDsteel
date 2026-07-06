"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft, Edit, ArrowDownCircle, ArrowUpCircle,
  Layers, Warehouse, Package, Hash, Ruler, Scale,
  CheckCircle, AlertTriangle, Clock, RefreshCw
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import {
  useSkuDetail, useStockLedger, useTransactions,
  useCreateTransaction, useWarehouses
} from "@/hooks/useInventory";
import SlidePanel from "@/components/ui/SlidePanel";
import { Skeleton } from "@/components/ui/Skeleton";
import { StackedPlateBar } from "@/components/inventory/StackedPlateBar";

const TXN_COLORS: Record<string, { bg: string; text: string; border: string; icon: any }> = {
  inward:        { bg: "rgba(61,122,107,0.12)",  text: "#3D7A6B", border: "rgba(61,122,107,0.3)",  icon: ArrowDownCircle },
  outward:       { bg: "rgba(208,41,54,0.12)",   text: "#D02936", border: "rgba(208,41,54,0.3)",   icon: ArrowUpCircle },
  adjustment:    { bg: "rgba(244,166,35,0.12)",  text: "#F4A623", border: "rgba(244,166,35,0.3)",  icon: RefreshCw },
  opening_stock: { bg: "rgba(74,144,226,0.12)",  text: "#4A90E2", border: "rgba(74,144,226,0.3)",  icon: Layers },
};

function InputField({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] text-text-muted uppercase tracking-widest font-bold">{label}</label>
      <input
        {...props}
        className="w-full bg-background border border-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all placeholder:text-text-muted/40"
      />
    </div>
  );
}

function SelectField({ label, children, ...props }: { label: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] text-text-muted uppercase tracking-widest font-bold">{label}</label>
      <select
        {...props}
        className="w-full bg-background border border-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all appearance-none"
      >
        {children}
      </select>
    </div>
  );
}

export default function SkuDetailPage() {
  const params = useParams();
  const router = useRouter();
  const skuId = parseInt(params.skuId as string, 10);
  const { user } = useAuthStore();

  const [isTxnPanelOpen, setIsTxnPanelOpen] = useState(false);
  const [isEditPanelOpen, setIsEditPanelOpen] = useState(false);
  const [txnError, setTxnError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [txnType, setTxnType] = useState("inward");
  const [unitCost, setUnitCost] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const { data: sku, isLoading: skuLoading, refetch: refetchSku } = useSkuDetail(skuId);
  const { data: ledger, isLoading: ledgerLoading } = useStockLedger(skuId);
  const { data: transactions, isLoading: txnsLoading } = useTransactions({ sku_id: skuId });
  const { data: warehouses } = useWarehouses();
  const { mutate: createTxn, isPending: isTxnPending } = useCreateTransaction();
  const { api } = require('@/lib/api');

  const canEditSku  = user?.role !== "warehouse_staff";
  const canRecordTxn = ["warehouse_staff", "operations", "management"].includes(user?.role || "");

  const handleCreateTxn = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTxnError(null);
    const fd = new FormData(e.currentTarget);

    const payload: any = {
      sku_id:           skuId,
      warehouse_id:     parseInt(fd.get("warehouse_id") as string, 10),
      transaction_type: fd.get("transaction_type"),
      quantity:         parseFloat(fd.get("quantity") as string),
      reference_note:   fd.get("reference_note") as string,
    };

    if (payload.transaction_type === "inward" || payload.transaction_type === "opening_stock") {
      payload.batch_number = fd.get("batch_number");
      const uc = fd.get("unit_cost");
      if (uc) payload.unit_cost = parseFloat((uc as string).replace(/,/g, ''));
    } else {
      payload.batch_id = parseInt(fd.get("batch_id") as string, 10);
    }

    createTxn(payload, {
      onSuccess: () => { 
        setIsTxnPanelOpen(false); 
        showToast("Transaction recorded successfully."); 
        setUnitCost(""); 
      },
      onError: (err: any) => setTxnError(err.response?.data?.detail || "Failed to record transaction"),
    });
  };

  const handleEditSku = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setEditError(null);
    setIsEditing(true);
    const fd = new FormData(e.currentTarget);
    const updateData: any = {
      thickness_mm: parseFloat(fd.get("thickness_mm") as string),
      width_mm: parseFloat(fd.get("width_mm") as string),
      grade: fd.get("grade") as string,
      reorder_threshold: parseFloat(fd.get("reorder_threshold") as string),
    };
    const lengthStr = fd.get("length_mm") as string;
    if (lengthStr) updateData.length_mm = parseFloat(lengthStr);

    try {
      await api.patch(`/api/skus/${skuId}`, updateData);
      showToast("SKU updated successfully.");
      setIsEditPanelOpen(false);
      refetchSku();
    } catch (err: any) {
      const d = err.response?.data?.detail;
      setEditError(Array.isArray(d) ? d.map((x: any) => `${x.loc.at(-1)}: ${x.msg}`).join(", ") : d || "Failed to update SKU");
    } finally {
      setIsEditing(false);
    }
  };

  if (skuLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-16 rounded-2xl" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_,i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (!sku) return <div className="p-6 text-text-primary">SKU not found.</div>;

  const maxBatchQty = ledger?.batches.reduce((max, b) => Math.max(max, Number(b.quantity_on_hand)), 0) || 100;
  const vizMax = maxBatchQty > 0 ? maxBatchQty * 1.2 : 100;
  
  const stock = Number(sku.total_stock);
  const threshold = Number(sku.reorder_threshold);
  const stockStatus = stock < threshold ? "critical"
    : stock <= threshold * 1.2 ? "warning" : "healthy";

  const statusConfig = {
    critical: { label: "Low Stock",  color: "#D02936", bg: "rgba(208,41,54,0.1)",  icon: AlertTriangle },
    warning:  { label: "Marginal",   color: "#F4A623", bg: "rgba(244,166,35,0.1)", icon: Clock },
    healthy:  { label: "Healthy",    color: "#3D7A6B", bg: "rgba(61,122,107,0.1)", icon: CheckCircle },
  }[stockStatus];

  return (
    <div className="flex flex-col min-h-full pb-8 gap-6">

      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/inventory")}
          className="p-2.5 bg-panel border border-border text-text-muted hover:text-text-primary hover:border-border/80 rounded-xl transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-display font-bold uppercase tracking-widest text-text-primary">
              {sku.sku_code}
            </h1>
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"
              style={{ background: statusConfig.bg, color: statusConfig.color }}
            >
              <statusConfig.icon className="w-3 h-3" />
              {statusConfig.label}
            </span>
          </div>
          <p className="text-text-muted text-sm mt-0.5 capitalize">
            {sku.product_type.replace(/_/g, " ")} &nbsp;·&nbsp; {sku.thickness_mm}mm × {sku.width_mm}mm &nbsp;·&nbsp; Grade {sku.grade}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {canEditSku && (
            <button
              onClick={() => setIsEditPanelOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-panel border border-border text-text-primary font-bold text-xs uppercase tracking-widest rounded-xl hover:border-white/30 transition-all"
            >
              <Edit className="w-4 h-4" /> Edit SKU
            </button>
          )}
          {canRecordTxn && (
            <button
              onClick={() => setIsTxnPanelOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-accent text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-accent/90 shadow-md shadow-accent/20 transition-all"
            >
              <ArrowDownCircle className="w-4 h-4" /> Record Transaction
            </button>
          )}
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Package,   label: "Total Stock",       value: `${Number(sku.total_stock)} ${sku.unit_of_measure}`,   color: "#4A90E2" },
          { icon: Layers,    label: "Reorder Threshold", value: `${Number(sku.reorder_threshold)} ${sku.unit_of_measure}`, color: "#F4A623" },
          { icon: Ruler,     label: "Dimensions",        value: `${sku.thickness_mm} × ${sku.width_mm}mm`,    color: "#3D7A6B" },
          { icon: Hash,      label: "Grade / Standard",  value: sku.grade,                                      color: "#A78BFA" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-panel border border-border rounded-2xl p-4 card-shadow">
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-4 h-4" style={{ color }} />
              <span className="text-[10px] text-text-muted uppercase tracking-widest font-bold">{label}</span>
            </div>
            <p className="text-lg font-display font-bold text-text-primary">{value}</p>
          </div>
        ))}
      </div>

      {/* Stock Progress */}
      <div className="bg-panel border border-border rounded-2xl p-5 card-shadow">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Stock Level vs Reorder Threshold</span>
          <span className="text-xs font-bold" style={{ color: statusConfig.color }}>
            {Math.round((stock / Math.max(threshold, 1)) * 100)}% of threshold
          </span>
        </div>
        <div className="h-2.5 w-full bg-border rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.min((stock / Math.max(threshold * 2, 1)) * 100, 100)}%`,
              backgroundColor: statusConfig.color,
            }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-text-muted mt-1.5">
          <span>0</span>
          <span>Reorder @ {threshold} {sku.unit_of_measure}</span>
          <span>{threshold * 2} {sku.unit_of_measure}</span>
        </div>
      </div>

      {/* Stock Ledger — Batch Breakdown */}
      <div className="bg-panel border border-border rounded-2xl p-6 card-shadow">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-[#4A90E2]/10 border border-[#4A90E2]/20 flex items-center justify-center">
            <Warehouse className="w-4 h-4 text-[#4A90E2]" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-widest">Stock Ledger — Batch Breakdown</h2>
            <p className="text-text-muted text-xs">Multi-warehouse batch-wise inventory positions</p>
          </div>
        </div>

        {ledgerLoading ? (
          <div className="space-y-2">{[...Array(3)].map((_,i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
        ) : !ledger?.batches.length ? (
          <div className="text-center py-10 text-text-muted">
            <Layers className="w-8 h-8 mx-auto mb-2 opacity-20" />
            <p className="text-xs uppercase tracking-widest">No batches recorded for this SKU</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-[10px] uppercase tracking-widest text-text-muted">
                  <th className="pb-3 font-bold pr-4">Batch Number</th>
                  <th className="pb-3 font-bold pr-4">Warehouse</th>
                  <th className="pb-3 font-bold pr-4">Received Date</th>
                  <th className="pb-3 font-bold text-right pr-4">Qty on Hand</th>
                  <th className="pb-3 font-bold">Stock Visual</th>
                </tr>
              </thead>
              <tbody>
                {ledger.batches.map(b => (
                  <tr key={b.id} className="border-b border-border/50 hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 pr-4">
                      <span className="font-mono font-bold text-sm text-text-primary bg-border/40 px-2 py-0.5 rounded">{b.batch_number}</span>
                    </td>
                    <td className="py-3.5 pr-4 text-sm text-text-muted font-mono">WH-{b.warehouse_id}</td>
                    <td className="py-3.5 pr-4 text-sm text-text-muted">{format(new Date(b.received_date), "dd MMM yyyy")}</td>
                    <td className="py-3.5 pr-4 text-right">
                      <span className="font-mono font-bold text-sm text-text-primary">{Number(b.quantity_on_hand)}</span>
                      <span className="text-text-muted text-xs ml-1">{sku.unit_of_measure}</span>
                    </td>
                    <td className="py-3.5">
                      <StackedPlateBar quantity={Number(b.quantity_on_hand)} maxQuantity={vizMax} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transaction History */}
      <div className="bg-panel border border-border rounded-2xl p-6 card-shadow">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
            <Scale className="w-4 h-4 text-accent" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-widest">Transaction Log</h2>
            <p className="text-text-muted text-xs">Full audit trail with user attribution and timestamps</p>
          </div>
        </div>

        {txnsLoading ? (
          <div className="space-y-2">{[...Array(5)].map((_,i) => <Skeleton key={i} className="h-10 rounded-xl" />)}</div>
        ) : !transactions?.length ? (
          <div className="text-center py-10 text-text-muted">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-20" />
            <p className="text-xs uppercase tracking-widest">No transactions recorded yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-[10px] uppercase tracking-widest text-text-muted sticky top-0 bg-panel z-10">
                  <th className="pb-3 font-bold pr-4">Date / Time</th>
                  <th className="pb-3 font-bold pr-4">Type</th>
                  <th className="pb-3 font-bold text-right pr-4">Quantity</th>
                  <th className="pb-3 font-bold pr-4">Batch</th>
                  <th className="pb-3 font-bold pr-4">Warehouse</th>
                  <th className="pb-3 font-bold pr-4">Recorded By</th>
                  <th className="pb-3 font-bold">Reference</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => {
                  const cfg = TXN_COLORS[t.transaction_type] || TXN_COLORS.adjustment;
                  const TxnIcon = cfg.icon;
                  return (
                    <tr key={t.id} className="border-b border-border/40 hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 pr-4 text-xs text-text-muted font-mono whitespace-nowrap">
                        {format(new Date(t.created_at), "dd MMM yy, HH:mm")}
                      </td>
                      <td className="py-3.5 pr-4">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest"
                          style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}
                        >
                          <TxnIcon className="w-3 h-3" />
                          {t.transaction_type.replace("_", " ")}
                        </span>
                      </td>
                      <td className={`py-3.5 pr-4 text-right font-mono font-bold text-sm ${Number(t.quantity) > 0 ? "text-success" : "text-critical"}`}>
                        {Number(t.quantity) > 0 ? "+" : ""}{Number(t.quantity)} {sku.unit_of_measure}
                      </td>
                      <td className="py-3.5 pr-4 text-xs text-text-muted font-mono">{t.batch_id || "—"}</td>
                      <td className="py-3.5 pr-4 text-xs text-text-muted font-mono">WH-{t.warehouse_id}</td>
                      <td className="py-3.5 pr-4 text-xs text-text-muted">User #{t.performed_by_user_id}</td>
                      <td className="py-3.5 text-xs text-text-muted">{t.reference_note || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transaction Panel */}
      <SlidePanel
        isOpen={isTxnPanelOpen}
        onClose={() => setIsTxnPanelOpen(false)}
        title="Record Transaction"
        subtitle={`SKU: ${sku.sku_code} · Current stock: ${sku.total_stock} ${sku.unit_of_measure}`}
      >
        <form onSubmit={handleCreateTxn} className="space-y-5">
          {txnError && (
            <div className="p-3 bg-critical/10 border border-critical/30 text-critical text-xs rounded-xl font-medium">
              {txnError}
            </div>
          )}

          <SelectField label="Transaction Type" name="transaction_type" value={txnType}
            onChange={e => setTxnType(e.target.value)}>
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
                <option key={b.id} value={b.id}>{b.batch_number} — {Number(b.quantity_on_hand)} {sku.unit_of_measure} available</option>
              ))}
            </SelectField>
          )}

          <InputField
            label={`Quantity (${sku.unit_of_measure})`}
            name="quantity"
            required
            type="number"
            step="0.0001"
            placeholder={txnType === "outward" ? "-50.0 (negative for dispatch)" : "50.0"}
          />

          {(txnType === "inward" || txnType === "opening_stock") && (
            <div className="space-y-1.5">
              <label className="block text-[10px] text-text-muted uppercase tracking-widest font-bold">Unit Cost ₹ (optional)</label>
              <input
                type="text"
                name="unit_cost"
                value={unitCost}
                onChange={e => {
                  let val = e.target.value.replace(/[^0-9.]/g, '');
                  const parts = val.split('.');
                  val = parts[0] + (parts.length > 1 ? '.' + parts[1] : '');
                  const intPart = parts[0];
                  const lastThree = intPart.slice(-3);
                  const other = intPart.slice(0, -3);
                  const fmtInt = other ? other.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree : lastThree;
                  setUnitCost(parts.length > 1 ? `${fmtInt}.${parts[1]}` : fmtInt);
                }}
                placeholder="e.g. 4,500.00"
                className="w-full bg-background border border-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all placeholder:text-text-muted/40"
              />
            </div>
          )}

          <InputField label="Reference / PO Number" name="reference_note" type="text" placeholder="PO-2026-00142" />

          <div className="pt-2">
            <button
              type="submit"
              disabled={isTxnPending}
              className="w-full bg-accent text-white font-display font-bold uppercase tracking-widest py-3.5 rounded-xl hover:bg-accent/90 shadow-lg shadow-accent/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isTxnPending ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing…</>
              ) : (
                <><ArrowDownCircle className="w-4 h-4" /> Confirm Transaction</>
              )}
            </button>
          </div>
        </form>
      </SlidePanel>

      {/* Edit SKU Panel */}
      <SlidePanel
        isOpen={isEditPanelOpen}
        onClose={() => setIsEditPanelOpen(false)}
        title="Edit SKU Details"
        subtitle={`SKU: ${sku.sku_code}`}
      >
        <form onSubmit={handleEditSku} className="space-y-4">
          {editError && (
            <div className="p-3 bg-critical/10 border border-critical/30 text-critical text-xs rounded-xl font-medium">
              {editError}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Thickness (mm)" name="thickness_mm" required type="number" step="0.01" defaultValue={sku.thickness_mm} />
            <InputField label="Width (mm)" name="width_mm" required type="number" step="0.01" defaultValue={sku.width_mm} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Length (mm)" name="length_mm" type="number" step="0.01" defaultValue={sku.length_mm || ""} placeholder="Optional" />
            <InputField label="Grade" name="grade" required type="text" defaultValue={sku.grade} />
          </div>
          <InputField label="Reorder Threshold" name="reorder_threshold" required type="number" step="0.01" defaultValue={sku.reorder_threshold} />
          
          <div className="pt-2">
            <button
              type="submit"
              disabled={isEditing}
              className="w-full bg-accent text-white font-display font-bold uppercase tracking-widest py-3.5 rounded-xl hover:bg-accent/90 shadow-lg shadow-accent/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isEditing ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </SlidePanel>

      {/* Toast */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl shadow-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 animate-slide-up z-50 ${
          toastMessage.type === "error" ? "bg-critical text-white" : "bg-success text-white"
        }`}>
          {toastMessage.type === "error" ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          {toastMessage.msg}
        </div>
      )}
    </div>
  );
}
