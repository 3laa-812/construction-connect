import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MaterialsService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters: {
    category?: string;
    supplierId?: string;
    search?: string;
  }) {
    return this.prisma.product.findMany({
      where: {
        ...(filters.category && { category: filters.category }),
        ...(filters.supplierId && { supplier_company_id: filters.supplierId }),
        ...(filters.search && {
          name: { contains: filters.search, mode: 'insensitive' },
        }),
        is_active: true,
      },
      include: { supplier: { select: { name: true, is_verified: true } } },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.product.findFirst({
      where: { id, is_active: true },
      include: { supplier: { select: { name: true, is_verified: true } } },
    });
  }

  async create(dto: any, user: any) {
    return this.prisma.product.create({
      data: {
        name: dto.name,
        category: dto.category,
        sub_category: dto.sub_category,
        unit: dto.unit,
        base_price: dto.base_price,
        description: dto.description,
        image_url: dto.image_url,
        specifications: dto.specifications,
        supplier_company_id: user.companyId,
      },
    });
  }

  async update(id: string, dto: any, user: any) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product || product.supplier_company_id !== user.companyId) {
      throw new ForbiddenException('Not allowed to update this product');
    }
    return this.prisma.product.update({
      where: { id },
      data: {
        name: dto.name,
        category: dto.category,
        sub_category: dto.sub_category,
        unit: dto.unit,
        base_price: dto.base_price,
        description: dto.description,
        image_url: dto.image_url,
        specifications: dto.specifications,
        is_active: dto.is_active,
      },
    });
  }

  async remove(id: string, user: any) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product || product.supplier_company_id !== user.companyId) {
      throw new ForbiddenException('Not allowed to delete this product');
    }
    return this.prisma.product.update({
      where: { id },
      data: { is_active: false },
    });
  }
}
