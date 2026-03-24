import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

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
import { MaterialsModule } from './materials/materials.module';
import { DailyLogsModule } from './daily-logs/daily-logs.module';
import { AdminModule } from './admin/admin.module';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { NotificationsModule } from './notifications/notifications.module';
import { HealthModule } from './health/health.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'default',
          ttl: 60000,
          limit: 100,
        },
      ],
    }),
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
    WalletsModule,
    MaterialsModule,
    DailyLogsModule,
    AdminModule,
    NotificationsModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule {}
