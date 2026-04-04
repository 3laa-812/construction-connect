import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageShell } from "@/components/layout/PageShell";
import { ArrowLeft, MapPin, Receipt, Download, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { StatusStepper } from "@/components/orders/StatusStepper";
import { GoodsReceivedNote } from "@/components/orders/GoodsReceivedNote";
import { toast } from "@/hooks/use-toast";

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [showGrn, setShowGrn] = useState(false);
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: ["purchase-orders", id],
    queryFn: async () => {
      const resp = await api.get(`/purchase-orders/${id}`);
      return resp.data;
    },
    enabled: !!id,
  });

  if (isLoading) return <AppLayout><div className="p-8 text-text-2 text-center">Loading...</div></AppLayout>;
  if (!order) return <AppLayout><div className="p-8 text-danger text-center">Order not found.</div></AppLayout>;

  return (
    <AppLayout>
      <div className="p-4 lg:p-6 space-y-6 max-w-[1280px] mx-auto">
        {/* Header containing Stepper */}
        <div className="bg-surface border border-border rounded-md p-4 lg:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-4">
              <Link to="/orders">
                <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5 text-text-2" /></Button>
              </Link>
              <div>
                <h1 className="text-[24px] font-display text-text-1">PO {order.id?.substring(0,8)} — {order.supplier?.name}</h1>
                <p className="text-[13px] text-text-3">Placed on {new Date(order.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            
            <div className="lg:ml-auto w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
               <StatusStepper currentStatus={order.status || "confirmed"} />
            </div>
          </div>
        </div>

        {/* 3-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column (Items, site location) */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-surface border border-border rounded-md overflow-hidden">
              <div className="p-4 border-b border-border bg-surface-2 flex items-center justify-between">
                <h3 className="font-medium text-text-1 text-[15px]">Line Items</h3>
                <span className="text-[12px] font-mono text-text-3 px-2 py-0.5 rounded bg-surface border border-border">
                  Total: SAR {Number(order.total_amount).toLocaleString()}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-surface border-b border-border">
                    <tr>
                      <th className="py-3 px-4 text-[11px] font-medium text-text-2 uppercase tracking-wider">Description</th>
                      <th className="py-3 px-4 text-[11px] font-medium text-text-2 uppercase tracking-wider">Qty</th>
                      <th className="py-3 px-4 text-[11px] font-medium text-text-2 uppercase tracking-wider">Unit Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(order.items || []).map((item: any, idx: number) => (
                      <tr key={item.id || idx} className="border-b border-border">
                        <td className="py-3 px-4 text-[13px] text-text-1 font-medium">{item.item_description}</td>
                        <td className="py-3 px-4 text-[13px] text-text-2">{item.ordered_qty} {item.unit}</td>
                        <td className="py-3 px-4 text-[13px] font-mono text-text-1">SAR {Number(item.unit_price).toLocaleString()}</td>
                      </tr>
                    ))}
                    {(order.items?.length || 0) === 0 && (
                      <tr><td colSpan={3} className="py-8 text-center text-[13px] text-text-3">No items listed.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-surface border border-border rounded-md p-4 flex gap-4">
              <div className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-amber" />
              </div>
              <div>
                <h4 className="text-[14px] font-medium text-text-1 mb-1">Delivery Site</h4>
                <p className="text-[13px] text-text-2">{order.project?.name || "Riyadh Villa Compound"}</p>
                <p className="text-[12px] text-text-3 mt-1">Expected Delivery: {new Date(order.delivery_date || order.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Middle Column (Vertical Feed) */}
          <div className="lg:col-span-3 bg-surface border border-border rounded-md p-4 min-h-[400px]">
            <h3 className="font-medium text-text-1 text-[15px] mb-6">Order Timeline</h3>
            <div className="relative border-l-2 border-border ml-2 space-y-8 pb-4">
              <div className="relative pl-6">
                <div className="absolute w-3 h-3 bg-amber rounded-full -left-[7px] top-1 shadow-[0_0_0_4px_var(--surface)]" />
                <p className="text-[13px] font-medium text-text-1">Order Placed</p>
                <p className="text-[11px] text-text-3 mt-0.5">{new Date(order.created_at).toLocaleString()}</p>
              </div>
              {order.status !== "confirmed" && (
                <div className="relative pl-6">
                  <div className="absolute w-3 h-3 bg-warning rounded-full -left-[7px] top-1 shadow-[0_0_0_4px_var(--surface)]" />
                  <p className="text-[13px] font-medium text-text-1">Supplier Processing</p>
                  <p className="text-[11px] text-text-3 mt-0.5">Updated recently</p>
                </div>
              )}
              {/* Fake timeline items for visual structure */}
            </div>
          </div>

          {/* Right Column (Actions) */}
          <div className="lg:col-span-3 flex flex-col gap-3">
             <div className="bg-surface-2 p-4 rounded-md border border-border-2">
                 <h3 className="font-medium text-text-1 text-[14px] mb-3">Quick Actions</h3>
                 <div className="flex flex-col gap-2">
                    <Button variant="outline" className="w-full justify-start h-9 text-[13px]"><Download className="w-4 h-4 mr-2" /> Download PO PDF</Button>
                    <Button variant="outline" className="w-full justify-start h-9 text-[13px]"><Receipt className="w-4 h-4 mr-2" /> Upload Payment Ticket</Button>
                 </div>
             </div>

             {order.status === "OUT_FOR_DELIVERY" && (
             <div className="bg-amber-glow/20 p-4 rounded-md border border-amber/30 mt-2">
                 <h3 className="font-medium text-text-1 text-[14px] mb-1">Receiving</h3>
                 <p className="text-[12px] text-text-2 mb-4 leading-relaxed">
                   When materials arrive at the site, inspect and register quantities.
                 </p>
                 <Button className="w-full text-[13px]" onClick={() => setShowGrn(true)}>
                   <FileCheck className="w-4 h-4 mr-2" /> Record GRN
                 </Button>
             </div>
             )}
          </div>

        </div>
      </div>

      <GoodsReceivedNote 
         open={showGrn} 
         onOpenChange={setShowGrn}
         orderId={order.id}
         supplier={order.supplier?.name}
         lineItems={(order.items || []).map((i: any) => ({
           id: i.id,
           productName: i.item_description,
           quantity: i.ordered_qty,
           unit: i.unit || 'unit'
         }))}
         onRecordSuccess={() => {
           queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
           queryClient.invalidateQueries({ queryKey: ["purchase-orders", id] });
           toast({ title: "Delivery recorded successfully" });
         }}
      />
    </AppLayout>
  );
}
