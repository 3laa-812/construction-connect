import { Controller, Get, Post, Body, Patch, Param, UseGuards, Query } from '@nestjs/common';
import { DailyLogsService } from './daily-logs.service';
import { Prisma } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';

@Controller('daily-logs')
@UseGuards(AuthGuard('jwt'))
export class DailyLogsController {
  constructor(private readonly dailyLogsService: DailyLogsService) {}

  @Post()
  create(@Body() data: Prisma.DailyLogCreateInput) {
    return this.dailyLogsService.create(data);
  }

  @Get()
  findAll(
    @Query('project_id') projectId?: string,
    @Query('date') date?: string,
  ) {
    const where: Prisma.DailyLogWhereInput = {};
    if (projectId) where.project_id = projectId;
    if (date) where.log_date = new Date(date);

    return this.dailyLogsService.findAll({ where });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.dailyLogsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: Prisma.DailyLogUpdateInput) {
    return this.dailyLogsService.update(id, data);
  }
}
