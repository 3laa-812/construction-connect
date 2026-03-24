import { useMemo, useState } from "react";
import {
  Search,
  Filter,
  ShoppingCart,
  Package,
  Truck,
  MapPin,
  CheckCircle,
  Eye,
  MoreHorizontal,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GoodsReceivedNote } from "@/components/orders/GoodsReceivedNote";
import { useLanguage } from "@/contexts/LanguageContext";
import { api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";


const statusConfig = {
  confirmed: { color: "primary", labelKey: "orders.status.confirmed", icon: CheckCircle },
  processing: { color: "warning", labelKey: "orders.status.processing", icon: Package },
  out_for_delivery: { color: "accent", labelKey: "orders.status.out_for_delivery", icon: Truck },
  delivered: { color: "success", labelKey: "orders.status.delivered", icon: MapPin },
  completed: { color: "success", labelKey: "orders.status.completed", icon: CheckCircle },
  cancelled: { color: "danger", labelKey: "orders.status.cancelled", icon: MapPin },
  CONFIRMED: { color: "primary", labelKey: "orders.status.confirmed", icon: CheckCircle },
  PROCESSING: { color: "warning", labelKey: "orders.status.processing", icon: Package },
  OUT_FOR_DELIVERY: { color: "accent", labelKey: "orders.status.out_for_delivery", icon: Truck },
  DELIVERED: { color: "success", labelKey: "orders.status.delivered", icon: MapPin },
  COMPLETED: { color: "success", labelKey: "orders.status.completed", icon: CheckCircle },
  CANCELLED: { color: "danger", labelKey: "orders.status.cancelled", icon: MapPin },
} as const;

const paymentConfig = {
  pending: { color: "warning", labelKey: "orders.payment_status.pending" },
  paid: { color: "success", labelKey: "orders.payment_status.paid" },
  overdue: { color: "danger", labelKey: "orders.payment_status.overdue" },
} as const;

type ApiPurchaseOrder = {
  id: string;
  status?: string;
  total_amount?: number;
  created_at?: string;
  supplier?: { name?: string };
  project?: { name?: string };
  items?: Array<{ id: string; item_description?: string; ordered_qty?: number }>;
};

type AdaptedOrder = {
  id: string;
  fullId: string;
  supplier: string;
  project: string;
  items: string;
  totalAmount: number;
  status: keyof typeof statusConfig;
  orderDate: string;
  paymentStatus: "pending" | "paid" | "overdue";
  lineItems: Array<{ id: string; productName: string; quantity: number; unit: string }>;
};

const OrderRow = ({ order, onSelect }: { order: AdaptedOrder; onSelect: (o: AdaptedOrder) => void }) => {
    const { t } = useLanguage();
    const StatusIcon = (statusConfig[order.status] || statusConfig["confirmed"]).icon;
    const statusVariant = (statusConfig[order.status] || statusConfig["confirmed"]).color;
    const statusLabel = (statusConfig[order.status] || statusConfig["confirmed"]).labelKey;

    return (
        <tr className="hover:bg-muted/50 transition-colors animate-fade-in">
        <td>
            <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center shrink-0">
                <ShoppingCart className="w-5 h-5 text-accent" />
            </div>
            <div>
                <p className="font-medium text-foreground">{order.id}</p>
                <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                {order.items}
                </p>
            </div>
            </div>
        </td>
        <td>
            <p className="font-medium">{order.supplier}</p>
        </td>
        <td>
            <p className="text-sm truncate max-w-[160px]">{order.project}</p>
        </td>
        <td className="tabular-nums font-semibold">
            SAR {order.totalAmount.toLocaleString()}
        </td>
        <td>
            <StatusBadge variant={statusVariant as any} size="sm">
            <StatusIcon className="w-3 h-3" />
            {t(statusLabel)}
            </StatusBadge>
        </td>
        <td>
            <StatusBadge variant="warning" size="sm">
            Pending
            </StatusBadge>
        </td>
        <td className="text-center">
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                <MoreHorizontal className="w-4 h-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onSelect(order)}>
                <Eye className="w-4 h-4 me-2" />
                {t("orders.view_details")}
                </DropdownMenuItem>
                <DropdownMenuItem>
                <Truck className="w-4 h-4 me-2" />
                {t("orders.track")}
                </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
        </td>
        </tr>
    );
}

function Orders() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<AdaptedOrder | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showGRNDialog, setShowGRNDialog] = useState(false);

  const { data, isLoading, isError } = useQuery<ApiPurchaseOrder[]>({
    queryKey: ["purchase-orders"],
    queryFn: async () => {
      const response = await api.get("/purchase-orders");
      return response.data;
    },
  });

  const orders: AdaptedOrder[] = useMemo(() => {
    if (!data) return [];
    return data.map((order) => {
      const normalizedStatus = (() => {
        const raw = (order.status || "confirmed").toString().toLowerCase();
        if (raw === "processing") return "processing";
        if (raw === "out_for_delivery") return "out_for_delivery";
        if (raw === "delivered") return "delivered";
        if (raw === "cancelled") return "cancelled";
        if (raw === "completed") return "completed";
        return "confirmed";
      })() as AdaptedOrder["status"];

      const itemsSummary = order.items?.length
        ? `${order.items.length} item${order.items.length > 1 ? "s" : ""}`
        : "Items not provided";

      return {
        id: order.id.substring(0, 8),
        fullId: order.id,
        supplier: order.supplier?.name || "Unknown supplier",
        project: order.project?.name || "Unknown project",
        items: itemsSummary,
        totalAmount: Number(order.total_amount || 0),
        status: normalizedStatus,
        orderDate: order.created_at ? new Date(order.created_at).toLocaleDateString() : "",
        paymentStatus: "pending",
        lineItems: (order.items || []).map((item) => ({
          id: item.id,
          productName: item.item_description || "Line item",
          quantity: Number(item.ordered_qty || 0),
          unit: "unit",
        })),
      };
    });
  }, [data]);

  const filteredOrders = orders.filter((order) => {
      const matchesSearch =
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.fullId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      return matchesSearch && matchesStatus;
  });

  return (
    <AppLayout>
      <div className="p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">{t("orders.title")}</h1>
            <p className="text-muted-foreground mt-1">
              {t("orders.subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge variant="accent">
              {t("orders.in_transit_count", { count: orders.filter((o) => o.status === "out_for_delivery").length })}
            </StatusBadge>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{orders.length}</p>
                <p className="text-sm text-muted-foreground">{t("orders.total_orders")}</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">
                  {orders.filter((o) => o.status === "processing" || o.status === "PROCESSING").length}
                </p>
                <p className="text-sm text-muted-foreground">{t("orders.processing")}</p>
              </div>
            </div>
          </div>
          {/* ... other cards (omitted for brevity, can keep structure) ... */}
        </div>

        {/* Filters */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("orders.search_placeholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 me-2" />
                <SelectValue placeholder={t("orders.filter.status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("orders.filter.all_status")}</SelectItem>
                <SelectItem value="confirmed">{t("orders.filter.confirmed")}</SelectItem>
                <SelectItem value="processing">{t("orders.filter.processing")}</SelectItem>
                <SelectItem value="out_for_delivery">{t("orders.filter.out_for_delivery")}</SelectItem>
                <SelectItem value="delivered">{t("orders.filter.delivered")}</SelectItem>
                <SelectItem value="completed">{t("orders.filter.completed")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Orders List */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            {isLoading ? (
              <table className="w-full data-grid">
                <thead>
                  <tr>
                    <th className="min-w-[200px]">{t("orders.order_info")}</th>
                    <th className="min-w-[150px]">{t("orders.supplier")}</th>
                    <th className="min-w-[180px]">{t("orders.project")}</th>
                    <th className="min-w-[130px]">{t("orders.amount")}</th>
                    <th className="min-w-[130px]">{t("orders.status")}</th>
                    <th className="min-w-[110px]">{t("orders.payment")}</th>
                    <th className="min-w-[100px] text-center">{t("common.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {[...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td>
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-[120px]" />
                            <Skeleton className="h-3 w-[80px]" />
                          </div>
                        </div>
                      </td>
                      <td><Skeleton className="h-4 w-[120px]" /></td>
                      <td><Skeleton className="h-4 w-[140px]" /></td>
                      <td><Skeleton className="h-4 w-[80px]" /></td>
                      <td><Skeleton className="h-6 w-[80px] rounded-full" /></td>
                      <td><Skeleton className="h-6 w-[80px] rounded-full" /></td>
                      <td><Skeleton className="h-8 w-8 rounded-md mx-auto" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : isError ? (
              <div className="p-8 text-center text-danger">Failed to load orders</div>
            ) : filteredOrders.length > 0 ? (
              <table className="w-full data-grid">
                <thead>
                  <tr>
                    <th className="min-w-[200px]">{t("orders.order_info")}</th>
                    <th className="min-w-[150px]">{t("orders.supplier")}</th>
                    <th className="min-w-[180px]">{t("orders.project")}</th>
                    <th className="min-w-[130px]">{t("orders.amount")}</th>
                    <th className="min-w-[130px]">{t("orders.status")}</th>
                    <th className="min-w-[110px]">{t("orders.payment")}</th>
                    <th className="min-w-[100px] text-center">{t("common.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                      <OrderRow 
                          key={order.fullId} 
                          order={order} 
                          onSelect={(o) => {
                              setSelectedOrder(o);
                              setShowDetailsDialog(true);
                          }}
                      />
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-12">
                <EmptyState
                  icon={ShoppingCart}
                  title={t("orders.empty.no_orders")}
                  description={t("orders.empty.desc")}
                />
              </div>
            )}
          </div>
        </div>
      </div>

       {/* Order Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t("orders.details.title")}</DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                      {t("orders.order_info")}
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("orders.order_id")}</span>
                        <span className="font-medium">{selectedOrder.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("orders.total_amount")}</span>
                        <span className="font-semibold text-primary tabular-nums">
                          SAR {selectedOrder.totalAmount?.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                {selectedOrder.status === "out_for_delivery" ||
                selectedOrder.status === "OUT_FOR_DELIVERY" ? (
                  <div className="pt-2">
                    <Button
                      className="w-full"
                      onClick={() => setShowGRNDialog(true)}
                    >
                      Record Goods Receipt (GRN)
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {selectedOrder ? (
        <GoodsReceivedNote
          orderId={selectedOrder.fullId}
          supplier={selectedOrder.supplier}
          lineItems={selectedOrder.lineItems}
          open={showGRNDialog}
          onOpenChange={setShowGRNDialog}
          onConfirm={() => {
            queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
          }}
        />
      ) : null}
    </AppLayout>
  );
}

export default Orders;
