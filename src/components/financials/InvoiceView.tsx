import { Download, Printer, Mail, QrCode, FileText, Building2, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  orderId: string;
  status: "draft" | "sent" | "paid" | "overdue";
  // Supplier (Seller)
  seller: {
    name: string;
    nameAr: string;
    crNumber: string;
    vatNumber: string;
    address: string;
    phone: string;
    email: string;
  };
  // Buyer
  buyer: {
    name: string;
    nameAr: string;
    crNumber: string;
    vatNumber: string;
    address: string;
    phone: string;
    project: string;
  };
  lineItems: InvoiceLineItem[];
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  // ZATCA QR Code data for KSA compliance (FR-E02)
  zatcaQrCode?: string;
}

interface InvoiceViewProps {
  invoice: InvoiceData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusConfig = {
  draft: { color: "neutral", label: "Draft" },
  sent: { color: "primary", label: "Sent" },
  paid: { color: "success", label: "Paid" },
  overdue: { color: "danger", label: "Overdue" },
} as const;

export function InvoiceView({ invoice, open, onOpenChange }: InvoiceViewProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // In production, would generate PDF
    console.log("Downloading invoice:", invoice.invoiceNumber);
  };

  const handleEmail = () => {
    // In production, would send email
    console.log("Emailing invoice:", invoice.invoiceNumber);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Invoice {invoice.invoiceNumber}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleEmail}>
              <Mail className="w-4 h-4 me-2" />
              Email
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="w-4 h-4 me-2" />
              Print
            </Button>
            <Button size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4 me-2" />
              Download PDF
            </Button>
          </div>
        </DialogHeader>

        {/* Invoice Content - Printable */}
        <div className="bg-white rounded-lg border border-border p-8 print:border-0 print:p-0">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-2xl font-bold text-foreground">فاتورة ضريبية</h1>
              <p className="text-lg text-muted-foreground">TAX INVOICE</p>
            </div>
            <StatusBadge variant={statusConfig[invoice.status].color as any}>
              {statusConfig[invoice.status].label}
            </StatusBadge>
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Invoice Number</p>
              <p className="font-semibold tabular-nums">{invoice.invoiceNumber}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Invoice Date</p>
              <p className="font-semibold tabular-nums">{invoice.invoiceDate}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Due Date</p>
              <p className="font-semibold tabular-nums">{invoice.dueDate}</p>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Seller & Buyer Info */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Seller */}
            <div className="bg-muted/30 rounded-lg p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">FROM (SELLER)</p>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Building2 className="w-4 h-4 text-muted-foreground mt-1 shrink-0" />
                  <div>
                    <p className="font-semibold">{invoice.seller.name}</p>
                    <p className="text-sm text-muted-foreground" dir="rtl">{invoice.seller.nameAr}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-1 shrink-0" />
                  <p className="text-sm">{invoice.seller.address}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                  <p className="text-sm tabular-nums">{invoice.seller.phone}</p>
                </div>
                <div className="pt-2 space-y-1 text-sm">
                  <p><span className="text-muted-foreground">CR:</span> {invoice.seller.crNumber}</p>
                  <p><span className="text-muted-foreground">VAT:</span> {invoice.seller.vatNumber}</p>
                </div>
              </div>
            </div>

            {/* Buyer */}
            <div className="bg-muted/30 rounded-lg p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">TO (BUYER)</p>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Building2 className="w-4 h-4 text-muted-foreground mt-1 shrink-0" />
                  <div>
                    <p className="font-semibold">{invoice.buyer.name}</p>
                    <p className="text-sm text-muted-foreground" dir="rtl">{invoice.buyer.nameAr}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-1 shrink-0" />
                  <p className="text-sm">{invoice.buyer.address}</p>
                </div>
                <div className="pt-2 space-y-1 text-sm">
                  <p><span className="text-muted-foreground">CR:</span> {invoice.buyer.crNumber}</p>
                  <p><span className="text-muted-foreground">VAT:</span> {invoice.buyer.vatNumber}</p>
                  <p><span className="text-muted-foreground">Project:</span> {invoice.buyer.project}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-border rounded-lg overflow-hidden mb-6">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-start p-3 text-sm font-medium text-muted-foreground">#</th>
                  <th className="text-start p-3 text-sm font-medium text-muted-foreground">Description</th>
                  <th className="text-center p-3 text-sm font-medium text-muted-foreground">Qty</th>
                  <th className="text-center p-3 text-sm font-medium text-muted-foreground">Unit</th>
                  <th className="text-end p-3 text-sm font-medium text-muted-foreground">Unit Price</th>
                  <th className="text-end p-3 text-sm font-medium text-muted-foreground">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lineItems.map((item, index) => (
                  <tr key={item.id} className="border-t border-border">
                    <td className="p-3 text-sm tabular-nums">{index + 1}</td>
                    <td className="p-3 text-sm font-medium">{item.description}</td>
                    <td className="p-3 text-sm text-center tabular-nums">{item.quantity}</td>
                    <td className="p-3 text-sm text-center">{item.unit}</td>
                    <td className="p-3 text-sm text-end tabular-nums">SAR {item.unitPrice.toFixed(2)}</td>
                    <td className="p-3 text-sm text-end tabular-nums font-medium">SAR {item.totalPrice.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-72 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="tabular-nums">SAR {invoice.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">VAT ({invoice.vatRate}%)</span>
                <span className="tabular-nums">SAR {invoice.vatAmount.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total / المجموع</span>
                <span className="text-primary tabular-nums">SAR {invoice.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* ZATCA QR Code - FR-E02 KSA Compliance */}
          {invoice.zatcaQrCode && (
            <div className="border-t border-border pt-6 flex items-center gap-4">
              <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center">
                <QrCode className="w-16 h-16 text-muted-foreground" />
              </div>
              <div className="text-sm">
                <p className="font-medium">ZATCA Compliant Invoice</p>
                <p className="text-muted-foreground">
                  Scan QR code to verify invoice authenticity
                </p>
                <p className="text-xs text-muted-foreground mt-1" dir="rtl">
                  فاتورة متوافقة مع هيئة الزكاة والضريبة والجمارك
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
