import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Project, Site, BOQItem, Prisma } from '@prisma/client';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  // Projects
  async create(data: Prisma.ProjectCreateInput): Promise<Project> {
    return this.prisma.project.create({ data });
  }

  async findAll(): Promise<Project[]> {
    return this.prisma.project.findMany({
      include: {
        company: true,
        sites: true,
        boq_items: true,
        rfqs: true,
        purchase_orders: true,
      },
    });
  }

  async findOne(id: string): Promise<Project | null> {
    return this.prisma.project.findUnique({
      where: { id },
      include: {
        company: true,
        sites: true,
        boq_items: true,
        rfqs: true,
        purchase_orders: true,
      },
    });
  }

  async update(id: string, data: Prisma.ProjectUpdateInput): Promise<Project> {
    return this.prisma.project.update({
      where: { id },
      data,
    });
  }
  
  async remove(id: string): Promise<Project> {
      return this.prisma.project.delete({
          where: { id }
      });
  }

  // Sites
  async createSite(data: Prisma.SiteCreateInput): Promise<Site> {
    return this.prisma.site.create({ data });
  }
  
  // BOQ Items
  async createBOQItem(data: Prisma.BOQItemCreateInput): Promise<BOQItem> {
      return this.prisma.bOQItem.create({ data });
  }
}
