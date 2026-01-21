import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RFQ, RFQItem, Bid, BidItem, Prisma } from '@prisma/client';

@Injectable()
export class RFQsService {
  constructor(private prisma: PrismaService) {}

  // RFQs
  async create(data: Prisma.RFQCreateInput): Promise<RFQ> {
    return this.prisma.rFQ.create({ data });
  }

  async findAll(): Promise<RFQ[]> {
    return this.prisma.rFQ.findMany({
      include: {
        project: { include: { company: true } },
        items: true,
        bids: {
          include: {
            supplier: true,
            items: true,
          },
        },
      },
    });
  }

  async findOne(id: string): Promise<RFQ | null> {
    return this.prisma.rFQ.findUnique({
      where: { id },
      include: {
        project: { include: { company: true } },
        items: true,
        bids: {
          include: {
            supplier: true,
            items: true,
          },
        },
      },
    });
  }

  async update(id: string, data: Prisma.RFQUpdateInput): Promise<RFQ> {
    return this.prisma.rFQ.update({
      where: { id },
      data,
    });
  }
  
  async remove(id: string): Promise<RFQ> {
    return this.prisma.rFQ.delete({
        where: { id }
    });
  }

  // RFQ Items
  async createItem(data: Prisma.RFQItemCreateInput): Promise<RFQItem> {
      return this.prisma.rFQItem.create({ data });
  }

  // Bids
  async createBid(data: Prisma.BidCreateInput): Promise<Bid> {
      return this.prisma.bid.create({ data });
  }

  async findAllBids(rfqId: string): Promise<Bid[]> {
      return this.prisma.bid.findMany({
          where: { rfq_id: rfqId },
          include: {
            supplier: true,
            items: true,
            rfq: true,
          }
      });
  }
}
