import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { AuthController } from './auth.controller';
import { CompaniesModule } from '../companies/companies.module';
import { JwtAuthGuard } from './jwt-auth.guard';
import { OtpDeliveryService } from './otp-delivery.service';

@Module({
  imports: [
    UsersModule,
    CompaniesModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'super-secret-key',
      signOptions: { expiresIn: (process.env.JWT_EXPIRATION || '1d') as any },
    }),
  ],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, OtpDeliveryService],
  controllers: [AuthController],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
