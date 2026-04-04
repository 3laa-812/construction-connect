import { useMemo, useState } from "react";
import { Search, List, LayoutGrid, AlertCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

const KANBAN_COLUMNS = [
  { id: "confirmed", label: "Confirmed", borderInfo: "border-t-[3px] border-t-[#2E5A8B]" },
  { id: "processing", label: "Processing", borderInfo: "border-t-[3px] border-t-[#B87333]" },
  { id: "out_for_delivery", label: "Out for Delivery", borderInfo: "border-t-[3px] border-t-[#8A6BBF]" },
  { id: "delivered", label: "Delivered", borderInfo: "border-t-[3px] border-t-[#2D7A4F]" },
  { id: "completed", label: "Completed", borderInfo: "border-t-[3px] border-t-[#5C5A55]" },
];

export default function Orders() {
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["purchase-orders"],
    queryFn: async () => (await api.get("/purchase-orders")).data,
  });

  const orders = useMemo(() => {
    if (!data) return [];
    return data.map((o: any) => {
      const s = (o.status || "confirmed").toString().toLowerCase();
      const status = KANBAN_COLUMNS.find(c => c.id === s) ? s : "confirmed";
      return {
        id: o.id?.substring(0, 8) || "UNKNOWN",
        fullId: o.id,
        supplier: o.supplier?.name || "Unknown Supplier",
        itemsCount: o.items?.length || 0,
        totalAmount: Number(o.total_amount || 0),
        status,
        date: o.created_at ? new Date(o.created_at).toLocaleDateString() : "N/A",
      };
    });
  }, [data]);

  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    o.supplier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppLayout>
      <PageShell 
        title="Orders & Fulfillment" 
        subtitle="Track purchase orders and manage goods receipt notes."
        actions={
          <div className="flex bg-surface-2 p-1 rounded-md border border-border">
            <Button 
              variant={viewMode === "kanban" ? "secondary" : "ghost"} 
              size="sm" 
              onClick={() => setViewMode("kanban")}
              className={`h-7 px-3 ${viewMode === "kanban" ? 'bg-surface shadow-sm' : ''}`}
            >
              <LayoutGrid className="w-4 h-4 mr-1.5" /> Kanban
            </Button>
            <Button 
              variant={viewMode === "table" ? "secondary" : "ghost"} 
              size="sm" 
              onClick={() => setViewMode("table")}
              className={`h-7 px-3 ${viewMode === "table" ? 'bg-surface shadow-sm' : ''}`}
            >
              <List className="w-4 h-4 mr-1.5" /> Table
            </Button>
          </div>
        }
      >
        <div className="mb-6 max-w-sm relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-3" />
          <Input 
            placeholder="Search PO number or supplier..." 
            className="pl-9 h-9" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {viewMode === "kanban" ? (
          <div className="flex gap-4 overflow-x-auto pb-4 min-h-[500px]">
            {KANBAN_COLUMNS.map(col => {
              const colOrders = filteredOrders.filter(o => o.status === col.id);
              return (
                <div key={col.id} className={`w-[280px] shrink-0 bg-surface-2 rounded-md ${col.borderInfo} border-x border-b border-border-2 p-3 flex flex-col`}>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-[13px] font-medium text-text-1 uppercase tracking-wider">{col.label}</h3>
                    <span className="text-[11px] font-mono text-text-3 px-1.5 py-0.5 bg-surface rounded border border-border">
                      {colOrders.length}
                    </span>
                  </div>
                  <div className="flex flex-col gap-3 flex-1">
                    {colOrders.map(order => (
                      <div 
                        key={order.fullId} 
                        onClick={() => navigate(`/orders/${order.fullId}`)}
                        className="bg-surface p-3 rounded-md border border-border hover:border-amber/50 hover:shadow-[0_0_0_1px_rgba(212,146,10,0.2)] cursor-pointer transition-all active:scale-[0.98]"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-mono text-[13px] text-text-1">{order.id}</span>
                          <span className="text-[11px] text-text-3">{order.date}</span>
                        </div>
                        <p className="font-medium text-[14px] text-text-1 mb-1 truncate">{order.supplier}</p>
                        <div className="flex justify-between items-end mt-3">
                          <p className="text-[12px] text-text-2">{order.itemsCount} items</p>
                          <p className="font-mono text-[13px] text-text-1 font-medium">SAR {order.totalAmount.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                    {colOrders.length === 0 && (
                      <div className="flex-1 flex flex-col items-center justify-center text-text-3 opacity-50 border-2 border-dashed border-border rounded-md min-h-[100px]">
                        <p className="text-[12px]">No orders</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-md overflow-hidden overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-2 border-b border-border">
                  <th className="py-3 px-4 text-[12px] font-medium text-text-2 uppercase tracking-wider">PO #</th>
                  <th className="py-3 px-4 text-[12px] font-medium text-text-2 uppercase tracking-wider">Supplier</th>
                  <th className="py-3 px-4 text-[12px] font-medium text-text-2 uppercase tracking-wider">Items</th>
                  <th className="py-3 px-4 text-[12px] font-medium text-text-2 uppercase tracking-wider">Total</th>
                  <th className="py-3 px-4 text-[12px] font-medium text-text-2 uppercase tracking-wider">Status</th>
                  <th className="py-3 px-4 text-[12px] font-medium text-text-2 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-text-3">No orders found.</td>
                  </tr>
                ) : filteredOrders.map(order => {
                  const statusInfo = KANBAN_COLUMNS.find(c => c.id === order.status)!;
                  return (
                    <tr key={order.fullId} className="border-b border-border hover:bg-surface-2 transition-colors">
                      <td className="py-3 px-4 font-mono text-[13px] text-text-1">{order.id}</td>
                      <td className="py-3 px-4 text-[13px] font-medium text-text-1">{order.supplier}</td>
                      <td className="py-3 px-4 text-[13px] text-text-2">{order.itemsCount}</td>
                      <td className="py-3 px-4 font-mono text-[13px] text-text-1">SAR {order.totalAmount.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded uppercase ${statusInfo.borderInfo.replace('border-t-[3px] border-t-', 'bg-').replace('[', '').replace(']', '/20 text-').concat('')}`}>{statusInfo.label}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button variant="outline" size="sm" onClick={() => navigate(`/orders/${order.fullId}`)}>View</Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </PageShell>
    </AppLayout>
  );
}
