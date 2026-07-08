import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// ── Types ────────────────────────────────────────────────────────────────────

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

// ── Hooks ────────────────────────────────────────────────────────────────────

export function useSkus(filters?: { product_type?: string; search?: string; low_stock_only?: boolean }) {
  return useQuery({
    queryKey: ['skus', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.product_type) params.append('product_type', filters.product_type);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.low_stock_only) params.append('low_stock_only', 'true');
      const { data } = await api.get<SKU[]>(`/api/skus?${params.toString()}`);
      return data;
    },
  });
}

export function useSkuDetail(id: number) {
  return useQuery({
    queryKey: ['skus', id],
    queryFn: async () => {
      const { data } = await api.get<SKU>(`/api/skus/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateSku() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newSku: Omit<SKU, 'id' | 'total_stock'>) => {
      const { data } = await api.post<SKU>('/api/skus', newSku);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skus'] });
    },
  });
}

export function useUpdateSku() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SKU> & { id: number }) => {
      const { data } = await api.patch<SKU>(`/api/skus/${id}`, updates);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['skus'] });
      queryClient.invalidateQueries({ queryKey: ['skus', data.id] });
    },
  });
}

export function useStockLedger(skuId: number) {
  return useQuery({
    queryKey: ['stock-ledger', skuId],
    queryFn: async () => {
      const { data } = await api.get<StockLedger>(`/api/stock-ledger/${skuId}`);
      return data;
    },
    enabled: !!skuId,
  });
}

export function useTransactions(filters?: {
  sku_id?: number;
  warehouse_id?: number;
  transaction_type?: string;
  performed_by_user_id?: number;
}) {
  return useQuery({
    queryKey: ['stock-transactions', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.sku_id) params.append('sku_id', filters.sku_id.toString());
      if (filters?.warehouse_id) params.append('warehouse_id', filters.warehouse_id.toString());
      if (filters?.transaction_type) params.append('transaction_type', filters.transaction_type);
      if (filters?.performed_by_user_id) params.append('performed_by_user_id', filters.performed_by_user_id.toString());
      const { data } = await api.get<StockTransaction[]>(`/api/stock-transactions?${params.toString()}`);
      return data;
    },
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (txn: Partial<StockTransaction> & { batch_number?: string; unit_cost?: number }) => {
      const { data } = await api.post<StockTransaction>('/api/stock-transactions', txn);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['stock-ledger', variables.sku_id] });
      queryClient.invalidateQueries({ queryKey: ['stock-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['skus'] });
      queryClient.invalidateQueries({ queryKey: ['skus', variables.sku_id] });
    },
  });
}

export function useWarehouses() {
  return useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const { data } = await api.get<Warehouse[]>('/api/warehouses');
      return data;
    },
  });
}

export function useCreateWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (wh: { name: string; location: string }) => {
      const { data } = await api.post<Warehouse>('/api/warehouses', wh);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    },
  });
}
