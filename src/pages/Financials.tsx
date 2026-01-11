import { useState } from "react";
import { FileText, CreditCard, Wallet, Receipt, Download, Eye, Upload } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WalletLedger } from "@/components/financials/WalletLedger";
import { InvoiceView } from "@/components/financials/InvoiceView";
import { PaymentUpload } from "@/components/financials/PaymentUpload";
import { useLanguage } from "@/contexts/LanguageContext";

// Mock data for invoices
const mockInvoices = [
  {
    invoiceNumber: "INV-2024-00123",
    invoiceDate: "2024-01-15",
    dueDate: "2024-02-14",
    orderId: "ORD-2024-0845",
    status: "sent" as const,
    seller: {
      name: "Saudi Ceramics",
      nameAr: "السيراميك السعودي",
      crNumber: "1010234567",
      vatNumber: "300012345600003",
      address: "Industrial City, Riyadh 12345",
      phone: "+966 11 456 7890",
      email: "sales@saudiceramics.com",
    },
    buyer: {
      name: "BuildPro Construction LLC",
      nameAr: "بيلد برو للمقاولات",
      crNumber: "1010123456",
      vatNumber: "300098765400001",
      address: "King Fahd Road, Olaya District, Riyadh",
      phone: "+966 50 123 4567",
      project: "King Abdullah Financial District",
    },
    lineItems: [
      { id: "1", description: "Portland Cement Type I - 50kg bags", quantity: 5000, unit: "Bags", unitPrice: 45, totalPrice: 225000 },
    ],
    subtotal: 225000,
    vatRate: 15,
    vatAmount: 33750,
    total: 258750,
    zatcaQrCode: "base64encodedqrcode",
  },
  {
    invoiceNumber: "INV-2024-00122",
    invoiceDate: "2024-01-10",
    dueDate: "2024-02-09",
    orderId: "ORD-2024-0843",
    status: "paid" as const,
    seller: {
      name: "Gulf Electrical Co.",
      nameAr: "شركة الخليج الكهربائية",
      crNumber: "1010567890",
      vatNumber: "300045678900002",
      address: "Industrial Area, Jeddah 21442",
      phone: "+966 12 987 6543",
      email: "info@gulfelectrical.com",
    },
    buyer: {
      name: "BuildPro Construction LLC",
      nameAr: "بيلد برو للمقاولات",
      crNumber: "1010123456",
      vatNumber: "300098765400001",
      address: "King Fahd Road, Olaya District, Riyadh",
      phone: "+966 50 123 4567",
      project: "Al-Faisaliah Tower",
    },
    lineItems: [
      { id: "1", description: "Power Cable 4x25mm", quantity: 2000, unit: "Meters", unitPrice: 65, totalPrice: 130000 },
      { id: "2", description: "PVC Conduit 25mm", quantity: 1000, unit: "Meters", unitPrice: 26, totalPrice: 26000 },
    ],
    subtotal: 156000,
    vatRate: 15,
    vatAmount: 23400,
    total: 179400,
    zatcaQrCode: "base64encodedqrcode",
  },
];

const mockTransactions = [
  { id: "tx-1", type: "debit" as const, description: "Order Payment - Saudi Ceramics", orderId: "ORD-2024-0845", amount: 258750, balance: 8241250, date: "2024-01-18", status: "pending" as const },
  { id: "tx-2", type: "credit" as const, description: "Payment Received", invoiceId: "INV-2024-00122", amount: 179400, balance: 8500000, date: "2024-01-16", status: "completed" as const },
  { id: "tx-3", type: "debit" as const, description: "Order Payment - Gulf Electrical", orderId: "ORD-2024-0843", amount: 179400, balance: 8320600, date: "2024-01-10", status: "completed" as const },
  { id: "tx-4", type: "debit" as const, description: "Order Payment - Ezz Steel", orderId: "ORD-2024-0844", amount: 890000, balance: 8500000, date: "2024-01-14", status: "completed" as const },
];

export default function Financials() {
  const { t, isRTL } = useLanguage();
  const [selectedInvoice, setSelectedInvoice] = useState<typeof mockInvoices[0] | null>(null);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPaymentInvoice, setSelectedPaymentInvoice] = useState<typeof mockInvoices[0] | null>(null);

  const pendingAmount = mockInvoices
    .filter((inv) => inv.status !== "paid")
    .reduce((sum, inv) => sum + inv.total, 0);

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
                <p className="text-2xl font-bold tabular-nums">{mockInvoices.length}</p>
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
                  SAR {mockInvoices.filter(i => i.status === "paid").reduce((s, i) => s + i.total, 0).toLocaleString()}
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
                    {mockInvoices.map((invoice, index) => (
                      <tr
                        key={invoice.invoiceNumber}
                        className="border-t border-border hover:bg-muted/30 transition-colors animate-fade-in"
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        <td className="p-3">
                          <p className="font-medium text-foreground">{invoice.invoiceNumber}</p>
                        </td>
                        <td className="p-3">
                          <p className="font-medium">{isRTL ? invoice.seller.nameAr : invoice.seller.name}</p>
                        </td>
                        <td className="p-3 text-muted-foreground">{invoice.orderId}</td>
                        <td className="p-3 text-muted-foreground tabular-nums">{invoice.invoiceDate}</td>
                        <td className="p-3 text-end font-semibold tabular-nums rtl:text-start">
                          SAR {invoice.total.toLocaleString()}
                        </td>
                        <td className="p-3 text-center">
                          <StatusBadge
                            variant={invoice.status === "paid" ? "success" : invoice.status === "sent" ? "primary" : "warning"}
                            size="sm"
                          >
                            {invoice.status === "paid" 
                              ? t("financials_page.status.paid") 
                              : invoice.status === "sent" 
                                ? t("financials_page.status.sent") 
                                : t("financials_page.status.draft")}
                          </StatusBadge>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedInvoice(invoice);
                                setShowInvoiceDialog(true);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Download className="w-4 h-4" />
                            </Button>
                            {invoice.status !== "paid" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedPaymentInvoice(invoice);
                                  setShowPaymentDialog(true);
                                }}
                              >
                                <Upload className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Wallet Tab */}
          <TabsContent value="wallet">
            <WalletLedger
              companyName={isRTL ? "بيلد برو للمقاولات" : "BuildPro Construction LLC"}
              totalSpent={12500000}
              outstandingDues={pendingAmount}
              transactions={mockTransactions}
            />
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
