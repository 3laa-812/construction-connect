import { useEffect, useState } from "react";
import { Download, Printer, Mail, FileText, Building2, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import QRCode from "qrcode";

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
  currency?: string;
  // ZATCA QR Code data for KSA compliance (FR-E02)
  zatcaQrCode?: string;
}

interface InvoiceViewProps {
  invoice: InvoiceData;
  /** Server invoice UUID — enables real PDF download. */
  invoiceId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusConfig = {
  draft: { color: "neutral", label: "Draft" },
  sent: { color: "primary", label: "Sent" },
  paid: { color: "success", label: "Paid" },
  overdue: { color: "danger", label: "Overdue" },
} as const;

export function InvoiceView({ invoice, invoiceId, open, onOpenChange }: InvoiceViewProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const cur = invoice.currency || "SAR";

  useEffect(() => {
    let cancelled = false;
    const tlv = invoice.zatcaQrCode;
    if (!tlv) {
      setQrDataUrl(null);
      return;
    }
    QRCode.toDataURL(tlv, { width: 160, margin: 1 })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [invoice.zatcaQrCode]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (invoiceId) {
      try {
        const res = await api.get<{ url: string }>(`/invoices/${invoiceId}/pdf`);
        window.open(res.data.url, "_blank", "noopener,noreferrer");
        return;
      } catch {
        /* fall back */
      }
    }
    handleDownloadTextFallback();
  };

  const handleDownloadTextFallback = () => {
    // Lightweight "download" until backend PDF endpoint exists:
    // create a simple text snapshot so the button does something useful.
    const content = [
      `Invoice ${invoice.invoiceNumber}`,
      `Status: ${invoice.status}`,
      `Invoice Date: ${invoice.invoiceDate}`,
      `Due Date: ${invoice.dueDate}`,
      `Order ID: ${invoice.orderId}`,
      ``,
      `Seller: ${invoice.seller.name} (CR: ${invoice.seller.crNumber}, VAT: ${invoice.seller.vatNumber})`,
      `Buyer: ${invoice.buyer.name} (CR: ${invoice.buyer.crNumber}, VAT: ${invoice.buyer.vatNumber})`,
      ``,
      `Subtotal: ${invoice.subtotal}`,
      `VAT (${invoice.vatRate}%): ${invoice.vatAmount}`,
      `Total: ${invoice.total}`,
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice-${invoice.invoiceNumber || invoiceId || "export"}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`Invoice ${invoice.invoiceNumber}`);
    const body = encodeURIComponent(
      `Invoice ${invoice.invoiceNumber}\n\nTotal: ${cur} ${invoice.total}\nDue: ${invoice.dueDate}\nOrder: ${invoice.orderId}\n\n`
    );
    // No recipient available in data yet; open mail client.
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
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
            <Button size="sm" onClick={handleDownloadPdf}>
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
                    <td className="p-3 text-sm text-end tabular-nums">{cur} {item.unitPrice.toFixed(2)}</td>
                    <td className="p-3 text-sm text-end tabular-nums font-medium">{cur} {item.totalPrice.toFixed(2)}</td>
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
                <span className="tabular-nums">{cur} {invoice.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">VAT ({invoice.vatRate}%)</span>
                <span className="tabular-nums">{cur} {invoice.vatAmount.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total / المجموع</span>
                <span className="text-primary tabular-nums">{cur} {invoice.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* ZATCA QR Code - FR-E02 KSA Compliance */}
          {invoice.zatcaQrCode && qrDataUrl && (
            <div className="border-t border-border pt-6 flex items-center gap-4">
              <div className="w-40 h-40 bg-white rounded-lg flex items-center justify-center border border-border p-1">
                <img src={qrDataUrl} alt="ZATCA QR" className="w-full h-full object-contain" />
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
