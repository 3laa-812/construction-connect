import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  RFQ,
  RFQItem,
  Bid,
  Prisma,
  PurchaseOrder,
  BidStatus,
  RFQStatus,
} from '@prisma/client';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { StorageService } from '../storage/storage.service';
import type { MulterMemoryFile } from '../storage/upload-file.types';
import { NotificationsService } from '../notifications/notifications.service';

const rfqInclude = {
  project: { include: { company: true } },
  items: true,
  attachments: true,
  bids: {
    include: {
      supplier: true,
      items: true,
    },
  },
} as const;

@Injectable()
export class RFQsService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    private notifications: NotificationsService,
  ) {}

  async create(data: Prisma.RFQCreateInput, user: JwtPayload): Promise<RFQ> {
    const projectId = (data.project as { connect?: { id: string } })?.connect
      ?.id;
    if (!projectId) {
      throw new BadRequestException('project is required');
    }
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    if (user.role === 'ADMIN') {
      return this.prisma.rFQ.create({ data });
    }
    if (user.role !== 'CONTRACTOR' || project.company_id !== user.companyId) {
      throw new ForbiddenException('Cannot create RFQ for this project');
    }
    return this.prisma.rFQ.create({ data });
  }

  async addAttachment(
    rfqId: string,
    file: MulterMemoryFile,
    user: JwtPayload,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('file is required');
    }
    const rfq = await this.prisma.rFQ.findUnique({
      where: { id: rfqId },
      include: { project: true },
    });
    if (!rfq) {
      throw new NotFoundException('RFQ not found');
    }
    if (
      user.role !== 'ADMIN' &&
      (user.role !== 'CONTRACTOR' ||
        rfq.project.company_id !== user.companyId)
    ) {
      throw new ForbiddenException('Cannot attach files to this RFQ');
    }
    const url = await this.storage.uploadFile(
      file.buffer,
      file.mimetype || 'application/octet-stream',
      'rfq-attachments',
    );
    return this.prisma.rFQAttachment.create({
      data: {
        rfq_id: rfqId,
        file_url: url,
        file_name: file.originalname || 'attachment',
      },
    });
  }

  async findAll(user: JwtPayload): Promise<RFQ[]> {
    if (user.role === 'ADMIN') {
      return this.prisma.rFQ.findMany({ include: rfqInclude });
    }
    if (!user.companyId) {
      return [];
    }
    if (user.role === 'CONTRACTOR') {
      return this.prisma.rFQ.findMany({
        where: { project: { company_id: user.companyId } },
        include: rfqInclude,
      });
    }
    return this.prisma.rFQ.findMany({
      where: {
        OR: [
          { status: 'OPEN' },
          { bids: { some: { supplier_id: user.companyId } } },
        ],
      },
      include: rfqInclude,
    });
  }

  async findOne(id: string, user: JwtPayload): Promise<RFQ | null> {
    const rfq = await this.prisma.rFQ.findUnique({
      where: { id },
      include: rfqInclude,
    });
    if (!rfq) {
      return null;
    }
    await this.assertRfqReadAccess(user, rfq);
    return rfq;
  }

  async update(
    id: string,
    data: Prisma.RFQUpdateInput,
    user: JwtPayload,
  ): Promise<RFQ> {
    const rfq = await this.prisma.rFQ.findUnique({
      where: { id },
      include: { project: true },
    });
    if (!rfq) {
      throw new NotFoundException('RFQ not found');
    }
    await this.assertRfqOwnerAccess(user, rfq);
    return this.prisma.rFQ.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, user: JwtPayload): Promise<RFQ> {
    const rfq = await this.prisma.rFQ.findUnique({
      where: { id },
      include: { project: true },
    });
    if (!rfq) {
      throw new NotFoundException('RFQ not found');
    }
    await this.assertRfqOwnerAccess(user, rfq);
    return this.prisma.rFQ.delete({
      where: { id },
    });
  }

  async createItem(
    data: Prisma.RFQItemCreateInput,
    user: JwtPayload,
  ): Promise<RFQItem> {
    const rfqId = (data.rfq as { connect?: { id: string } })?.connect?.id;
    if (!rfqId) {
      throw new BadRequestException('rfq is required');
    }
    const rfq = await this.prisma.rFQ.findUnique({
      where: { id: rfqId },
      include: { project: true },
    });
    if (!rfq) {
      throw new NotFoundException('RFQ not found');
    }
    if (user.role === 'ADMIN') {
      return this.prisma.rFQItem.create({ data });
    }
    if (user.role !== 'CONTRACTOR' || rfq.project.company_id !== user.companyId) {
      throw new ForbiddenException();
    }
    return this.prisma.rFQItem.create({ data });
  }

  async createBid(data: Prisma.BidCreateInput, user: JwtPayload): Promise<Bid> {
    if (user.role !== 'SUPPLIER' || !user.companyId) {
      throw new ForbiddenException('Only suppliers can submit bids');
    }
    const supplierId = (data.supplier as { connect?: { id: string } })?.connect
      ?.id;
    if (supplierId !== user.companyId) {
      throw new ForbiddenException('Bid must be placed for your company');
    }
    const bid = await this.prisma.bid.create({ data });
    const rfq = await this.prisma.rFQ.findUnique({
      where: { id: bid.rfq_id },
      select: { id: true, created_by: true },
    });
    if (rfq?.created_by) {
      await this.notifications.createForUsers([rfq.created_by], {
        title: 'New bid received',
        body: 'A supplier submitted a new bid on your RFQ.',
        type: 'bid_received',
        entityId: rfq.id,
      });
    }
    return bid;
  }

  async findAllBids(rfqId: string, user: JwtPayload): Promise<Bid[]> {
    const rfq = await this.prisma.rFQ.findUnique({
      where: { id: rfqId },
      include: { project: true },
    });
    if (!rfq) {
      throw new NotFoundException('RFQ not found');
    }
    await this.assertRfqReadAccess(user, rfq);
    return this.prisma.bid.findMany({
      where: { rfq_id: rfqId },
      include: {
        supplier: true,
        items: true,
        rfq: true,
      },
    });
  }

  /**
   * Awards a bid: marks RFQ AWARDED, rejects other pending bids, creates PurchaseOrder + POItems.
   */
  async awardBid(
    rfqId: string,
    bidId: string,
    user: JwtPayload,
  ): Promise<PurchaseOrder> {
    if (user.role !== 'CONTRACTOR' && user.role !== 'ADMIN') {
      throw new ForbiddenException('Only contractors can award bids');
    }

    const po = await this.prisma.$transaction(async (tx) => {
      const rfq = await tx.rFQ.findUnique({
        where: { id: rfqId },
        include: { project: true },
      });
      if (!rfq) {
        throw new NotFoundException('RFQ not found');
      }
      if (
        user.role === 'CONTRACTOR' &&
        rfq.project.company_id !== user.companyId
      ) {
        throw new ForbiddenException('You do not own this RFQ');
      }
      if (rfq.status !== RFQStatus.OPEN) {
        throw new BadRequestException('RFQ is not open for awarding');
      }

      const bid = await tx.bid.findUnique({
        where: { id: bidId },
        include: {
          items: {
            include: { rfq_item: true },
          },
        },
      });
      if (!bid || bid.rfq_id !== rfqId) {
        throw new NotFoundException('Bid not found');
      }
      if (bid.status !== BidStatus.PENDING) {
        throw new BadRequestException('Bid is not pending');
      }

      await tx.rFQ.update({
        where: { id: rfqId },
        data: {
          status: RFQStatus.AWARDED,
          awarded_bid_id: bidId,
        },
      });

      await tx.bid.updateMany({
        where: {
          rfq_id: rfqId,
          id: { not: bidId },
          status: BidStatus.PENDING,
        },
        data: {
          status: BidStatus.REJECTED,
          rejection_reason: 'Another bid was selected',
        },
      });

      await tx.bid.update({
        where: { id: bidId },
        data: { status: BidStatus.ACCEPTED },
      });

      const createdPo = await tx.purchaseOrder.create({
        data: {
          project: { connect: { id: rfq.project_id } },
          supplier: { connect: { id: bid.supplier_id } },
          bid: { connect: { id: bid.id } },
          rfq: { connect: { id: rfq.id } },
          status: 'CONFIRMED',
          total_amount: bid.total_price ?? undefined,
          payment_terms: rfq.payment_terms ?? undefined,
          delivery_date_required: rfq.delivery_date_required ?? undefined,
          items: {
            create: bid.items.map((bi) => ({
              item_description:
                bi.rfq_item.product_name?.trim() || 'Line item',
              ordered_qty: bi.rfq_item.quantity ?? undefined,
              unit_price: bi.unit_price ?? undefined,
            })),
          },
        },
        include: {
          items: true,
          project: true,
          supplier: true,
          bid: true,
          rfq: true,
        },
      });

      return createdPo;
    });

    await this.notifications.notifyCompanyUsers(po.supplier_id, {
      title: 'RFQ awarded',
      body: 'Your bid was selected and a purchase order has been created.',
      type: 'rfq_awarded',
      entityId: po.id,
    });

    return po;
  }

  async rejectBid(
    rfqId: string,
    bidId: string,
    rejectionReason: string,
    user: JwtPayload,
  ): Promise<Bid> {
    if (user.role !== 'CONTRACTOR' && user.role !== 'ADMIN') {
      throw new ForbiddenException('Only contractors can reject bids');
    }
    const reason = rejectionReason?.trim();
    if (!reason) {
      throw new BadRequestException('rejection_reason is required');
    }

    const rfq = await this.prisma.rFQ.findUnique({
      where: { id: rfqId },
      include: { project: true },
    });
    if (!rfq) {
      throw new NotFoundException('RFQ not found');
    }
    if (
      user.role === 'CONTRACTOR' &&
      rfq.project.company_id !== user.companyId
    ) {
      throw new ForbiddenException('You do not own this RFQ');
    }

    const bid = await this.prisma.bid.findUnique({ where: { id: bidId } });
    if (!bid || bid.rfq_id !== rfqId) {
      throw new NotFoundException('Bid not found');
    }
    if (bid.status !== BidStatus.PENDING) {
      throw new BadRequestException('Bid is not pending');
    }

    return this.prisma.bid.update({
      where: { id: bidId },
      data: {
        status: BidStatus.REJECTED,
        rejection_reason: reason,
      },
    });
  }

  private async assertRfqReadAccess(user: JwtPayload, rfq: RFQ & { project: { company_id: string } }): Promise<void> {
    if (user.role === 'ADMIN') {
      return;
    }
    if (!user.companyId) {
      throw new ForbiddenException();
    }
    if (user.role === 'CONTRACTOR' && rfq.project.company_id === user.companyId) {
      return;
    }
    if (user.role === 'SUPPLIER') {
      if (rfq.status === 'OPEN') {
        return;
      }
      const mine = await this.prisma.bid.findFirst({
        where: { rfq_id: rfq.id, supplier_id: user.companyId },
      });
      if (mine) {
        return;
      }
    }
    throw new ForbiddenException('Access denied');
  }

  private async assertRfqOwnerAccess(
    user: JwtPayload,
    rfq: { project: { company_id: string } },
  ): Promise<void> {
    if (user.role === 'ADMIN') {
      return;
    }
    if (
      user.role === 'CONTRACTOR' &&
      rfq.project.company_id === user.companyId
    ) {
      return;
    }
    throw new ForbiddenException('Only the owning contractor can modify this RFQ');
  }
}
