import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Company, Prisma } from '@prisma/client';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

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
    return this.prisma.company.update({
      where: { id },
      data,
    });
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
