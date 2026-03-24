import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  NotFoundException,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DailyLogsService } from './daily-logs.service';
import { Prisma } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import type { MulterMemoryFile } from '../storage/upload-file.types';

@Controller('daily-logs')
export class DailyLogsController {
  constructor(private readonly dailyLogsService: DailyLogsService) {}

  @Post()
  create(
    @Body() data: Prisma.DailyLogCreateInput,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.dailyLogsService.create(data, user);
  }

  @Get()
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('project_id') projectId?: string,
    @Query('date') date?: string,
  ) {
    const where: Prisma.DailyLogWhereInput = {};
    if (projectId) {
      where.project_id = projectId;
    }
    if (date) {
      where.log_date = new Date(date);
    }

    return this.dailyLogsService.findAll({ where }, user);
  }

  @Post('photos')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 15 * 1024 * 1024 } }),
  )
  uploadPhoto(
    @UploadedFile() file: MulterMemoryFile | undefined,
    @Body('log_photo_id') logPhotoId: string | undefined,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!logPhotoId?.trim()) {
      throw new BadRequestException('log_photo_id is required');
    }
    if (!file?.buffer?.length) {
      throw new BadRequestException('file is required');
    }
    return this.dailyLogsService.uploadSitePhoto(logPhotoId.trim(), file, user);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const log = await this.dailyLogsService.findOne(id, user);
    if (!log) {
      throw new NotFoundException('Daily log not found');
    }
    return log;
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() data: Prisma.DailyLogUpdateInput,
    @CurrentUser() user: JwtPayload,
  ) {
    const log = await this.dailyLogsService.update(id, data, user);
    if (!log) {
      throw new NotFoundException('Daily log not found');
    }
    return log;
  }
}
