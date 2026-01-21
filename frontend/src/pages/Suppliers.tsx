import React, { useState, useMemo } from "react";
import { Search, Filter, Building2, Phone, Mail, CheckCircle, Clock, MoreHorizontal, Eye, Ban } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
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
import { useLanguage } from "@/contexts/LanguageContext";
import { api } from "@/lib/api";

type ApiCompany = {
  id: string;
  name: string;
  type: string;
  commercial_reg_no?: string;
  tax_id?: string;
  is_verified: boolean;
  users?: Array<{ email?: string; phone?: string }>;
};

type ApiPurchaseOrder = {
  id: string;
  supplier_id: string;
  status: string;
  delivery_notes?: Array<{ delivery_date: string; status: string }>;
};

type ApiInvoice = {
  id: string;
  supplier_id: string;
  total_amount?: number;
};

type ApiRFQ = {
  id: string;
  bids?: Array<{ supplier_id: string }>;
};

type SupplierMetrics = {
  orderCount: number;
  onTimeDelivery: number;
  responseRate: number;
};

const statusConfig = {
  active: { color: "success", labelKey: "suppliers.status.active", icon: CheckCircle },
  pending: { color: "warning", labelKey: "suppliers.status.pending", icon: Clock },
  suspended: { color: "danger", labelKey: "suppliers.status.suspended", icon: Ban },
} as const;

// --- Supplier Card Component ---
const SupplierCard = ({ 
  company, 
  metrics, 
  onViewProfile 
}: { 
  company: ApiCompany; 
  metrics: SupplierMetrics;
  onViewProfile: (c: ApiCompany) => void;
}) => {
    const { t } = useLanguage();
    
    // Determine status based on is_verified
    const status = company.is_verified ? 'active' : 'pending';
    const StatusIcon = statusConfig[status as keyof typeof statusConfig].icon;
    
    // Get first user contact info if available
    const firstUser = company.users?.[0];
    const contactPhone = firstUser?.phone || "N/A";
    const contactEmail = firstUser?.email || "N/A";

    return (
        <div className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow animate-fade-in">
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                    <span className="text-primary font-bold">
                    {company.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
                    </span>
                </div>
                <div>
                    <h3 className="font-semibold text-foreground">{company.name}</h3>
                    <p className="text-sm text-muted-foreground" dir="rtl">
                    {/* nameAr fallback */}
                    {company.name} 
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
                    <DropdownMenuItem onClick={() => onViewProfile(company)}>
                    <Eye className="w-4 h-4 me-2" />
                    {t("suppliers.actions.view_profile")}
                    </DropdownMenuItem>
                    <DropdownMenuItem>{t("suppliers.actions.view_orders")}</DropdownMenuItem>
                    <DropdownMenuItem>{t("suppliers.actions.send_message")}</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {status === "active" && (
                    <DropdownMenuItem className="text-danger">
                        <Ban className="w-4 h-4 me-2" />
                        {t("suppliers.actions.suspend")}
                    </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="flex items-center gap-2 mt-3">
                <StatusBadge variant={statusConfig[status as keyof typeof statusConfig].color as any} size="sm">
                <StatusIcon className="w-3 h-3" />
                {t(statusConfig[status as keyof typeof statusConfig].labelKey)}
                </StatusBadge>
            </div>

            <div className="flex flex-wrap gap-1 mt-3">
                <StatusBadge variant="neutral" size="sm">
                    {company.type === 'SUPPLIER' ? 'Supplier' : company.type === 'CONTRACTOR' ? 'Contractor' : company.type || "Supplier"}
                </StatusBadge>
            </div>

            <div className="mt-4 space-y-2 text-sm">
                {contactEmail !== "N/A" && (
                    <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground truncate">{contactEmail}</span>
                    </div>
                )}
                {contactPhone !== "N/A" && (
                    <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">{contactPhone}</span>
                    </div>
                )}
            </div>

            <div className="mt-4 pt-4 border-t border-border">
                <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                    <p className="text-lg font-bold tabular-nums">{metrics.orderCount}</p>
                    <p className="text-xs text-muted-foreground">{t("suppliers.metrics.orders")}</p>
                </div>
                <div>
                    <p className="text-lg font-bold tabular-nums text-success">{metrics.onTimeDelivery}%</p>
                    <p className="text-xs text-muted-foreground">{t("suppliers.metrics.on_time")}</p>
                </div>
                <div>
                    <p className="text-lg font-bold tabular-nums text-primary">{metrics.responseRate}%</p>
                    <p className="text-xs text-muted-foreground">{t("suppliers.metrics.response")}</p>
                </div>
                </div>
            </div>

            <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => onViewProfile(company)}
            >
                {t("suppliers.actions.view_profile")}
            </Button>
        </div>
    );
};

// --- Main Page Component ---

export default function Suppliers() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedSupplier, setSelectedSupplier] = useState<ApiCompany | null>(null);
  const [showProfileDialog, setShowProfileDialog] = useState(false);

  // Fetch all data
  const { data: companiesData, isLoading: isLoadingCompanies } = useQuery<ApiCompany[]>({
    queryKey: ["companies"],
    queryFn: async () => {
      const response = await api.get("/companies");
      return response.data;
    },
  });

  const { data: purchaseOrdersData } = useQuery<ApiPurchaseOrder[]>({
    queryKey: ["purchase-orders"],
    queryFn: async () => {
      const response = await api.get("/purchase-orders");
      return response.data;
    },
  });

  const { data: invoicesData } = useQuery<ApiInvoice[]>({
    queryKey: ["invoices"],
    queryFn: async () => {
      const response = await api.get("/invoices");
      return response.data;
    },
  });

  const { data: rfqsData } = useQuery<ApiRFQ[]>({
    queryKey: ["rfqs"],
    queryFn: async () => {
      const response = await api.get("/rfqs");
      return response.data;
    },
  });

  // Calculate metrics for each supplier
  const suppliersWithMetrics = useMemo(() => {
    if (!companiesData) return [];
    
    return companiesData
      .filter(c => c.type === 'SUPPLIER') // Only show suppliers
      .map(company => {
        // Order count: count POs where this company is the supplier
        const orderCount = purchaseOrdersData?.filter(po => po.supplier_id === company.id).length || 0;
        
        // On-time delivery: calculate from delivery notes
        const companyPOs = purchaseOrdersData?.filter(po => po.supplier_id === company.id) || [];
        const deliveries = companyPOs.flatMap(po => po.delivery_notes || []);
        const deliveredCount = deliveries.filter(dn => dn.status === 'DELIVERED').length;
        const onTimeDelivery = deliveries.length > 0 
          ? Math.round((deliveredCount / deliveries.length) * 100)
          : 0;
        
        // Response rate: percentage of RFQs that got bids from this supplier
        const totalRFQs = rfqsData?.length || 0;
        const rfqsWithBids = rfqsData?.filter(rfq => 
          rfq.bids?.some(bid => bid.supplier_id === company.id)
        ).length || 0;
        const responseRate = totalRFQs > 0 
          ? Math.round((rfqsWithBids / totalRFQs) * 100)
          : 0;
        
        return {
          company,
          metrics: {
            orderCount,
            onTimeDelivery,
            responseRate,
          },
        };
      });
  }, [companiesData, purchaseOrdersData, invoicesData, rfqsData]);

  // Derive categories from data
  const categories = useMemo(() => {
    return [...new Set(suppliersWithMetrics.map((s) => s.company.type).filter(Boolean))];
  }, [suppliersWithMetrics]);

  const filteredSuppliers = useMemo(() => {
    return suppliersWithMetrics.filter(({ company }) => {
      const matchesSearch =
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (company.commercial_reg_no || "").includes(searchTerm);
      
      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "active" && company.is_verified) ||
        (statusFilter === "pending" && !company.is_verified) ||
        (statusFilter === "suspended" && false); // Suspended not implemented yet
      
      const matchesCategory =
        categoryFilter === "all" || company.type === categoryFilter;
        
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [suppliersWithMetrics, searchTerm, statusFilter, categoryFilter]);

  const handleViewProfile = (supplier: ApiCompany) => {
    setSelectedSupplier(supplier);
    setShowProfileDialog(true);
  };

  if (isLoadingCompanies) {
    return (
      <AppLayout>
        <div className="p-4 lg:p-6 flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Loading suppliers...</p>
        </div>
      </AppLayout>
    );
  }

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
          {/* Summary Badges - optionally calculate from data */}
          <div className="flex items-center gap-2">
             {/* Placeholders for now */}
            <StatusBadge variant="success">{t("suppliers.active_count", { count: filteredSuppliers.length })}</StatusBadge>
            <StatusBadge variant="warning">{t("suppliers.pending_count", { count: 0 })}</StatusBadge>
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
                    <SelectItem key={cat} value={cat as string}>
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
          {filteredSuppliers.map(({ company, metrics }) => (
            <SupplierCard 
                key={company.id} 
                company={company} 
                metrics={metrics}
                onViewProfile={handleViewProfile} 
            />
          ))}
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
                    {selectedSupplier.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">{selectedSupplier.name}</h3>
                  <div className="flex items-center gap-2 mt-2">
                     <StatusBadge variant="neutral">{selectedSupplier.type || "Supplier"}</StatusBadge>
                  </div>
                </div>
              </div>

               <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                     <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">{t("suppliers.profile.contact_info")}</h4>
                     {selectedSupplier.users && selectedSupplier.users.length > 0 ? (
                       <>
                         {selectedSupplier.users[0].email && (
                           <div className="flex items-center gap-2">
                             <Mail className="w-4 h-4 text-muted-foreground" />
                             <span>{selectedSupplier.users[0].email}</span>
                           </div>
                         )}
                         {selectedSupplier.users[0].phone && (
                           <div className="flex items-center gap-2">
                             <Phone className="w-4 h-4 text-muted-foreground" />
                             <span>{selectedSupplier.users[0].phone}</span>
                           </div>
                         )}
                       </>
                     ) : (
                       <p className="text-muted-foreground">No contact information available</p>
                     )}
                  </div>
                   <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                     <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">{t("suppliers.profile.business_details")}</h4>
                     <div>
                       <span className="text-sm text-muted-foreground">CR Number: </span>
                       <span>{selectedSupplier.commercial_reg_no || "N/A"}</span>
                     </div>
                     <div>
                       <span className="text-sm text-muted-foreground">Tax ID: </span>
                       <span>{selectedSupplier.tax_id || "N/A"}</span>
                     </div>
                     <div>
                       <span className="text-sm text-muted-foreground">Status: </span>
                       <StatusBadge variant={selectedSupplier.is_verified ? "success" : "warning"} size="sm">
                         {selectedSupplier.is_verified ? t("suppliers.status.active") : t("suppliers.status.pending")}
                       </StatusBadge>
                     </div>
                  </div>
               </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
