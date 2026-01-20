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
import { useLanguage } from "@/contexts/LanguageContext";

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
  active: { color: "success", labelKey: "suppliers.status.active", icon: CheckCircle },
  pending: { color: "warning", labelKey: "suppliers.status.pending", icon: Clock },
  suspended: { color: "danger", labelKey: "suppliers.status.suspended", icon: Ban },
} as const;

export default function Suppliers() {
  const { t } = useLanguage();
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
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">{t("suppliers.title")}</h1>
            <p className="text-muted-foreground mt-1">
              {t("suppliers.subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge variant="success">{t("suppliers.active_count", { count: mockSuppliers.filter((s) => s.status === "active").length })}</StatusBadge>
            <StatusBadge variant="warning">{t("suppliers.pending_count", { count: mockSuppliers.filter((s) => s.status === "pending").length })}</StatusBadge>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("suppliers.search_placeholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="w-4 h-4 me-2" />
                  <SelectValue placeholder={t("suppliers.filter.status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("suppliers.filter.all_status")}</SelectItem>
                  <SelectItem value="active">{t("suppliers.filter.active")}</SelectItem>
                  <SelectItem value="pending">{t("suppliers.filter.pending")}</SelectItem>
                  <SelectItem value="suspended">{t("suppliers.filter.suspended")}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t("suppliers.filter.category")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("suppliers.filter.all_categories")}</SelectItem>
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
                        {t("suppliers.actions.view_profile")}
                      </DropdownMenuItem>
                      <DropdownMenuItem>{t("suppliers.actions.view_orders")}</DropdownMenuItem>
                      <DropdownMenuItem>{t("suppliers.actions.send_message")}</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {supplier.status === "active" && (
                        <DropdownMenuItem className="text-danger">
                          <Ban className="w-4 h-4 me-2" />
                          {t("suppliers.actions.suspend")}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <StatusBadge variant={statusConfig[supplier.status].color as any} size="sm">
                    <StatusIcon className="w-3 h-3" />
                    {t(statusConfig[supplier.status].labelKey)}
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
                      <p className="text-xs text-muted-foreground">{t("suppliers.metrics.orders")}</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold tabular-nums text-success">{supplier.onTimeDelivery}%</p>
                      <p className="text-xs text-muted-foreground">{t("suppliers.metrics.on_time")}</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold tabular-nums text-primary">{supplier.responseRate}%</p>
                      <p className="text-xs text-muted-foreground">{t("suppliers.metrics.response")}</p>
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => handleViewProfile(supplier)}
                >
                  {t("suppliers.actions.view_profile")}
                </Button>
              </div>
            );
          })}
        </div>

        {filteredSuppliers.length === 0 && (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="font-medium text-foreground">{t("suppliers.empty.no_suppliers")}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {t("suppliers.empty.desc")}
            </p>
          </div>
        )}
      </div>

      {/* Supplier Profile Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("suppliers.profile.title")}</DialogTitle>
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
                      {t(statusConfig[selectedSupplier.status].labelKey)}
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
                    {t("suppliers.profile.contact_info")}
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
                    {t("suppliers.profile.business_details")}
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("suppliers.profile.cr_number")}</span>
                      <span className="font-medium tabular-nums">{selectedSupplier.crNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("suppliers.categories")}</span>
                      <span className="font-medium">{selectedSupplier.categories.join(", ")}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold tabular-nums">{selectedSupplier.totalOrders}</p>
                  <p className="text-sm text-muted-foreground">{t("suppliers.metrics.total_orders")}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold tabular-nums text-primary">
                    {(selectedSupplier.totalValue / 1000000).toFixed(1)}M
                  </p>
                  <p className="text-sm text-muted-foreground">{t("suppliers.metrics.sar_value")}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold tabular-nums text-success">
                    {selectedSupplier.onTimeDelivery}%
                  </p>
                  <p className="text-sm text-muted-foreground">{t("suppliers.metrics.on_time")}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold tabular-nums text-accent">
                    {selectedSupplier.responseRate}%
                  </p>
                  <p className="text-sm text-muted-foreground">{t("suppliers.metrics.response")}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
