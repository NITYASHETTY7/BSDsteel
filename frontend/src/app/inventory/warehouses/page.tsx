"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useWarehouses, useCreateWarehouse } from "@/hooks/useInventory";
import SlidePanel from "@/components/ui/SlidePanel";
import { Skeleton } from "@/components/ui/Skeleton";

export default function WarehousesPage() {
  const { user } = useAuthStore();
  const [isSlideOpen, setIsSlideOpen] = useState(false);

  const { data: warehouses, isLoading } = useWarehouses();
  const { mutate: createWarehouse, isPending: isCreating } = useCreateWarehouse();

  // Redirect or hide if not management
  if (user?.role !== "management") {
    return <div className="p-6 text-text-primary">Unauthorized. Only management can view and edit warehouses.</div>;
  }

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createWarehouse({
      name: formData.get("name") as string,
      location: formData.get("location") as string,
    }, {
      onSuccess: () => {
        setIsSlideOpen(false);
      }
    });
  };

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-bold uppercase tracking-widest text-text-primary">
          Warehouses
        </h1>
        <button 
          onClick={() => setIsSlideOpen(true)}
          className="bg-accent text-black px-4 py-2 font-display font-bold uppercase tracking-wide rounded-sm flex items-center gap-2 hover:bg-[#e09820] transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Warehouse
        </button>
      </div>

      <div className="flex-1 overflow-auto bg-panel border border-border rounded-sm">
        {isLoading ? (
          <div className="p-4 space-y-4">
            <Skeleton className="w-full h-12" />
            <Skeleton className="w-full h-12" />
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-[#1A1C20] text-xs uppercase tracking-widest text-text-muted">
                <th className="p-4 font-medium">ID</th>
                <th className="p-4 font-medium">Name</th>
                <th className="p-4 font-medium">Location</th>
                <th className="p-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {warehouses?.map((w) => (
                <tr key={w.id} className="border-b border-border hover:bg-[#25282d] transition-colors text-sm text-text-primary">
                  <td className="p-4 font-mono font-medium">{w.id}</td>
                  <td className="p-4 font-medium">{w.name}</td>
                  <td className="p-4 text-text-muted">{w.location}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs font-bold uppercase tracking-wide rounded-sm ${w.is_active ? 'bg-[#3D7A6B]/20 text-[#3D7A6B]' : 'bg-border text-text-muted'}`}>
                      {w.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <SlidePanel 
        isOpen={isSlideOpen} 
        onClose={() => setIsSlideOpen(false)}
        title="Add Warehouse"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wide text-text-muted mb-1">Warehouse Name</label>
            <input required name="name" type="text" className="w-full bg-background border border-border p-2 text-sm text-text-primary focus:border-accent outline-none rounded-sm" placeholder="e.g. Main Yard" />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-text-muted mb-1">Location</label>
            <input required name="location" type="text" className="w-full bg-background border border-border p-2 text-sm text-text-primary focus:border-accent outline-none rounded-sm" placeholder="e.g. Mumbai, MH" />
          </div>
          <button 
            type="submit" 
            disabled={isCreating}
            className="w-full bg-accent text-black font-display font-bold uppercase tracking-wide py-3 mt-6 hover:bg-[#e09820] transition-colors rounded-sm disabled:opacity-50"
          >
            {isCreating ? "Saving..." : "Save Warehouse"}
          </button>
        </form>
      </SlidePanel>
    </div>
  );
}
