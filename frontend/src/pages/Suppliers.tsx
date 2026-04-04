import React, { useState, useMemo } from "react";
import { Search, Filter, Building2, Phone, Mail, CheckCircle, Clock, MoreVertical, Eye, Ban, Calendar, Hash } from "lucide-react";
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
    
    const status = company.is_verified ? 'active' : 'pending';
    const StatusIcon = statusConfig[status as keyof typeof statusConfig].icon;
    
    const firstUser = company.users?.[0];
    const contactPhone = firstUser?.phone || "N/A";
    const contactEmail = firstUser?.email || "N/A";

    const initials = company.name.substring(0, 2).toUpperCase();

    return (
        <div className="bg-surface rounded-xl border border-border p-5 relative group hover:border-amber/50 hover:shadow-amber transition-all duration-200 flex flex-col h-full active:scale-[0.98]">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-amber/10 rounded-md border border-amber/20 flex items-center justify-center shrink-0">
                        <span className="text-amber font-display text-lg tracking-widest">
                            {initials}
                        </span>
                    </div>
                    <div>
                        <h3 className="font-semibold text-[16px] text-text-1 truncate max-w-[180px]" title={company.name}>
                            {company.name}
                        </h3>
                        <div className="flex gap-2 mt-1">
                            <StatusBadge variant={statusConfig[status as keyof typeof statusConfig].color as any} size="sm" className="font-mono text-[10px]">
                                <StatusIcon className="w-3 h-3" />
                                {t(statusConfig[status as keyof typeof statusConfig].labelKey).toUpperCase()}
                            </StatusBadge>
                            <StatusBadge variant="neutral" size="sm" className="font-mono text-[10px]">
                                {company.type === 'SUPPLIER' ? 'SUPPLIER' : company.type === 'CONTRACTOR' ? 'CONTRACTOR' : (company.type || "SUPPLIER")}
                            </StatusBadge>
                        </div>
                    </div>
                </div>
                
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-text-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="w-4 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onViewProfile(company)}>
                            <Eye className="w-4 h-4 mr-2" />
                            {t("suppliers.actions.view_profile")}
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <Hash className="w-4 h-4 mr-2" />
                            {t("suppliers.actions.view_orders")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {status === "active" && (
                            <DropdownMenuItem className="text-danger">
                                <Ban className="w-4 h-4 mr-2" />
                                {t("suppliers.actions.suspend")}
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="space-y-2 mt-2 mb-6 flex-1">
                {contactEmail !== "N/A" && (
                    <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-text-3 shrink-0" />
                        <span className="text-text-2 text-[13px] font-mono truncate">{contactEmail}</span>
                    </div>
                )}
                {contactPhone !== "N/A" && (
                    <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-text-3 shrink-0" />
                        <span className="text-text-2 text-[13px] font-mono truncate">{contactPhone}</span>
                    </div>
                )}
            </div>

            <div className="border-t border-border pt-4">
                <div className="flex justify-between items-center text-center">
                    <div className="flex-1 border-r border-border">
                        <p className="text-[18px] font-mono font-medium text-text-1 leading-tight">{metrics.orderCount}</p>
                        <p className="text-[10px] uppercase tracking-[1px] text-text-3 mt-1">Orders</p>
                    </div>
                    <div className="flex-1 border-r border-border">
                        <p className={`text-[18px] font-mono font-medium leading-tight ${metrics.onTimeDelivery >= 90 ? 'text-success' : metrics.onTimeDelivery >= 70 ? 'text-warning' : 'text-danger'}`}>
                            {metrics.onTimeDelivery}%
                        </p>
                        <p className="text-[10px] uppercase tracking-[1px] text-text-3 mt-1">On Time</p>
                    </div>
                    <div className="flex-1">
                        <p className="text-[18px] font-mono font-medium text-text-1 leading-tight">{metrics.responseRate}%</p>
                        <p className="text-[10px] uppercase tracking-[1px] text-text-3 mt-1">Response</p>
                    </div>
                </div>
            </div>
            
            <div className="mt-5 opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-5 left-5 right-5 pointer-events-none">
                <Button 
                    variant="outline" 
                    className="w-full h-8 text-[12px] bg-surface-2 border-border/50 text-text-1 pointer-events-auto"
                    onClick={() => onViewProfile(company)}
                >
                    View Directory Details
                </Button>
            </div>
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

  const { data: companiesData, isLoading: isLoadingCompanies } = useQuery<ApiCompany[]>({
    queryKey: ["companies"],
    queryFn: async () => (await api.get("/companies")).data,
  });

  const { data: purchaseOrdersData } = useQuery<ApiPurchaseOrder[]>({
    queryKey: ["purchase-orders"],
    queryFn: async () => (await api.get("/purchase-orders")).data,
  });

  const { data: rfqsData } = useQuery<ApiRFQ[]>({
    queryKey: ["rfqs"],
    queryFn: async () => (await api.get("/rfqs")).data,
  });

  const suppliersWithMetrics = useMemo(() => {
    if (!companiesData) return [];
    
    return companiesData
      .filter(c => c.type === 'SUPPLIER')
      .map(company => {
        const orderCount = purchaseOrdersData?.filter(po => po.supplier_id === company.id).length || 0;
        
        const companyPOs = purchaseOrdersData?.filter(po => po.supplier_id === company.id) || [];
        const deliveries = companyPOs.flatMap(po => po.delivery_notes || []);
        const deliveredCount = deliveries.filter(dn => dn.status === 'DELIVERED').length;
        const onTimeDelivery = deliveries.length > 0 ? Math.round((deliveredCount / deliveries.length) * 100) : 100; // Mock 100 on empty
        
        const totalRFQs = rfqsData?.length || 0;
        const rfqsWithBids = rfqsData?.filter(rfq => rfq.bids?.some(bid => bid.supplier_id === company.id)).length || 0;
        const responseRate = totalRFQs > 0 ? Math.round((rfqsWithBids / totalRFQs) * 100) : 85; // Mock 85 on empty
        
        return {
          company,
          metrics: { orderCount, onTimeDelivery, responseRate },
        };
      });
  }, [companiesData, purchaseOrdersData, rfqsData]);

  const categories = useMemo(() => {
    return [...new Set(suppliersWithMetrics.map((s) => s.company.type).filter(Boolean))];
  }, [suppliersWithMetrics]);

  const filteredSuppliers = useMemo(() => {
    return suppliersWithMetrics.filter(({ company }) => {
      const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) || (company.commercial_reg_no || "").includes(searchTerm);
      const matchesStatus = statusFilter === "all" || (statusFilter === "active" && company.is_verified) || (statusFilter === "pending" && !company.is_verified);
      const matchesCategory = categoryFilter === "all" || company.type === categoryFilter;
        
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [suppliersWithMetrics, searchTerm, statusFilter, categoryFilter]);

  const handleViewProfile = (supplier: ApiCompany) => {
    setSelectedSupplier(supplier);
    setShowProfileDialog(true);
  };

  const activeCount = filteredSuppliers.filter(c => c.company.is_verified).length;
  const pendingCount = filteredSuppliers.length - activeCount;

  if (isLoadingCompanies) {
    return (
      <AppLayout>
        <div className="p-8 flex items-center justify-center min-h-[400px]">
          <span className="font-mono text-text-3 tracking-widest text-sm uppercase">Loading Suppliers...</span>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border pb-6">
          <div>
            <h1 className="text-[24px] font-display text-text-1">Suppliers Directory</h1>
            <p className="text-[13px] text-text-2 mt-1 max-w-[480px]">
              Manage supplier relationships, track compliance, and analyze historical performance metrics across your organization.
            </p>
          </div>
          <div className="flex gap-2">
            <StatusBadge variant="success" className="font-mono">{activeCount} ACTIVE</StatusBadge>
            {pendingCount > 0 && <StatusBadge variant="warning" className="font-mono">{pendingCount} PENDING</StatusBadge>}
          </div>
        </div>

        {/* Action Bar */}
        <div className="bg-surface-2 rounded border border-border p-3 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
            <Input
              placeholder="Search by name or CR number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] h-9">
                <Filter className="w-3.5 h-3.5 mr-2 text-text-3" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending KYB</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat as string}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Suppliers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
          <div className="border border-dashed border-border-2 rounded-lg p-12 text-center">
            <Building2 className="w-8 h-8 text-text-3 mx-auto mb-4 opacity-50" />
            <p className="font-medium text-text-1">No Suppliers Found</p>
            <p className="text-[13px] text-text-3 mt-1">Try adjusting your filters or search criteria.</p>
          </div>
        )}
      </div>

       {/* Supplier Profile Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="max-w-2xl bg-surface border-border p-0 overflow-hidden">
          {selectedSupplier && (
            <>
              {/* Header Banner */}
              <div className="bg-surface-2 border-b border-border p-6 pb-8 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-amber/10 border border-amber/20 rounded-lg flex items-center justify-center mb-3">
                  <Building2 className="w-6 h-6 text-amber" />
                </div>
                <h3 className="font-display text-2xl text-text-1">{selectedSupplier.name}</h3>
                <div className="flex items-center gap-2 mt-2 justify-center">
                  <StatusBadge variant={selectedSupplier.is_verified ? "success" : "warning"} size="sm" className="font-mono tracking-widest text-[10px]">
                     {selectedSupplier.is_verified ? "VERIFIED PARTNER" : "PENDING REVIEW"}
                  </StatusBadge>
                  <StatusBadge variant="neutral" size="sm" className="font-mono tracking-widest text-[10px]">
                     {selectedSupplier.type || "SUPPLIER"}
                  </StatusBadge>
                </div>
              </div>

              {/* Data Layout */}
              <div className="p-6 grid md:grid-cols-2 gap-6 bg-ground">
                {/* Contact Segment */}
                <div className="space-y-4">
                  <h4 className="text-[10px] tracking-widest uppercase text-text-3 font-medium border-b border-border pb-2">Primary Contact</h4>
                  <div className="bg-surface rounded-md border border-border p-4 space-y-4">
                    {selectedSupplier.users && selectedSupplier.users.length > 0 ? (
                      <>
                        <div className="flex items-start gap-4">
                           <Mail className="w-4 h-4 text-text-3 mt-1 shrink-0" />
                           <div className="flex flex-col">
                              <span className="text-[11px] text-text-3 mb-1">EMAIL ADDRESS</span>
                              <span className="font-mono text-[13px] text-text-1">{selectedSupplier.users[0].email || 'N/A'}</span>
                           </div>
                        </div>
                        <div className="flex items-start gap-4">
                           <Phone className="w-4 h-4 text-text-3 mt-1 shrink-0" />
                           <div className="flex flex-col">
                              <span className="text-[11px] text-text-3 mb-1">PHONE NUMBER</span>
                              <span className="font-mono text-[13px] text-text-1">{selectedSupplier.users[0].phone || 'N/A'}</span>
                           </div>
                        </div>
                      </>
                    ) : (
                      <p className="text-[13px] text-text-3 text-center py-4">No contact linked</p>
                    )}
                  </div>
                </div>

                {/* Fiscal Segment */}
                <div className="space-y-4">
                  <h4 className="text-[10px] tracking-widest uppercase text-text-3 font-medium border-b border-border pb-2">Business Data</h4>
                  <div className="bg-surface rounded-md border border-border p-4 space-y-4">
                     <div className="flex items-start gap-4 flex-col sm:flex-row">
                         <div className="flex flex-col flex-1">
                            <span className="text-[11px] text-text-3 mb-1 flex gap-2"><Hash className="w-3 h-3" /> CR NUMBER</span>
                            <span className="font-mono text-[13px] text-text-1 line-clamp-1">{selectedSupplier.commercial_reg_no || 'Pending Check'}</span>
                         </div>
                     </div>
                     <div className="flex items-start gap-4 flex-col sm:flex-row">
                         <div className="flex flex-col flex-1">
                            <span className="text-[11px] text-text-3 mb-1 flex gap-2"><Hash className="w-3 h-3" /> TAX ID</span>
                            <span className="font-mono text-[13px] text-text-1 line-clamp-1">{selectedSupplier.tax_id || 'Pending Check'}</span>
                         </div>
                     </div>
                     <div className="flex items-start gap-4 flex-col sm:flex-row">
                         <div className="flex flex-col flex-1">
                            <span className="text-[11px] text-text-3 mb-1 flex gap-2"><Calendar className="w-3 h-3" /> PARTNERSHIP DATE</span>
                            <span className="font-mono text-[13px] text-text-1">2026-03-25</span>
                         </div>
                     </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
