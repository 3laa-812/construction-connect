import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getCompanySettings(companyId: string) {
    let settings = await this.prisma.companySettings.findUnique({
      where: { company_id: companyId },
    });

    if (!settings) {
      settings = await this.prisma.companySettings.create({
        data: {
          company: { connect: { id: companyId } },
          notifications: {},
          catalog: {},
          admin: {},
        },
      });
    }

    return settings;
  }

  async updateCompanySettings(companyId: string, data: { notifications?: any; catalog?: any; admin?: any }) {
    const existing = await this.prisma.companySettings.findUnique({
      where: { company_id: companyId },
    });

    if (!existing) {
      return this.prisma.companySettings.create({
        data: {
          company: { connect: { id: companyId } },
          notifications: data.notifications ?? {},
          catalog: data.catalog ?? {},
          admin: data.admin ?? {},
        },
      });
    }

    // Merge JSON fields instead of replacing them
    const updateData: any = {};
    
    if (data.notifications !== undefined) {
      updateData.notifications = { ...(existing.notifications as any || {}), ...data.notifications };
    }
    
    if (data.catalog !== undefined) {
      updateData.catalog = { ...(existing.catalog as any || {}), ...data.catalog };
    }
    
    if (data.admin !== undefined) {
      updateData.admin = { ...(existing.admin as any || {}), ...data.admin };
    }

    return this.prisma.companySettings.update({
      where: { company_id: companyId },
      data: updateData,
    });
  }
}

