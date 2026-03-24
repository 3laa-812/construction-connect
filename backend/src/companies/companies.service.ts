import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Company, CompanyType, Prisma } from '@prisma/client';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { StorageService } from '../storage/storage.service';
import type { MulterMemoryFile } from '../storage/upload-file.types';
import { NotificationsService } from '../notifications/notifications.service';

const KYB_DOC_TYPES = ['CR', 'TAX_ID', 'VAT_CERT', 'COMPANY_LOGO'] as const;

@Injectable()
export class CompaniesService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    private notifications: NotificationsService,
  ) {}

  async create(data: Prisma.CompanyCreateInput): Promise<Company> {
    return this.prisma.company.create({
      data,
    });
  }

  async findAll(user: JwtPayload): Promise<Company[]> {
    if (user.role === 'ADMIN') {
      return this.prisma.company.findMany({
        include: { users: true },
        orderBy: { created_at: 'desc' },
      });
    }
    if (!user.companyId) {
      return [];
    }
    return this.prisma.company.findMany({
      where: { id: user.companyId },
      include: { users: true },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: string, user: JwtPayload): Promise<Company | null> {
    const company = await this.prisma.company.findUnique({
      where: { id },
    });
    if (!company) {
      return null;
    }
    if (user.role === 'ADMIN') {
      return company;
    }
    if (!user.companyId || id !== user.companyId) {
      throw new ForbiddenException('Access denied');
    }
    return company;
  }

  async update(
    id: string,
    data: Prisma.CompanyUpdateInput,
    user: JwtPayload,
  ): Promise<Company> {
    if (data.is_verified !== undefined && user.role !== 'ADMIN') {
      throw new ForbiddenException(
        'Only administrators can verify or unverify companies',
      );
    }
    if (user.role !== 'ADMIN' && id !== user.companyId) {
      throw new ForbiddenException('Cannot modify another company');
    }
    const existing = await this.prisma.company.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Company not found');
    }
    if (user.role === 'ADMIN') {
      const nextVerified = this.extractVerifyFlag(data.is_verified);
      if (nextVerified === true && !existing.is_verified) {
        await this.assertKyDocumentsComplete(id, existing.type);
      }
    }
    const updated = await this.prisma.company.update({
      where: { id },
      data,
    });
    if (user.role === 'ADMIN') {
      const becameVerified =
        this.extractVerifyFlag(data.is_verified) === true &&
        !existing.is_verified;
      if (becameVerified) {
        await this.notifications.notifyCompanyUsers(id, {
          title: 'KYB approved',
          body: 'Your company has been verified. You can now use the full marketplace.',
          type: 'kyb_approved',
          entityId: id,
        });
      }
    }
    return updated;
  }

  async verifyCompany(id: string): Promise<Company> {
    const existing = await this.prisma.company.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Company not found');
    }
    if (existing.is_verified) {
      return existing;
    }
    await this.assertKyDocumentsComplete(id, existing.type);
    const updated = await this.prisma.company.update({
      where: { id },
      data: { is_verified: true },
    });
    await this.notifications.notifyCompanyUsers(id, {
      title: 'KYB approved',
      body: 'Your company has been verified. You can now use the full marketplace.',
      type: 'kyb_approved',
      entityId: id,
    });
    return updated;
  }

  async uploadDocument(
    companyId: string,
    docType: string,
    file: MulterMemoryFile,
    user: JwtPayload,
  ) {
    if (!KYB_DOC_TYPES.includes(docType as (typeof KYB_DOC_TYPES)[number])) {
      throw new BadRequestException(
        `doc_type must be one of: ${KYB_DOC_TYPES.join(', ')}`,
      );
    }
    if (!file?.buffer?.length) {
      throw new BadRequestException('file is required');
    }
    if (user.role !== 'ADMIN' && user.companyId !== companyId) {
      throw new ForbiddenException('Cannot upload for another company');
    }
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    const url = await this.storage.uploadFile(
      file.buffer,
      file.mimetype || 'application/octet-stream',
      'kyb-docs',
    );
    return this.prisma.companyDocument.create({
      data: {
        company_id: companyId,
        doc_type: docType,
        file_url: url,
      },
    });
  }

  private extractVerifyFlag(
    input: Prisma.CompanyUpdateInput['is_verified'],
  ): boolean | undefined {
    if (typeof input === 'boolean') {
      return input;
    }
    if (input && typeof input === 'object' && 'set' in input) {
      const v = (input as { set: boolean }).set;
      return typeof v === 'boolean' ? v : undefined;
    }
    return undefined;
  }

  private async assertKyDocumentsComplete(
    companyId: string,
    companyType: CompanyType,
  ): Promise<void> {
    const docs = await this.prisma.companyDocument.findMany({
      where: { company_id: companyId },
    });
    const types = new Set(docs.map((d) => d.doc_type));
    const required: string[] = ['CR', 'TAX_ID'];
    if (companyType === 'SUPPLIER') {
      required.push('VAT_CERT');
    }
    for (const t of required) {
      if (!types.has(t)) {
        throw new BadRequestException(
          `Cannot verify company: missing required document type ${t}`,
        );
      }
    }
  }

  async remove(id: string, user: JwtPayload): Promise<Company> {
    if (user.role !== 'ADMIN' && id !== user.companyId) {
      throw new ForbiddenException();
    }
    const existing = await this.prisma.company.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Company not found');
    }
    return this.prisma.company.delete({
      where: { id },
    });
  }
}
