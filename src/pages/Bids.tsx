import { useState } from "react";
import { Search, Filter, TrendingUp, Clock, CheckCircle, XCircle, Eye, MoreHorizontal, DollarSign, Award } from "lucide-react";
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

const mockBids: Bid[] = [
  {
    id: "BID-001",
    rfqId: "RFQ-2024-0162",
    rfqTitle: "Portland Cement Type I",
    supplier: "Saudi Ceramics",
    unitPrice: 45.0,
    totalPrice: 225000,
    deliveryDays: 7,
    quoteValidity: "48 hours",
    status: "pending",
    submittedAt: "2024-01-18 14:30",
    notes: "Price includes delivery to site",
  },
  {
    id: "BID-002",
    rfqId: "RFQ-2024-0162",
    rfqTitle: "Portland Cement Type I",
    supplier: "Ezz Steel Industries",
    unitPrice: 42.5,
    totalPrice: 212500,
    deliveryDays: 10,
    quoteValidity: "72 hours",
    status: "pending",
    submittedAt: "2024-01-18 10:15",
  },
  {
    id: "BID-003",
    rfqId: "RFQ-2024-0161",
    rfqTitle: "Structural Steel Beams",
    supplier: "Arabian Cement Co.",
    unitPrice: 850.0,
    totalPrice: 425000,
    deliveryDays: 14,
    quoteValidity: "7 days",
    status: "accepted",
    submittedAt: "2024-01-15 09:00",
  },
  {
    id: "BID-004",
    rfqId: "RFQ-2024-0160",
    rfqTitle: "Electrical Cables",
    supplier: "Gulf Steel Industries",
    unitPrice: 125.0,
    totalPrice: 156000,
    deliveryDays: 5,
    quoteValidity: "48 hours",
    status: "rejected",
    submittedAt: "2024-01-12 16:45",
    notes: "Brand is Ezz Steel, Grade A quality",
  },
  {
    id: "BID-005",
    rfqId: "RFQ-2024-0158",
    rfqTitle: "HVAC Units",
    supplier: "Al-Bawani Materials",
    unitPrice: 15000.0,
    totalPrice: 450000,
    deliveryDays: 21,
    quoteValidity: "5 days",
    status: "pending",
    submittedAt: "2024-01-19 11:20",
  },
];

const statusConfig = {
  pending: { color: "warning", label: "Pending Review", icon: Clock },
  accepted: { color: "success", label: "Accepted", icon: CheckCircle },
  rejected: { color: "danger", label: "Rejected", icon: XCircle },
  expired: { color: "neutral", label: "Expired", icon: Clock },
} as const;

export default function Bids() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const filteredBids = mockBids.filter((bid) => {
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
    toast({
      title: "Bid Accepted",
      description: `Order will be created with ${bid.supplier}`,
    });
  };

  const handleReject = () => {
    if (selectedBid && rejectionReason.trim()) {
      toast({
        title: "Bid Rejected",
        description: `${selectedBid.supplier} has been notified`,
      });
      setShowRejectDialog(false);
      setRejectionReason("");
      setSelectedBid(null);
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
                  <StatusIcon className="w-3 h-3" />
                  {statusConfig[bid.status].label}
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
                View Details
              </DropdownMenuItem>
              {bid.status === "pending" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleAccept(bid)} className="text-success">
                    <Award className="w-4 h-4 me-2" />
                    Accept Bid
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedBid(bid);
                      setShowRejectDialog(true);
                    }}
                    className="text-danger"
                  >
                    <XCircle className="w-4 h-4 me-2" />
                    Reject Bid
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground">Unit Price</p>
            <p className="font-medium tabular-nums">SAR {bid.unitPrice.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Price</p>
            <p className="font-semibold text-primary tabular-nums">
              SAR {bid.totalPrice.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Delivery</p>
            <p className="font-medium">{bid.deliveryDays} days</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Quote Valid</p>
            <p className="font-medium">{bid.quoteValidity}</p>
          </div>
        </div>

        {bid.notes && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Note:</span> {bid.notes}
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
              Reject
            </Button>
            <Button
              size="sm"
              className="flex-1 bg-success hover:bg-success/90 text-success-foreground"
              onClick={() => handleAccept(bid)}
            >
              <Award className="w-4 h-4 me-2" />
              Accept
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
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Bids</h1>
            <p className="text-muted-foreground mt-1">
              Review and manage supplier quotations
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge variant="warning">{pendingBids.length} Pending</StatusBadge>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by supplier, RFQ ID, or title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <Filter className="w-4 h-4 me-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Bids Tabs */}
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">
              Pending Review ({pendingBids.length})
            </TabsTrigger>
            <TabsTrigger value="history">
              History ({historyBids.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingBids.length === 0 ? (
              <div className="bg-card rounded-xl border border-border p-12 text-center">
                <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
                <p className="font-medium text-foreground">All caught up!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  No pending bids to review
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
            {historyBids.length === 0 ? (
              <div className="bg-card rounded-xl border border-border p-12 text-center">
                <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="font-medium text-foreground">No bid history</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Accepted and rejected bids will appear here
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
            <DialogTitle>Reject Bid</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this bid. This feedback helps improve supplier offerings.
            </DialogDescription>
          </DialogHeader>

          {selectedBid && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Supplier</span>
                <span className="font-medium">{selectedBid.supplier}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Price</span>
                <span className="font-semibold tabular-nums">
                  SAR {selectedBid.totalPrice.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Reason for Rejection *</Label>
            <Select onValueChange={(v) => setRejectionReason(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Price too high">Price too high</SelectItem>
                <SelectItem value="Delivery too late">Delivery too late</SelectItem>
                <SelectItem value="Quality concerns">Quality concerns</SelectItem>
                <SelectItem value="Missing specifications">Missing specifications</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Additional comments (optional)..."
              rows={3}
              className="mt-2"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason.trim()}
            >
              <XCircle className="w-4 h-4 me-2" />
              Reject Bid
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
