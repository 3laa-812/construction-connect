import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Filter, Clock, MapPin, Calendar, Package, Eye, Send, Building2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SupplierQuoteForm } from "@/components/supplier/SupplierQuoteForm";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface RFQFeedItem {
  id: string;
  title: string;
  buyerCompany: string;
  category: string;
  lineItems: {
    id: string;
    productName: string;
    quantity: number;
    unit: string;
    specifications?: string;
  }[];
  deliveryLocation: string;
  requiredDeliveryDate: string;
  paymentTerms: string;
  allowPartialBids: boolean;
  closingDate: string;
  bidCount: number;
  isNew: boolean;
  priority: "urgent" | "high" | "normal";
}

type ApiRFQ = {
  id: string;
  project?: { name?: string; company?: { name?: string } };
  deadline?: string;
  created_at?: string;
  payment_terms?: string;
  items?: Array<{ id: string; product_name?: string; quantity?: number; unit?: string }>;
  bids?: Array<unknown>;
};

const priorityConfig = {
  urgent: { labelKey: "supplier_rfq_feed.card.urgent", color: "danger" },
  high: { labelKey: "supplier_rfq_feed.card.high_priority", color: "warning" },
  normal: { labelKey: "supplier_rfq_feed.card.normal", color: "neutral" },
} as const;

export default function SupplierRFQFeed() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedRFQ, setSelectedRFQ] = useState<RFQFeedItem | null>(null);
  const [showQuoteDialog, setShowQuoteDialog] = useState(false);

  const { data, isLoading, isError } = useQuery<ApiRFQ[]>({
    queryKey: ["rfqs", "supplier-feed"],
    queryFn: async () => (await api.get("/rfqs")).data,
  });

  const submitQuoteMutation = useMutation({
    mutationFn: async (formData: any) => {
      if (!selectedRFQ || !user?.companyId) throw new Error("Missing RFQ or user company.");
      
      const payload = {
        supplier: { connect: { id: user.companyId } },
        total_price: formData.items.reduce((acc: number, item: any) => {
          if (!item.isQuoting) return acc;
          const qty = selectedRFQ.lineItems.find(i => i.id === item.id)?.quantity || 0;
          return acc + (Number(item.unitPrice) * qty);
        }, 0),
        status: "PENDING",
        valid_until: new Date(formData.validUntil).toISOString(),
        items: {
          create: formData.items
            .filter((i: any) => i.isQuoting)
            .map((i: any) => ({
              rfq_item: { connect: { id: i.id } },
              unit_price: Number(i.unitPrice),
              note: i.notes || undefined,
            })),
        },
      };
      
      return api.post(`/rfqs/${selectedRFQ.id}/bids`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rfqs", "supplier-feed"] });
      setShowQuoteDialog(false);
    },
  });

  const feedItems: RFQFeedItem[] = useMemo(() => {
    if (!data) return [];
    const now = Date.now();
    return data.map((rfq) => {
      const firstItem = rfq.items?.[0];
      const deadline = rfq.deadline ? new Date(rfq.deadline) : null;
      const ageDays = rfq.created_at ? (now - new Date(rfq.created_at).getTime()) / (1000 * 60 * 60 * 24) : 0;
      const daysToDeadline = deadline ? (deadline.getTime() - now) / (1000 * 60 * 60 * 24) : null;
      const priority: RFQFeedItem["priority"] =
        daysToDeadline !== null && daysToDeadline <= 3 ? "urgent" : daysToDeadline !== null && daysToDeadline <= 7 ? "high" : "normal";

      return {
        id: rfq.id,
        title: firstItem?.product_name || "RFQ Materials",
        buyerCompany: rfq.project?.company?.name || rfq.project?.name || "Verified Contractor",
        category: firstItem?.unit || "General",
        lineItems: (rfq.items || []).map((item) => ({
          id: item.id,
          productName: item.product_name || "Item",
          quantity: Number(item.quantity || 0),
          unit: item.unit || "",
        })),
        deliveryLocation: rfq.project?.name || "Delivery location TBD",
        requiredDeliveryDate: deadline ? deadline.toLocaleDateString() : "TBD",
        paymentTerms: rfq.payment_terms || "Standard",
        allowPartialBids: true,
        closingDate: deadline ? deadline.toISOString() : new Date(Date.now() + 86400000 * 10).toISOString(),
        bidCount: rfq.bids?.length || 0,
        isNew: ageDays <= 7,
        priority,
      };
    });
  }, [data]);

  const categories = [...new Set(feedItems.map((rfq) => rfq.category))];

  const filteredRFQs = feedItems.filter((rfq) => {
    const matchesSearch =
      rfq.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rfq.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rfq.buyerCompany.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || rfq.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleSubmitQuote = (rfq: RFQFeedItem) => {
    setSelectedRFQ(rfq);
    setShowQuoteDialog(true);
  };

  const getTimeRemaining = (closingDate: string) => {
    if (!closingDate) return t("supplier_rfq_feed.time.closing_soon");
    const closing = new Date(closingDate);
    const now = new Date();
    const diff = closing.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h remaining`;
    return "CLOSING SOON";
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-border pb-6">
          <div>
            <h1 className="text-[24px] font-display text-text-1">Live RFQ Feed</h1>
            <p className="text-[13px] text-text-2 mt-1 max-w-[480px]">
              Active requests for quotation from verified contractors matching your supply categories.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge variant="primary" className="font-mono">
              {feedItems.filter((r) => r.isNew).length} NEW
            </StatusBadge>
            <StatusBadge variant="danger" className="font-mono">
              {feedItems.filter((r) => r.priority === "urgent").length} URGENT
            </StatusBadge>
          </div>
        </div>

        {/* Action Bar */}
        <div className="bg-surface-2 rounded border border-border p-3 flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-3" />
            <Input
              placeholder="Query by ID, title, or contractor name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 border-border bg-surface text-[14px]"
            />
          </div>
          <div className="flex gap-2 min-w-[200px]">
             <Select value={categoryFilter} onValueChange={setCategoryFilter}>
               <SelectTrigger className="w-full h-10 border-border bg-surface text-[14px]">
                 <Filter className="w-4 h-4 me-2 text-text-3" />
                 <SelectValue placeholder="All Categories" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="all">All Categories</SelectItem>
                 {categories.map((cat) => (
                   <SelectItem key={cat} value={cat}>
                     {cat}
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
          </div>
        </div>

        {/* RFQ Cards Grid */}
        <div className="grid lg:grid-cols-2 gap-5">
          {isLoading ? (
             <div className="col-span-2 py-16 text-center text-text-3 font-mono text-sm tracking-widest uppercase">
                Synchronizing RFQ Feed...
             </div>
          ) : isError ? (
            <div className="col-span-2 py-16 text-center text-danger bg-danger/5 border border-danger/20 rounded font-mono text-sm uppercase">
              Telemetry Error: Failed to load feed
            </div>
          ) : filteredRFQs.length === 0 ? (
            <div className="col-span-2 border border-dashed border-border-2 rounded-lg py-16 px-6 text-center">
              <Package className="w-8 h-8 text-text-3 mx-auto mb-4 opacity-50" />
              <p className="font-medium text-text-1">No Active RFQs Found</p>
              <p className="text-[13px] text-text-3 mt-1">Check back later or adjust your category filtering.</p>
            </div>
          ) : (
            filteredRFQs.map((rfq) => (
              <div
                key={rfq.id}
                className={cn(
                  "bg-surface rounded-xl border border-border p-5 group transition-all duration-200 flex flex-col h-full",
                  rfq.isNew && "border-amber/40 shadow-[0_0_15px_rgba(212,146,10,0.05)]",
                  "hover:border-amber/50 hover:shadow-amber active:scale-[0.99]"
                )}
              >
                <div className="flex justify-between items-start gap-4 mb-4">
                  <div className="flex items-start gap-4">
                     <div className="w-12 h-12 bg-amber/10 border border-amber/20 rounded-lg flex items-center justify-center shrink-0">
                       <Package className="w-6 h-6 text-amber" />
                     </div>
                     <div>
                       <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-mono text-[11px] font-medium text-text-3 uppercase tracking-widest">{rfq.id.split('-')[0] || rfq.id.slice(0, 8)}</span>
                          {rfq.isNew && (
                            <StatusBadge variant="primary" size="sm" className="font-mono text-[10px] uppercase">NEW</StatusBadge>
                          )}
                          <StatusBadge variant={priorityConfig[rfq.priority].color as any} size="sm" className="font-mono text-[10px] uppercase">
                            {t(priorityConfig[rfq.priority].labelKey)}
                          </StatusBadge>
                       </div>
                       <h3 className="font-display text-[18px] text-text-1 leading-tight line-clamp-2">{rfq.title}</h3>
                     </div>
                  </div>
                </div>

                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-4 h-4 text-text-3 shrink-0" />
                    <span className="text-[13px] text-text-2 line-clamp-1 flex-1">{rfq.buyerCompany}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-text-3 shrink-0" />
                    <span className="text-[13px] text-text-2 line-clamp-1 flex-1">{rfq.deliveryLocation}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-text-3 shrink-0" />
                    <span className="text-[13px] text-text-2 flex-1">
                      Required by: <span className="font-mono text-text-1 ml-1">{rfq.requiredDeliveryDate}</span>
                    </span>
                  </div>
                </div>

                {/* Line Items Preview */}
                <div className="mt-5 bg-ground border border-border rounded-lg p-3">
                  <p className="text-[10px] text-text-3 font-mono uppercase tracking-[1px] mb-3">
                    Line Items Matrix ({rfq.lineItems.length})
                  </p>
                  <div className="space-y-2">
                    {rfq.lineItems.slice(0, 2).map((item, idx) => (
                      <div key={item.id} className={cn("flex justify-between items-center text-[13px]", idx !== 0 && "pt-2 border-t border-border-2")}>
                        <span className="text-text-1 truncate pr-4">{item.productName}</span>
                        <span className="text-text-2 font-mono tabular-nums shrink-0 whitespace-nowrap">
                          {item.quantity} {item.unit}
                        </span>
                      </div>
                    ))}
                    {rfq.lineItems.length > 2 && (
                       <div className="pt-2 border-t border-border-2 flex items-center justify-between text-[11px] text-text-3 font-mono">
                          <span>+{rfq.lineItems.length - 2} ADDITIONAL ITEMS...</span>
                          <span className="text-amber">VIEW ALL</span>
                       </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 text-[13px] font-mono">
                    <div className="flex items-center gap-1.5 text-warning">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium tracking-tight">{getTimeRemaining(rfq.closingDate)}</span>
                    </div>
                    <span className="text-text-3">
                      {rfq.bidCount} BIDS
                    </span>
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                    <Button variant="outline" className="flex-1 sm:flex-none border-border hover:bg-surface-2 bg-surface text-text-2 font-medium" onClick={() => handleSubmitQuote(rfq)}>
                      <Eye className="w-4 h-4 me-2" />
                      Details
                    </Button>
                    <Button className="flex-1 sm:flex-none bg-amber hover:bg-amber-hover text-black shadow-lg font-bold" onClick={() => handleSubmitQuote(rfq)}>
                      <Send className="w-4 h-4 me-2" />
                      Submit Quote
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quote Submission Dialog */}
      <Dialog open={showQuoteDialog} onOpenChange={setShowQuoteDialog}>
        <DialogContent className="max-w-4xl bg-surface border-border p-0 overflow-y-auto max-h-[90vh]">
          <DialogHeader className="bg-surface-2 border-b border-border p-6 flex-row items-center justify-between">
            <div>
               <DialogTitle className="text-[18px] font-display text-text-1 tracking-tight">Official Quote Submission</DialogTitle>
               <p className="text-[13px] text-text-3 mt-1 font-mono uppercase tracking-widest">{selectedRFQ?.id.split('-')[0] || selectedRFQ?.id}</p>
            </div>
            <div className="w-12 h-12 bg-amber/10 border border-amber/20 rounded-lg flex items-center justify-center shrink-0">
               <Send className="w-6 h-6 text-amber" />
            </div>
          </DialogHeader>
          {selectedRFQ && (
            <SupplierQuoteForm
              rfqId={selectedRFQ.id}
              rfqTitle={selectedRFQ.title}
              lineItems={selectedRFQ.lineItems}
              buyerCompany={selectedRFQ.buyerCompany}
              deliveryLocation={selectedRFQ.deliveryLocation}
              requiredDeliveryDate={selectedRFQ.requiredDeliveryDate}
              allowPartialBids={selectedRFQ.allowPartialBids}
              onSubmit={(data) => submitQuoteMutation.mutateAsync(data)}
              onCancel={() => setShowQuoteDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
