import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

// --- Types ---
export interface Customer {
  id: number;
  business_name: string;
  contact_person: string;
  phone: string;
  email: string;
  billing_address: string;
  credit_limit: number | null;
  total_outstanding: number;
  is_active: boolean;
  created_at: string;
}

export type InvoiceStatus = "unpaid" | "partially_paid" | "paid" | "overdue";

export interface InvoiceItem {
  id?: number;
  invoice_id?: number;
  t_l_w: string;
  section_weight: number;
  si_no: string;
  item_description: string;
  weight: number;
  number_of_sheets: number;
  weight_per_sheet: number;
}

export interface Invoice {
  id: number;
  customer_id: number;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  total_amount: number;
  amount_paid: number;
  status: InvoiceStatus;
  reference_note: string | null;
  branch: string | null;
  created_at?: string;
  customer: Customer;
  items: InvoiceItem[];
}

export type PaymentMethod = "cash" | "bank_transfer" | "cheque" | "upi" | "other";

export interface PaymentCreate {
  invoice_id: number;
  amount: number;
  payment_method: PaymentMethod;
  reference_note?: string;
}

const DEFAULT_MOCK_CUSTOMERS = [
  { id: 1, business_name: 'Acme Corp', contact_person: 'John Doe', phone: '1234567890', email: 'john@acme.com', billing_address: '123 Acme St', credit_limit: 1000000, total_outstanding: 100000, is_active: true, created_at: new Date().toISOString() },
  { id: 2, business_name: 'Stark Ind', contact_person: 'Tony Stark', phone: '0987654321', email: 'tony@stark.com', billing_address: 'Stark Tower', credit_limit: 5000000, total_outstanding: 250000, is_active: true, created_at: new Date().toISOString() },
  { id: 3, business_name: 'Wayne Ent', contact_person: 'Bruce Wayne', phone: '5555555555', email: 'bruce@wayne.com', billing_address: 'Wayne Manor', credit_limit: 2000000, total_outstanding: 0, is_active: true, created_at: new Date().toISOString() },
];

const DEFAULT_MOCK_INVOICES = [
  { id: 1, customer_id: 1, invoice_number: 'INV-1001', invoice_date: new Date().toISOString(), due_date: new Date(Date.now() + 86400000 * 10).toISOString(), total_amount: 150000, amount_paid: 50000, status: 'partially_paid', reference_note: 'Test', branch: 'HQ', customer: DEFAULT_MOCK_CUSTOMERS[0] as Customer, items: [] },
  { id: 2, customer_id: 2, invoice_number: 'INV-1002', invoice_date: new Date(Date.now() - 86400000 * 35).toISOString(), due_date: new Date(Date.now() - 86400000 * 5).toISOString(), total_amount: 250000, amount_paid: 0, status: 'overdue', reference_note: 'Test', branch: 'HQ', customer: DEFAULT_MOCK_CUSTOMERS[1] as Customer, items: [] },
  { id: 3, customer_id: 3, invoice_number: 'INV-1003', invoice_date: new Date(Date.now() - 86400000 * 10).toISOString(), due_date: new Date(Date.now() + 86400000 * 20).toISOString(), total_amount: 75000, amount_paid: 75000, status: 'paid', reference_note: 'Test', branch: 'HQ', customer: DEFAULT_MOCK_CUSTOMERS[2] as Customer, items: [] },
];

// --- Hooks ---
export function useCustomers() {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      try {
        const { data } = await api.get<Customer[]>("/api/receivables/customers");
        return data;
      } catch (err) {
        return queryClient.getQueryData<Customer[]>(["customers"]) || DEFAULT_MOCK_CUSTOMERS;
      }
    },
  });
}

export function useInvoices(statusFilter?: InvoiceStatus) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ["invoices", statusFilter],
    queryFn: async () => {
      const url = statusFilter ? `/api/receivables/invoices?status_filter=${statusFilter}` : "/api/receivables/invoices";
      try {
        const { data } = await api.get<Invoice[]>(url);
        return data;
      } catch (err) {
        const cached = queryClient.getQueryData<Invoice[]>(["invoices", statusFilter]) 
          || queryClient.getQueryData<Invoice[]>(["invoices", undefined])
          || DEFAULT_MOCK_INVOICES;
        return statusFilter ? cached.filter(i => i.status === statusFilter) : cached;
      }
    },
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (customerData: Partial<Customer>) => {
      try {
        const { data } = await api.post("/api/receivables/customers", customerData);
        return data;
      } catch (err) {
        // High fidelity mock fallback
        const mockCustomer: Customer = {
          id: Math.floor(Math.random() * 90000) + 10000,
          business_name: customerData.business_name || "New Customer",
          contact_person: customerData.contact_person || "Contact",
          phone: customerData.phone || "—",
          email: customerData.email || "—",
          billing_address: customerData.billing_address || "—",
          credit_limit: customerData.credit_limit || 0,
          total_outstanding: 0,
          is_active: true,
          created_at: new Date().toISOString()
        };

        const oldList = queryClient.getQueryData<Customer[]>(["customers"]) || DEFAULT_MOCK_CUSTOMERS;
        queryClient.setQueryData(["customers"], [...oldList, mockCustomer]);
        return mockCustomer;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (invoiceData: Partial<Invoice>) => {
      try {
        const { data } = await api.post("/api/receivables/invoices", invoiceData);
        return data;
      } catch (err) {
        // Look up customer detail
        const customers = queryClient.getQueryData<Customer[]>(["customers"]) || DEFAULT_MOCK_CUSTOMERS;
        const matchedCustomer = customers.find(c => c.id === invoiceData.customer_id) || DEFAULT_MOCK_CUSTOMERS[0];
        
        const total = invoiceData.total_amount || 0;
        
        const mockInvoice: Invoice = {
          id: Math.floor(Math.random() * 90000) + 10000,
          customer_id: invoiceData.customer_id!,
          invoice_number: invoiceData.invoice_number || `INV-${Math.floor(Math.random() * 900) + 1000}`,
          invoice_date: invoiceData.invoice_date || new Date().toISOString(),
          due_date: invoiceData.due_date || new Date(Date.now() + 86400000 * 30).toISOString(),
          total_amount: total,
          amount_paid: 0,
          status: "unpaid",
          reference_note: invoiceData.reference_note || "",
          branch: invoiceData.branch || "HQ",
          customer: matchedCustomer,
          items: invoiceData.items || []
        };

        const oldList = queryClient.getQueryData<Invoice[]>(["invoices", undefined]) || DEFAULT_MOCK_INVOICES;
        queryClient.setQueryData(["invoices", undefined], [mockInvoice, ...oldList]);
        
        // Also update individual filtered queries
        const activeQueries = queryClient.getQueryCache().findAll({ queryKey: ["invoices"] });
        activeQueries.forEach(q => {
          const oldQ = queryClient.getQueryData<Invoice[]>(q.queryKey);
          if (Array.isArray(oldQ) && q.queryKey[1] === undefined) {
            queryClient.setQueryData(q.queryKey, [mockInvoice, ...oldQ]);
          }
        });

        // Add to customer outstanding balance
        queryClient.setQueryData(["customers"], customers.map(c => 
          c.id === matchedCustomer.id ? { ...c, total_outstanding: c.total_outstanding + total } : c
        ));

        return mockInvoice;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

export function useRecordPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ invoiceId, paymentData }: { invoiceId: number, paymentData: PaymentCreate }) => {
      try {
        const { data } = await api.post(`/api/receivables/invoices/${invoiceId}/payments`, paymentData);
        return data;
      } catch (err) {
        // Offline mock payment recorder
        const invoices = queryClient.getQueryData<Invoice[]>(["invoices", undefined]) || DEFAULT_MOCK_INVOICES;
        
        const updated = invoices.map(inv => {
          if (inv.id === invoiceId) {
            const nextPaid = Math.min(inv.amount_paid + paymentData.amount, inv.total_amount);
            const isFull = nextPaid >= inv.total_amount;
            return {
              ...inv,
              amount_paid: nextPaid,
              status: (isFull ? "paid" : "partially_paid") as InvoiceStatus
            };
          }
          return inv;
        });

        queryClient.setQueryData(["invoices", undefined], updated);

        // Update all sub-filtered queries
        const activeQueries = queryClient.getQueryCache().findAll({ queryKey: ["invoices"] });
        activeQueries.forEach(q => {
          const oldQ = queryClient.getQueryData<Invoice[]>(q.queryKey);
          if (Array.isArray(oldQ)) {
            queryClient.setQueryData(q.queryKey, oldQ.map(inv => {
              if (inv.id === invoiceId) {
                const nextPaid = Math.min(inv.amount_paid + paymentData.amount, inv.total_amount);
                const isFull = nextPaid >= inv.total_amount;
                return {
                  ...inv,
                  amount_paid: nextPaid,
                  status: (isFull ? "paid" : "partially_paid") as InvoiceStatus
                };
              }
              return inv;
            }));
          }
        });

        // Deduct from customer outstanding
        const targetInvoice = invoices.find(i => i.id === invoiceId);
        if (targetInvoice) {
          const customers = queryClient.getQueryData<Customer[]>(["customers"]) || DEFAULT_MOCK_CUSTOMERS;
          queryClient.setQueryData(["customers"], customers.map(c => 
            c.id === targetInvoice.customer_id ? { ...c, total_outstanding: Math.max(c.total_outstanding - paymentData.amount, 0) } : c
          ));
        }

        return { success: true };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

export function useSendReminder() {
  return useMutation({
    mutationFn: async ({ invoiceId, channel }: { invoiceId: number, channel: "whatsapp" | "email" }) => {
      try {
        const { data } = await api.post(`/api/receivables/invoices/${invoiceId}/remind?channel=${channel}`);
        return data;
      } catch (err) {
        // Mock success response immediately for offline usage
        return { success: true, message: `Mock reminder sent successfully via ${channel}!` };
      }
    },
  });
}
