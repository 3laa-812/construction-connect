import { Controller, Get, Post, Body, Request, Query } from '@nestjs/common';
import { SyncService } from './sync.service';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get('pull')
  pull(
    @Query('last_pulled_at') lastPulledAt: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const timestamp = parseInt(lastPulledAt || '0', 10);
    return this.syncService.pullChanges(timestamp, user);
  }

  @Post('push')
  push(
    @Body() body: { changes?: any; lastPulledAt?: number } | any,
    @Request() req: { user: JwtPayload },
  ) {
    const changes = body?.changes ?? body;
    return this.syncService.pushChanges(changes, req.user);
  }
}
