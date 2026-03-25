import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedRFQ, setSelectedRFQ] = useState<RFQFeedItem | null>(null);
  const [showQuoteDialog, setShowQuoteDialog] = useState(false);

  const { data, isLoading, isError } = useQuery<ApiRFQ[]>({
    queryKey: ["rfqs", "supplier-feed"],
    queryFn: async () => {
      const response = await api.get("/rfqs");
      return response.data;
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
        daysToDeadline !== null && daysToDeadline <= 3 ? "urgent" : "normal";

      return {
        id: rfq.id,
        title: firstItem?.product_name || "RFQ",
        buyerCompany: rfq.project?.company?.name || rfq.project?.name || "Buyer",
        category: firstItem?.unit || "General",
        lineItems: (rfq.items || []).map((item) => ({
          id: item.id,
          productName: item.product_name || "Item",
          quantity: Number(item.quantity || 0),
          unit: item.unit || "",
        })),
        deliveryLocation: rfq.project?.name || "Delivery location TBD",
        requiredDeliveryDate: deadline ? deadline.toLocaleDateString() : "TBD",
        paymentTerms: rfq.payment_terms || "Not set",
        allowPartialBids: true,
        closingDate: deadline ? deadline.toISOString() : "",
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
    if (days > 0) return t("supplier_rfq_feed.time.days_left", { days, hours: hours % 24 });
    if (hours > 0) return t("supplier_rfq_feed.time.hours_left", { hours });
    return t("supplier_rfq_feed.time.closing_soon");
  };

  return (
    <AppLayout>
      <div className="p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">{t("supplier_rfq_feed.title")}</h1>
            <p className="text-muted-foreground mt-1">
              {t("supplier_rfq_feed.subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge variant="primary">
              {feedItems.filter((r) => r.isNew).length} {t("supplier_rfq_feed.filters.new")}
            </StatusBadge>
            <StatusBadge variant="warning">
              {feedItems.filter((r) => r.priority === "urgent").length} {t("supplier_rfq_feed.filters.urgent")}
            </StatusBadge>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("supplier_rfq_feed.filters.search_placeholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 me-2" />
                <SelectValue placeholder={t("supplier_rfq_feed.filters.category_placeholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("supplier_rfq_feed.filters.all_categories")}</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* RFQ Cards */}
        <div className="grid lg:grid-cols-2 gap-4">
          {isLoading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="bg-card rounded-xl border border-border p-5">
                <div className="flex items-start gap-3">
                  <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="flex gap-2"><Skeleton className="h-5 w-16 rounded-full" /><Skeleton className="h-5 w-20 rounded-full" /></div>
                    <Skeleton className="h-5 w-3/4" />
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
                <div className="mt-4 bg-muted/50 rounded-lg p-3 space-y-2">
                  <Skeleton className="h-3 w-20 mb-3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
                <div className="mt-4 pt-4 border-t border-border flex justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex gap-2 mt-4">
                  <Skeleton className="h-9 flex-1 rounded-md" />
                  <Skeleton className="h-9 flex-1 rounded-md" />
                </div>
              </div>
            ))
          ) : isError ? (
            <div className="bg-card rounded-xl border border-border p-12 text-center text-danger">
              Failed to load RFQs
            </div>
          ) : (
            filteredRFQs.map((rfq, index) => (
              <div
                key={rfq.id}
                className={cn(
                  "bg-card rounded-xl border p-5 hover:shadow-md transition-shadow animate-fade-in",
                  rfq.isNew ? "border-primary/50" : "border-border"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                      <Package className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-muted-foreground">{rfq.id}</span>
                        {rfq.isNew && (
                          <StatusBadge variant="primary" size="sm">{t("supplier_rfq_feed.filters.new")}</StatusBadge>
                        )}
                        <StatusBadge variant={priorityConfig[rfq.priority].color as any} size="sm">
                          {t(priorityConfig[rfq.priority].labelKey)}
                        </StatusBadge>
                      </div>
                      <h3 className="font-semibold text-foreground mt-1">{rfq.title}</h3>
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">{rfq.buyerCompany}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground truncate">{rfq.deliveryLocation}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">
                      {t("supplier_rfq_feed.card.required_by")}: <span className="font-medium tabular-nums">{rfq.requiredDeliveryDate}</span>
                    </span>
                  </div>
                </div>

                {/* Line Items Preview */}
                <div className="mt-4 bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                    {t("supplier_rfq_feed.card.items")} ({rfq.lineItems.length})
                  </p>
                  <div className="space-y-1">
                    {rfq.lineItems.slice(0, 2).map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-foreground">{item.productName}</span>
                        <span className="text-muted-foreground tabular-nums">
                          {item.quantity} {item.unit}
                        </span>
                      </div>
                    ))}
                    {rfq.lineItems.length > 2 && (
                      <p className="text-xs text-muted-foreground">
                        +{rfq.lineItems.length - 2} {t("supplier_rfq_feed.card.more_items")}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-warning">
                        <Clock className="w-4 h-4" />
                        <span className="font-medium">{getTimeRemaining(rfq.closingDate)}</span>
                      </div>
                      <span className="text-muted-foreground">
                        {rfq.bidCount} {t("supplier_rfq_feed.card.bids")}
                      </span>
                      {rfq.allowPartialBids && (
                        <StatusBadge variant="neutral" size="sm">{t("supplier_rfq_feed.card.partial_ok")}</StatusBadge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="w-4 h-4 me-2" />
                    {t("supplier_rfq_feed.card.view_details")}
                  </Button>
                  <Button size="sm" className="flex-1" onClick={() => handleSubmitQuote(rfq)}>
                    <Send className="w-4 h-4 me-2" />
                    {t("supplier_rfq_feed.card.submit_quote")}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {!isLoading && !isError && filteredRFQs.length === 0 && (
          <div className="bg-card rounded-xl border border-border py-12">
            <EmptyState
              icon={Package}
              title={t("supplier_rfq_feed.empty.title")}
              description={t("supplier_rfq_feed.empty.desc")}
            />
          </div>
        )}
      </div>

      {/* Quote Submission Dialog */}
      <Dialog open={showQuoteDialog} onOpenChange={setShowQuoteDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("supplier_rfq_feed.dialog.submit_title")}</DialogTitle>
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
              onSubmit={() => setShowQuoteDialog(false)}
              onCancel={() => setShowQuoteDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
