import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Invoice, POStatus } from '@prisma/client';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { StorageService } from '../storage/storage.service';
import { buildZatcaPhase1TlvBase64 } from './zatca-tlv';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

const invoiceInclude = {
  supplier: true,
  buyer: true,
  purchase_order: {
    include: {
      project: true,
      items: true,
    },
  },
} as const;

function addDays(d: Date, days: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}

function decStr(d: Prisma.Decimal | null | undefined): string {
  if (d === null || d === undefined) return '0.00';
  return Number(d).toFixed(2);
}

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  /**
   * Called when a PO reaches DELIVERED. Idempotent per PO.
   */
  async createOnPoDelivered(poId: string): Promise<Invoice | null> {
    const existing = await this.prisma.invoice.findFirst({
      where: { po_id: poId },
    });
    if (existing) {
      return existing;
    }

    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: {
        project: true,
        items: true,
      },
    });

    if (!po || po.status !== POStatus.DELIVERED) {
      return null;
    }

    const buyer = await this.prisma.company.findUnique({
      where: { id: po.project.company_id },
    });
    const supplier = await this.prisma.company.findUnique({
      where: { id: po.supplier_id },
    });
    if (!buyer || !supplier) {
      this.logger.warn(`Missing buyer/supplier for PO ${poId}`);
      return null;
    }

    const country = (buyer.country || 'SA').toUpperCase();
    const vatRateNum = country === 'SA' ? 0.15 : 0.14;
    const currency = country === 'SA' ? 'SAR' : 'EGP';
    const subtotal = po.total_amount ?? new Prisma.Decimal(0);
    const vatRateDec = new Prisma.Decimal(vatRateNum);
    const vatAmountDec = subtotal.mul(vatRateDec);
    const totalAmountDec = subtotal.add(vatAmountDec);
    const issueDate = new Date();
    const creditDays = po.payment_terms === 'CREDIT' ? 30 : 0;
    const dueDate = addDays(issueDate, creditDays);

    const tlvBase64 = buildZatcaPhase1TlvBase64({
      sellerName: supplier.name,
      vatNumber: supplier.tax_id || '000000000000000',
      timestampIso: issueDate.toISOString(),
      totalWithVat: decStr(totalAmountDec),
      vatAmount: decStr(vatAmountDec),
    });

    return this.prisma.invoice.create({
      data: {
        purchase_order: { connect: { id: po.id } },
        buyer: { connect: { id: buyer.id } },
        supplier: { connect: { id: supplier.id } },
        subtotal,
        vat_rate: vatRateDec,
        vat_amount: vatAmountDec,
        total_amount: totalAmountDec,
        currency,
        issue_date: issueDate,
        due_date: dueDate,
        status: 'ISSUED',
        qr_code_data: tlvBase64,
      },
    });
  }

  async create(
    data: Prisma.InvoiceCreateInput,
    user: JwtPayload,
  ): Promise<Invoice> {
    const buyerId = (data.buyer as { connect?: { id: string } })?.connect?.id;
    const supplierId = (data.supplier as { connect?: { id: string } })?.connect
      ?.id;
    if (!buyerId || !supplierId) {
      throw new ForbiddenException('buyer and supplier are required');
    }
    if (user.role === 'ADMIN') {
      return this.prisma.invoice.create({ data });
    }
    if (!user.companyId) {
      throw new ForbiddenException();
    }
    if (buyerId !== user.companyId && supplierId !== user.companyId) {
      throw new ForbiddenException('Cannot create invoice for other parties');
    }
    return this.prisma.invoice.create({ data });
  }

  async findAll(user: JwtPayload): Promise<Invoice[]> {
    if (user.role === 'ADMIN') {
      return this.prisma.invoice.findMany({ include: invoiceInclude });
    }
    if (!user.companyId) {
      return [];
    }
    return this.prisma.invoice.findMany({
      where: {
        OR: [
          { buyer_id: user.companyId },
          { supplier_id: user.companyId },
        ],
      },
      include: invoiceInclude,
    });
  }

  async findOne(id: string, user: JwtPayload): Promise<Invoice | null> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: invoiceInclude,
    });
    if (!invoice) {
      return null;
    }
    await this.assertInvoiceAccess(user, invoice);
    return invoice;
  }

  async getPdfSignedUrl(
    id: string,
    user: JwtPayload,
  ): Promise<{ url: string }> {
    const invoice = await this.findOne(id, user);
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    let key = invoice.pdf_storage_key;
    if (!key) {
      key = await this.generateAndStorePdf(id);
    }

    const url = await this.storage.getSignedUrl(key);
    return { url };
  }

  private async generateAndStorePdf(invoiceId: string): Promise<string> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: invoiceInclude,
    });
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    const pdfBuffer = await this.buildInvoicePdfBuffer(invoice);
    try {
      const key = await this.storage.uploadBufferAndReturnKey(
        pdfBuffer,
        'application/pdf',
        'invoices',
      );
      await this.prisma.invoice.update({
        where: { id: invoiceId },
        data: { pdf_storage_key: key },
      });
      return key;
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException('Could not store invoice PDF');
    }
  }

  private async buildInvoicePdfBuffer(invoice: {
    id: string;
    subtotal: Prisma.Decimal | null;
    vat_rate: Prisma.Decimal | null;
    vat_amount: Prisma.Decimal | null;
    total_amount: Prisma.Decimal | null;
    currency: string | null;
    issue_date: Date | null;
    due_date: Date | null;
    qr_code_data: string | null;
    supplier: { name: string; tax_id: string | null };
    buyer: { name: string; tax_id: string | null };
    purchase_order: null | {
      id: string;
      items: Array<{
        item_description: string | null;
        ordered_qty: Prisma.Decimal | null;
        unit_price: Prisma.Decimal | null;
      }>;
    };
  }): Promise<Buffer> {
    const doc = new PDFDocument({ margin: 48, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));

    const po = invoice.purchase_order;
    const lines = po?.items ?? [];
    const sub = invoice.subtotal ?? new Prisma.Decimal(0);
    const vat = invoice.vat_amount ?? new Prisma.Decimal(0);
    const total = invoice.total_amount ?? new Prisma.Decimal(0);
    const currency = invoice.currency || 'SAR';

    doc.fontSize(18).text('Tax Invoice / Fatoora', { align: 'left' });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor('#444');
    doc.text('ZATCA Phase 1 — simplified tax invoice');
    doc.fillColor('#000');
    doc.moveDown();

    doc.fontSize(10);
    doc.text(`Invoice ID: ${invoice.id}`, { continued: false });
    if (invoice.issue_date) {
      doc.text(`Issue: ${invoice.issue_date.toISOString().slice(0, 10)}`);
    }
    if (invoice.due_date) {
      doc.text(`Due: ${invoice.due_date.toISOString().slice(0, 10)}`);
    }
    if (po?.id) {
      doc.text(`PO: ${po.id}`);
    }
    doc.moveDown();

    doc.fontSize(11).text('Seller', { underline: true });
    doc.fontSize(10).text(invoice.supplier.name);
    doc.text(`VAT: ${invoice.supplier.tax_id || '—'}`);
    doc.moveDown(0.5);

    doc.fontSize(11).text('Buyer', { underline: true });
    doc.fontSize(10).text(invoice.buyer.name);
    doc.text(`VAT: ${invoice.buyer.tax_id || '—'}`);
    doc.moveDown();

    doc.fontSize(11).text('Line items', { underline: true });
    doc.moveDown(0.3);
    let y = doc.y;
    doc.fontSize(9);
    for (let i = 0; i < lines.length; i++) {
      const li = lines[i];
      const desc = li.item_description || 'Item';
      const qty = Number(li.ordered_qty ?? 0);
      const unit = Number(li.unit_price ?? 0);
      const lineTotal = qty * unit;
      doc.text(`${i + 1}. ${desc}`, { indent: 8 });
      doc.text(
        `   ${qty} x ${unit.toFixed(2)} = ${lineTotal.toFixed(2)} ${currency}`,
        { indent: 16 },
      );
      y = doc.y;
    }
    if (lines.length === 0) {
      doc.text('(No PO line snapshot — total from PO header)');
    }

    doc.moveDown();
    doc.fontSize(10);
    doc.text(`Subtotal: ${decStr(sub)} ${currency}`, { align: 'right' });
    const vatRate = invoice.vat_rate
      ? `${(Number(invoice.vat_rate) * 100).toFixed(2)}%`
      : '—';
    doc.text(
      `VAT (${vatRate}): ${decStr(vat)} ${currency}`,
      { align: 'right' },
    );
    doc.fontSize(12).text(`Total: ${decStr(total)} ${currency}`, {
      align: 'right',
    });

    if (invoice.qr_code_data) {
      try {
        const png = await QRCode.toBuffer(invoice.qr_code_data, {
          type: 'png',
          width: 140,
          margin: 1,
        });
        doc.addPage();
        doc.fontSize(12).text('ZATCA QR (KSA)', { align: 'left' });
        doc.moveDown();
        doc.image(png, { fit: [160, 160] });
        doc.moveDown();
        doc.fontSize(8).text(
          'Scan to verify TLV payload (Phase 1 simplified).',
          { align: 'left' },
        );
      } catch (e) {
        this.logger.warn(`QR embed failed: ${e}`);
      }
    }

    const done = new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });
    doc.end();
    return done;
  }

  async uploadPaymentProof(
    id: string,
    file: Express.Multer.File | undefined,
    body: { referenceNumber?: string; notes?: string },
    user: JwtPayload,
  ): Promise<{ payment_proof_url: string }> {
    if (!file?.buffer) {
      throw new BadRequestException('file is required');
    }
    const invoice = await this.findOne(id, user);
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }
    const mime = file.mimetype || 'application/octet-stream';
    try {
      const key = await this.storage.uploadBufferAndReturnKey(
        file.buffer,
        mime,
        'invoices',
      );
      const refNote = body.referenceNumber
        ? `ref:${body.referenceNumber}`
        : '';
      const notes = body.notes ? ` notes:${body.notes}` : '';
      this.logger.log(`Payment proof for invoice ${id} ${refNote}${notes}`);

      const publicUrl = this.storage.getPublicObjectUrl(key);

      await this.prisma.invoice.update({
        where: { id },
        data: { payment_proof_url: publicUrl },
      });

      return { payment_proof_url: publicUrl };
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException('Could not upload payment proof');
    }
  }

  async update(
    id: string,
    data: Prisma.InvoiceUpdateInput,
    user: JwtPayload,
  ): Promise<Invoice> {
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }
    await this.assertInvoiceAccess(user, invoice);
    return this.prisma.invoice.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, user: JwtPayload): Promise<Invoice> {
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }
    await this.assertInvoiceAccess(user, invoice);
    return this.prisma.invoice.delete({
      where: { id },
    });
  }

  private async assertInvoiceAccess(
    user: JwtPayload,
    invoice: Invoice,
  ): Promise<void> {
    if (user.role === 'ADMIN') {
      return;
    }
    if (!user.companyId) {
      throw new ForbiddenException();
    }
    if (
      invoice.buyer_id === user.companyId ||
      invoice.supplier_id === user.companyId
    ) {
      return;
    }
    throw new ForbiddenException('Access denied');
  }
}
