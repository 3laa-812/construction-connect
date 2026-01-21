import { Controller, Get, Param, Patch, Body, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('settings')
@UseGuards(AuthGuard('jwt'))
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('company/:companyId')
  getCompanySettings(@Param('companyId') companyId: string) {
    return this.settingsService.getCompanySettings(companyId);
  }

  @Patch('company/:companyId')
  updateCompanySettings(
    @Param('companyId') companyId: string,
    @Body() data: { notifications?: any; catalog?: any; admin?: any },
  ) {
    return this.settingsService.updateCompanySettings(companyId, data);
  }
}

