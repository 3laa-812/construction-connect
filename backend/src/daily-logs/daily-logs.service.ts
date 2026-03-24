import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';

@Injectable()
export class DailyLogsService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.DailyLogCreateInput, user: JwtPayload) {
    const { user: _ignored, ...rest } = data as Record<string, unknown>;
    return this.prisma.dailyLog.create({
      data: {
        ...(rest as object),
        user: { connect: { id: user.sub } },
      } as Prisma.DailyLogCreateInput,
      include: {
        photos: true,
      },
    });
  }

  async findAll(
    params: {
      skip?: number;
      take?: number;
      cursor?: Prisma.DailyLogWhereUniqueInput;
      where?: Prisma.DailyLogWhereInput;
      orderBy?: Prisma.DailyLogOrderByWithRelationInput;
    },
    user: JwtPayload,
  ) {
    const { skip, take, cursor, where, orderBy } = params;
    const scopedWhere: Prisma.DailyLogWhereInput =
      user.role === 'ADMIN'
        ? { ...where }
        : {
            ...where,
            user_id: user.sub,
          };
    return this.prisma.dailyLog.findMany({
      skip,
      take,
      cursor,
      where: scopedWhere,
      orderBy,
      include: {
        user: {
          select: { id: true, email: true },
        },
        project: {
          select: { id: true, name: true },
        },
        photos: true,
      },
    });
  }

  async findOne(id: string, user: JwtPayload) {
    const log = await this.prisma.dailyLog.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true } },
        project: { select: { id: true, name: true } },
        photos: true,
      },
    });
    if (!log) {
      return null;
    }
    if (user.role !== 'ADMIN' && log.user_id !== user.sub) {
      return null;
    }
    return log;
  }

  async update(
    id: string,
    data: Prisma.DailyLogUpdateInput,
    user: JwtPayload,
  ) {
    const log = await this.prisma.dailyLog.findUnique({ where: { id } });
    if (!log) {
      return null;
    }
    if (user.role !== 'ADMIN' && log.user_id !== user.sub) {
      return null;
    }
    return this.prisma.dailyLog.update({
      where: { id },
      data,
      include: { photos: true },
    });
  }
}
