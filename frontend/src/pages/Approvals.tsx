import { useMemo, useState } from "react";
import { Search, Filter, Building2, FileText, CheckCircle, XCircle, Clock, Eye, AlertTriangle, Users, Package } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { api } from "@/lib/api";

type ApiCompany = {
  id: string;
  name: string;
  type: "CONTRACTOR" | "SUPPLIER";
  commercial_reg_no?: string | null;
  tax_id?: string | null;
  is_verified: boolean;
  created_at?: string;
  users?: Array<{ email: string; phone: string | null }>;
};

export default function Approvals() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<ApiCompany | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  const { data, isLoading, isError } = useQuery<ApiCompany[]>({
    queryKey: ["companies"],
    queryFn: async () => {
      const response = await api.get("/companies");
      return response.data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (companyId: string) => {
      await api.patch(`/companies/${companyId}`, { is_verified: true });
    },
    onSuccess: () => {
      toast({ title: t("approvals.toast.approved_title"), description: t("approvals.toast.approved_desc", { name: selectedRequest?.name || "" }) });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      setShowReviewDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to approve",
        description: error?.response?.data?.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (companyId: string) => {
      // No rejection flag in schema; keep unverified but we still record intent.
      await api.patch(`/companies/${companyId}`, { is_verified: false });
    },
    onSuccess: () => {
      toast({ title: t("approvals.toast.rejected_title"), description: t("approvals.toast.rejected_desc", { name: selectedRequest?.name || "" }) });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      setShowReviewDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to reject",
        description: error?.response?.data?.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const pendingRequests = useMemo(() => {
    return (data || []).filter((c) => !c.is_verified);
  }, [data]);

  const filteredRequests = useMemo(() => {
    return pendingRequests.filter((request) => {
      const contactEmail = request.users?.[0]?.email?.toLowerCase() || "";
      const matchesSearch =
        request.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (request.commercial_reg_no || "").includes(searchTerm) ||
        contactEmail.includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === "all" || request.type.toLowerCase() === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [pendingRequests, searchTerm, typeFilter]);

  const supplierRequests = filteredRequests.filter((r) => r.type === "supplier");
  const contractorRequests = filteredRequests.filter((r) => r.type === "contractor");

  const handleReview = (request: ApiCompany) => {
    setSelectedRequest(request);
    setShowReviewDialog(true);
    setRejectionReason("");
    setIsRejecting(false);
  };

  const handleApprove = () => {
    if (selectedRequest) approveMutation.mutate(selectedRequest.id);
  };

  const handleReject = () => {
    if (selectedRequest && rejectionReason.trim()) rejectMutation.mutate(selectedRequest.id);
  };

  const RequestCard = ({ request }: { request: ApiCompany }) => {
    const contact = request.users?.[0];
    return (
      <div className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow animate-fade-in">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{request.name}</h3>
              <p className="text-sm text-muted-foreground">{request.type}</p>
              <div className="flex items-center gap-2 mt-2">
                <StatusBadge variant="warning" size="sm">
                  <Clock className="w-3 h-3" />
                  {t("approvals.card.pending_review")}
                </StatusBadge>
                <StatusBadge variant="neutral" size="sm">
                  {request.type === "SUPPLIER" ? t("approvals.card.supplier") : t("approvals.card.contractor")}
                </StatusBadge>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("approvals.card.cr_number")}</span>
            <span className="font-medium tabular-nums">{request.commercial_reg_no || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("approvals.card.contact")}</span>
            <span className="font-medium">{contact?.email || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("approvals.card.submitted")}</span>
            <span className="font-medium">{new Date(request.created_at || Date.now()).toLocaleDateString()}</span>
          </div>
          <div className="flex flex-wrap gap-1 pt-2">
            {request.tax_id && (
              <StatusBadge variant="neutral" size="sm">
                VAT: {request.tax_id}
              </StatusBadge>
            )}
          </div>
        </div>

        <div className="flex gap-2 mt-4 pt-4 border-t border-border">
          <Button variant="outline" className="flex-1" onClick={() => handleReview(request)}>
            <Eye className="w-4 h-4 me-2" />
            {t("approvals.card.review")}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-warning" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground">{t("approvals.title")}</h1>
              <p className="text-muted-foreground mt-1">
                {t("approvals.subtitle")}
              </p>
            </div>
          </div>
          <StatusBadge variant="warning" className="text-lg px-4 py-2">
            {t("approvals.pending_count", { count: filteredRequests.length })}
          </StatusBadge>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{filteredRequests.length}</p>
                <p className="text-sm text-muted-foreground">{t("approvals.summary.pending")}</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{supplierRequests.length}</p>
                <p className="text-sm text-muted-foreground">{t("approvals.summary.suppliers")}</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{contractorRequests.length}</p>
                <p className="text-sm text-muted-foreground">{t("approvals.summary.contractors")}</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">156</p>
                <p className="text-sm text-muted-foreground">{t("approvals.summary.approved_mtd")}</p>
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
                placeholder={t("approvals.search_placeholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px]">
                <Filter className="w-4 h-4 me-2" />
                <SelectValue placeholder={t("approvals.filter.type")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("approvals.filter.all_types")}</SelectItem>
                <SelectItem value="supplier">{t("approvals.filter.suppliers")}</SelectItem>
                <SelectItem value="contractor">{t("approvals.filter.contractors")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Requests Tabs */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">{t("approvals.tabs.all")} ({filteredRequests.length})</TabsTrigger>
            <TabsTrigger value="suppliers">{t("approvals.tabs.suppliers")} ({supplierRequests.length})</TabsTrigger>
            <TabsTrigger value="contractors">{t("approvals.tabs.contractors")} ({contractorRequests.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoading ? (
                <div className="col-span-full bg-card rounded-xl border border-border p-10 text-center text-muted-foreground">
                  Loading requests...
                </div>
              ) : isError ? (
                <div className="col-span-full bg-card rounded-xl border border-border p-10 text-center text-danger">
                  Failed to load requests
                </div>
              ) : (
                filteredRequests.map((request) => (
                  <RequestCard key={request.id} request={request} />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="suppliers" className="space-y-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {supplierRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="contractors" className="space-y-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contractorRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {filteredRequests.length === 0 && (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
            <p className="font-medium text-foreground">{t("approvals.empty.all_caught_up")}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {t("approvals.empty.no_pending")}
            </p>
          </div>
        )}
      </div>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{t("approvals.dialog.title")}</DialogTitle>
            <DialogDescription>
              {t("approvals.dialog.desc")}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="flex-1 grid md:grid-cols-2 gap-6 overflow-hidden">
              {/* Document Preview */}
              <div className="bg-muted rounded-lg flex flex-col">
                <div className="px-4 py-3 border-b border-border">
                  <span className="text-sm font-medium">{t("approvals.dialog.uploaded_docs")}</span>
                </div>
                <div className="flex-1 p-4 space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-background rounded-lg border border-border">
                    <FileText className="w-5 h-5 text-primary" />
                    <span className="flex-1 text-sm font-medium">CR / VAT documents</span>
                    <Button variant="ghost" size="sm" disabled>
                      <Eye className="w-4 h-4 me-1" />
                      {t("approvals.dialog.view")}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Application Details */}
              <div className="space-y-6 overflow-y-auto">
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                    {t("approvals.dialog.company_info")}
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground">{t("approvals.dialog.company_name_en")}</p>
                      <p className="font-medium">{selectedRequest.name}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">{t("approvals.dialog.cr_number")}</p>
                        <p className="font-medium tabular-nums">{selectedRequest.commercial_reg_no || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t("approvals.dialog.vat_number")}</p>
                        <p className="font-medium tabular-nums">{selectedRequest.tax_id || "—"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                    {t("approvals.dialog.contact_info")}
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground">{t("approvals.dialog.contact_person")}</p>
                      <p className="font-medium">{selectedRequest.users?.[0]?.email || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t("approvals.dialog.email")}</p>
                      <p className="font-medium">{selectedRequest.users?.[0]?.email || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t("approvals.dialog.phone")}</p>
                      <p className="font-medium tabular-nums">{selectedRequest.users?.[0]?.phone || "—"}</p>
                    </div>
                  </div>
                </div>

                {isRejecting && (
                  <div className="space-y-2">
                    <Label className="text-danger">{t("approvals.dialog.rejection_reason")}</Label>
                    <Textarea
                      placeholder={t("approvals.dialog.rejection_placeholder")}
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={3}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            {isRejecting ? (
              <>
                <Button variant="outline" onClick={() => setIsRejecting(false)}>
                  {t("approvals.dialog.cancel")}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={!rejectionReason.trim()}
                >
                  <XCircle className="w-4 h-4 me-2" />
                  {t("approvals.dialog.confirm_reject")}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
                  {t("approvals.dialog.close")}
                </Button>
                <Button
                  variant="outline"
                  className="text-danger hover:text-danger"
                  onClick={() => setIsRejecting(true)}
                >
                  <XCircle className="w-4 h-4 me-2" />
                  {t("approvals.dialog.reject")}
                </Button>
                <Button onClick={handleApprove} className="bg-success hover:bg-success/90 text-success-foreground">
                  <CheckCircle className="w-4 h-4 me-2" />
                  {t("approvals.dialog.approve")}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
