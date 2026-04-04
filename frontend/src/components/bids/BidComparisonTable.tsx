import { useState } from "react";
import { Check, Star, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ApiBid = {
  id: string;
  supplier?: { name?: string };
  items?: { unit_price?: unknown }[];
  total_price?: unknown;
  valid_until?: string | null;
  status?: string;
};

function mapBidForRow(b: ApiBid, allBids: ApiBid[]) {
  const unitPrice = Number(b.items?.[0]?.unit_price ?? 0);
  const total = Number(b.total_price ?? 0);
  const unitPrices = allBids.map((x) => Number(x.items?.[0]?.unit_price ?? Infinity));
  const totals = allBids.map((x) => Number(x.total_price ?? Infinity));
  const unitPriceBest = unitPrice > 0 && unitPrice === Math.min(...unitPrices);
  const totalCostBest = total > 0 && total === Math.min(...totals);
  return {
    id: b.id,
    supplier: b.supplier?.name ?? "Supplier",
    unitPrice,
    total,
    unitPriceBest,
    totalCostBest,
    validUntil: b.valid_until
      ? new Date(b.valid_until).toLocaleDateString()
      : "—",
    validWarning: b.valid_until
      ? new Date(b.valid_until).getTime() - Date.now() < 2 * 86400000
      : false,
    status: b.status ?? "PENDING",
  };
}

export function BidComparisonTable({
  rfqId,
  rfqStatus,
}: {
  rfqId: string;
  rfqStatus: string;
}) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [confirmBidId, setConfirmBidId] = useState<string | null>(null);

  const { data: bids = [], isLoading } = useQuery({
    queryKey: ["rfqs", rfqId, "bids"],
    queryFn: async () => {
      const res = await api.get<ApiBid[]>(`/rfqs/${rfqId}/bids`);
      return res.data;
    },
    enabled: !!rfqId,
  });

  const rows = bids.map((b) => mapBidForRow(b, bids));
  const BEST_COLOR = "text-amber";

  const awardMutation = useMutation({
    mutationFn: ({ bidId }: { bidId: string }) =>
      api.patch(`/rfqs/${rfqId}/award/${bidId}`).then((r) => r.data),
    onSuccess: (po: { id: string }) => {
      toast({
        title: "Purchase order created",
        description: `PO #${po.id.slice(-6).toUpperCase()}`,
      });
      queryClient.invalidateQueries({ queryKey: ["rfqs"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      setConfirmBidId(null);
      navigate(`/orders/${po.id}`);
    },
    onError: (e: unknown) => {
      const msg =
        e && typeof e === "object" && "response" in e
          ? (e as { response?: { data?: { message?: string } } }).response?.data
              ?.message
          : undefined;
      toast({
        variant: "destructive",
        title: "Could not award bid",
        description: msg ?? String(e),
      });
    },
  });

  const confirmAward = () => {
    if (confirmBidId) {
      awardMutation.mutate({ bidId: confirmBidId });
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-text-3 text-[13px]">
        Loading bids...
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="p-8 text-center text-text-3 text-[13px]">
        No bids on this RFQ yet.
      </div>
    );
  }

  const canAward = rfqStatus === "OPEN";

  return (
    <div className="overflow-x-auto w-full font-body rounded-md border border-border">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr>
            <th className="p-4 border-b border-border bg-surface-2 min-w-[150px]" />
            {rows.map((bid) => (
              <th
                key={bid.id}
                className="p-4 border-b border-l border-border font-medium text-[14px] text-text-1 bg-surface-2 min-w-[150px]"
              >
                <div className="flex items-center gap-2">
                  <span>{bid.supplier}</span>
                  {bid.totalCostBest && (
                    <Check className="w-4 h-4 text-success" />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-[13px] text-text-2">
          <tr>
            <td className="p-4 border-b border-border font-medium text-text-1 bg-surface">
              Unit price
            </td>
            {rows.map((bid) => (
              <td
                key={`up_${bid.id}`}
                className="p-4 border-b border-l border-border bg-surface"
              >
                <div className="flex items-center gap-1.5">
                  <span className="tabular-nums">
                    SAR {bid.unitPrice.toLocaleString()}
                  </span>
                  {bid.unitPriceBest && (
                    <Star
                      className={`w-3.5 h-3.5 ${BEST_COLOR} fill-[var(--amber)]`}
                    />
                  )}
                </div>
              </td>
            ))}
          </tr>
          <tr>
            <td className="p-4 border-b border-border font-medium text-text-1 bg-surface">
              Valid until
            </td>
            {rows.map((bid) => (
              <td
                key={`vu_${bid.id}`}
                className="p-4 border-b border-l border-border bg-surface"
              >
                <div className="flex items-center gap-1.5">
                  <span>{bid.validUntil}</span>
                  {bid.validWarning && (
                    <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                  )}
                </div>
              </td>
            ))}
          </tr>
          <tr className="bg-surface-2/50 font-medium">
            <td className="p-4 border-b border-border text-text-1">Total</td>
            {rows.map((bid) => (
              <td
                key={`tc_${bid.id}`}
                className={`p-4 border-b border-l border-border transition-colors ${
                  bid.totalCostBest
                    ? "border-l-[3px] border-l-amber bg-[rgba(212,146,10,0.06)] text-text-1"
                    : ""
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="tabular-nums">
                    SAR {bid.total.toLocaleString()}
                  </span>
                  {bid.totalCostBest && (
                    <Star
                      className={`w-3.5 h-3.5 ${BEST_COLOR} fill-[var(--amber)]`}
                    />
                  )}
                </div>
              </td>
            ))}
          </tr>
          <tr>
            <td className="p-4 border-border bg-surface" />
            {rows.map((bid) => (
              <td
                key={`btn_${bid.id}`}
                className="p-4 border-l border-border bg-surface"
              >
                <Button
                  className="w-full text-[12px] h-8"
                  variant={bid.totalCostBest ? "default" : "outline"}
                  disabled={!canAward || awardMutation.isPending}
                  aria-label={t("bids.comparison.actions.award")}
                  onClick={() => setConfirmBidId(bid.id)}
                >
                  {t("bids.comparison.actions.award")}
                </Button>
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      <AlertDialog
        open={!!confirmBidId}
        onOpenChange={(o) => !o && setConfirmBidId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("bids.comparison.dialog.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("bids.comparison.dialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t("bids.comparison.dialog.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              aria-label={t("bids.comparison.dialog.confirm")}
              onClick={(e) => {
                e.preventDefault();
                confirmAward();
              }}
            >
              {t("bids.comparison.dialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
