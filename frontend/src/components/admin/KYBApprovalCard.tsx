import { useMemo, useState } from "react";
import { Building2, FileText, Check, X, Eye, ExternalLink, Clock, AlertTriangle } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Textarea } from "@/components/ui/textarea";
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
  users?: Array<{ email?: string | null }>;
};

export function KYBApprovalCard() {
  const { t } = useLanguage();
  const { data, isLoading, isError, refetch } = useQuery<ApiCompany[]>({
    queryKey: ["companies", "kyb-unverified"],
    queryFn: async () => (await api.get("/companies", { params: { is_verified: false } })).data,
  });

  const pendingRequests = useMemo(() => (data || []).filter((c) => !c.is_verified), [data]);

  const [selectedRequest, setSelectedRequest] = useState<ApiCompany | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  const handleReview = (request: ApiCompany) => {
    setSelectedRequest(request);
    setShowReviewDialog(true);
    setRejectionReason("");
    setIsRejecting(false);
  };

  const approveMutation = useMutation({
    mutationFn: async (companyId: string) => api.patch(`/companies/${companyId}`, { is_verified: true }),
    onSuccess: async () => {
      toast({
        title: t("approvals.toast.approved_title"),
        description: t("approvals.toast.approved_desc", { name: selectedRequest?.name || "" }),
      });
      setShowReviewDialog(false);
      await refetch();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Approval Failed",
        description: error.response?.data?.message || "Could not approve company",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (companyId: string) => api.patch(`/companies/${companyId}`, { is_verified: false }),
    onSuccess: async () => {
      toast({
        title: t("approvals.toast.rejected_title"),
        description: t("approvals.toast.rejected_desc", { name: selectedRequest?.name || "" }),
      });
      setShowReviewDialog(false);
      setRejectionReason("");
      await refetch();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Rejection Failed",
        description: error.response?.data?.message || "Could not reject company",
      });
    },
  });

  const handleApprove = () => {
    if (selectedRequest) approveMutation.mutate(selectedRequest.id);
  };

  const handleReject = () => {
    if (selectedRequest && rejectionReason.trim()) rejectMutation.mutate(selectedRequest.id);
  };

  return (
    <>
      <div className="bg-card rounded-xl border border-border">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-warning" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{t("approvals.widget.title")}</h3>
              <p className="text-sm text-muted-foreground">{t("approvals.widget.subtitle")}</p>
            </div>
          </div>
          <StatusBadge variant="warning">{pendingRequests.length} {t("approvals.widget.pending_badge")}</StatusBadge>
        </div>

        <div className="divide-y divide-border">
          {isLoading ? (
            <div className="px-6 py-12 text-center text-muted-foreground">Loading...</div>
          ) : isError ? (
            <div className="px-6 py-12 text-center text-danger">Failed to load requests</div>
          ) : pendingRequests.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Check className="w-12 h-12 text-success mx-auto mb-4" />
              <p className="font-medium text-foreground">{t("approvals.widget.all_caught_up")}</p>
              <p className="text-sm text-muted-foreground">{t("approvals.widget.no_pending")}</p>
            </div>
          ) : (
            pendingRequests.map((request, index) => (
              <div
                key={request.id}
                className="px-6 py-4 flex items-center gap-4 hover:bg-muted/50 transition-colors animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground truncate">{request.name}</p>
                    <StatusBadge variant="warning" size="sm">
                      <Clock className="w-3 h-3" />
                      {t("approvals.widget.pending_badge")}
                    </StatusBadge>
                  </div>
                  <p className="text-sm text-muted-foreground">{request.type}</p>
                  <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                    <span>{t("approvals.widget.cr_prefix")}: {request.commercial_reg_no || "—"}</span>
                    <span>{t("approvals.widget.submitted_prefix")}: {new Date(request.created_at || Date.now()).toLocaleString()}</span>
                  </div>
                </div>

                <Button onClick={() => handleReview(request)} size="sm">
                  <Eye className="w-4 h-4 me-2" />
                  {t("approvals.card.review")}
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{t("approvals.dialog.kyb_review_title")}</DialogTitle>
            <DialogDescription>
              {t("approvals.dialog.kyb_review_desc")}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="flex-1 grid md:grid-cols-2 gap-6 overflow-hidden">
              {/* Document Preview */}
              <div className="bg-muted rounded-lg flex flex-col">
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                  <span className="text-sm font-medium">{t("approvals.dialog.cr_document")}</span>
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="w-4 h-4 me-1" />
                    {t("approvals.dialog.open")}
                  </Button>
                </div>
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="text-center">
                    <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">
                      {t("approvals.dialog.doc_preview_placeholder")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      CR-{selectedRequest.commercial_reg_no || "N/A"}.pdf
                    </p>
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
                    <div>
                      <p className="text-xs text-muted-foreground">{t("approvals.dialog.company_name_ar")}</p>
                      <p className="font-medium" dir="rtl">{selectedRequest.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t("approvals.dialog.cr_number")}</p>
                      <p className="font-medium tabular-nums">{selectedRequest.commercial_reg_no || "—"}</p>
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
                  </div>
                </div>

                {isRejecting && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-danger">{t("approvals.dialog.rejection_reason")} *</label>
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
                  <X className="w-4 h-4 me-2" />
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
                  <X className="w-4 h-4 me-2" />
                  {t("approvals.dialog.reject")}
                </Button>
                <Button onClick={handleApprove} className="bg-success hover:bg-success/90 text-success-foreground">
                  <Check className="w-4 h-4 me-2" />
                  {t("approvals.dialog.approve")}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
