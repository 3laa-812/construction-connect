import { useEffect, useState } from "react";
import { Download, Printer, Mail, FileText, Building2, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/ui/status-badge";
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
  lineItems: InvoiceLineItem[];
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  currency?: string;
  zatcaQrCode?: string;
}

interface InvoicePreviewProps {
  invoice: InvoiceData;
  invoiceId?: string;
}

const statusConfig = {
  draft: { color: "neutral", label: "Draft" },
  sent: { color: "primary", label: "Sent" },
  paid: { color: "success", label: "Paid" },
  overdue: { color: "danger", label: "Overdue" },
} as const;

export function InvoicePreview({ invoice, invoiceId }: InvoicePreviewProps) {
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
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div className="bg-surface rounded-lg border border-border flex flex-col h-full overflow-hidden">
      {/* Action Bar */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-surface-2 shrink-0">
        <h2 className="flex items-center gap-2 font-medium text-text-1">
          <FileText className="w-5 h-5 text-text-2" />
          Invoice {invoice.invoiceNumber}
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleEmail} className="h-8 shadow-none">
            <Mail className="w-4 h-4 mr-2" /> Email
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint} className="h-8 shadow-none hidden sm:flex">
            <Printer className="w-4 h-4 mr-2" /> Print
          </Button>
          <Button size="sm" onClick={handleDownloadPdf} className="h-8 shadow-none">
            <Download className="w-4 h-4 mr-2" /> Download PDF
          </Button>
        </div>
      </div>

      {/* Invoice Document (Scrollable) */}
      <div className="p-6 overflow-y-auto bg-white text-black flex-1">
        <div className="max-w-3xl mx-auto print:p-0">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-2xl font-bold">فاتورة ضريبية</h1>
              <p className="text-lg text-gray-500">TAX INVOICE</p>
            </div>
            <StatusBadge variant={statusConfig[invoice.status].color as any}>
              {statusConfig[invoice.status].label}
            </StatusBadge>
          </div>

          <div className="grid grid-cols-3 gap-6 mb-8 border-b border-gray-200 pb-8">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Invoice Number</p>
              <p className="font-semibold tabular-nums">{invoice.invoiceNumber}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Invoice Date</p>
              <p className="font-semibold tabular-nums">{invoice.invoiceDate}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Due Date</p>
              <p className="font-semibold tabular-nums">{invoice.dueDate}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 font-semibold">FROM (SELLER)</p>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Building2 className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold">{invoice.seller.name}</p>
                    <p className="text-sm text-gray-600" dir="rtl">{invoice.seller.nameAr}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <p>{invoice.seller.address}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                  <p className="tabular-nums">{invoice.seller.phone}</p>
                </div>
                <div className="pt-2 border-t border-gray-200 space-y-1 text-sm text-gray-700">
                  <p><span className="text-gray-500 w-12 inline-block">CR:</span> {invoice.seller.crNumber}</p>
                  <p><span className="text-gray-500 w-12 inline-block">VAT:</span> {invoice.seller.vatNumber}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 font-semibold">TO (BUYER)</p>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Building2 className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold">{invoice.buyer.name}</p>
                    <p className="text-sm text-gray-600" dir="rtl">{invoice.buyer.nameAr}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <p>{invoice.buyer.address}</p>
                </div>
                <div className="pt-2 border-t border-gray-200 space-y-1 text-sm text-gray-700">
                  <p><span className="text-gray-500 w-16 inline-block">CR:</span> {invoice.buyer.crNumber}</p>
                  <p><span className="text-gray-500 w-16 inline-block">VAT:</span> {invoice.buyer.vatNumber}</p>
                  <p><span className="text-gray-500 w-16 inline-block">Project:</span> {invoice.buyer.project}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden mb-8">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="p-3 text-xs font-semibold text-gray-600 uppercase tracking-wider w-8">#</th>
                  <th className="p-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Description</th>
                  <th className="text-center p-3 text-xs font-semibold text-gray-600 uppercase tracking-wider w-16">Qty</th>
                  <th className="text-center p-3 text-xs font-semibold text-gray-600 uppercase tracking-wider w-20">Unit</th>
                  <th className="text-right p-3 text-xs font-semibold text-gray-600 uppercase tracking-wider w-32">Unit Price</th>
                  <th className="text-right p-3 text-xs font-semibold text-gray-600 uppercase tracking-wider w-32">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoice.lineItems.map((item, index) => (
                  <tr key={item.id}>
                    <td className="p-3 text-sm text-gray-500 tabular-nums">{index + 1}</td>
                    <td className="p-3 text-sm font-medium text-gray-900">{item.description}</td>
                    <td className="p-3 text-sm text-center tabular-nums text-gray-700">{item.quantity}</td>
                    <td className="p-3 text-sm text-center text-gray-500">{item.unit}</td>
                    <td className="p-3 text-sm text-right tabular-nums text-gray-700">{cur} {item.unitPrice.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                    <td className="p-3 text-sm text-right tabular-nums font-medium text-gray-900">{cur} {item.totalPrice.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end mb-8">
            <div className="w-full sm:w-80 space-y-3 bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span className="tabular-nums font-medium">{cur} {invoice.subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>VAT ({invoice.vatRate}%)</span>
                <span className="tabular-nums font-medium">{cur} {invoice.vatAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              <div className="pt-3 border-t border-gray-300 flex justify-between font-bold text-lg text-gray-900">
                <span>Total / المجموع</span>
                <span className="tabular-nums">{cur} {invoice.total.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
            </div>
          </div>

          {invoice.zatcaQrCode && qrDataUrl && (
            <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="w-32 h-32 bg-white rounded flex flex-col items-center justify-center border border-gray-200 p-1 shrink-0">
                <img src={qrDataUrl} alt="ZATCA QR Code" className="w-full h-full object-contain" />
              </div>
              <div className="text-sm text-center sm:text-left">
                <p className="font-semibold text-gray-900">ZATCA Compliant Invoice</p>
                <p className="text-gray-500 mt-1">
                  Scan QR code with the official ZATCA app to verify this tax invoice's cryptographic signature and authenticity.
                </p>
                <p className="text-sm font-medium text-gray-700 mt-2" dir="rtl">
                  فاتورة ضريبية إلكترونية متوافقة مع متطلبات هيئة الزكاة والضريبة والجمارك
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
