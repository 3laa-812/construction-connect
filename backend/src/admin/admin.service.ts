import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getAuditLogs(params: {
    page?: number;
    limit?: number;
    entityType?: string;
    from?: string;
    to?: string;
  }) {
    const page = Math.max(1, Number(params.page || 1));
    const limit = Math.min(100, Math.max(1, Number(params.limit || 20)));
    const skip = (page - 1) * limit;

    const where: {
      entity_type?: string;
      created_at?: { gte?: Date; lte?: Date };
    } = {};

    if (params.entityType) {
      where.entity_type = params.entityType.toUpperCase();
    }
    if (params.from || params.to) {
      where.created_at = {};
      if (params.from) {
        where.created_at.gte = new Date(params.from);
      }
      if (params.to) {
        where.created_at.lte = new Date(params.to);
      }
    }

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items,
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async getCategories() {
    const categories = await this.prisma.category.findMany({
      include: {
        children: {
          select: { id: true }
        }
      }
    });

    return categories.map(c => ({
      id: c.id,
      name: c.name,
      nameAr: (c as any).name_ar || c.name, // To satisfy frontend
      parentId: c.parent_id,
      productCount: c.children.length, // Placeholder logic
    }));
  }

  async createCategory(dto: any) {
    const data: any = {
      name: dto.name,
      parent_id: dto.parentId || null,
      unit_options: [],
    };
    if (dto.nameAr) data.name_ar = dto.nameAr;

    const cat = await this.prisma.category.create({ data });
    return {
      id: cat.id,
      name: cat.name,
      nameAr: (cat as any).name_ar || cat.name,
      parentId: cat.parent_id,
    };
  }

  async updateCategory(id: string, dto: any) {
    const data: any = {};
    if (dto.name) data.name = dto.name;
    if (dto.nameAr) data.name_ar = dto.nameAr;
    if (dto.parentId !== undefined) data.parent_id = dto.parentId || null;

    const cat = await this.prisma.category.update({
      where: { id },
      data
    });
    return {
      id: cat.id,
      name: cat.name,
      nameAr: (cat as any).name_ar || cat.name,
      parentId: cat.parent_id,
    };
  }

  async deleteCategory(id: string) {
    await this.prisma.category.delete({ where: { id } });
    return { success: true };
  }
}
