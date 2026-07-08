"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Package, AlertTriangle, CheckCircle, TrendingDown, ChevronRight } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useSkus, useCreateSku, SKU } from "@/hooks/useInventory";
import SlidePanel from "@/components/ui/SlidePanel";
import { Skeleton } from "@/components/ui/Skeleton";
import { Select } from "@/components/ui/Select";
import toast from "react-hot-toast";

const PRODUCT_TYPE_CONFIG: Record<string, { label: string; textClass: string; bgClass: string; ringClass: string }> = {
  hr_coil:         { label: "HR Coil",         textClass: "text-blue-700 dark:text-blue-400", bgClass: "bg-blue-50/80 dark:bg-blue-500/10", ringClass: "ring-blue-600/20 dark:ring-blue-500/20" },
  hr_sheet:        { label: "HR Sheet",         textClass: "text-teal-700 dark:text-teal-400", bgClass: "bg-teal-50/80 dark:bg-teal-500/10", ringClass: "ring-teal-600/20 dark:ring-teal-500/20" },
  chequered_sheet: { label: "Chequered Sheet",  textClass: "text-amber-700 dark:text-amber-400", bgClass: "bg-amber-50/80 dark:bg-amber-500/10", ringClass: "ring-amber-600/20 dark:ring-amber-500/20" },
};

function StockBar({ current, threshold }: { current: number; threshold: number }) {
  const max = Math.max(threshold * 2, current, 1);
  const pct = Math.min((current / max) * 100, 100);
  const color = current < threshold 
    ? "rgb(var(--color-accent))" 
    : current <= threshold * 1.2 
    ? "rgb(var(--color-warning))" 
    : "rgb(var(--color-success))";
  return (
    <div className="w-24 h-1 bg-background/50 border border-border/50 rounded-full overflow-hidden shrink-0">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

function StatusPill({ sku }: { sku: SKU }) {
  const stock = Number(sku.total_stock);
  const threshold = Number(sku.reorder_threshold);

  if (stock < threshold) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-red-50/80 dark:bg-red-500/10 text-red-600 dark:text-red-400 ring-1 ring-inset ring-red-600/20 dark:ring-red-500/20 backdrop-blur-sm shadow-sm transition-all hover:bg-red-50 dark:hover:bg-red-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
        Low Stock
      </span>
    );
  }
  if (stock <= threshold * 1.2) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-amber-50/80 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-inset ring-amber-600/20 dark:ring-amber-500/20 backdrop-blur-sm shadow-sm transition-all hover:bg-amber-50 dark:hover:bg-amber-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
        Marginal
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-50/80 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-inset ring-emerald-600/20 dark:ring-emerald-500/20 backdrop-blur-sm shadow-sm transition-all hover:bg-emerald-50 dark:hover:bg-emerald-500/20">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
      Healthy
    </span>
  );
}

export default function InventoryPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [search, setSearch] = useState("");
  const [productType, setProductType] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [isSlideOpen, setIsSlideOpen] = useState(false);
  const [formProductType, setFormProductType] = useState("hr_coil");
  const [formUOM, setFormUOM] = useState("MT");
  const [error, setError] = useState<string | null>(null);

  const { data: skus, isLoading, isError, error: fetchError } = useSkus({
    search: search || undefined,
    product_type: productType || undefined,
    low_stock_only: lowStockOnly || undefined,
  });

  const uniqueSkus = useMemo(() => {
    if (!skus) return undefined;
    const seen = new Set();
    return skus.filter(s => {
      const stock = Number(s.total_stock);
      const threshold = Number(s.reorder_threshold);
      let status = 'healthy';
      if (stock < threshold) status = 'low';
      else if (stock <= threshold * 1.2) status = 'marginal';
      
      const key = `${s.sku_code}-${status}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [skus]);

  const { mutate: createSku, isPending: isCreating } = useCreateSku();

  const stats = useMemo(() => {
    if (!uniqueSkus) return { total: 0, lowStock: 0, healthy: 0 };
    const lowStock = uniqueSkus.filter(s => Number(s.total_stock) < Number(s.reorder_threshold)).length;
    const healthy = uniqueSkus.filter(s => Number(s.total_stock) >= Number(s.reorder_threshold) * 1.2).length;
    return { total: uniqueSkus.length, lowStock, healthy };
  }, [uniqueSkus]);

  const handleCreateSku = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const lengthStr = formData.get("length_mm") as string;
    const thickness = parseFloat(formData.get("thickness_mm") as string);
    const productType = formData.get("product_type") as string;
    
    if (thickness < 1.6 || thickness > 25) {
      toast.error("Rejected: Steel thickness must be between 1.6mm and 25mm for all product types");
      return;
    }

    createSku({
      sku_code: formData.get("sku_code") as string,
      product_type: productType,
      grade: formData.get("grade") as string,
      unit_of_measure: formData.get("unit_of_measure") as string,
      thickness_mm: thickness,
      width_mm: parseFloat(formData.get("width_mm") as string),
      length_mm: lengthStr ? parseFloat(lengthStr) : undefined,
      reorder_threshold: parseFloat(formData.get("reorder_threshold") as string),
      is_active: true,
    }, {
      onSuccess: () => {
        setIsSlideOpen(false);
        toast.success("SKU Created Successfully", { style: { background: 'rgba(61,122,107,0.1)', color: '#3D7A6B', border: '1px solid rgba(61,122,107,0.3)' }});
      },
      onError: (err: unknown) => {
        const d = (err as Record<string, unknown>).response ? ((err as Record<string, unknown>).response as Record<string, unknown>).data ? (((err as Record<string, unknown>).response as Record<string, unknown>).data as Record<string, unknown>).detail : null : null;
        const msg = Array.isArray(d) ? d.map((x: Record<string, unknown>) => `${Array.isArray(x.loc) ? x.loc.at(-1) : ''}: ${x.msg}`).join(", ") : (typeof d === 'string' ? d : "Failed to create SKU");
        setError(msg);
        toast.error("Rejected: " + msg, { style: { background: 'rgba(208,41,54,0.1)', color: '#D02936', border: '1px solid rgba(208,41,54,0.3)' }});
      },
    });
  };

  const canEdit = user?.role !== "warehouse_staff";

  return (
    <div className="flex flex-col min-h-full pb-8">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8 shrink-0 relative z-10">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-accent mb-1.5 flex items-center gap-2">
            <span className="w-4 h-[2px] bg-accent rounded-full"></span>
            Inventory
          </p>
          <h1 className="text-[32px] font-display font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-500 dark:from-slate-100 dark:to-slate-400 leading-tight">
            SKU Master List
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-[13px] mt-1 font-medium">
            Manage all product variations and dynamically monitor stock levels.
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => setIsSlideOpen(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-full text-[11px] font-bold uppercase tracking-widest text-white transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl hover:shadow-accent/30 active:scale-95 bg-gradient-to-r from-accent to-red-500"
          >
            <Plus className="w-4 h-4" />
            New SKU
          </button>
        )}
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-3 gap-6 mb-8 shrink-0">
        {([
          {
            icon: Package,
            label: "Total SKUs",
            value: stats.total,
            sub: "Active products",
            color: "#3b82f6",
            bg: "bg-blue-50/50 dark:bg-blue-500/10",
            borderClass: "border-blue-100 dark:border-blue-500/20",
            glow: "shadow-blue-500/10 dark:shadow-blue-500/20",
          },
          {
            icon: AlertTriangle,
            label: "Low Stock",
            value: stats.lowStock,
            sub: stats.lowStock > 0 ? "Needs attention" : "All stocked",
            color: stats.lowStock > 0 ? "#ef4444" : "#10b981",
            bg: stats.lowStock > 0 ? "bg-red-50/50 dark:bg-red-500/10" : "bg-emerald-50/50 dark:bg-emerald-500/10",
            borderClass: stats.lowStock > 0 ? "border-red-100 dark:border-red-500/20" : "border-emerald-100 dark:border-emerald-500/20",
            glow: stats.lowStock > 0 ? "shadow-red-500/10 dark:shadow-red-500/20" : "shadow-emerald-500/10 dark:shadow-emerald-500/20",
          },
          {
            icon: CheckCircle,
            label: "Healthy Stock",
            value: stats.healthy,
            sub: "Above reorder level",
            color: "#10b981",
            bg: "bg-emerald-50/50 dark:bg-emerald-500/10",
            borderClass: "border-emerald-100 dark:border-emerald-500/20",
            glow: "shadow-emerald-500/10 dark:shadow-emerald-500/20",
          },
        ] as const).map(({ icon: Icon, label, value, sub, color, bg, borderClass, glow }) => (
          <div
            key={label}
            className={`rounded-3xl p-6 relative overflow-hidden bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl ${glow} transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:bg-white/90 dark:hover:bg-slate-900/90 group`}
          >
            {/* Soft background gradient orb */}
            <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-20 dark:opacity-10 blur-3xl transition-transform duration-500 group-hover:scale-150" style={{ background: color }} />

            {/* colored left border accent */}
            <div className="absolute left-0 top-6 bottom-6 w-1 rounded-r-full transition-all duration-300 group-hover:w-1.5" style={{ background: color }} />

            <div className="flex items-start justify-between pl-4 relative z-10">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-2">{label}</p>
                <p className="text-[36px] font-display font-extrabold text-slate-800 dark:text-slate-100 leading-none tracking-tight">
                  {isLoading ? <span className="opacity-20 text-2xl">—</span> : value}
                </p>
                <p className="text-[11px] mt-2 font-semibold" style={{ color }}>{sub}</p>
              </div>
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${bg} border ${borderClass} transition-transform duration-500 group-hover:rotate-6`}
              >
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-0 mb-6 shrink-0 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 relative z-20">
        {/* Search */}
        <div className="flex items-center gap-2.5 flex-1 px-4 py-3">
          <Search className="w-3.5 h-3.5 text-text-muted shrink-0" />
          <input
            type="text"
            placeholder="Search by SKU code or type…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-transparent text-[12px] text-text-primary placeholder-text-muted focus:outline-none"
          />
        </div>

        {/* Divider */}
        <div className="w-px self-stretch" style={{ background: "rgb(var(--color-border))" }} />

        {/* Type filter */}
        <div className="px-3 py-2 shrink-0">
          <Select
            value={productType}
            onChange={setProductType}
            className="w-40 text-[12px]"
            placeholder="All Types"
            options={[
              { label: "All Types",       value: ""               },
              { label: "HR Coil",         value: "hr_coil"        },
              { label: "HR Sheet",        value: "hr_sheet"       },
              { label: "Chequered Sheet", value: "chequered_sheet"},
            ]}
          />
        </div>

        {/* Divider */}
        <div className="w-px self-stretch" style={{ background: "rgb(var(--color-border))" }} />

        {/* Low stock toggle */}
        <label
          className="flex items-center gap-2.5 px-4 cursor-pointer select-none"
          style={{ color: lowStockOnly ? "#D02936" : "rgb(var(--color-text-muted))" }}
        >
          <div
            className="w-4 h-4 rounded flex items-center justify-center shrink-0 transition-all"
            style={{
              background: lowStockOnly ? "rgba(208,41,54,0.15)" : "transparent",
              border: lowStockOnly ? "1.5px solid #D02936" : "1.5px solid rgb(var(--color-border))",
            }}
          >
            <input type="checkbox" checked={lowStockOnly} onChange={e => setLowStockOnly(e.target.checked)} className="absolute opacity-0 w-0 h-0" />
            {lowStockOnly && <TrendingDown className="w-2.5 h-2.5" style={{ color: "#D02936" }} />}
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-widest whitespace-nowrap">Low Stock Only</span>
        </label>
      </div>

      {/* ── Table ── */}
      <div className="rounded-3xl flex flex-col bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-xl shadow-slate-200/40 dark:shadow-slate-900/40 relative z-10 pb-2">
        {isLoading ? (
          <div className="p-6 space-y-2.5">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="w-full h-14 rounded-xl" />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
              style={{ background: "rgba(208,41,54,0.10)", border: "1px solid rgba(208,41,54,0.22)" }}>
              <AlertTriangle className="w-6 h-6" style={{ color: "#D02936" }} />
            </div>
            <p className="text-[13px] font-bold text-text-primary mb-1">Failed to Load SKUs</p>
            <p className="text-[11px] text-text-muted">Could not connect to the backend.</p>
          </div>
        ) : uniqueSkus?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
              style={{ background: "rgb(var(--surface-sunken))", border: "1px solid rgb(var(--color-border))" }}>
              <Package className="w-6 h-6 text-text-muted" />
            </div>
            <p className="text-[13px] font-bold text-text-primary mb-1">No SKUs Found</p>
            <p className="text-[11px] text-text-muted mb-4">Start building your inventory master list.</p>
            {canEdit && (
              <button onClick={() => setIsSlideOpen(true)}
                className="px-5 py-2 text-white rounded-xl text-[11px] font-bold uppercase tracking-wider"
                style={{ background: "rgb(var(--color-accent))" }}>
                + New SKU
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr style={{ borderBottom: "2px solid rgb(var(--color-border))", background: "rgb(var(--surface-sunken))" }}>
                    {[
                      { label: "SKU Code",     w: "w-40"  },
                      { label: "Product Type", w: "w-36"  },
                      { label: "Dimensions",   w: "w-36"  },
                      { label: "Grade",        w: "w-24"  },
                      { label: "Stock Level",  w: "w-44"  },
                      { label: "Status",       w: "w-32"  },
                      { label: "",             w: "w-8"   },
                    ].map((col, i) => (
                      <th
                        key={i}
                        colSpan={i === 0 ? 2 : 1}
                        className={`px-5 py-3 text-[9px] font-bold uppercase tracking-[0.18em] text-text-muted/60 ${col.w}`}
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {uniqueSkus?.map((sku, idx) => {
                    const ptConfig = PRODUCT_TYPE_CONFIG[sku.product_type] ?? { label: sku.product_type, textClass: "text-slate-700 dark:text-slate-300", bgClass: "bg-slate-100 dark:bg-slate-800", ringClass: "ring-slate-200 dark:ring-slate-700" };
                    const isLow = Number(sku.total_stock) < Number(sku.reorder_threshold);
                    return (
                      <tr
                        key={sku.id}
                        onClick={() => router.push(`/inventory/${sku.id}`)}
                        className="cursor-pointer group relative transition-all duration-300 hover:bg-slate-50/80 dark:hover:bg-slate-800/80"
                        style={{
                          borderBottom: idx < (uniqueSkus?.length ?? 0) - 1 ? "1px solid rgba(148, 163, 184, 0.2)" : "none",
                        }}
                      >
                        {/* Left hover accent bar */}
                        <td className="pl-0 pr-0 w-0 relative">
                          <div
                            className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-full group-hover:translate-x-0"
                            style={{ background: isLow ? "#ef4444" : "#10b981" }}
                          />
                        </td>

                        <td className="px-5 py-4 transition-transform duration-300 group-hover:translate-x-1">
                          <span className="font-mono font-bold text-[14px] text-slate-800 dark:text-slate-100 tracking-tight">{sku.sku_code}</span>
                        </td>

                        <td className="px-5 py-4 transition-transform duration-300 group-hover:translate-x-1">
                          <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ring-1 ring-inset ${ptConfig.bgClass} ${ptConfig.textClass} ${ptConfig.ringClass}`}>
                            {ptConfig.label}
                          </span>
                        </td>

                        <td className="px-5 py-4 transition-transform duration-300 group-hover:translate-x-1">
                          <span className="text-[12px] font-mono text-slate-600 dark:text-slate-300 font-medium bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded-md border border-slate-100 dark:border-slate-700">
                            {sku.thickness_mm}<span className="text-slate-400 dark:text-slate-500">mm</span>
                            <span className="mx-1 text-slate-300 dark:text-slate-600">×</span>
                            {sku.width_mm}<span className="text-slate-400 dark:text-slate-500">mm</span>
                          </span>
                        </td>

                        <td className="px-5 py-4 transition-transform duration-300 group-hover:translate-x-1">
                          <span className="text-[11px] font-bold px-2.5 py-1 rounded-md font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 shadow-sm">
                            {sku.grade}
                          </span>
                        </td>

                        <td className="px-5 py-4 transition-transform duration-300 group-hover:translate-x-1">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-baseline gap-1.5">
                              <span className="font-mono font-extrabold text-[15px] text-slate-800 dark:text-slate-100">{Number(sku.total_stock)}</span>
                              <span className="text-[9px] font-bold uppercase text-slate-400 dark:text-slate-500 tracking-widest">{sku.unit_of_measure}</span>
                            </div>
                            <StockBar current={Number(sku.total_stock)} threshold={Number(sku.reorder_threshold)} />
                            <span className="text-[9px] text-slate-400/80 dark:text-slate-500 font-medium">
                              threshold: {Number(sku.reorder_threshold)} {sku.unit_of_measure}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4 transition-transform duration-300 group-hover:translate-x-1"><StatusPill sku={sku} /></td>

                        <td className="px-4 py-4">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                            <ChevronRight className="w-4 h-4 text-accent" />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Table footer */}
            <div
              className="flex items-center justify-between px-5 py-3"
              style={{ borderTop: "1px solid rgb(var(--color-border))", background: "rgb(var(--surface-sunken))" }}
            >
              <p className="text-[10px] text-text-muted">
                Showing <span className="font-semibold text-text-primary">{uniqueSkus?.length}</span> SKUs
                {stats.lowStock > 0 && (
                  <span className="ml-2 font-semibold" style={{ color: "#D02936" }}>
                    · {stats.lowStock} low stock
                  </span>
                )}
              </p>
              <p className="text-[10px] text-text-muted">Click any row to view details</p>
            </div>
          </>
        )}
      </div>

      {/* Create SKU Panel */}
      <SlidePanel isOpen={isSlideOpen} onClose={() => setIsSlideOpen(false)} title="Create New SKU">
        <form onSubmit={handleCreateSku} className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-text-muted mb-1.5 ml-1">SKU Code</label>
            <input required name="sku_code" type="text" placeholder="e.g. HRC-1.6-1250"
              className="w-full bg-panel/40 border border-white/10 p-3 text-sm text-text-primary focus:border-accent outline-none rounded-xl shadow-inner transition-colors" />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-text-muted mb-1.5 ml-1">Product Type</label>
            <Select name="product_type" value={formProductType} onChange={setFormProductType}
              options={[
                { label: "HR Coil",         value: "hr_coil" },
                { label: "HR Sheet",        value: "hr_sheet" },
                { label: "Chequered Sheet", value: "chequered_sheet" },
              ]} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-text-muted mb-1.5 ml-1">Thickness (mm)</label>
              <input required name="thickness_mm" type="number" step="0.01" min="1.6" max="25"
                className="w-full bg-panel/40 border border-white/10 p-3 text-sm text-text-primary focus:border-accent outline-none rounded-xl shadow-inner transition-colors" />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-text-muted mb-1.5 ml-1">Width (mm)</label>
              <input required name="width_mm" type="number" step="0.01"
                className="w-full bg-panel/40 border border-white/10 p-3 text-sm text-text-primary focus:border-accent outline-none rounded-xl shadow-inner transition-colors" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-text-muted mb-1.5 ml-1">Length (mm)</label>
              <input name="length_mm" type="number" step="0.01" placeholder="Optional"
                className="w-full bg-panel/40 border border-white/10 p-3 text-sm text-text-primary focus:border-accent outline-none rounded-xl shadow-inner transition-colors" />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-text-muted mb-1.5 ml-1">Grade</label>
              <input required name="grade" type="text" placeholder="e.g. IS 2062"
                className="w-full bg-panel/40 border border-white/10 p-3 text-sm text-text-primary focus:border-accent outline-none rounded-xl shadow-inner transition-colors" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-text-muted mb-1.5 ml-1">Unit of Measure</label>
              <Select name="unit_of_measure" value={formUOM} onChange={setFormUOM}
                options={[
                  { label: "MT",  value: "MT" },
                  { label: "KG",  value: "KG" },
                  { label: "PCS", value: "PCS" },
                ]} />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-text-muted mb-1.5 ml-1">Reorder Threshold</label>
              <input required name="reorder_threshold" type="number" step="0.01" defaultValue="0"
                className="w-full bg-panel/40 border border-white/10 p-3 text-sm text-text-primary focus:border-accent outline-none rounded-xl shadow-inner transition-colors" />
            </div>
          </div>
          <button type="submit" disabled={isCreating}
            className="w-full bg-accent text-white font-display font-bold uppercase tracking-widest py-4 mt-4 hover:bg-accent/90 transition-colors rounded-xl shadow-lg disabled:opacity-50">
            {isCreating ? "Saving..." : "Save SKU"}
          </button>
        </form>
      </SlidePanel>
    </div>
  );
}
