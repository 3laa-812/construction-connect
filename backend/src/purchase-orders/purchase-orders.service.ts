import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  DeliveryNote,
  POStatus,
  PurchaseOrder,
  Prisma,
} from '@prisma/client';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { NotificationsService } from '../notifications/notifications.service';
import { InvoicesService } from '../invoices/invoices.service';

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
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private invoices: InvoicesService,
  ) {}

  private readonly supplierTransitions: Record<string, POStatus> = {
    CONFIRMED: 'PROCESSING',
    PROCESSING: 'OUT_FOR_DELIVERY',
  };

  private readonly buyerTransitions: Record<string, POStatus> = {
    OUT_FOR_DELIVERY: 'DELIVERED',
    DELIVERED: 'COMPLETED',
  };

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

  async findOne(id: string, user: JwtPayload): Promise<any | null> {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        ...poInclude,
        items: {
          include: {
            grn_items: true,
          },
        },
      },
    });
    if (!po) {
      return null;
    }
    await this.assertPoAccess(user, po);
    const itemsWithRemaining = po.items.map((item) => {
      const delivered = item.grn_items.reduce(
        (sum, g) => sum + Number(g.delivered_qty ?? 0),
        0,
      );
      const ordered = Number(item.ordered_qty ?? 0);
      return {
        ...item,
        remaining_qty: Math.max(ordered - delivered, 0),
      };
    });

    return {
      ...po,
      items: itemsWithRemaining as any,
    };
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

  async updateStatus(
    id: string,
    status: POStatus,
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

    const current = po.status;
    if (current === status) {
      return po;
    }

    const isSupplier =
      !!user.companyId && po.supplier_id === user.companyId;
    const isBuyer =
      !!user.companyId && po.project.company_id === user.companyId;

    if (user.role === 'ADMIN') {
      const updated = await this.prisma.purchaseOrder.update({
        where: { id },
        data: { status },
      });
      await this.notifyOrderStatusParties(po, id, status, 'admin');
      if (status === POStatus.DELIVERED) {
        await this.invoices.createOnPoDelivered(id);
      }
      return updated;
    }

    if (!user.companyId) {
      throw new ForbiddenException('Access denied');
    }

    if (isSupplier) {
      if (this.supplierTransitions[current] !== status) {
        throw new BadRequestException(
          `Invalid supplier transition: ${current} -> ${status}`,
        );
      }
    } else if (isBuyer) {
      if (this.buyerTransitions[current] !== status) {
        throw new BadRequestException(
          `Invalid buyer transition: ${current} -> ${status}`,
        );
      }
    } else {
      throw new ForbiddenException('Access denied');
    }

    const updated = await this.prisma.purchaseOrder.update({
      where: { id },
      data: { status },
    });
    await this.notifyOrderStatusParties(
      po,
      id,
      status,
      isSupplier ? 'supplier' : 'buyer',
    );
    if (status === POStatus.DELIVERED) {
      await this.invoices.createOnPoDelivered(id);
    }
    return updated;
  }

  private async notifyOrderStatusParties(
    po: PurchaseOrder & { project: { company_id: string } },
    poId: string,
    status: POStatus,
    actor: 'admin' | 'supplier' | 'buyer',
  ): Promise<void> {
    const label = String(status).replace(/_/g, ' ');
    const payload = {
      title: 'Order status updated',
      body: `Purchase order is now ${label}.`,
      type: 'order_status',
      entityId: poId,
    };
    if (actor === 'admin') {
      await this.notifications.notifyCompanyUsers(
        po.project.company_id,
        payload,
      );
      await this.notifications.notifyCompanyUsers(po.supplier_id, payload);
    } else if (actor === 'supplier') {
      await this.notifications.notifyCompanyUsers(
        po.project.company_id,
        payload,
      );
    } else {
      await this.notifications.notifyCompanyUsers(po.supplier_id, payload);
    }
  }

  async createDeliveryNote(
    poId: string,
    dto: {
      delivery_date?: string;
      status?: 'OUT_FOR_DELIVERY' | 'DELIVERED';
      pod_image_url?: string;
      pod_signature_url?: string;
      received_by?: string;
      items: Array<{ po_item_id: string; delivered_qty: number }>;
    },
    user: JwtPayload,
  ): Promise<DeliveryNote> {
    if (!dto.items?.length) {
      throw new BadRequestException('At least one GRN line item is required');
    }
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: { project: true, items: true },
    });
    if (!po) {
      throw new NotFoundException('Purchase order not found');
    }
    const isSupplier = user.companyId === po.supplier_id;
    const isBuyer = user.companyId === po.project.company_id;
    if (
      user.role !== 'ADMIN' &&
      (!user.companyId || (!isSupplier && !isBuyer))
    ) {
      throw new ForbiddenException(
        'Only the supplier or buyer company can record goods received',
      );
    }

    for (const item of dto.items) {
      const exists = po.items.find((poItem) => poItem.id === item.po_item_id);
      if (!exists) {
        throw new BadRequestException(
          `PO item ${item.po_item_id} does not belong to this order`,
        );
      }
      if (item.delivered_qty <= 0) {
        throw new BadRequestException('delivered_qty must be > 0');
      }
    }

    const deliveryNote = await this.prisma.deliveryNote.create({
      data: {
        purchase_order: { connect: { id: poId } },
        delivery_date: dto.delivery_date
          ? new Date(dto.delivery_date)
          : undefined,
        status: dto.status ?? 'DELIVERED',
        pod_image_url: dto.pod_image_url,
        pod_signature_url: dto.pod_signature_url,
        receiver: dto.received_by
          ? { connect: { id: dto.received_by } }
          : undefined,
        items: {
          create: dto.items.map((item) => ({
            po_item: { connect: { id: item.po_item_id } },
            delivered_qty: item.delivered_qty,
          })),
        },
      },
      include: { items: true },
    });

    await this.updateInventory(
      po.project_id,
      dto.items.map((item) => {
        const poItem = po.items.find((i) => i.id === item.po_item_id)!;
        return {
          product_name: poItem.item_description || 'Line item',
          unit: 'unit',
          qty: item.delivered_qty,
        };
      }),
    );

    return deliveryNote;
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

  private async updateInventory(
    projectId: string,
    items: Array<{ product_name: string; unit: string; qty: number }>,
  ): Promise<void> {
    for (const item of items) {
      const existing = await this.prisma.inventory.findFirst({
        where: {
          project_id: projectId,
          product_name: item.product_name,
          unit: item.unit,
        },
      });
      if (!existing) {
        await this.prisma.inventory.create({
          data: {
            project: { connect: { id: projectId } },
            product_name: item.product_name,
            unit: item.unit,
            qty_on_hand: item.qty,
          },
        });
      } else {
        await this.prisma.inventory.update({
          where: { id: existing.id },
          data: {
            qty_on_hand: Number(existing.qty_on_hand) + item.qty,
          },
        });
      }
    }
  }
}
