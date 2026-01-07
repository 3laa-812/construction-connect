import { useState } from "react";
import { Award, ChevronDown, ChevronUp, Star, Truck, DollarSign, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
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

interface Bid {
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

const mockBids: Bid[] = [
  {
    id: "bid-001",
    supplierName: "Saudi Ceramics",
    supplierRating: 4.8,
    unitPrice: 45.00,
    totalPrice: 225000,
    deliveryDate: "2024-02-15",
    deliveryDays: 7,
    score: 92,
    isLowestPrice: false,
    isEarliestDelivery: true,
  },
  {
    id: "bid-002",
    supplierName: "Ezz Steel Industries",
    supplierRating: 4.5,
    unitPrice: 42.50,
    totalPrice: 212500,
    deliveryDate: "2024-02-18",
    deliveryDays: 10,
    score: 88,
    isLowestPrice: true,
    isEarliestDelivery: false,
  },
  {
    id: "bid-003",
    supplierName: "Arabian Cement Co.",
    supplierRating: 4.2,
    unitPrice: 44.00,
    totalPrice: 220000,
    deliveryDate: "2024-02-20",
    deliveryDays: 12,
    score: 85,
    notes: "Bulk discount available for orders > 10,000 units",
  },
  {
    id: "bid-004",
    supplierName: "Al-Bawani Materials",
    supplierRating: 4.6,
    unitPrice: 46.50,
    totalPrice: 232500,
    deliveryDate: "2024-02-17",
    deliveryDays: 9,
    score: 90,
  },
];

type SortKey = "totalPrice" | "deliveryDays" | "score" | "supplierRating";

export function BidComparisonTable() {
  const [bids, setBids] = useState(mockBids);
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);
  const [showAwardDialog, setShowAwardDialog] = useState(false);

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

  const handleAward = (bid: Bid) => {
    setSelectedBid(bid);
    setShowAwardDialog(true);
  };

  const confirmAward = () => {
    if (selectedBid) {
      toast({
        title: "Contract Awarded",
        description: `Order has been placed with ${selectedBid.supplierName}`,
      });
      setShowAwardDialog(false);
      setSelectedBid(null);
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
            <h3 className="font-semibold text-foreground">Bid Comparison</h3>
            <p className="text-sm text-muted-foreground">RFQ-2024-0162 · Portland Cement Type I</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge variant="primary">{bids.length} Bids</StatusBadge>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full data-grid">
            <thead>
              <tr>
                <th className="min-w-[200px]">Supplier</th>
                <th className="min-w-[120px]">
                  <SortHeader label="Unit Price" sortKeyName="totalPrice" />
                </th>
                <th className="min-w-[140px]">
                  <SortHeader label="Total Price" sortKeyName="totalPrice" />
                </th>
                <th className="min-w-[130px]">
                  <SortHeader label="Delivery" sortKeyName="deliveryDays" />
                </th>
                <th className="min-w-[100px]">
                  <SortHeader label="Score" sortKeyName="score" />
                </th>
                <th className="min-w-[120px] text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedBids.map((bid, index) => (
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
                          Lowest
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
                        <p className="font-medium">{bid.deliveryDays} days</p>
                        <p className="text-xs text-muted-foreground">{bid.deliveryDate}</p>
                      </div>
                      {bid.isEarliestDelivery && (
                        <StatusBadge variant="success" size="sm">
                          <Truck className="w-3 h-3" />
                          Fastest
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
                      Award
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Award Confirmation Dialog */}
      <Dialog open={showAwardDialog} onOpenChange={setShowAwardDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Award Contract</DialogTitle>
            <DialogDescription>
              You are about to award this contract. This action will create a purchase order.
            </DialogDescription>
          </DialogHeader>

          {selectedBid && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Supplier</span>
                <span className="font-medium">{selectedBid.supplierName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Amount</span>
                <span className="font-semibold text-lg tabular-nums">
                  SAR {selectedBid.totalPrice.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Delivery</span>
                <span className="font-medium">{selectedBid.deliveryDays} days</span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAwardDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmAward}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              <Award className="w-4 h-4 me-2" />
              Confirm Award
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
