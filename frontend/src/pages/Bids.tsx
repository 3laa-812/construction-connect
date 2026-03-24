import { useMemo, useState } from "react";
import { Search, Filter, TrendingUp, Clock, CheckCircle, XCircle, Eye, MoreHorizontal, DollarSign, Award } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { api } from "@/lib/api";

type ApiBid = {
  id: string;
  total_price?: number;
  valid_until?: string;
  status?: string;
  created_at?: string;
  supplier?: { name?: string };
  items?: Array<{ unit_price?: number; note?: string }>;
};

type ApiRFQ = {
  id: string;
  items?: Array<{ product_name?: string; quantity?: number }>;
  bids?: ApiBid[];
};

interface Bid {
  id: string;
  rfqId: string;
  rfqTitle: string;
  supplier: string;
  unitPrice: number;
  totalPrice: number;
  deliveryDays: number;
  quoteValidity: string;
  status: "pending" | "accepted" | "rejected" | "expired";
  submittedAt: string;
  notes?: string;
}

const statusConfig = {
  pending: { color: "warning", labelKey: "bids.status.pending", icon: Clock },
  accepted: { color: "success", labelKey: "bids.status.accepted", icon: CheckCircle },
  rejected: { color: "danger", labelKey: "bids.status.rejected", icon: XCircle },
  expired: { color: "neutral", labelKey: "bids.status.expired", icon: Clock },
} as const;

export default function Bids() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data, isLoading, isError } = useQuery<ApiRFQ[]>({
    queryKey: ["rfqs", "bids"],
    queryFn: async () => {
      const response = await api.get("/rfqs");
      return response.data;
    },
  });

  const awardMutation = useMutation({
    mutationFn: (payload: {
      rfqId: string;
      bidId: string;
      supplierName: string;
    }) =>
      api.patch(`/rfqs/${payload.rfqId}/award/${payload.bidId}`),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["rfqs"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast({
        title: t("bids.toast.accepted_title"),
        description: t("bids.toast.accepted_desc", {
          supplier: variables.supplierName,
        }),
      });
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

  const rejectMutation = useMutation({
    mutationFn: (payload: {
      rfqId: string;
      bidId: string;
      rejection_reason: string;
      supplierName: string;
    }) =>
      api.patch(
        `/rfqs/${payload.rfqId}/bids/${payload.bidId}/reject`,
        { rejection_reason: payload.rejection_reason },
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["rfqs"] });
      toast({
        title: t("bids.toast.rejected_title"),
        description: t("bids.toast.rejected_desc", {
          supplier: variables.supplierName,
        }),
      });
      setShowRejectDialog(false);
      setRejectionReason("");
      setSelectedBid(null);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Reject failed";
      toast({
        variant: "destructive",
        title: t("common.error") || "Error",
        description: String(msg),
      });
    },
  });

  const bids: Bid[] = useMemo(() => {
    if (!data) return [];
    const dayMs = 1000 * 60 * 60 * 24;
    return data.flatMap((rfq) => {
      const rfqTitle = rfq.items?.[0]?.product_name || rfq.id;
      return (rfq.bids || []).map((bid) => {
        const status = (bid.status || "pending").toLowerCase() as Bid["status"];
        const validUntil = bid.valid_until ? new Date(bid.valid_until) : null;
        const deliveryDays = validUntil ? Math.max(0, Math.round((validUntil.getTime() - Date.now()) / dayMs)) : 0;
        const unitPrice = bid.items?.[0]?.unit_price ? Number(bid.items[0].unit_price) : 0;

        return {
          id: bid.id,
          rfqId: rfq.id,
          rfqTitle,
          supplier: bid.supplier?.name || "Unknown supplier",
          unitPrice,
          totalPrice: Number(bid.total_price || 0),
          deliveryDays,
          quoteValidity: validUntil ? validUntil.toLocaleDateString() : t("bids.quote_valid") || "N/A",
          status: statusConfig[status] ? status : "pending",
          submittedAt: bid.created_at
            ? new Date(bid.created_at).toLocaleString()
            : "",
          notes: bid.items?.[0]?.note,
        };
      });
    });
  }, [data, t]);

  const filteredBids = bids.filter((bid) => {
    const matchesSearch =
      bid.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bid.rfqId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bid.rfqTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || bid.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingBids = filteredBids.filter((b) => b.status === "pending");
  const historyBids = filteredBids.filter((b) => b.status !== "pending");

  const handleAccept = (bid: Bid) => {
    awardMutation.mutate({
      rfqId: bid.rfqId,
      bidId: bid.id,
      supplierName: bid.supplier,
    });
  };

  const handleReject = () => {
    if (selectedBid && rejectionReason.trim()) {
      rejectMutation.mutate({
        rfqId: selectedBid.rfqId,
        bidId: selectedBid.id,
        rejection_reason: rejectionReason.trim(),
        supplierName: selectedBid.supplier,
      });
    }
  };

  const BidCard = ({ bid }: { bid: Bid }) => {
    const StatusIcon = statusConfig[bid.status].icon;
    return (
      <div className="bg-card rounded-xl border border-border p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-foreground">{bid.supplier}</p>
                  <StatusBadge variant={statusConfig[bid.status].color as any} size="sm">
                  {statusConfig[bid.status].icon && <StatusIcon className="w-3 h-3" />}
                  {t(statusConfig[bid.status].labelKey)}
                </StatusBadge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {bid.rfqId} · {bid.rfqTitle}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Eye className="w-4 h-4 me-2" />
                {t("bids.view_details")}
              </DropdownMenuItem>
              {bid.status === "pending" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleAccept(bid)} className="text-success">
                    <Award className="w-4 h-4 me-2" />
                    {t("bids.accept_bid")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedBid(bid);
                      setShowRejectDialog(true);
                    }}
                    className="text-danger"
                  >
                    <XCircle className="w-4 h-4 me-2" />
                    {t("bids.reject_bid")}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground">{t("bids.unit_price")}</p>
            <p className="font-medium tabular-nums">SAR {bid.unitPrice.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("bids.total_price")}</p>
            <p className="font-semibold text-primary tabular-nums">
              SAR {bid.totalPrice.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("bids.delivery")}</p>
            <p className="font-medium">{bid.deliveryDays} {t("bids.days")}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("bids.quote_valid")}</p>
            <p className="font-medium">{bid.quoteValidity}</p>
          </div>
        </div>

        {bid.notes && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">{t("bids.note")}:</span> {bid.notes}
            </p>
          </div>
        )}

        {bid.status === "pending" && (
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                setSelectedBid(bid);
                setShowRejectDialog(true);
              }}
            >
              <XCircle className="w-4 h-4 me-2" />
              {t("common.reject")}
            </Button>
            <Button
              size="sm"
              className="flex-1 bg-success hover:bg-success/90 text-success-foreground"
              onClick={() => handleAccept(bid)}
              disabled={awardMutation.isPending}
            >
              <Award className="w-4 h-4 me-2" />
              {t("bids.award")}
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">{t("bids.title")}</h1>
            <p className="text-muted-foreground mt-1">
              {t("bids.subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge variant="warning">{t("bids.pending_count", { count: pendingBids.length })}</StatusBadge>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("bids.search_placeholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <Filter className="w-4 h-4 me-2" />
                <SelectValue placeholder={t("bids.filter.status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("bids.filter.all_status")}</SelectItem>
                <SelectItem value="pending">{t("bids.filter.pending")}</SelectItem>
                <SelectItem value="accepted">{t("bids.filter.accepted")}</SelectItem>
                <SelectItem value="rejected">{t("bids.filter.rejected")}</SelectItem>
                <SelectItem value="expired">{t("bids.filter.expired")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Bids Tabs */}
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">
              {t("bids.tabs.pending_review")} ({pendingBids.length})
            </TabsTrigger>
            <TabsTrigger value="history">
              {t("bids.tabs.history")} ({historyBids.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {isLoading ? (
              <div className="bg-card rounded-xl border border-border p-12 text-center text-muted-foreground">
                Loading bids...
              </div>
            ) : isError ? (
              <div className="bg-card rounded-xl border border-border p-12 text-center text-danger">
                Failed to load bids
              </div>
            ) : pendingBids.length === 0 ? (
              <div className="bg-card rounded-xl border border-border p-12 text-center">
                <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
                <p className="font-medium text-foreground">{t("bids.empty.caught_up")}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("bids.empty.no_pending")}
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {pendingBids.map((bid) => (
                  <BidCard key={bid.id} bid={bid} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {isLoading ? (
              <div className="bg-card rounded-xl border border-border p-12 text-center text-muted-foreground">
                Loading bids...
              </div>
            ) : isError ? (
              <div className="bg-card rounded-xl border border-border p-12 text-center text-danger">
                Failed to load bids
              </div>
            ) : historyBids.length === 0 ? (
              <div className="bg-card rounded-xl border border-border p-12 text-center">
                <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="font-medium text-foreground">{t("bids.empty.no_history")}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("bids.empty.history_desc")}
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {historyBids.map((bid) => (
                  <BidCard key={bid.id} bid={bid} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Rejection Dialog - FR-C09 */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("bids.dialog.reject_title")}</DialogTitle>
            <DialogDescription>
              {t("bids.dialog.reject_desc")}
            </DialogDescription>
          </DialogHeader>

          {selectedBid && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("bids.supplier")}</span>
                <span className="font-medium">{selectedBid.supplier}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("bids.total_price")}</span>
                <span className="font-semibold tabular-nums">
                  SAR {selectedBid.totalPrice.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>{t("bids.dialog.reason_label")}</Label>
            <Select onValueChange={(v) => setRejectionReason(v)}>
              <SelectTrigger>
                <SelectValue placeholder={t("bids.dialog.select_reason")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Price too high">{t("bids.dialog.reasons.price_high")}</SelectItem>
                <SelectItem value="Delivery too late">{t("bids.dialog.reasons.delivery_late")}</SelectItem>
                <SelectItem value="Quality concerns">{t("bids.dialog.reasons.quality")}</SelectItem>
                <SelectItem value="Missing specifications">{t("bids.dialog.reasons.missing_specs")}</SelectItem>
                <SelectItem value="Other">{t("bids.dialog.reasons.other")}</SelectItem>
              </SelectContent>
            </Select>
            <Textarea
              placeholder={t("bids.dialog.comments_placeholder")}
              rows={3}
              className="mt-2"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              {t("bids.dialog.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={
                !rejectionReason.trim() || rejectMutation.isPending
              }
            >
              <XCircle className="w-4 h-4 me-2" />
              {t("bids.dialog.confirm_reject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
