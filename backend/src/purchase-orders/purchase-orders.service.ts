import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PurchaseOrder, DeliveryNote, Prisma } from '@prisma/client';

@Injectable()
export class PurchaseOrdersService {
  constructor(private prisma: PrismaService) {}

  // Purchase Orders
  async create(data: Prisma.PurchaseOrderCreateInput): Promise<PurchaseOrder> {
    return this.prisma.purchaseOrder.create({ data });
  }

  async findAll(): Promise<PurchaseOrder[]> {
    return this.prisma.purchaseOrder.findMany({
      include: {
        project: true,
        supplier: true,
        bid: true,
        items: true,
        delivery_notes: true,
        invoices: true,
      },
    });
  }

  async findOne(id: string): Promise<PurchaseOrder | null> {
    return this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        project: true,
        supplier: true,
        bid: true,
        items: true,
        delivery_notes: true,
        invoices: true,
      },
    });
  }

  async update(id: string, data: Prisma.PurchaseOrderUpdateInput): Promise<PurchaseOrder> {
    return this.prisma.purchaseOrder.update({
      where: { id },
      data,
    });
  }
  
  async remove(id: string): Promise<PurchaseOrder> {
      return this.prisma.purchaseOrder.delete({
          where: { id }
      });
  }

  // Delivery Notes
  async createDeliveryNote(data: Prisma.DeliveryNoteCreateInput): Promise<DeliveryNote> {
      return this.prisma.deliveryNote.create({ data });
  }
  
  async findAllDeliveryNotes(poId: string): Promise<DeliveryNote[]> {
      return this.prisma.deliveryNote.findMany({
          where: { po_id: poId },
          include: { items: true }
      });
  }
}
