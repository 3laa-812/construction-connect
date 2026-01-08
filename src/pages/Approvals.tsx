import { useState } from "react";
import { Search, Filter, Building2, FileText, CheckCircle, XCircle, Clock, Eye, AlertTriangle, Users, Package } from "lucide-react";
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

interface KYBRequest {
  id: string;
  type: "supplier" | "contractor";
  companyName: string;
  companyNameAr: string;
  crNumber: string;
  vatNumber: string;
  categories?: string[];
  submittedAt: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  documents: string[];
}

const mockKYBRequests: KYBRequest[] = [
  {
    id: "kyb-001",
    type: "supplier",
    companyName: "Saudi Ceramics Trading Co.",
    companyNameAr: "شركة السيراميك السعودي للتجارة",
    crNumber: "1010234567",
    vatNumber: "300012345600003",
    categories: ["Building Materials", "Finishing Materials"],
    submittedAt: "2024-01-18 14:30",
    contactName: "Mohammed Al-Qahtani",
    contactEmail: "m.qahtani@saudiceramics.com",
    contactPhone: "+966 50 123 4567",
    documents: ["CR Certificate", "VAT Certificate", "Company Logo"],
  },
  {
    id: "kyb-002",
    type: "supplier",
    companyName: "Gulf Steel Industries",
    companyNameAr: "صناعات الخليج للحديد",
    crNumber: "1010345678",
    vatNumber: "300023456700004",
    categories: ["Steel & Metal"],
    submittedAt: "2024-01-17 09:15",
    contactName: "Khalid Ibrahim",
    contactEmail: "k.ibrahim@gulfsteel.com",
    contactPhone: "+966 55 987 6543",
    documents: ["CR Certificate", "VAT Certificate", "Category License"],
  },
  {
    id: "kyb-003",
    type: "contractor",
    companyName: "Al-Madinah Construction LLC",
    companyNameAr: "شركة المدينة للمقاولات",
    crNumber: "1010456789",
    vatNumber: "300034567800005",
    submittedAt: "2024-01-16 16:45",
    contactName: "Fahad Al-Otaibi",
    contactEmail: "f.otaibi@madinahconst.com",
    contactPhone: "+966 56 456 7890",
    documents: ["CR Certificate", "Tax ID", "Company Logo"],
  },
  {
    id: "kyb-004",
    type: "supplier",
    companyName: "Riyadh Electrical Supplies",
    companyNameAr: "مستلزمات الرياض الكهربائية",
    crNumber: "1010567890",
    vatNumber: "300045678900006",
    categories: ["Electrical"],
    submittedAt: "2024-01-19 10:00",
    contactName: "Abdullah Nasser",
    contactEmail: "a.nasser@riyadhelectrical.com",
    contactPhone: "+966 54 321 0987",
    documents: ["CR Certificate", "VAT Certificate"],
  },
];

export default function Approvals() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<KYBRequest | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  const filteredRequests = mockKYBRequests.filter((request) => {
    const matchesSearch =
      request.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.crNumber.includes(searchTerm) ||
      request.contactEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || request.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const supplierRequests = filteredRequests.filter((r) => r.type === "supplier");
  const contractorRequests = filteredRequests.filter((r) => r.type === "contractor");

  const handleReview = (request: KYBRequest) => {
    setSelectedRequest(request);
    setShowReviewDialog(true);
    setRejectionReason("");
    setIsRejecting(false);
  };

  const handleApprove = () => {
    if (selectedRequest) {
      toast({
        title: "Application Approved",
        description: `${selectedRequest.companyName} has been approved and notified.`,
      });
      setShowReviewDialog(false);
    }
  };

  const handleReject = () => {
    if (selectedRequest && rejectionReason.trim()) {
      toast({
        title: "Application Rejected",
        description: `${selectedRequest.companyName} has been notified with the reason.`,
      });
      setShowReviewDialog(false);
    }
  };

  const RequestCard = ({ request }: { request: KYBRequest }) => (
    <div className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{request.companyName}</h3>
            <p className="text-sm text-muted-foreground" dir="rtl">{request.companyNameAr}</p>
            <div className="flex items-center gap-2 mt-2">
              <StatusBadge variant="warning" size="sm">
                <Clock className="w-3 h-3" />
                Pending Review
              </StatusBadge>
              <StatusBadge variant="neutral" size="sm">
                {request.type === "supplier" ? "Supplier" : "Contractor"}
              </StatusBadge>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">CR Number</span>
          <span className="font-medium tabular-nums">{request.crNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Contact</span>
          <span className="font-medium">{request.contactName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Submitted</span>
          <span className="font-medium">{request.submittedAt}</span>
        </div>
        {request.categories && (
          <div className="flex flex-wrap gap-1 pt-2">
            {request.categories.map((cat) => (
              <StatusBadge key={cat} variant="neutral" size="sm">
                {cat}
              </StatusBadge>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-4 pt-4 border-t border-border">
        <Button variant="outline" className="flex-1" onClick={() => handleReview(request)}>
          <Eye className="w-4 h-4 me-2" />
          Review
        </Button>
      </div>
    </div>
  );

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
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Pending Approvals</h1>
              <p className="text-muted-foreground mt-1">
                Review KYB applications from suppliers and contractors
              </p>
            </div>
          </div>
          <StatusBadge variant="warning" className="text-lg px-4 py-2">
            {mockKYBRequests.length} Pending
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
                <p className="text-2xl font-bold tabular-nums">{mockKYBRequests.length}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
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
                <p className="text-sm text-muted-foreground">Suppliers</p>
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
                <p className="text-sm text-muted-foreground">Contractors</p>
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
                <p className="text-sm text-muted-foreground">Approved MTD</p>
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
                placeholder="Search by company name, CR number, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px]">
                <Filter className="w-4 h-4 me-2" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="supplier">Suppliers</SelectItem>
                <SelectItem value="contractor">Contractors</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Requests Tabs */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All ({filteredRequests.length})</TabsTrigger>
            <TabsTrigger value="suppliers">Suppliers ({supplierRequests.length})</TabsTrigger>
            <TabsTrigger value="contractors">Contractors ({contractorRequests.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
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
            <p className="font-medium text-foreground">All caught up!</p>
            <p className="text-sm text-muted-foreground mt-1">
              No pending approvals at the moment
            </p>
          </div>
        )}
      </div>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>KYB Application Review</DialogTitle>
            <DialogDescription>
              Verify the business documents and approve or reject the application
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="flex-1 grid md:grid-cols-2 gap-6 overflow-hidden">
              {/* Document Preview */}
              <div className="bg-muted rounded-lg flex flex-col">
                <div className="px-4 py-3 border-b border-border">
                  <span className="text-sm font-medium">Uploaded Documents</span>
                </div>
                <div className="flex-1 p-4 space-y-3">
                  {selectedRequest.documents.map((doc, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-background rounded-lg border border-border"
                    >
                      <FileText className="w-5 h-5 text-primary" />
                      <span className="flex-1 text-sm font-medium">{doc}</span>
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4 me-1" />
                        View
                      </Button>
                    </div>
                  ))}
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
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">CR Number</p>
                        <p className="font-medium tabular-nums">{selectedRequest.crNumber}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">VAT Number</p>
                        <p className="font-medium tabular-nums">{selectedRequest.vatNumber}</p>
                      </div>
                    </div>
                    {selectedRequest.categories && (
                      <div>
                        <p className="text-xs text-muted-foreground">Categories</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedRequest.categories.map((cat) => (
                            <StatusBadge key={cat} variant="neutral" size="sm">
                              {cat}
                            </StatusBadge>
                          ))}
                        </div>
                      </div>
                    )}
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
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="font-medium tabular-nums">{selectedRequest.contactPhone}</p>
                    </div>
                  </div>
                </div>

                {isRejecting && (
                  <div className="space-y-2">
                    <Label className="text-danger">Rejection Reason *</Label>
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
                  <XCircle className="w-4 h-4 me-2" />
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
                  <XCircle className="w-4 h-4 me-2" />
                  Reject
                </Button>
                <Button onClick={handleApprove} className="bg-success hover:bg-success/90 text-success-foreground">
                  <CheckCircle className="w-4 h-4 me-2" />
                  Approve
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
