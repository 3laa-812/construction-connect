import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { StorageService } from '../storage/storage.service';
import type { MulterMemoryFile } from '../storage/upload-file.types';

@Injectable()
export class DailyLogsService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

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

  async deleteSitePhoto(photoId: string, user: JwtPayload) {
    const photo = await this.prisma.logPhoto.findUnique({
      where: { id: photoId },
      include: { daily_log: true },
    });
    if (!photo) {
      throw new NotFoundException('Log photo not found');
    }
    if (user.role !== 'ADMIN' && photo.daily_log.user_id !== user.sub) {
      throw new ForbiddenException("Cannot delete another user's photo");
    }
    await this.prisma.logPhoto.delete({ where: { id: photoId } });
    return { deleted: true };
  }

  async uploadSitePhoto(
    logPhotoId: string,
    file: MulterMemoryFile,
    user: JwtPayload,
  ) {
    const photo = await this.prisma.logPhoto.findUnique({
      where: { id: logPhotoId },
      include: { daily_log: true },
    });
    if (!photo) {
      throw new NotFoundException('Log photo not found');
    }
    if (user.role !== 'ADMIN' && photo.daily_log.user_id !== user.sub) {
      throw new ForbiddenException("Cannot upload for another user's log");
    }
    const url = await this.storage.uploadFile(
      file.buffer,
      file.mimetype || 'image/jpeg',
      'site-photos',
    );
    await this.prisma.logPhoto.update({
      where: { id: logPhotoId },
      data: { s3_url: url },
    });
    return { url };
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
