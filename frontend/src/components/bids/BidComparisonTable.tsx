import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Award, ChevronDown, ChevronUp, Star, Truck, DollarSign, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

interface AdaptedBid {
  id: string;
  supplierName: string;
  supplierRating: number;
  unitPrice: number;
  totalPrice: number;
  deliveryDate: string;
  deliveryDays: number;
  score: number;
  notes?: string;
  isLowestPrice?: boolean;
  isEarliestDelivery?: boolean;
}

type ApiBid = {
  id: string;
  total_price?: number;
  valid_until?: string | null;
  created_at?: string;
  supplier?: { name?: string };
  items?: Array<{ unit_price?: number | null }>;
};

type ApiRFQ = {
  id: string;
  deadline?: string | null;
  items?: Array<{ product_name?: string }>;
  bids?: ApiBid[];
};

type SortKey = "totalPrice" | "deliveryDays" | "score" | "supplierRating";

export function BidComparisonTable() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useQuery<ApiRFQ[]>({
    queryKey: ["rfqs", "bid-comparison"],
    queryFn: async () => (await api.get("/rfqs")).data,
  });

  const awardMutation = useMutation({
    mutationFn: async (payload: {
      rfqId: string;
      bidId: string;
      supplierName: string;
    }) => {
      const res = await api.patch(
        `/rfqs/${payload.rfqId}/award/${payload.bidId}`,
      );
      return {
        po: res.data as { id: string },
        supplierName: payload.supplierName,
      };
    },
    onSuccess: ({ po, supplierName }) => {
      toast({
        title: t("bids.comparison.toast.awarded_title"),
        description: t("bids.comparison.toast.awarded_desc", {
          supplier: supplierName,
        }),
      });
      queryClient.invalidateQueries({ queryKey: ["rfqs"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      setShowAwardDialog(false);
      setSelectedBid(null);
      navigate(`/orders?created=${po.id}`);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Award failed";
      toast({
        variant: "destructive",
        title: t("common.error") || "Error",
        description: String(msg),
      });
    },
  });

  const [selectedBid, setSelectedBid] = useState<AdaptedBid | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showAwardDialog, setShowAwardDialog] = useState(false);

  const { rfqTitle, bids, comparisonRfqId } = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        rfqTitle: "",
        bids: [] as AdaptedBid[],
        comparisonRfqId: "" as string,
      };
    }
    const rfqWithBids = data.find((r) => (r.bids?.length || 0) > 0) || data[0];
    const title = rfqWithBids.items?.[0]?.product_name || rfqWithBids.id;

    const adapted: AdaptedBid[] = (rfqWithBids.bids || []).map((bid) => {
      const unitPrice = bid.items?.[0]?.unit_price ? Number(bid.items[0].unit_price) : 0;
      const totalPrice = Number(bid.total_price || unitPrice);
      const now = Date.now();
      const deliveryDays = bid.valid_until
        ? Math.max(1, Math.round((new Date(bid.valid_until).getTime() - now) / (1000 * 60 * 60 * 24)))
        : 7;
      const deliveryDate = bid.valid_until
        ? new Date(bid.valid_until).toISOString().split("T")[0]
        : new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      const priceScore = totalPrice > 0 ? Math.min(100, (Math.min(...(rfqWithBids.bids || []).map((b) => Number(b.total_price || unitPrice))) / totalPrice) * 100) : 0;
      const deliveryScore = Math.max(0, 100 - deliveryDays * 3);
      const score = Math.round((priceScore * 0.6 + deliveryScore * 0.4));

      return {
        id: bid.id,
        supplierName: bid.supplier?.name || "Supplier",
        supplierRating: 4.5,
        unitPrice,
        totalPrice,
        deliveryDate,
        deliveryDays,
        score,
        notes: undefined,
      };
    });

    if (adapted.length > 0) {
      const minPrice = Math.min(...adapted.map((b) => b.totalPrice));
      const minDelivery = Math.min(...adapted.map((b) => b.deliveryDays));
      adapted.forEach((b) => {
        b.isLowestPrice = b.totalPrice === minPrice;
        b.isEarliestDelivery = b.deliveryDays === minDelivery;
      });
    }

    return {
      rfqTitle: title,
      bids: adapted,
      comparisonRfqId: rfqWithBids.id,
    };
  }, [data]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder(key === "totalPrice" || key === "deliveryDays" ? "asc" : "desc");
    }
  };

  const sortedBids = [...bids].sort((a, b) => {
    const multiplier = sortOrder === "asc" ? 1 : -1;
    return (a[sortKey] - b[sortKey]) * multiplier;
  });

  const handleAward = (bid: AdaptedBid) => {
    setSelectedBid(bid);
    setShowAwardDialog(true);
  };

  const confirmAward = () => {
    if (selectedBid && comparisonRfqId) {
      awardMutation.mutate({
        rfqId: comparisonRfqId,
        bidId: selectedBid.id,
        supplierName: selectedBid.supplierName,
      });
    }
  };

  const SortHeader = ({ label, sortKeyName }: { label: string; sortKeyName: SortKey }) => (
    <button
      onClick={() => handleSort(sortKeyName)}
      className="flex items-center gap-1 font-semibold hover:text-primary transition-colors"
    >
      {label}
      <span className="flex flex-col">
        <ChevronUp className={cn(
          "h-3 w-3 -mb-1",
          sortKey === sortKeyName && sortOrder === "asc" ? "text-primary" : "text-muted-foreground/40"
        )} />
        <ChevronDown className={cn(
          "h-3 w-3",
          sortKey === sortKeyName && sortOrder === "desc" ? "text-primary" : "text-muted-foreground/40"
        )} />
      </span>
    </button>
  );

  return (
    <>
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">{t("bids.comparison.title")}</h3>
            <p className="text-sm text-muted-foreground">
              {isLoading || isError || !rfqTitle ? t("bids.comparison.empty_rfq") : rfqTitle}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge variant="primary">{bids.length} {t("bids.comparison.total_bids")}</StatusBadge>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full data-grid">
            <thead>
              <tr>
                <th className="min-w-[200px] text-start">{t("bids.comparison.table.supplier")}</th>
                <th className="min-w-[120px]">
                  <SortHeader label={t("bids.comparison.table.unit_price")} sortKeyName="totalPrice" />
                </th>
                <th className="min-w-[140px]">
                  <SortHeader label={t("bids.comparison.table.total_price")} sortKeyName="totalPrice" />
                </th>
                <th className="min-w-[130px]">
                  <SortHeader label={t("bids.comparison.table.delivery")} sortKeyName="deliveryDays" />
                </th>
                <th className="min-w-[100px]">
                  <SortHeader label={t("bids.comparison.table.score")} sortKeyName="score" />
                </th>
                <th className="min-w-[120px] text-center">{t("bids.comparison.table.action")}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Loading bids...
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-danger">
                    Failed to load bids
                  </td>
                </tr>
              ) : sortedBids.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    {t("bids.comparison.no_bids")}
                  </td>
                </tr>
              ) : (
              sortedBids.map((bid, index) => (
                <tr
                  key={bid.id}
                  className={cn(
                    "hover:bg-muted/50 transition-colors animate-fade-in",
                    index === 0 && "bg-success/5"
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <span className="text-primary font-semibold text-sm">
                          {bid.supplierName.split(" ").map(w => w[0]).join("").slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{bid.supplierName}</p>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-warning fill-warning" />
                          <span className="text-xs text-muted-foreground">{bid.supplierRating}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="tabular-nums">
                    SAR {bid.unitPrice.toFixed(2)}
                  </td>
                  <td className={cn(
                    "tabular-nums font-medium",
                    bid.isLowestPrice && "highlight-best"
                  )}>
                    <div className="flex items-center gap-2">
                      <span>SAR {bid.totalPrice.toLocaleString()}</span>
                      {bid.isLowestPrice && (
                        <StatusBadge variant="success" size="sm">
                          <DollarSign className="w-3 h-3" />
                          {t("bids.comparison.badges.lowest")}
                        </StatusBadge>
                      )}
                    </div>
                  </td>
                  <td className={cn(
                    "tabular-nums",
                    bid.isEarliestDelivery && "highlight-best"
                  )}>
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="font-medium">{bid.deliveryDays} {t("bids.comparison.badges.days")}</p>
                        <p className="text-xs text-muted-foreground">{bid.deliveryDate}</p>
                      </div>
                      {bid.isEarliestDelivery && (
                        <StatusBadge variant="success" size="sm">
                          <Truck className="w-3 h-3" />
                          {t("bids.comparison.badges.fastest")}
                        </StatusBadge>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            bid.score >= 90 ? "bg-success" : bid.score >= 80 ? "bg-warning" : "bg-danger"
                          )}
                          style={{ width: `${bid.score}%` }}
                        />
                      </div>
                      <span className="font-semibold tabular-nums">{bid.score}</span>
                    </div>
                  </td>
                  <td className="text-center">
                    <Button
                      size="sm"
                      onClick={() => handleAward(bid)}
                      className="bg-accent hover:bg-accent/90 text-accent-foreground"
                    >
                      <Award className="w-4 h-4 me-1" />
                      {t("bids.comparison.actions.award")}
                    </Button>
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Award Confirmation Dialog */}
      <Dialog open={showAwardDialog} onOpenChange={setShowAwardDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("bids.comparison.dialog.title")}</DialogTitle>
            <DialogDescription>
              {t("bids.comparison.dialog.description")}
            </DialogDescription>
          </DialogHeader>

          {selectedBid && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("bids.comparison.dialog.supplier")}</span>
                <span className="font-medium">{selectedBid.supplierName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("bids.comparison.dialog.total_amount")}</span>
                <span className="font-semibold text-lg tabular-nums">
                  SAR {selectedBid.totalPrice.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("bids.comparison.dialog.delivery")}</span>
                <span className="font-medium">{selectedBid.deliveryDays} {t("bids.comparison.badges.days")}</span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAwardDialog(false)}>
              {t("bids.comparison.dialog.cancel")}
            </Button>
            <Button
              onClick={confirmAward}
              disabled={awardMutation.isPending || !comparisonRfqId}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              <Award className="w-4 h-4 me-2" />
              {awardMutation.isPending
                ? t("common.loading") || "…"
                : t("bids.comparison.dialog.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
