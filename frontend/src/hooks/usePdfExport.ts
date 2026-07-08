import { useCallback } from 'react';
import { Invoice } from '@/hooks/useReceivables';

export const usePdfExport = () => {
  const exportInvoices = useCallback((_invoices: Invoice[]) => {
    window.print();
  }, []);

  return { exportInvoices };
};
