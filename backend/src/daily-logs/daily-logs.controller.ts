import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { DailyLogsService } from './daily-logs.service';
import { Prisma } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface';

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
