import { useState } from "react";
import { Search, Filter, ShoppingCart, Clock, Package, Truck, MapPin, CheckCircle, FileText, Download, Eye, MoreHorizontal } from "lucide-react";
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
import { OrderTimeline } from "@/components/orders/OrderTimeline";
import { cn } from "@/lib/utils";

interface Order {
  id: string;
  rfqId: string;
  supplier: string;
  project: string;
  items: string;
  totalAmount: number;
  status: "confirmed" | "processing" | "out_for_delivery" | "delivered" | "completed";
  orderDate: string;
  deliveryDate?: string;
  paymentStatus: "pending" | "paid" | "overdue";
}

const mockOrders: Order[] = [
  {
    id: "ORD-2024-0845",
    rfqId: "RFQ-2024-0162",
    supplier: "Saudi Ceramics",
    project: "King Abdullah Financial District",
    items: "Portland Cement Type I - 5000 Bags",
    totalAmount: 225000,
    status: "out_for_delivery",
    orderDate: "2024-01-15",
    deliveryDate: "2024-01-18",
    paymentStatus: "pending",
  },
  {
    id: "ORD-2024-0844",
    rfqId: "RFQ-2024-0161",
    supplier: "Ezz Steel Industries",
    project: "Riyadh Metro Station",
    items: "Structural Steel Beams - 500 Tons",
    totalAmount: 890000,
    status: "processing",
    orderDate: "2024-01-14",
    paymentStatus: "paid",
  },
  {
    id: "ORD-2024-0843",
    rfqId: "RFQ-2024-0160",
    supplier: "Gulf Electrical Co.",
    project: "Al-Faisaliah Tower",
    items: "Electrical Cables and Conduits",
    totalAmount: 156000,
    status: "delivered",
    orderDate: "2024-01-10",
    deliveryDate: "2024-01-16",
    paymentStatus: "paid",
  },
  {
    id: "ORD-2024-0842",
    rfqId: "RFQ-2024-0159",
    supplier: "Al-Madinah Plumbing",
    project: "Jeddah Waterfront",
    items: "PVC Pipes and Fittings",
    totalAmount: 78000,
    status: "completed",
    orderDate: "2024-01-08",
    deliveryDate: "2024-01-12",
    paymentStatus: "paid",
  },
  {
    id: "ORD-2024-0841",
    rfqId: "RFQ-2024-0155",
    supplier: "Arabian HVAC Systems",
    project: "King Abdullah Financial District",
    items: "Central Air Conditioning Units",
    totalAmount: 450000,
    status: "confirmed",
    orderDate: "2024-01-18",
    paymentStatus: "overdue",
  },
];

const statusConfig = {
  confirmed: { color: "primary", label: "Confirmed", icon: CheckCircle },
  processing: { color: "warning", label: "Processing", icon: Package },
  out_for_delivery: { color: "accent", label: "Out for Delivery", icon: Truck },
  delivered: { color: "success", label: "Delivered", icon: MapPin },
  completed: { color: "success", label: "Completed", icon: CheckCircle },
} as const;

const paymentConfig = {
  pending: { color: "warning", label: "Payment Pending" },
  paid: { color: "success", label: "Paid" },
  overdue: { color: "danger", label: "Overdue" },
} as const;

export default function Orders() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const filteredOrders = mockOrders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.project.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailsDialog(true);
  };

  return (
    <AppLayout>
      <div className="p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Orders</h1>
            <p className="text-muted-foreground mt-1">
              Track and manage your purchase orders
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge variant="accent">
              {mockOrders.filter((o) => o.status === "out_for_delivery").length} In Transit
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
                <p className="text-2xl font-bold tabular-nums">{mockOrders.length}</p>
                <p className="text-sm text-muted-foreground">Total Orders</p>
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
                  {mockOrders.filter((o) => o.status === "processing").length}
                </p>
                <p className="text-sm text-muted-foreground">Processing</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                <Truck className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">
                  {mockOrders.filter((o) => o.status === "out_for_delivery").length}
                </p>
                <p className="text-sm text-muted-foreground">In Transit</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">
                  {mockOrders.filter((o) => o.status === "delivered" || o.status === "completed").length}
                </p>
                <p className="text-sm text-muted-foreground">Delivered</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by Order ID, supplier, or project..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 me-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Orders List */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full data-grid">
              <thead>
                <tr>
                  <th className="min-w-[200px]">Order Details</th>
                  <th className="min-w-[150px]">Supplier</th>
                  <th className="min-w-[180px]">Project</th>
                  <th className="min-w-[130px]">Amount</th>
                  <th className="min-w-[130px]">Status</th>
                  <th className="min-w-[110px]">Payment</th>
                  <th className="min-w-[100px] text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order, index) => {
                  const StatusIcon = statusConfig[order.status].icon;
                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-muted/50 transition-colors animate-fade-in"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
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
                        <StatusBadge
                          variant={statusConfig[order.status].color as any}
                          size="sm"
                        >
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig[order.status].label}
                        </StatusBadge>
                      </td>
                      <td>
                        <StatusBadge
                          variant={paymentConfig[order.paymentStatus].color as any}
                          size="sm"
                        >
                          {paymentConfig[order.paymentStatus].label}
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
                            <DropdownMenuItem onClick={() => handleViewDetails(order)}>
                              <Eye className="w-4 h-4 me-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Truck className="w-4 h-4 me-2" />
                              Track Shipment
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <FileText className="w-4 h-4 me-2" />
                              View Invoice
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="w-4 h-4 me-2" />
                              Download DN
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredOrders.length === 0 && (
            <div className="p-12 text-center">
              <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="font-medium text-foreground">No orders found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Order Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                      Order Information
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Order ID</span>
                        <span className="font-medium">{selectedOrder.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">RFQ Reference</span>
                        <span className="font-medium">{selectedOrder.rfqId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Order Date</span>
                        <span className="font-medium tabular-nums">{selectedOrder.orderDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Amount</span>
                        <span className="font-semibold text-primary tabular-nums">
                          SAR {selectedOrder.totalAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                      Supplier Details
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Company</span>
                        <span className="font-medium">{selectedOrder.supplier}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Project</span>
                        <span className="font-medium">{selectedOrder.project}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <OrderTimeline
                    orderId={selectedOrder.id}
                    currentStatus={selectedOrder.status}
                    className="h-full"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <Button variant="outline">
                  <FileText className="w-4 h-4 me-2" />
                  View Invoice
                </Button>
                <Button variant="outline">
                  <Download className="w-4 h-4 me-2" />
                  Download DN
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
