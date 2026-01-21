import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { CompaniesModule } from './companies/companies.module';
import { AuthModule } from './auth/auth.module';
import { ProjectsModule } from './projects/projects.module';
import { RFQsModule } from './rfqs/rfqs.module';
import { PurchaseOrdersModule } from './purchase-orders/purchase-orders.module';
import { InvoicesModule } from './invoices/invoices.module';
import { SyncModule } from './sync/sync.module';
import { SettingsModule } from './settings/settings.module';
import { WalletsModule } from './wallets/wallets.module';

@Module({
  imports: [
    PrismaModule, 
    UsersModule, 
    CompaniesModule, 
    AuthModule,
    ProjectsModule,
    RFQsModule,
    PurchaseOrdersModule,
    InvoicesModule,
    SyncModule,
    SettingsModule,
    WalletsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
