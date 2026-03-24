import { Module } from '@nestjs/common';
import { DailyLogsService } from './daily-logs.service';
import { DailyLogsController } from './daily-logs.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [DailyLogsController],
  providers: [DailyLogsService],
})
export class DailyLogsModule {}
