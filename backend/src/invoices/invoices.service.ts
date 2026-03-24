import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Invoice, Prisma } from '@prisma/client';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';

const invoiceInclude = {
  supplier: true,
  buyer: true,
  purchase_order: true,
} as const;

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

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
