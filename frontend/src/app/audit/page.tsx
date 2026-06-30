"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, Search, Filter } from "lucide-react";
import { useInvoices } from "@/hooks/useReceivables";
import { format } from "date-fns";

export default function AuditLogsPage() {
  const router = useRouter();
  const { data: invoices } = useInvoices();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const formatActivityTime = (dateStr: string) => {
    const d = new Date(dateStr);
    if (d.toDateString() === new Date().toDateString()) {
      return `Today, ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  const logs = useMemo(() => {
    const realLogs = invoices && invoices.length > 0 ? invoices.map(inv => ({
      id: String(inv.id),
      name: inv.customer?.business_name || inv.customer?.contact_person || 'Unknown Customer',
      action: inv.status === 'paid' ? 'Payment Received of steel order' : 'Invoice Issued of steel order',
      time: formatActivityTime((inv as any).created_at || inv.invoice_date || new Date().toISOString()),
      isPaid: inv.status === 'paid',
      amount: `₹${Number(inv.total_amount || 0).toLocaleString('en-IN')}`,
      status: inv.status === 'paid' ? 'Credited' : 'Pending',
    })) : [];

    const mockLogs = [
      { id: 'm1', name: 'Acme Corp',         action: 'Payment Received of steel order', time: 'Today, 10:30 AM', isPaid: true,  amount: '₹2,00,000', status: 'Credited' },
      { id: 'm2', name: 'Stark Industries',  action: 'Invoice Issued of steel order',   time: 'Today, 09:15 AM', isPaid: false, amount: '₹1,50,000', status: 'Pending' },
      { id: 'm3', name: 'Wayne Enterprises', action: 'Payment Received of steel order', time: 'Yesterday',       isPaid: true,  amount: '₹3,50,000', status: 'Credited' },
      { id: 'm4', name: 'LexCorp',           action: 'Invoice Issued of steel order',   time: 'Yesterday',       isPaid: false, amount: '₹80,000',   status: 'Pending' },
      { id: 'm5', name: 'Oscorp Holdings',   action: 'Invoice Issued of steel order',   time: '2 days ago',      isPaid: false, amount: '₹2,20,000', status: 'Pending' },
      { id: 'm6', name: 'Stark Industries',  action: 'Payment Received of steel order', time: '3 days ago',      isPaid: true,  amount: '₹1,20,000', status: 'Credited' },
      { id: 'm7', name: 'Shield Logistics',  action: 'Invoice Issued of steel order',   time: '4 days ago',      isPaid: false, amount: '₹95,000',   status: 'Pending' },
      { id: 'm8', name: 'Daily Bugle Press', action: 'Payment Received of steel order', time: '5 days ago',      isPaid: true,  amount: '₹40,000',   status: 'Credited' },
      { id: 'm9', name: 'Larsen & Toubro',   action: 'Invoice Issued of steel order',   time: '12 days ago',     isPaid: false, amount: '₹2,40,000', status: 'Pending' },
      { id: 'm10', name: 'BuildIt Steel',    action: 'Payment Received of steel order', time: '20 days ago',     isPaid: true,  amount: '₹5,00,000', status: 'Credited' },
      { id: 'm11', name: 'Acme Corp',        action: 'Invoice Issued of steel order',   time: '25 days ago',     isPaid: false, amount: '₹4,00,000', status: 'Pending' },
      { id: 'm12', name: 'Larsen & Toubro',  action: 'Invoice Issued of steel order',   time: '29 days ago',     isPaid: false, amount: '₹1,50,000', status: 'Pending' },
    ];

    let base = [...realLogs, ...mockLogs];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      base = base.filter(l => l.name.toLowerCase().includes(q) || l.action.toLowerCase().includes(q));
    }

    if (statusFilter !== "All") {
      base = base.filter(l => l.status === statusFilter);
    }

    return base;
  }, [invoices, searchQuery, statusFilter]);

  return (
    <div className="flex flex-col min-h-full pb-8">
      {/* Top Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.push("/dashboard")}
          className="p-2.5 bg-panel border border-border text-text-muted hover:text-text-primary hover:border-border/80 rounded-xl transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-display font-bold text-text-primary tracking-wide uppercase">
            Audit Logs & Transactions
          </h1>
          <p className="text-text-muted text-sm mt-0.5">
            Full 30-day history of inventory, invoice, and payment movements
          </p>
        </div>
      </div>

      <div className="bg-panel border border-border rounded-2xl p-6 card-shadow">
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative group">
            <Search className="w-4 h-4 text-text-muted absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-accent transition-colors" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-background border border-border pl-11 pr-4 py-3 rounded-xl text-sm text-text-primary focus:border-accent outline-none transition-colors"
            />
          </div>
          <div className="relative shrink-0">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none bg-background border border-border pl-4 pr-10 py-3 rounded-xl text-sm font-bold text-text-primary focus:border-accent outline-none transition-colors cursor-pointer uppercase tracking-widest text-[10px]"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Credited">Credited</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
              ▼
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {logs.map(item => {
            const initial = item.name.charAt(0).toUpperCase();
            return (
              <div key={item.id} className="flex items-center gap-4 p-4 bg-background/40 border border-border rounded-xl hover:border-accent/30 transition-all group">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                  item.isPaid
                    ? 'bg-[#3D7A6B]/15 text-[#3D7A6B] border border-[#3D7A6B]/25'
                    : 'bg-accent/10 text-accent border border-accent/20'
                }`}>
                  {initial}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-text-primary truncate">{item.name}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-text-muted truncate">{item.action}</p>
                    <span className="text-text-muted/30">•</span>
                    <span className="text-[10px] font-mono text-text-muted flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {item.time}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md mb-1 inline-block ${
                    item.isPaid ? 'bg-[#3D7A6B]/10 text-[#3D7A6B]' : 'bg-[#F4A623]/10 text-[#F4A623]'
                  }`}>
                    {item.status}
                  </span>
                  <p className="text-sm font-bold text-text-primary">{item.amount}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
