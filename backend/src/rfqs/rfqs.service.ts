import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RFQ, RFQItem, Bid, BidItem, Prisma } from '@prisma/client';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';

const rfqInclude = {
  project: { include: { company: true } },
  items: true,
  bids: {
    include: {
      supplier: true,
      items: true,
    },
  },
} as const;

@Injectable()
export class RFQsService {
  constructor(private prisma: PrismaService) {}

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
    return this.prisma.bid.create({ data });
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
