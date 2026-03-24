import { Controller, Get, Param, Patch, Body, ForbiddenException } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  private assertCompany(user: JwtPayload, companyId: string) {
    if (user.role === 'ADMIN') {
      return;
    }
    if (user.companyId !== companyId) {
      throw new ForbiddenException('Access denied');
    }
  }

  @Get('company/:companyId')
  getCompanySettings(
    @Param('companyId') companyId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    this.assertCompany(user, companyId);
    return this.settingsService.getCompanySettings(companyId);
  }

  @Patch('company/:companyId')
  updateCompanySettings(
    @Param('companyId') companyId: string,
    @Body() data: { notifications?: any; catalog?: any; admin?: any },
    @CurrentUser() user: JwtPayload,
  ) {
    this.assertCompany(user, companyId);
    return this.settingsService.updateCompanySettings(companyId, data);
  }
}
