import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class DailyLogsService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.DailyLogCreateInput) {
    return this.prisma.dailyLog.create({
      data,
      include: {
        photos: true,
      },
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.DailyLogWhereUniqueInput;
    where?: Prisma.DailyLogWhereInput;
    orderBy?: Prisma.DailyLogOrderByWithRelationInput;
  }) {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.dailyLog.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        user: {
            select: { id: true, email: true } // Don't leak passwords
        },
        project: {
            select: { id: true, name: true }
        },
        photos: true
      }
    });
  }

  async findOne(id: string) {
    return this.prisma.dailyLog.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true } },
        project: { select: { id: true, name: true } },
        photos: true,
      },
    });
  }

  // Note: Updates primarily happen via Sync, but we provide this for Admin overrides
  async update(id: string, data: Prisma.DailyLogUpdateInput) {
    return this.prisma.dailyLog.update({
      where: { id },
      data,
      include: { photos: true },
    });
  }
}
