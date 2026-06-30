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

const PRODUCT_TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  hr_coil:         { label: "HR Coil",         color: "#4A90E2", bg: "rgba(74,144,226,0.12)" },
  hr_sheet:        { label: "HR Sheet",         color: "#3D7A6B", bg: "rgba(61,122,107,0.12)" },
  chequered_sheet: { label: "Chequered Sheet",  color: "#F4A623", bg: "rgba(244,166,35,0.12)" },
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
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"
        style={{ background: "rgba(208,41,54,0.15)", color: "#D02936", border: "1px solid rgba(208,41,54,0.3)" }}>
        <span className="w-1.5 h-1.5 rounded-full bg-[#D02936] animate-pulse" />
        Low Stock
      </span>
    );
  }
  if (stock <= threshold * 1.2) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"
        style={{ background: "rgba(244,166,35,0.15)", color: "#F4A623", border: "1px solid rgba(244,166,35,0.3)" }}>
        <span className="w-1.5 h-1.5 rounded-full bg-[#F4A623]" />
        Marginal
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"
      style={{ background: "rgba(61,122,107,0.15)", color: "#3D7A6B", border: "1px solid rgba(61,122,107,0.3)" }}>
      <span className="w-1.5 h-1.5 rounded-full bg-[#3D7A6B]" />
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

  const { mutate: createSku, isPending: isCreating } = useCreateSku();

  const stats = useMemo(() => {
    if (!skus) return { total: 0, lowStock: 0, healthy: 0 };
    const lowStock = skus.filter(s => Number(s.total_stock) < Number(s.reorder_threshold)).length;
    const healthy = skus.filter(s => Number(s.total_stock) >= Number(s.reorder_threshold) * 1.2).length;
    return { total: skus.length, lowStock, healthy };
  }, [skus]);

  const handleCreateSku = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const lengthStr = formData.get("length_mm") as string;
    const thickness = parseFloat(formData.get("thickness_mm") as string);
    const productType = formData.get("product_type") as string;
    
    if ((productType === "hr_coil" || productType === "hr_sheet") && (thickness < 1.6 || thickness > 25)) {
      toast.error("Rejected: Hot-rolled steel thickness must be between 1.6mm and 25mm", { style: { background: 'rgba(208,41,54,0.1)', color: '#D02936', border: '1px solid rgba(208,41,54,0.3)' }});
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
      onError: (err: any) => {
        const d = err.response?.data?.detail;
        const msg = Array.isArray(d) ? d.map((x: any) => `${x.loc.at(-1)}: ${x.msg}`).join(", ") : d || "Failed to create SKU";
        setError(msg);
        toast.error("Rejected: " + msg, { style: { background: 'rgba(208,41,54,0.1)', color: '#D02936', border: '1px solid rgba(208,41,54,0.3)' }});
      },
    });
  };

  const canEdit = user?.role !== "warehouse_staff";

  return (
    <div className="flex flex-col min-h-full pb-8">
      {/* Header */}
      <div className="flex items-center justify-between px-8 pt-8 pb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary tracking-wide uppercase">
            SKU Master List
          </h1>
          <p className="text-text-muted text-sm mt-1">Manage all product variations and stock levels</p>
        </div>
        {canEdit && (
          <button
            onClick={() => setIsSlideOpen(true)}
            className="group relative bg-accent text-white px-5 py-2.5 font-display font-bold uppercase tracking-widest text-xs rounded-xl flex items-center gap-2 hover:bg-accent/90 transition-all shadow-[0_0_20px_rgba(208,41,54,0.3)] hover:shadow-[0_0_30px_rgba(208,41,54,0.5)]"
          >
            <Plus className="w-4 h-4" /> New SKU
          </button>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4 px-8 mb-6 shrink-0">
        {[
          { icon: Package,       label: "Total SKUs",    value: stats.total,    color: "#4A90E2", glow: "rgba(74,144,226,0.2)" },
          { icon: AlertTriangle, label: "Low Stock",     value: stats.lowStock, color: "#D02936", glow: "rgba(208,41,54,0.2)" },
          { icon: CheckCircle,   label: "Healthy Stock", value: stats.healthy,  color: "#3D7A6B", glow: "rgba(61,122,107,0.2)" },
        ].map(({ icon: Icon, label, value, color, glow }) => (
          <div key={label}
            className="bg-panel/40 backdrop-blur-md border border-border rounded-2xl p-5 flex items-center gap-4 shadow-xl relative overflow-hidden group hover:border-border/60 transition-all">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all"
              style={{ background: glow, border: `1px solid ${color}30` }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div>
              <div className="text-2xl font-display font-bold text-text-primary">
                {isLoading ? <span className="opacity-30">—</span> : value}
              </div>
              <div className="text-[10px] text-text-muted uppercase tracking-widest font-medium">{label}</div>
            </div>
            <div className="absolute top-0 left-0 w-full h-[1px]"
              style={{ background: `linear-gradient(90deg, transparent, ${color}40, transparent)` }} />
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="relative z-20 flex items-center gap-4 bg-panel/40 backdrop-blur-md border border-border py-2.5 px-5 rounded-2xl shadow-xl shrink-0 mx-8 mb-5">
        <div className="relative flex-1 max-w-xs flex items-center gap-2 group">
          <Search className="w-3.5 h-3.5 text-text-muted group-focus-within:text-accent transition-colors shrink-0" />
          <input
            type="text"
            placeholder="Search SKU code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-xs text-text-primary placeholder-text-muted focus:outline-none border-none tracking-wider"
          />
        </div>
        <div className="h-5 w-px bg-border" />
        <Select
          value={productType}
          onChange={setProductType}
          className="w-44"
          placeholder="All Types"
          options={[
            { label: "All Types",        value: "" },
            { label: "HR Coil",          value: "hr_coil" },
            { label: "HR Sheet",         value: "hr_sheet" },
            { label: "Chequered Sheet",  value: "chequered_sheet" },
          ]}
        />
        <div className="h-5 w-px bg-border" />
        <label className="flex items-center gap-2.5 text-[10px] text-text-muted font-medium uppercase tracking-widest cursor-pointer hover:text-text-primary transition-colors">
          <div className={`relative w-4 h-4 rounded border transition-all ${lowStockOnly ? "bg-accent border-accent" : "border-border hover:border-accent/60"}`}>
            <input type="checkbox" checked={lowStockOnly} onChange={(e) => setLowStockOnly(e.target.checked)}
              className="absolute opacity-0 inset-0 cursor-pointer" />
            {lowStockOnly && <div className="absolute inset-0 flex items-center justify-center"><TrendingDown className="w-2.5 h-2.5 text-white" /></div>}
          </div>
          Low Stock Only
        </label>
      </div>

      {/* Table */}
      <div className="bg-panel/40 backdrop-blur-md border border-border mx-8 rounded-2xl shadow-xl overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="w-full h-12 rounded-xl" />
            ))}
          </div>
        ) : isError ? (
          <div className="h-full flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-900/20 border border-red-500/30 flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-display font-bold uppercase tracking-widest text-red-500 mb-2">Failed to Load SKUs</h2>
            <p className="text-text-muted text-sm mb-6">Could not connect to the server. Please check your backend URL configuration.</p>
          </div>
        ) : skus?.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-text-muted" />
            </div>
            <h2 className="text-xl font-display font-bold uppercase tracking-widest text-text-primary mb-2">No SKUs Found</h2>
            <p className="text-text-muted text-sm mb-6">Start building your inventory master list.</p>
            {canEdit && (
              <button onClick={() => setIsSlideOpen(true)}
                className="bg-accent text-white px-6 py-2.5 font-display font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-accent/90 transition-colors">
                + New SKU
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-[10px] uppercase tracking-widest text-text-muted sticky top-0 z-10 bg-panel/90 backdrop-blur-md">
                  <th className="px-5 py-3 font-bold">SKU Code</th>
                  <th className="px-5 py-3 font-bold">Product Type</th>
                  <th className="px-5 py-3 font-bold">Dimensions</th>
                  <th className="px-5 py-3 font-bold">Grade</th>
                  <th className="px-5 py-3 font-bold">Stock Level</th>
                  <th className="px-5 py-3 font-bold">Status</th>
                  <th className="px-5 py-3 font-bold w-8" />
                </tr>
              </thead>
              <tbody>
                {skus?.map((sku) => {
                  const ptConfig = PRODUCT_TYPE_CONFIG[sku.product_type] ?? { label: sku.product_type, color: "#888", bg: "rgba(136,136,136,0.1)" };
                  return (
                    <tr
                      key={sku.id}
                      onClick={() => router.push(`/inventory/${sku.id}`)}
                      className="border-b border-border/50 hover:bg-white/[0.02] transition-all cursor-pointer group"
                    >
                      <td className="px-5 py-3">
                        <span className="font-mono font-bold text-sm text-text-primary tracking-wide">{sku.sku_code}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider"
                          style={{ background: ptConfig.bg, color: ptConfig.color, border: `1px solid ${ptConfig.color}25` }}>
                          {ptConfig.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-text-muted font-mono">
                        {sku.thickness_mm}mm × {sku.width_mm}mm
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-[10px] font-bold text-text-primary bg-background border border-border px-2 py-0.5 rounded-md">{sku.grade}</span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-col gap-1.5 justify-center">
                          <span className="font-mono font-bold text-sm text-text-primary">
                            {Number(sku.total_stock)} <span className="text-text-muted text-[10px] uppercase font-bold">{sku.unit_of_measure}</span>
                          </span>
                          <StockBar current={Number(sku.total_stock)} threshold={Number(sku.reorder_threshold)} />
                        </div>
                      </td>
                      <td className="px-5 py-3"><StatusPill sku={sku} /></td>
                      <td className="px-5 py-3">
                        <ChevronRight className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-4px] group-hover:translate-x-0" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
              <input required name="thickness_mm" type="number" step="0.01" min={formProductType === 'hr_coil' || formProductType === 'hr_sheet' ? "1.6" : undefined} max={formProductType === 'hr_coil' || formProductType === 'hr_sheet' ? "25" : undefined}
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
