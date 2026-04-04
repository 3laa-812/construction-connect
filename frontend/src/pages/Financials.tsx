import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageShell } from "@/components/layout/PageShell";
import { Wallet, Receipt, ArrowDownToLine, Eye, AlertCircle, FileText } from "lucide-react";
import { InvoicePreview } from "@/components/financials/InvoicePreview";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";

type ApiInvoice = {
  id: string;
  status?: string;
  subtotal?: number | string;
  vat_rate?: number | string;
  vat_amount?: number | string;
  total_amount?: number | string;
  currency?: string;
  issue_date?: string | null;
  due_date?: string | null;
  qr_code_data?: string | null;
  created_at?: string;
  purchase_order?: {
    id: string;
    project?: { name?: string };
    items?: Array<{
      id: string;
      item_description?: string | null;
      ordered_qty?: number | string | null;
      unit_price?: number | string | null;
    }>;
  };
  supplier?: { name?: string; commercial_reg_no?: string; tax_id?: string };
  buyer?: { name?: string; commercial_reg_no?: string; tax_id?: string; country?: string };
};

type AdaptedInvoice = {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  orderId: string;
  total: number;
  status: "draft" | "sent" | "paid" | "overdue";
  currency: string;
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  zatcaQrCode?: string;
  lineItems: Array<any>;
  seller: any;
  buyer: any;
  rawStatus: string;
};

function mapInvoiceUiStatus(raw: string | undefined): "draft" | "sent" | "paid" | "overdue" {
  const u = (raw || "DRAFT").toUpperCase();
  if (u === "OVERDUE") return "overdue";
  if (u === "ISSUED" || u === "SUBMITTED") return "sent";
  if (u === "CLEARED" || u === "REPORTED") return "paid";
  return "draft";
}

export default function Financials() {
  const { user } = useAuth();
  const [selectedInvoice, setSelectedInvoice] = useState<AdaptedInvoice | null>(null);

  const { data: walletSummary, isLoading: isLoadingWallet } = useQuery({
    queryKey: ["wallet-summary", user?.companyId],
    queryFn: async () => {
      const resp = await api.get(`/wallets/company/${user?.companyId}/summary`);
      return resp.data;
    },
    enabled: !!user?.companyId,
  });

  const { data: rawInvoices, isLoading: isLoadingInvoices } = useQuery<ApiInvoice[]>({
    queryKey: ["invoices"],
    queryFn: async () => (await api.get("/invoices")).data,
  });

  const invoices = useMemo(() => {
    if (!rawInvoices) return [];
    return rawInvoices.map((inv): AdaptedInvoice => {
      const createdAt = inv.issue_date ? new Date(inv.issue_date) : inv.created_at ? new Date(inv.created_at) : new Date();
      const due = inv.due_date ? new Date(inv.due_date) : new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);
      const isOverdue = due < new Date() && mapInvoiceUiStatus(inv.status) !== "paid";
      
      const status = isOverdue ? "overdue" : mapInvoiceUiStatus(inv.status);
      
      return {
        id: inv.id,
        invoiceNumber: inv.id.substring(0, 8).toUpperCase(),
        invoiceDate: createdAt.toLocaleDateString(),
        dueDate: due.toLocaleDateString(),
        orderId: inv.purchase_order?.id ? inv.purchase_order.id.substring(0, 8) : "—",
        total: Number(inv.total_amount || 0),
        subtotal: Number(inv.subtotal || inv.total_amount || 0),
        vatRate: Number(inv.vat_rate != null ? Number(inv.vat_rate) * 100 : 15),
        vatAmount: Number(inv.vat_amount || 0),
        currency: inv.currency || "SAR",
        status,
        rawStatus: (inv.status || "DRAFT").toString(),
        zatcaQrCode: inv.qr_code_data || undefined,
        lineItems: inv.purchase_order?.items?.map(it => ({
          id: it.id,
          description: it.item_description || "Item",
          quantity: Number(it.ordered_qty || 0),
          unit: "unit",
          unitPrice: Number(it.unit_price || 0),
          totalPrice: Number(it.ordered_qty || 0) * Number(it.unit_price || 0),
        })) || [],
        seller: {
          name: inv.supplier?.name || "Unknown Supplier",
          nameAr: inv.supplier?.name || "Unknown Supplier",
          crNumber: inv.supplier?.commercial_reg_no || "-",
          vatNumber: inv.supplier?.tax_id || "-",
          address: "Riyadh, KSA",
          phone: "+966 50 000 0000",
          email: "finance@supplier.com",
        },
        buyer: {
          name: inv.buyer?.name || "Buyer Company Ltd",
          nameAr: inv.buyer?.name || "شركة المشتري",
          crNumber: inv.buyer?.commercial_reg_no || "-",
          vatNumber: inv.buyer?.tax_id || "-",
          address: "Jeddah, KSA",
          phone: "+966 50 111 1111",
          project: inv.purchase_order?.project?.name || "Main Project",
        }
      };
    });
  }, [rawInvoices]);

  const outstanding = invoices.filter(i => i.status !== "paid").reduce((s, i) => s + i.total, 0);
  const totalSpent = walletSummary?.totalSpent || invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.total, 0);
  const thisMonthSpent = walletSummary?.recentTransactions?.reduce((sum: number, tx: any) => sum + Number(tx.amount || 0), 0) || 0;

  return (
    <AppLayout>
      <PageShell 
        title="Financials" 
        subtitle="Manage your payables, track invoices, and analyze spending."
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)] min-h-[700px]">
          
          {/* Left Panel: Wallet & Invoice List (40%) */}
          <div className="lg:col-span-5 flex flex-col gap-6 h-full">
            
            {/* Wallet Card */}
            <div className="bg-surface rounded-md border border-border border-t-[3px] border-t-amber p-6 shadow-sm shrink-0">
              <div className="flex items-center gap-2 mb-6">
                <Wallet className="w-5 h-5 text-text-2" />
                <h2 className="text-[14px] font-medium text-text-1">Company Wallet</h2>
              </div>
              
              <div className="mb-6">
                <p className="text-[12px] text-text-3 uppercase tracking-wide mb-1">Total Spent</p>
                {isLoadingWallet ? (
                  <Skeleton className="h-10 w-48" />
                ) : (
                  <p className="text-3xl font-mono text-text-1 font-semibold">
                    SAR {totalSpent.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                )}
              </div>

              <div className="flex gap-8 border-t border-border pt-4">
                <div>
                  <p className="text-[12px] text-text-3 mb-1">Outstanding</p>
                  <p className="text-[15px] font-mono text-text-1 font-medium">SAR {outstanding.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[12px] text-text-3 mb-1">This month</p>
                  <p className="text-[15px] font-mono text-text-1 font-medium">SAR {thisMonthSpent.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Invoices List */}
            <div className="bg-surface rounded-md border border-border flex-1 flex flex-col min-h-0">
              <div className="p-4 border-b border-border bg-surface-2 shrink-0 flex items-center justify-between">
                <h3 className="font-medium text-text-1 text-[14px]">Invoices</h3>
                <span className="text-[11px] font-mono font-medium text-text-3 bg-ground px-2 py-0.5 rounded-full border border-border">
                  {invoices.length} total
                </span>
              </div>
              <div className="overflow-y-auto flex-1 p-2 space-y-1">
                {isLoadingInvoices ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="p-3 border border-border rounded-md mb-2">
                       <Skeleton className="h-4 w-3/4 mb-2" />
                       <Skeleton className="h-4 w-1/2" />
                    </div>
                  ))
                ) : invoices.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-text-3">
                    <Receipt className="w-8 h-8 mb-3 opacity-20" />
                    <p className="text-[13px]">No invoices recorded.</p>
                  </div>
                ) : invoices.map((invoice) => (
                  <div 
                    key={invoice.id}
                    onClick={() => setSelectedInvoice(invoice)}
                    className={`p-3 rounded-md border cursor-pointer transition-colors flex flex-col gap-2
                      ${selectedInvoice?.id === invoice.id 
                        ? "bg-amber-glow border-amber" 
                        : "bg-surface border-transparent hover:border-border hover:bg-surface-2"}
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[13px] text-text-1 font-medium">{invoice.invoiceNumber}</span>
                        <StatusBadge variant={invoice.status === "paid" ? "success" : invoice.status === "overdue" ? "danger" : "warning"} size="sm">
                          {invoice.status.toUpperCase()}
                        </StatusBadge>
                      </div>
                      <span className={`font-mono text-[13px] font-medium ${invoice.status === "overdue" ? "text-[#E5484D]" : "text-text-1"}`}>
                        {invoice.currency} {invoice.total.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[12px] text-text-3">
                      <span>{invoice.seller.name.substring(0, 20)}...</span>
                      <span>PO #{invoice.orderId}</span>
                      <span>{invoice.invoiceDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Panel: Invoice Detail / PDF (60%) */}
          <div className="lg:col-span-7 h-full">
            {selectedInvoice ? (
              <InvoicePreview invoice={selectedInvoice} invoiceId={selectedInvoice.id} />
            ) : (
              <div className="bg-surface rounded-md border border-border h-full flex flex-col items-center justify-center text-text-3 p-8 text-center">
                <FileText className="w-12 h-12 mb-4 opacity-10" />
                <h3 className="text-[18px] text-text-1 font-medium mb-2">No Invoice Selected</h3>
                <p className="text-[14px]">Select an invoice from the list on the left to view its details, print, or download a ZATCA-compliant PDF.</p>
              </div>
            )}
          </div>

        </div>
      </PageShell>
    </AppLayout>
  );
}
