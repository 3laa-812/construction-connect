import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Project, Site, BOQItem, Prisma } from '@prisma/client';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';

const projectInclude = {
  company: true,
  sites: true,
  boq_items: true,
  rfqs: true,
  purchase_orders: true,
} as const;

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.ProjectCreateInput, user: JwtPayload): Promise<Project> {
    if (user.role === 'ADMIN') {
      return this.prisma.project.create({ data });
    }
    if (user.role !== 'CONTRACTOR' || !user.companyId) {
      throw new ForbiddenException('Only contractors can create projects');
    }
    const { company: _c, ...rest } = data as Record<string, unknown>;
    return this.prisma.project.create({
      data: {
        ...(rest as object),
        company: { connect: { id: user.companyId } },
      } as Prisma.ProjectCreateInput,
    });
  }

  async findAll(user: JwtPayload): Promise<Project[]> {
    if (user.role === 'ADMIN') {
      return this.prisma.project.findMany({ include: projectInclude });
    }
    if (!user.companyId) {
      return []; // intentionally empty — no data for this query when user has no company
    }
    if (user.role === 'SUPPLIER') {
      return this.prisma.project.findMany({
        where: {
          purchase_orders: { some: { supplier_id: user.companyId } },
        },
        include: projectInclude,
      });
    }
    return this.prisma.project.findMany({
      where: { company_id: user.companyId },
      include: projectInclude,
    });
  }

  async findOne(id: string, user: JwtPayload): Promise<Project | null> {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: projectInclude,
    });
    if (!project) {
      return null;
    }
    await this.assertProjectAccess(user, project);
    return project;
  }

  async update(
    id: string,
    data: Prisma.ProjectUpdateInput,
    user: JwtPayload,
  ): Promise<Project> {
    await this.assertProjectAccess(user, id);
    return this.prisma.project.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, user: JwtPayload): Promise<Project> {
    await this.assertProjectAccess(user, id);
    return this.prisma.project.delete({
      where: { id },
    });
  }

  private async assertProjectAccess(
    user: JwtPayload,
    projectOrId: Project | string,
  ): Promise<void> {
    const project =
      typeof projectOrId === 'string'
        ? await this.prisma.project.findUnique({ where: { id: projectOrId } })
        : projectOrId;
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    if (user.role === 'ADMIN') {
      return;
    }
    if (!user.companyId) {
      throw new ForbiddenException('Access denied');
    }
    if (project.company_id === user.companyId) {
      return;
    }
    if (user.role === 'SUPPLIER') {
      const linked = await this.prisma.purchaseOrder.findFirst({
        where: {
          project_id: project.id,
          supplier_id: user.companyId,
        },
      });
      if (linked) {
        return;
      }
    }
    throw new ForbiddenException('Access denied');
  }

  async createSite(
    data: Prisma.SiteCreateInput,
    user: JwtPayload,
  ): Promise<Site> {
    const projectId = (data.project as { connect?: { id: string } })?.connect
      ?.id;
    if (!projectId) {
      throw new ForbiddenException('Project is required');
    }
    await this.assertProjectAccess(user, projectId);
    return this.prisma.site.create({ data });
  }

  async createBOQItem(
    data: Prisma.BOQItemCreateInput,
    user: JwtPayload,
  ): Promise<BOQItem> {
    const projectId = (data.project as { connect?: { id: string } })?.connect
      ?.id;
    if (!projectId) {
      throw new ForbiddenException('Project is required');
    }
    await this.assertProjectAccess(user, projectId);
    return this.prisma.bOQItem.create({ data });
  }
}
