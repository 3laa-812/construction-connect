import { Module } from '@nestjs/common';
import { SyncService } from './sync.service';
import { SyncController } from './sync.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PurchaseOrdersModule } from '../purchase-orders/purchase-orders.module';

@Module({
  imports: [PrismaModule, PurchaseOrdersModule],
  controllers: [SyncController],
  providers: [SyncService],
})
export class SyncModule {}
