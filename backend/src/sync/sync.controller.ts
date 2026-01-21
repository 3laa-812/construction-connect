import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { SyncService } from './sync.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('sync')
@UseGuards(AuthGuard('jwt'))
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get('pull')
  pull(@Query('last_pulled_at') lastPulledAt: string) {
    console.log('SyncController.pull called');
    const timestamp = parseInt(lastPulledAt || '0', 10);
    return this.syncService.pullChanges(timestamp);
  }
  
  @Post('push')
  push(@Body() changes: any, @Request() req) {
      const userId = req.user.id; 
      return this.syncService.pushChanges(changes, userId);
  }
}
