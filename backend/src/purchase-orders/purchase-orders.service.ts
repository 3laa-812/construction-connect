import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DeliveryNote, PurchaseOrder, Prisma } from '@prisma/client';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';

const poInclude = {
  project: true,
  supplier: true,
  bid: true,
  items: true,
  delivery_notes: true,
  invoices: true,
} as const;

@Injectable()
export class PurchaseOrdersService {
  constructor(private prisma: PrismaService) {}

  async create(
    data: Prisma.PurchaseOrderCreateInput,
    user: JwtPayload,
  ): Promise<PurchaseOrder> {
    const projectId = (data.project as { connect?: { id: string } })?.connect
      ?.id;
    const supplierId = (data.supplier as { connect?: { id: string } })?.connect
      ?.id;
    if (!projectId || !supplierId) {
      throw new ForbiddenException('project and supplier are required');
    }
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    if (user.role === 'ADMIN') {
      return this.prisma.purchaseOrder.create({ data });
    }
    if (!user.companyId) {
      throw new ForbiddenException();
    }
    const isBuyer = project.company_id === user.companyId;
    const isSupplier = supplierId === user.companyId;
    if (!isBuyer && !isSupplier) {
      throw new ForbiddenException('Cannot create PO for these parties');
    }
    return this.prisma.purchaseOrder.create({ data });
  }

  async findAll(user: JwtPayload): Promise<PurchaseOrder[]> {
    if (user.role === 'ADMIN') {
      return this.prisma.purchaseOrder.findMany({ include: poInclude });
    }
    if (!user.companyId) {
      return [];
    }
    return this.prisma.purchaseOrder.findMany({
      where: {
        OR: [
          { project: { company_id: user.companyId } },
          { supplier_id: user.companyId },
        ],
      },
      include: poInclude,
    });
  }

  async findOne(id: string, user: JwtPayload): Promise<PurchaseOrder | null> {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: poInclude,
    });
    if (!po) {
      return null;
    }
    await this.assertPoAccess(user, po);
    return po;
  }

  async update(
    id: string,
    data: Prisma.PurchaseOrderUpdateInput,
    user: JwtPayload,
  ): Promise<PurchaseOrder> {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: { project: true },
    });
    if (!po) {
      throw new NotFoundException('Purchase order not found');
    }
    await this.assertPoAccess(user, po);
    return this.prisma.purchaseOrder.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, user: JwtPayload): Promise<PurchaseOrder> {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: { project: true },
    });
    if (!po) {
      throw new NotFoundException('Purchase order not found');
    }
    await this.assertPoAccess(user, po);
    return this.prisma.purchaseOrder.delete({
      where: { id },
    });
  }

  async createDeliveryNote(
    data: Prisma.DeliveryNoteCreateInput,
    user: JwtPayload,
  ): Promise<DeliveryNote> {
    const poId = (data.purchase_order as { connect?: { id: string } })?.connect
      ?.id;
    if (!poId) {
      throw new ForbiddenException('purchase_order is required');
    }
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: { project: true },
    });
    if (!po) {
      throw new NotFoundException('Purchase order not found');
    }
    if (user.role === 'ADMIN') {
      return this.prisma.deliveryNote.create({ data });
    }
    if (!user.companyId || po.supplier_id !== user.companyId) {
      throw new ForbiddenException('Only the supplier can create delivery notes');
    }
    return this.prisma.deliveryNote.create({ data });
  }

  async findAllDeliveryNotes(
    poId: string,
    user: JwtPayload,
  ): Promise<DeliveryNote[]> {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: { project: true },
    });
    if (!po) {
      throw new NotFoundException('Purchase order not found');
    }
    await this.assertPoAccess(user, po);
    return this.prisma.deliveryNote.findMany({
      where: { po_id: poId },
      include: { items: true },
    });
  }

  private async assertPoAccess(
    user: JwtPayload,
    po: PurchaseOrder & { project: { company_id: string } },
  ): Promise<void> {
    if (user.role === 'ADMIN') {
      return;
    }
    if (!user.companyId) {
      throw new ForbiddenException();
    }
    if (
      po.project.company_id === user.companyId ||
      po.supplier_id === user.companyId
    ) {
      return;
    }
    throw new ForbiddenException('Access denied');
  }
}
