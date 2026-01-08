import { useState } from "react";
import { Search, Filter, Building2, Star, MapPin, Phone, Mail, CheckCircle, Clock, MoreHorizontal, Eye, Ban } from "lucide-react";
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
import { cn } from "@/lib/utils";

interface Supplier {
  id: string;
  name: string;
  nameAr: string;
  crNumber: string;
  categories: string[];
  location: string;
  phone: string;
  email: string;
  rating: number;
  totalOrders: number;
  totalValue: number;
  status: "active" | "pending" | "suspended";
  onTimeDelivery: number;
  responseRate: number;
}

const mockSuppliers: Supplier[] = [
  {
    id: "sup-001",
    name: "Saudi Ceramics",
    nameAr: "السيراميك السعودي",
    crNumber: "1010234567",
    categories: ["Building Materials", "Finishing Materials"],
    location: "Riyadh, Saudi Arabia",
    phone: "+966 11 456 7890",
    email: "sales@saudiceramics.com",
    rating: 4.8,
    totalOrders: 156,
    totalValue: 8500000,
    status: "active",
    onTimeDelivery: 96,
    responseRate: 98,
  },
  {
    id: "sup-002",
    name: "Ezz Steel Industries",
    nameAr: "صناعات الحديد عز",
    crNumber: "1010345678",
    categories: ["Steel & Metal"],
    location: "Jeddah, Saudi Arabia",
    phone: "+966 12 987 6543",
    email: "procurement@ezzsteel.com",
    rating: 4.5,
    totalOrders: 89,
    totalValue: 12000000,
    status: "active",
    onTimeDelivery: 92,
    responseRate: 95,
  },
  {
    id: "sup-003",
    name: "Arabian Cement Co.",
    nameAr: "شركة الأسمنت العربية",
    crNumber: "1010456789",
    categories: ["Building Materials"],
    location: "Dammam, Saudi Arabia",
    phone: "+966 13 123 4567",
    email: "orders@arabiancement.com",
    rating: 4.2,
    totalOrders: 234,
    totalValue: 6700000,
    status: "active",
    onTimeDelivery: 88,
    responseRate: 90,
  },
  {
    id: "sup-004",
    name: "Gulf Electrical Co.",
    nameAr: "شركة الخليج الكهربائية",
    crNumber: "1010567890",
    categories: ["Electrical"],
    location: "Riyadh, Saudi Arabia",
    phone: "+966 11 321 0987",
    email: "info@gulfelectrical.com",
    rating: 4.6,
    totalOrders: 67,
    totalValue: 3200000,
    status: "active",
    onTimeDelivery: 94,
    responseRate: 97,
  },
  {
    id: "sup-005",
    name: "Al-Madinah Plumbing",
    nameAr: "السباكة المدينة",
    crNumber: "1010678901",
    categories: ["Plumbing"],
    location: "Madinah, Saudi Arabia",
    phone: "+966 14 654 3210",
    email: "sales@madinahplumbing.com",
    rating: 4.0,
    totalOrders: 45,
    totalValue: 1800000,
    status: "pending",
    onTimeDelivery: 85,
    responseRate: 88,
  },
  {
    id: "sup-006",
    name: "Riyadh HVAC Systems",
    nameAr: "أنظمة التكييف الرياض",
    crNumber: "1010789012",
    categories: ["HVAC"],
    location: "Riyadh, Saudi Arabia",
    phone: "+966 11 987 6543",
    email: "projects@riyadhhvac.com",
    rating: 3.8,
    totalOrders: 23,
    totalValue: 5400000,
    status: "suspended",
    onTimeDelivery: 75,
    responseRate: 80,
  },
];

const statusConfig = {
  active: { color: "success", label: "Active", icon: CheckCircle },
  pending: { color: "warning", label: "Pending KYB", icon: Clock },
  suspended: { color: "danger", label: "Suspended", icon: Ban },
} as const;

export default function Suppliers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showProfileDialog, setShowProfileDialog] = useState(false);

  const categories = [...new Set(mockSuppliers.flatMap((s) => s.categories))];

  const filteredSuppliers = mockSuppliers.filter((supplier) => {
    const matchesSearch =
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.nameAr.includes(searchTerm) ||
      supplier.crNumber.includes(searchTerm);
    const matchesStatus = statusFilter === "all" || supplier.status === statusFilter;
    const matchesCategory =
      categoryFilter === "all" || supplier.categories.includes(categoryFilter);
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleViewProfile = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowProfileDialog(true);
  };

  return (
    <AppLayout>
      <div className="p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Suppliers</h1>
            <p className="text-muted-foreground mt-1">
              Manage your supplier network and partnerships
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge variant="success">{mockSuppliers.filter((s) => s.status === "active").length} Active</StatusBadge>
            <StatusBadge variant="warning">{mockSuppliers.filter((s) => s.status === "pending").length} Pending</StatusBadge>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, CR number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="w-4 h-4 me-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
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
        </div>

        {/* Suppliers Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuppliers.map((supplier, index) => {
            const StatusIcon = statusConfig[supplier.status].icon;
            return (
              <div
                key={supplier.id}
                className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                      <span className="text-primary font-bold">
                        {supplier.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{supplier.name}</h3>
                      <p className="text-sm text-muted-foreground" dir="rtl">
                        {supplier.nameAr}
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
                      <DropdownMenuItem onClick={() => handleViewProfile(supplier)}>
                        <Eye className="w-4 h-4 me-2" />
                        View Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem>View Orders</DropdownMenuItem>
                      <DropdownMenuItem>Send Message</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {supplier.status === "active" && (
                        <DropdownMenuItem className="text-danger">
                          <Ban className="w-4 h-4 me-2" />
                          Suspend Supplier
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <StatusBadge variant={statusConfig[supplier.status].color as any} size="sm">
                    <StatusIcon className="w-3 h-3" />
                    {statusConfig[supplier.status].label}
                  </StatusBadge>
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="w-4 h-4 text-warning fill-warning" />
                    <span className="font-medium">{supplier.rating}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mt-3">
                  {supplier.categories.map((cat) => (
                    <StatusBadge key={cat} variant="neutral" size="sm">
                      {cat}
                    </StatusBadge>
                  ))}
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">{supplier.location}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-lg font-bold tabular-nums">{supplier.totalOrders}</p>
                      <p className="text-xs text-muted-foreground">Orders</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold tabular-nums text-success">{supplier.onTimeDelivery}%</p>
                      <p className="text-xs text-muted-foreground">On-Time</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold tabular-nums text-primary">{supplier.responseRate}%</p>
                      <p className="text-xs text-muted-foreground">Response</p>
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => handleViewProfile(supplier)}
                >
                  View Profile
                </Button>
              </div>
            );
          })}
        </div>

        {filteredSuppliers.length === 0 && (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="font-medium text-foreground">No suppliers found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>

      {/* Supplier Profile Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Supplier Profile</DialogTitle>
          </DialogHeader>

          {selectedSupplier && (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <span className="text-primary font-bold text-xl">
                    {selectedSupplier.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">{selectedSupplier.name}</h3>
                  <p className="text-muted-foreground" dir="rtl">{selectedSupplier.nameAr}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <StatusBadge variant={statusConfig[selectedSupplier.status].color as any}>
                      {statusConfig[selectedSupplier.status].label}
                    </StatusBadge>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-warning fill-warning" />
                      <span className="font-medium">{selectedSupplier.rating}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                    Contact Information
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedSupplier.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="tabular-nums">{selectedSupplier.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedSupplier.email}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                    Business Details
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">CR Number</span>
                      <span className="font-medium tabular-nums">{selectedSupplier.crNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Categories</span>
                      <span className="font-medium">{selectedSupplier.categories.join(", ")}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold tabular-nums">{selectedSupplier.totalOrders}</p>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold tabular-nums text-primary">
                    {(selectedSupplier.totalValue / 1000000).toFixed(1)}M
                  </p>
                  <p className="text-sm text-muted-foreground">SAR Value</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold tabular-nums text-success">
                    {selectedSupplier.onTimeDelivery}%
                  </p>
                  <p className="text-sm text-muted-foreground">On-Time</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold tabular-nums text-accent">
                    {selectedSupplier.responseRate}%
                  </p>
                  <p className="text-sm text-muted-foreground">Response</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
