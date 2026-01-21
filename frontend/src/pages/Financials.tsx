import { useMemo, useState } from "react";
import { FileText, CreditCard, Wallet, Receipt, Download, Eye, Upload } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WalletLedger } from "@/components/financials/WalletLedger";
import { InvoiceView } from "@/components/financials/InvoiceView";
import { PaymentUpload } from "@/components/financials/PaymentUpload";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

type ApiTransaction = {
  id: string;
  type: "DEPOSIT" | "WITHDRAWAL" | "PAYMENT" | "REFUND";
  amount: number | string;
  description?: string;
  reference?: string;
  invoice_id?: string;
  po_id?: string;
  created_at: string;
  wallet?: {
    balance: number | string;
    company?: { name?: string };
  };
  invoice?: { id?: string };
  purchase_order?: { id?: string };
};

type ApiWalletSummary = {
  wallet: {
    id: string;
    balance: number | string;
    currency: string;
    company?: { name?: string };
  };
  totalSpent: number;
  outstandingDues: number;
  recentTransactions: ApiTransaction[];
};

type ApiInvoice = {
  id: string;
  status?: string;
  total_amount?: number;
  created_at?: string;
  supplier?: { name?: string; commercial_reg_no?: string; tax_id?: string };
  buyer?: { name?: string; commercial_reg_no?: string; tax_id?: string };
};

type AdaptedInvoice = {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  orderId: string;
  total: number;
  status: string;
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  lineItems: Array<{
    id: string;
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalPrice: number;
  }>;
  seller: {
    name: string;
    nameAr: string;
    crNumber: string;
    vatNumber: string;
    address: string;
    phone: string;
    email: string;
  };
  buyer: {
    name: string;
    nameAr: string;
    crNumber: string;
    vatNumber: string;
    address: string;
    phone: string;
    project: string;
  };
};

const InvoiceRow = ({ invoice, onSelect, onPayment }: { invoice: AdaptedInvoice & { rawStatus: string; id: string }; onSelect: (inv: any) => void, onPayment: (inv: any) => void }) => {
    const { t, isRTL } = useLanguage();
    const adapted = invoice;

    return (
        <tr className="border-t border-border hover:bg-muted/30 transition-colors animate-fade-in">
        <td className="p-3">
            <p className="font-medium text-foreground">{adapted.invoiceNumber}</p>
        </td>
        <td className="p-3">
            <p className="font-medium">{isRTL ? adapted.seller.nameAr : adapted.seller.name}</p>
        </td>
        <td className="p-3 text-muted-foreground">{adapted.orderId}</td>
        <td className="p-3 text-muted-foreground tabular-nums">{adapted.invoiceDate}</td>
        <td className="p-3 text-end font-semibold tabular-nums rtl:text-start">
            SAR {invoice.total_amount?.toLocaleString() || '0'}
        </td>
        <td className="p-3 text-center">
            <StatusBadge
            variant={adapted.status === "paid" ? "success" : adapted.status === "sent" ? "primary" : "warning"}
            size="sm"
            >
            {adapted.status === "paid" 
                ? t("financials_page.status.paid") 
                : adapted.status === "sent" 
                ? t("financials_page.status.sent") 
                : t("financials_page.status.draft")}
            </StatusBadge>
        </td>
        <td className="p-3">
            <div className="flex items-center justify-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => onSelect(adapted)}>
                <Eye className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon">
                <Download className="w-4 h-4" />
            </Button>
            {adapted.status !== "paid" && (
                <Button variant="ghost" size="icon" onClick={() => onPayment(adapted)}>
                <Upload className="w-4 h-4" />
                </Button>
            )}
            </div>
        </td>
        </tr>
    );
};

function Financials() {
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null); // Using any for adapted type
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPaymentInvoice, setSelectedPaymentInvoice] = useState<any | null>(null);

  const { data, isLoading, isError } = useQuery<ApiInvoice[]>({
    queryKey: ["invoices"],
    queryFn: async () => {
      const response = await api.get("/invoices");
      return response.data;
    },
  });

  // Fetch wallet summary
  const { data: walletSummary, isLoading: isLoadingWallet } = useQuery<ApiWalletSummary>({
    queryKey: ["wallet-summary", user?.companyId],
    queryFn: async () => {
      if (!user?.companyId) throw new Error("Company ID not found");
      const response = await api.get(`/wallets/company/${user.companyId}/summary`);
      return response.data;
    },
    enabled: !!user?.companyId,
  });

  // Transform backend transactions to WalletLedger format
  const adaptedTransactions = useMemo(() => {
    if (!walletSummary?.recentTransactions) return [];
    
    let runningBalance = Number(walletSummary.wallet.balance);
    
    return walletSummary.recentTransactions.map((tx) => {
      const txAmount = Number(tx.amount);
      const txType = tx.type === "DEPOSIT" || tx.type === "REFUND" ? "credit" : "debit";
      
      // Calculate balance (assuming transactions are ordered newest first, so we reverse)
      // Actually, we'll calculate from the wallet balance going backwards
      if (txType === "credit") {
        runningBalance -= txAmount; // Subtract credit to get previous balance
      } else {
        runningBalance += txAmount; // Add debit to get previous balance
      }
      
      const description = tx.description || 
        (tx.type === "PAYMENT" && tx.purchase_order 
          ? `Order Payment - ${tx.purchase_order.id.substring(0, 8)}`
          : tx.type === "DEPOSIT" && tx.invoice
          ? `Payment Received - ${tx.invoice.id.substring(0, 8)}`
          : tx.type);

      return {
        id: tx.id,
        type: txType as "credit" | "debit",
        description,
        orderId: tx.po_id?.substring(0, 8) || undefined,
        invoiceId: tx.invoice_id?.substring(0, 8) || undefined,
        amount: txAmount,
        balance: runningBalance + (txType === "credit" ? txAmount : -txAmount), // Current balance after this tx
        date: new Date(tx.created_at).toISOString().split("T")[0],
        status: "completed" as const, // Backend doesn't have status field yet, default to completed
      };
    }).reverse(); // Reverse to show oldest first (for balance calculation)
  }, [walletSummary]);

  const invoices = useMemo(() => {
    if (!data) return [];
    return data.map((invoice) => {
      const createdAt = invoice.created_at ? new Date(invoice.created_at) : new Date();
      return {
        id: invoice.id,
        invoiceNumber: invoice.id.substring(0, 8).toUpperCase(),
        invoiceDate: createdAt.toLocaleDateString(),
        dueDate: new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        orderId: invoice.id.substring(0, 8),
        total: Number(invoice.total_amount || 0),
        subtotal: Number((invoice as any).subtotal || invoice.total_amount || 0),
        vatRate: 0.15,
        vatAmount: Number((invoice as any).vat_amount || 0),
        lineItems: [],
        status: (invoice.status || "draft").toString().toLowerCase(),
        rawStatus: (invoice.status || "draft").toString().toLowerCase(),
        seller: {
          name: invoice.supplier?.name || "Unknown",
          nameAr: invoice.supplier?.name || "Unknown",
          crNumber: invoice.supplier?.commercial_reg_no || "",
          vatNumber: invoice.supplier?.tax_id || "",
          address: "Riyadh, KSA",
          phone: "",
          email: "",
        },
        buyer: {
          name: invoice.buyer?.name || "Buyer",
          nameAr: invoice.buyer?.name || "Buyer",
          crNumber: invoice.buyer?.commercial_reg_no || "",
          vatNumber: invoice.buyer?.tax_id || "",
          address: "",
          phone: "",
          project: "Project",
        },
      };
    });
  }, [data]);

  const pendingAmount = invoices
    .filter((inv) => inv.rawStatus !== "cleared" && inv.rawStatus !== "paid")
    .reduce((sum, inv) => sum + (inv.total || 0), 0);
  
  const paidAmount = invoices
    .filter((inv) => inv.rawStatus === "cleared" || inv.rawStatus === "paid")
    .reduce((sum, inv) => sum + (inv.total || 0), 0);

  return (
    <AppLayout>
      <div className="p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">{t("financials_page.title")}</h1>
            <p className="text-muted-foreground mt-1">
              {t("financials_page.subtitle")}
            </p>
          </div>
        </div>

        <Tabs defaultValue="invoices" className="space-y-6">
          <TabsList>
            <TabsTrigger value="invoices" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              {t("financials_page.tabs.invoices")}
            </TabsTrigger>
            <TabsTrigger value="wallet" className="flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              {t("financials_page.tabs.wallet")}
            </TabsTrigger>
          </TabsList>

          {/* Invoices Tab */}
          <TabsContent value="invoices" className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <FileText className="w-4 h-4" />
                  <span className="text-xs uppercase tracking-wider">
                    {t("financials_page.summary.total_invoices")}
                  </span>
                </div>
                <p className="text-2xl font-bold tabular-nums">{invoices.length}</p>
              </div>
              <div className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 text-warning mb-2">
                  <Receipt className="w-4 h-4" />
                  <span className="text-xs uppercase tracking-wider">
                    {t("financials_page.summary.pending_payment")}
                  </span>
                </div>
                <p className="text-2xl font-bold text-warning tabular-nums">
                  SAR {pendingAmount.toLocaleString()}
                </p>
              </div>
              <div className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 text-success mb-2">
                  <CreditCard className="w-4 h-4" />
                  <span className="text-xs uppercase tracking-wider">
                    {t("financials_page.summary.paid_this_month")}
                  </span>
                </div>
                <p className="text-2xl font-bold text-success tabular-nums">
                  SAR {paidAmount.toLocaleString()}
                </p>
              </div>
              <div className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 text-danger mb-2">
                  <Receipt className="w-4 h-4" />
                  <span className="text-xs uppercase tracking-wider">
                    {t("financials_page.summary.overdue")}
                  </span>
                </div>
                <p className="text-2xl font-bold text-danger tabular-nums">
                  SAR 0
                </p>
              </div>
            </div>

            {/* Invoices Table */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-start p-3 text-sm font-medium text-muted-foreground rtl:text-right">
                        {t("financials_page.table.invoice")}
                      </th>
                      <th className="text-start p-3 text-sm font-medium text-muted-foreground rtl:text-right">
                        {t("financials_page.table.supplier")}
                      </th>
                      <th className="text-start p-3 text-sm font-medium text-muted-foreground rtl:text-right">
                        {t("financials_page.table.order")}
                      </th>
                      <th className="text-start p-3 text-sm font-medium text-muted-foreground rtl:text-right">
                        {t("common.date")}
                      </th>
                      <th className="text-end p-3 text-sm font-medium text-muted-foreground rtl:text-left">
                        {t("common.amount")}
                      </th>
                      <th className="text-center p-3 text-sm font-medium text-muted-foreground">
                        {t("common.status")}
                      </th>
                      <th className="text-center p-3 text-sm font-medium text-muted-foreground">
                        {t("common.actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-muted-foreground">
                          Loading invoices...
                        </td>
                      </tr>
                    ) : isError ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-danger">
                          Failed to load invoices
                        </td>
                      </tr>
                    ) : (
                      invoices.map((invoice) => (
                        <InvoiceRow 
                          key={invoice.id} 
                          invoice={invoice} 
                          onSelect={(inv) => {
                              setSelectedInvoice(inv);
                              setShowInvoiceDialog(true);
                          }}
                          onPayment={(inv) => {
                              setSelectedPaymentInvoice(inv);
                              setShowPaymentDialog(true);
                          }}
                        />
                      ))
                    )}
                    {!isLoading && !isError && invoices.length === 0 && (
                        <tr>
                            <td colSpan={7} className="p-8 text-center text-muted-foreground">
                                No invoices found.
                            </td>
                        </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Wallet Tab */}
          <TabsContent value="wallet">
            {isLoadingWallet ? (
              <div className="bg-card rounded-xl border border-border p-12 text-center">
                <p className="text-muted-foreground">Loading wallet data...</p>
              </div>
            ) : walletSummary ? (
              <WalletLedger
                companyName={walletSummary.wallet.company?.name || user?.companyName || (isRTL ? "بيلد برو للمقاولات" : "BuildPro Construction LLC")}
                totalSpent={walletSummary.totalSpent}
                outstandingDues={walletSummary.outstandingDues}
                transactions={adaptedTransactions}
              />
            ) : (
              <div className="bg-card rounded-xl border border-border p-12 text-center">
                <p className="text-muted-foreground">No wallet data available</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Invoice View Dialog */}
      {selectedInvoice && (
        <InvoiceView
          invoice={selectedInvoice}
          open={showInvoiceDialog}
          onOpenChange={setShowInvoiceDialog}
        />
      )}

      {/* Payment Upload Dialog */}
      {selectedPaymentInvoice && (
        <PaymentUpload
          orderId={selectedPaymentInvoice.orderId}
          invoiceNumber={selectedPaymentInvoice.invoiceNumber}
          amount={selectedPaymentInvoice.total}
          open={showPaymentDialog}
          onOpenChange={setShowPaymentDialog}
        />
      )}
    </AppLayout>
  );
}

export default Financials;
