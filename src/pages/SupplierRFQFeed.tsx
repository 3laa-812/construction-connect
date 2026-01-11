import { useState } from "react";
import { Search, Filter, Clock, MapPin, Calendar, Package, Eye, Send, Building2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
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

// FR-C04: Supplier RFQ Feed
const mockRFQFeed: RFQFeedItem[] = [
  {
    id: "RFQ-2024-0170",
    title: "Portland Cement for KAFD Project",
    buyerCompany: "BuildPro Construction LLC",
    category: "Building Materials",
    lineItems: [
      { id: "item-1", productName: "Portland Cement Type I", quantity: 5000, unit: "Bags" },
      { id: "item-2", productName: "Portland Cement Type II", quantity: 2000, unit: "Bags" },
    ],
    deliveryLocation: "King Abdullah Financial District, Riyadh",
    requiredDeliveryDate: "2024-02-01",
    paymentTerms: "Credit 30 Days",
    allowPartialBids: true,
    closingDate: "2024-01-22 18:00",
    bidCount: 3,
    isNew: true,
    priority: "urgent",
  },
  {
    id: "RFQ-2024-0169",
    title: "Structural Steel for Metro Station",
    buyerCompany: "Al-Rashid Engineering",
    category: "Steel & Metal",
    lineItems: [
      { id: "item-1", productName: "H-Beam Steel 200x200", quantity: 50, unit: "Tons" },
      { id: "item-2", productName: "Steel Plates 10mm", quantity: 25, unit: "Tons" },
      { id: "item-3", productName: "Steel Rebars 16mm", quantity: 100, unit: "Tons" },
    ],
    deliveryLocation: "Riyadh Metro Line 3, Station 15",
    requiredDeliveryDate: "2024-02-15",
    paymentTerms: "Cash",
    allowPartialBids: true,
    closingDate: "2024-01-25 12:00",
    bidCount: 5,
    isNew: false,
    priority: "high",
  },
  {
    id: "RFQ-2024-0168",
    title: "Electrical Cables and Conduits",
    buyerCompany: "Saudi Contracting Co.",
    category: "Electrical",
    lineItems: [
      { id: "item-1", productName: "Power Cable 4x25mm", quantity: 5000, unit: "Meters" },
      { id: "item-2", productName: "PVC Conduit 25mm", quantity: 2000, unit: "Meters" },
    ],
    deliveryLocation: "Jeddah Industrial Area",
    requiredDeliveryDate: "2024-02-10",
    paymentTerms: "Credit 60 Days",
    allowPartialBids: false,
    closingDate: "2024-01-28 18:00",
    bidCount: 2,
    isNew: true,
    priority: "normal",
  },
];

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

  const categories = [...new Set(mockRFQFeed.map((rfq) => rfq.category))];

  const filteredRFQs = mockRFQFeed.filter((rfq) => {
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
              {mockRFQFeed.filter((r) => r.isNew).length} {t("supplier_rfq_feed.filters.new")}
            </StatusBadge>
            <StatusBadge variant="warning">
              {mockRFQFeed.filter((r) => r.priority === "urgent").length} {t("supplier_rfq_feed.filters.urgent")}
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
          {filteredRFQs.map((rfq, index) => (
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
          ))}
        </div>

        {filteredRFQs.length === 0 && (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="font-medium text-foreground">{t("supplier_rfq_feed.empty.title")}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {t("supplier_rfq_feed.empty.desc")}
            </p>
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
