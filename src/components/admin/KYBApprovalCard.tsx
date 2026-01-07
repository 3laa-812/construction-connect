import { useState } from "react";
import { Building2, FileText, Check, X, Eye, ExternalLink, Clock, AlertTriangle } from "lucide-react";
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

interface KYBRequest {
  id: string;
  companyName: string;
  companyNameAr: string;
  crNumber: string;
  submittedAt: string;
  documentUrl: string;
  status: "pending" | "approved" | "rejected";
  contactName: string;
  contactEmail: string;
}

const mockRequests: KYBRequest[] = [
  {
    id: "kyb-001",
    companyName: "Saudi Ceramics Trading Co.",
    companyNameAr: "شركة السيراميك السعودي للتجارة",
    crNumber: "1010234567",
    submittedAt: "2024-01-18 14:30",
    documentUrl: "/cr-document.pdf",
    status: "pending",
    contactName: "Mohammed Al-Qahtani",
    contactEmail: "m.qahtani@saudiceramics.com",
  },
  {
    id: "kyb-002",
    companyName: "Gulf Steel Industries",
    companyNameAr: "صناعات الخليج للحديد",
    crNumber: "1010345678",
    submittedAt: "2024-01-17 09:15",
    documentUrl: "/cr-document.pdf",
    status: "pending",
    contactName: "Khalid Ibrahim",
    contactEmail: "k.ibrahim@gulfsteel.com",
  },
  {
    id: "kyb-003",
    companyName: "Al-Madinah Building Materials",
    companyNameAr: "مواد البناء المدينة",
    crNumber: "1010456789",
    submittedAt: "2024-01-16 16:45",
    documentUrl: "/cr-document.pdf",
    status: "pending",
    contactName: "Fahad Al-Otaibi",
    contactEmail: "f.otaibi@madinahbm.com",
  },
];

export function KYBApprovalCard() {
  const [requests, setRequests] = useState(mockRequests);
  const [selectedRequest, setSelectedRequest] = useState<KYBRequest | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  const handleReview = (request: KYBRequest) => {
    setSelectedRequest(request);
    setShowReviewDialog(true);
    setRejectionReason("");
    setIsRejecting(false);
  };

  const handleApprove = () => {
    if (selectedRequest) {
      setRequests((prev) =>
        prev.map((r) =>
          r.id === selectedRequest.id ? { ...r, status: "approved" as const } : r
        )
      );
      toast({
        title: "Supplier Approved",
        description: `${selectedRequest.companyName} has been approved and notified.`,
      });
      setShowReviewDialog(false);
    }
  };

  const handleReject = () => {
    if (selectedRequest && rejectionReason.trim()) {
      setRequests((prev) =>
        prev.map((r) =>
          r.id === selectedRequest.id ? { ...r, status: "rejected" as const } : r
        )
      );
      toast({
        title: "Application Rejected",
        description: `${selectedRequest.companyName} has been notified with the reason.`,
      });
      setShowReviewDialog(false);
    }
  };

  const pendingRequests = requests.filter((r) => r.status === "pending");

  return (
    <>
      <div className="bg-card rounded-xl border border-border">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-warning" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Pending KYB Approvals</h3>
              <p className="text-sm text-muted-foreground">Review supplier verification requests</p>
            </div>
          </div>
          <StatusBadge variant="warning">{pendingRequests.length} Pending</StatusBadge>
        </div>

        <div className="divide-y divide-border">
          {pendingRequests.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Check className="w-12 h-12 text-success mx-auto mb-4" />
              <p className="font-medium text-foreground">All caught up!</p>
              <p className="text-sm text-muted-foreground">No pending approvals at the moment.</p>
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
                    <p className="font-medium text-foreground truncate">{request.companyName}</p>
                    <StatusBadge variant="warning" size="sm">
                      <Clock className="w-3 h-3" />
                      Pending
                    </StatusBadge>
                  </div>
                  <p className="text-sm text-muted-foreground">{request.companyNameAr}</p>
                  <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                    <span>CR: {request.crNumber}</span>
                    <span>Submitted: {request.submittedAt}</span>
                  </div>
                </div>

                <Button onClick={() => handleReview(request)} size="sm">
                  <Eye className="w-4 h-4 me-2" />
                  Review
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
            <DialogTitle>KYB Review</DialogTitle>
            <DialogDescription>
              Verify the supplier's Commercial Registration document
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="flex-1 grid md:grid-cols-2 gap-6 overflow-hidden">
              {/* Document Preview */}
              <div className="bg-muted rounded-lg flex flex-col">
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                  <span className="text-sm font-medium">CR Document</span>
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="w-4 h-4 me-1" />
                    Open
                  </Button>
                </div>
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="text-center">
                    <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">
                      Document preview would appear here
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      CR-{selectedRequest.crNumber}.pdf
                    </p>
                  </div>
                </div>
              </div>

              {/* Application Details */}
              <div className="space-y-6 overflow-y-auto">
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                    Company Information
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Company Name (English)</p>
                      <p className="font-medium">{selectedRequest.companyName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Company Name (Arabic)</p>
                      <p className="font-medium" dir="rtl">{selectedRequest.companyNameAr}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Commercial Registration #</p>
                      <p className="font-medium tabular-nums">{selectedRequest.crNumber}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                    Contact Information
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Contact Person</p>
                      <p className="font-medium">{selectedRequest.contactName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="font-medium">{selectedRequest.contactEmail}</p>
                    </div>
                  </div>
                </div>

                {isRejecting && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-danger">Rejection Reason *</label>
                    <Textarea
                      placeholder="Please provide a reason for rejection..."
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
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={!rejectionReason.trim()}
                >
                  <X className="w-4 h-4 me-2" />
                  Confirm Rejection
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
                  Close
                </Button>
                <Button
                  variant="outline"
                  className="text-danger hover:text-danger"
                  onClick={() => setIsRejecting(true)}
                >
                  <X className="w-4 h-4 me-2" />
                  Reject
                </Button>
                <Button onClick={handleApprove} className="bg-success hover:bg-success/90 text-success-foreground">
                  <Check className="w-4 h-4 me-2" />
                  Approve
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
