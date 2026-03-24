import { Controller, Get, Post, Body, Request, Query } from '@nestjs/common';
import { SyncService } from './sync.service';

@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get('pull')
  pull(@Query('last_pulled_at') lastPulledAt: string) {
    const timestamp = parseInt(lastPulledAt || '0', 10);
    return this.syncService.pullChanges(timestamp);
  }

  @Post('push')
  push(@Body() changes: any, @Request() req: { user: { sub: string; id: string } }) {
    const userId = req.user.sub ?? req.user.id;
    return this.syncService.pushChanges(changes, userId);
  }
}
