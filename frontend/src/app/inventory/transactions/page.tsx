"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useTransactions, useWarehouses } from "@/hooks/useInventory";
import { Skeleton } from "@/components/ui/Skeleton";

export default function GlobalTransactionsPage() {
  const [transactionType, setTransactionType] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [skuIdStr, setSkuIdStr] = useState("");

  const { data: warehouses } = useWarehouses();
  const { data: transactions, isLoading, isError } = useTransactions({
    transaction_type: transactionType || undefined,
    warehouse_id: warehouseId ? parseInt(warehouseId, 10) : undefined,
    sku_id: skuIdStr ? parseInt(skuIdStr, 10) : undefined,
  });

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-bold uppercase tracking-widest text-text-primary">
          Global Audit Log
        </h1>
      </div>

      <div className="flex items-center gap-4 bg-panel border border-border p-4 rounded-sm">
        <input 
          type="number" 
          placeholder="Filter by SKU ID..." 
          value={skuIdStr}
          onChange={(e) => setSkuIdStr(e.target.value)}
          className="w-48 px-3 py-2 bg-background border border-border text-sm text-text-primary focus:outline-none focus:border-accent rounded-sm"
        />
        <select 
          value={warehouseId}
          onChange={(e) => setWarehouseId(e.target.value)}
          className="bg-background border border-border text-sm text-text-primary py-2 px-3 focus:outline-none focus:border-accent rounded-sm uppercase tracking-wider"
        >
          <option value="">All Warehouses</option>
          {warehouses?.map(w => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
        <select 
          value={transactionType}
          onChange={(e) => setTransactionType(e.target.value)}
          className="bg-background border border-border text-sm text-text-primary py-2 px-3 focus:outline-none focus:border-accent rounded-sm uppercase tracking-wider"
        >
          <option value="">All Types</option>
          <option value="inward">Inward</option>
          <option value="outward">Outward</option>
          <option value="adjustment">Adjustment</option>
          <option value="opening_stock">Opening Stock</option>
        </select>
      </div>

      <div className="flex-1 overflow-auto bg-panel border border-border rounded-sm">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="w-full h-8" />
            ))}
          </div>
        ) : isError ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-red-500">
            <p className="text-sm font-medium uppercase tracking-wider">Failed to load transactions. Check your connection to the backend.</p>
          </div>
        ) : transactions?.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center">
            <p className="text-text-muted text-sm uppercase tracking-wider">No transactions found matching criteria.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-[#1A1C20] text-xs uppercase tracking-widest text-text-muted">
                <th className="p-3 font-medium">Timestamp</th>
                <th className="p-3 font-medium">Type</th>
                <th className="p-3 font-medium">SKU ID</th>
                <th className="p-3 font-medium text-right">Qty</th>
                <th className="p-3 font-medium text-center">Batch ID</th>
                <th className="p-3 font-medium text-center">WH ID</th>
                <th className="p-3 font-medium text-center">User ID</th>
                <th className="p-3 font-medium">Reference</th>
              </tr>
            </thead>
            <tbody>
              {transactions?.map((t) => (
                <tr 
                  key={t.id} 
                  className="border-b border-border/50 hover:bg-[#25282d] transition-colors text-sm text-text-primary font-mono"
                >
                  <td className="p-3">{format(new Date(t.created_at), 'yyyy-MM-dd HH:mm:ss')}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-sm text-xs font-bold uppercase ${
                      t.transaction_type === 'inward' ? 'bg-[#3D7A6B]/20 text-[#3D7A6B]' :
                      t.transaction_type === 'outward' ? 'bg-[#C0392B]/20 text-[#C0392B]' :
                      'bg-border text-text-muted'
                    }`}>
                      {t.transaction_type}
                    </span>
                  </td>
                  <td className="p-3">{t.sku_id}</td>
                  <td className={`p-3 text-right ${t.quantity > 0 ? 'text-[#3D7A6B]' : 'text-[#C0392B]'}`}>
                    {t.quantity > 0 ? '+' : ''}{t.quantity}
                  </td>
                  <td className="p-3 text-center">{t.batch_id || '-'}</td>
                  <td className="p-3 text-center">{t.warehouse_id}</td>
                  <td className="p-3 text-center">{t.performed_by_user_id}</td>
                  <td className="p-3 text-text-muted">{t.reference_note || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
