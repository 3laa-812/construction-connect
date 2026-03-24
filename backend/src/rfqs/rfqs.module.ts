import { Module } from '@nestjs/common';
import { RFQsService } from './rfqs.service';
import { RFQsController } from './rfqs.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [RFQsController],
  providers: [RFQsService],
})
export class RFQsModule {}
