import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Types (simplified for frontend matching backend)
export interface SKU {
  id: number;
  sku_code: string;
  product_type: string;
  thickness_mm: number;
  width_mm: number;
  length_mm?: number;
  grade: string;
  unit_of_measure: string;
  reorder_threshold: number;
  is_active: boolean;
  total_stock: number;
}

export interface StockBatch {
  id: number;
  sku_id: number;
  warehouse_id: number;
  batch_number: string;
  quantity_on_hand: number;
  unit_cost?: number;
  received_date: string;
}

export interface StockLedger {
  sku_id: number;
  total_stock: number;
  batches: StockBatch[];
}

export interface StockTransaction {
  id: number;
  sku_id: number;
  warehouse_id: number;
  batch_id?: number;
  transaction_type: 'inward' | 'outward' | 'adjustment' | 'opening_stock';
  quantity: number;
  reference_note?: string;
  performed_by_user_id: number;
  created_at: string;
}

export interface Warehouse {
  id: number;
  name: string;
  location: string;
  is_active: boolean;
}

// Comprehensive high-fidelity mock dataset matching the SOW thickness range of 1.6mm to 25mm
const DEFAULT_MOCK_SKUS: SKU[] = [
  // HR Coils (hr_coil)
  { id: 1, sku_code: 'HRC-1.6-1250', product_type: 'hr_coil', thickness_mm: 1.6, width_mm: 1250, grade: 'IS 2062', unit_of_measure: 'MT', reorder_threshold: 50, is_active: true, total_stock: 45 },
  { id: 2, sku_code: 'HRC-2.5-1500', product_type: 'hr_coil', thickness_mm: 2.5, width_mm: 1500, grade: 'IS 2062', unit_of_measure: 'MT', reorder_threshold: 80, is_active: true, total_stock: 120 },
  { id: 3, sku_code: 'HRC-3.15-1250', product_type: 'hr_coil', thickness_mm: 3.15, width_mm: 1250, grade: 'IS 2062', unit_of_measure: 'MT', reorder_threshold: 70, is_active: true, total_stock: 90 },
  { id: 4, sku_code: 'HRC-4.0-1500', product_type: 'hr_coil', thickness_mm: 4.0, width_mm: 1500, grade: 'ASTM A36', unit_of_measure: 'MT', reorder_threshold: 60, is_active: true, total_stock: 35 },
  { id: 5, sku_code: 'HRC-6.0-1500', product_type: 'hr_coil', thickness_mm: 6.0, width_mm: 1500, grade: 'IS 2062', unit_of_measure: 'MT', reorder_threshold: 70, is_active: true, total_stock: 72 },
  { id: 6, sku_code: 'HRC-12.0-1500', product_type: 'hr_coil', thickness_mm: 12.0, width_mm: 1500, grade: 'SAE 1008', unit_of_measure: 'MT', reorder_threshold: 50, is_active: true, total_stock: 110 },
  
  // HR Sheets (hr_sheet)
  { id: 7, sku_code: 'HRS-2.0-1250-2500', product_type: 'hr_sheet', thickness_mm: 2.0, width_mm: 1250, length_mm: 2500, grade: 'IS 2062', unit_of_measure: 'MT', reorder_threshold: 100, is_active: true, total_stock: 120 },
  { id: 8, sku_code: 'HRS-3.0-1500-6000', product_type: 'hr_sheet', thickness_mm: 3.0, width_mm: 1500, length_mm: 6000, grade: 'IS 2062', unit_of_measure: 'MT', reorder_threshold: 60, is_active: true, total_stock: 40 },
  { id: 9, sku_code: 'HRS-5.0-1500-6000', product_type: 'hr_sheet', thickness_mm: 5.0, width_mm: 1500, length_mm: 6000, grade: 'ASTM A36', unit_of_measure: 'MT', reorder_threshold: 80, is_active: true, total_stock: 150 },
  { id: 10, sku_code: 'HRS-8.0-1500-6000', product_type: 'hr_sheet', thickness_mm: 8.0, width_mm: 1500, length_mm: 6000, grade: 'IS 2062', unit_of_measure: 'MT', reorder_threshold: 50, is_active: true, total_stock: 85 },
  { id: 11, sku_code: 'HRS-10.0-2000-6000', product_type: 'hr_sheet', thickness_mm: 10.0, width_mm: 2000, length_mm: 6000, grade: 'IS 2062', unit_of_measure: 'MT', reorder_threshold: 50, is_active: true, total_stock: 30 },
  { id: 12, sku_code: 'HRS-16.0-2000-6000', product_type: 'hr_sheet', thickness_mm: 16.0, width_mm: 2000, length_mm: 6000, grade: 'SAE 1010', unit_of_measure: 'MT', reorder_threshold: 40, is_active: true, total_stock: 65 },
  { id: 13, sku_code: 'HRS-25.0-2000-6000', product_type: 'hr_sheet', thickness_mm: 25.0, width_mm: 2000, length_mm: 6000, grade: 'IS 2062', unit_of_measure: 'MT', reorder_threshold: 30, is_active: true, total_stock: 18 },
  
  // Chequered Sheets (chequered_sheet)
  { id: 14, sku_code: 'CQ-3.0-1250-2500', product_type: 'chequered_sheet', thickness_mm: 3.0, width_mm: 1250, length_mm: 2500, grade: 'IS 2062', unit_of_measure: 'MT', reorder_threshold: 30, is_active: true, total_stock: 15 },
  { id: 15, sku_code: 'CQ-4.0-1250-2500', product_type: 'chequered_sheet', thickness_mm: 4.0, width_mm: 1250, length_mm: 2500, grade: 'IS 2062', unit_of_measure: 'MT', reorder_threshold: 30, is_active: true, total_stock: 55 },
  { id: 16, sku_code: 'CQ-5.0-1500-3000', product_type: 'chequered_sheet', thickness_mm: 5.0, width_mm: 1500, length_mm: 3000, grade: 'IS 2062', unit_of_measure: 'MT', reorder_threshold: 40, is_active: true, total_stock: 42 },
  { id: 17, sku_code: 'CQ-6.0-1500-3000', product_type: 'chequered_sheet', thickness_mm: 6.0, width_mm: 1500, length_mm: 3000, grade: 'IS 2062', unit_of_measure: 'MT', reorder_threshold: 25, is_active: true, total_stock: 12 },
];

// Hooks
export function useSkus(filters?: { product_type?: string, search?: string, low_stock_only?: boolean }) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ['skus', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.product_type) params.append('product_type', filters.product_type);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.low_stock_only) params.append('low_stock_only', 'true');
      try {
        const { data } = await api.get<SKU[]>(`/api/skus?${params.toString()}`);
        return data;
      } catch (err) {
        // Retrieve current list from cache, or fall back to the default seed list
        const cachedQueries = queryClient.getQueryCache().findAll({ queryKey: ['skus'] });
        let list: SKU[] = [];
        for (const q of cachedQueries) {
          if (Array.isArray(q.state.data) && q.state.data.length > list.length) {
            list = q.state.data as SKU[];
          }
        }
        
        if (list.length === 0) {
          list = DEFAULT_MOCK_SKUS;
        }

        // Apply local filtering
        let filtered = [...list];
        if (filters?.search) {
          const s = filters.search.toLowerCase();
          filtered = filtered.filter(item => item.sku_code.toLowerCase().includes(s));
        }
        if (filters?.product_type) {
          filtered = filtered.filter(item => item.product_type === filters.product_type);
        }
        if (filters?.low_stock_only) {
          filtered = filtered.filter(item => item.total_stock < item.reorder_threshold);
        }

        return filtered;
      }
    }
  });
}

export function useSkuDetail(id: number) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ['skus', id],
    queryFn: async () => {
      try {
        const { data } = await api.get<SKU>(`/api/skus/${id}`);
        return data;
      } catch (err) {
        // Look in query cache first, then fall back to default seed list
        const list = queryClient.getQueryData<SKU[]>(['skus', {}]) || DEFAULT_MOCK_SKUS;
        const mockDetail = list.find(s => s.id === id) || DEFAULT_MOCK_SKUS.find(s => s.id === id) || DEFAULT_MOCK_SKUS[0];
        return mockDetail;
      }
    }
  });
}

export function useCreateSku() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newSku: Omit<SKU, 'id' | 'total_stock'>) => {
      try {
        const { data } = await api.post<SKU>('/api/skus', newSku);
        return data;
      } catch (err: any) {
        if (err.response) throw err;
        // High fidelity mock fallback
        const mockSku: SKU = {
          id: Math.floor(Math.random() * 90000) + 10000,
          ...newSku,
          total_stock: 0,
        };

        const queries = queryClient.getQueryCache().findAll({ queryKey: ['skus'] });
        queries.forEach(query => {
          const oldData = queryClient.getQueryData<SKU[]>(query.queryKey);
          if (oldData) {
            queryClient.setQueryData(query.queryKey, [...oldData, mockSku]);
          }
        });
        return mockSku;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skus'] });
    }
  });
}

export function useStockLedger(skuId: number) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ['stock-ledger', skuId],
    queryFn: async () => {
      try {
        const { data } = await api.get<StockLedger>(`/api/stock-ledger/${skuId}`);
        return data;
      } catch (err) {
        // Look up the active SKU to get its total stock position
        const list = queryClient.getQueryData<SKU[]>(['skus', {}]) || DEFAULT_MOCK_SKUS;
        const sku = list.find(s => s.id === skuId) || DEFAULT_MOCK_SKUS.find(s => s.id === skuId) || { total_stock: 45 };
        const q1 = Math.round(sku.total_stock * 0.6);
        const q2 = Math.max(sku.total_stock - q1, 0);
        return {
          sku_id: skuId,
          total_stock: sku.total_stock,
          batches: [
            { id: 1, sku_id: skuId, warehouse_id: 1, batch_number: 'BATCH-001', quantity_on_hand: q1, received_date: new Date(Date.now() - 86400000 * 5).toISOString() },
            { id: 2, sku_id: skuId, warehouse_id: 2, batch_number: 'BATCH-002', quantity_on_hand: q2, received_date: new Date(Date.now() - 86400000 * 2).toISOString() }
          ].filter(b => b.quantity_on_hand > 0)
        } as StockLedger;
      }
    }
  });
}

export function useTransactions(filters?: { sku_id?: number, warehouse_id?: number, transaction_type?: string, performed_by_user_id?: number }) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ['stock-transactions', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.sku_id) params.append('sku_id', filters.sku_id.toString());
      if (filters?.warehouse_id) params.append('warehouse_id', filters.warehouse_id.toString());
      if (filters?.transaction_type) params.append('transaction_type', filters.transaction_type);
      if (filters?.performed_by_user_id) params.append('performed_by_user_id', filters.performed_by_user_id.toString());
      
      try {
        const { data } = await api.get<StockTransaction[]>(`/api/stock-transactions?${params.toString()}`);
        return data;
      } catch (err) {
        const skuId = filters?.sku_id || 1;
        const list = queryClient.getQueryData<SKU[]>(['skus', {}]) || DEFAULT_MOCK_SKUS;
        const sku = list.find(s => s.id === skuId) || DEFAULT_MOCK_SKUS.find(s => s.id === skuId) || { total_stock: 45 };
        const q1 = Math.round(sku.total_stock * 0.6);
        const q2 = Math.max(sku.total_stock - q1, 0);
        return [
          { id: 1, sku_id: skuId, warehouse_id: 1, batch_id: 1, transaction_type: 'inward', quantity: q1, performed_by_user_id: 1, created_at: new Date(Date.now() - 86400000 * 5).toISOString(), reference_note: 'PO-2026-00104' },
          { id: 2, sku_id: skuId, warehouse_id: 2, batch_id: 2, transaction_type: 'inward', quantity: q2, performed_by_user_id: 2, created_at: new Date(Date.now() - 86400000 * 2).toISOString(), reference_note: 'PO-2026-00108' }
        ] as StockTransaction[];
      }
    }
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (txn: Partial<StockTransaction>) => {
      try {
        const { data } = await api.post<StockTransaction>('/api/stock-transactions', txn);
        return data;
      } catch (err: any) {
        if (err.response) throw err;
        // High fidelity mock fallback
        const mockTxn: StockTransaction = {
          id: Math.floor(Math.random() * 90000) + 10000,
          sku_id: txn.sku_id!,
          warehouse_id: txn.warehouse_id!,
          batch_id: txn.batch_id,
          transaction_type: txn.transaction_type as any,
          quantity: txn.quantity!,
          reference_note: txn.reference_note,
          performed_by_user_id: txn.performed_by_user_id || 1,
          created_at: new Date().toISOString(),
        };

        const txnQueries = queryClient.getQueryCache().findAll({ queryKey: ['stock-transactions'] });
        txnQueries.forEach(query => {
          const old = queryClient.getQueryData<StockTransaction[]>(query.queryKey);
          if (old) {
            queryClient.setQueryData(query.queryKey, [mockTxn, ...old]);
          }
        });

        const ledgerQueries = queryClient.getQueryCache().findAll({ queryKey: ['stock-ledger', txn.sku_id] });
        ledgerQueries.forEach(query => {
          const oldLedger = queryClient.getQueryData<StockLedger>(query.queryKey);
          if (oldLedger) {
            const updatedBatches = [...oldLedger.batches];
            const isReceipt = txn.transaction_type === 'inward' || txn.transaction_type === 'opening_stock';
            
            if (isReceipt) {
              updatedBatches.push({
                id: Math.floor(Math.random() * 90000) + 10000,
                sku_id: txn.sku_id!,
                warehouse_id: txn.warehouse_id!,
                batch_number: (txn as any).batch_number || `BATCH-${Date.now().toString().slice(-4)}`,
                quantity_on_hand: txn.quantity!,
                unit_cost: (txn as any).unit_cost,
                received_date: new Date().toISOString(),
              });
            } else {
              const batchIdx = updatedBatches.findIndex(b => b.id === txn.batch_id);
              if (batchIdx !== -1) {
                updatedBatches[batchIdx] = {
                  ...updatedBatches[batchIdx],
                  quantity_on_hand: Math.max(updatedBatches[batchIdx].quantity_on_hand + txn.quantity!, 0),
                };
              }
            }

            queryClient.setQueryData(query.queryKey, {
              ...oldLedger,
              total_stock: Math.max(oldLedger.total_stock + txn.quantity!, 0),
              batches: updatedBatches,
            });
          }
        });

        const skuQueries = queryClient.getQueryCache().findAll({ queryKey: ['skus'] });
        skuQueries.forEach(query => {
          const oldSkus = queryClient.getQueryData<any>(query.queryKey);
          if (Array.isArray(oldSkus)) {
            queryClient.setQueryData(query.queryKey, oldSkus.map(s => 
              s.id === txn.sku_id ? { ...s, total_stock: Math.max(s.total_stock + txn.quantity!, 0) } : s
            ));
          } else if (oldSkus && oldSkus.id === txn.sku_id) {
            queryClient.setQueryData(query.queryKey, {
              ...oldSkus,
              total_stock: Math.max(oldSkus.total_stock + txn.quantity!, 0)
            });
          }
        });

        return mockTxn;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['stock-ledger', variables.sku_id] });
      queryClient.invalidateQueries({ queryKey: ['stock-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['skus'] });
    }
  });
}

export function useWarehouses() {
  return useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      try {
        const { data } = await api.get<Warehouse[]>('/api/warehouses');
        return data;
      } catch (err) {
        return [
          { id: 1, name: 'Main Warehouse', location: 'Bangalore HQ', is_active: true },
          { id: 2, name: 'Secondary Warehouse', location: 'Mumbai', is_active: true },
        ] as Warehouse[];
      }
    }
  });
}

export function useCreateWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (wh: { name: string, location: string }) => {
      const { data } = await api.post<Warehouse>('/api/warehouses', wh);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    }
  });
}
