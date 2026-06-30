import { useCallback } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice } from '@/hooks/useReceivables';

export const usePdfExport = () => {
  const exportInvoices = useCallback((invoices: Invoice[]) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('BSD Steel - Accounts Receivable Ledger', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    
    // Table
    const tableData = invoices.map(inv => [
      inv.invoice_number,
      inv.customer?.business_name || inv.customer?.contact_person || 'Unknown',
      new Date(inv.invoice_date).toLocaleDateString(),
      `Rs. ${Number(inv.total_amount).toLocaleString('en-IN')}`,
      `Rs. ${Number(inv.total_amount - inv.amount_paid).toLocaleString('en-IN')}`,
      inv.status.toUpperCase()
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['Invoice #', 'Customer', 'Date', 'Total', 'Balance Due', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
      styles: { fontSize: 8 },
    });
    
    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.getWidth() - 20,
        doc.internal.pageSize.getHeight() - 10
      );
    }
    
    doc.save(`Receivables_Export_${new Date().toISOString().split('T')[0]}.pdf`);
  }, []);

  return { exportInvoices };
};
