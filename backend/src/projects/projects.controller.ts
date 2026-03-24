import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  NotFoundException,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { Prisma } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(
    @Body() data: Prisma.ProjectCreateInput,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projectsService.create(data, user);
  }

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.projectsService.findAll(user);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const project = await this.projectsService.findOne(id, user);
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() data: Prisma.ProjectUpdateInput,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projectsService.update(id, data, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.projectsService.remove(id, user);
  }

  @Post('sites')
  createSite(
    @Body() data: Prisma.SiteCreateInput,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projectsService.createSite(data, user);
  }

  @Post('boqs')
  createBOQItem(
    @Body() data: Prisma.BOQItemCreateInput,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projectsService.createBOQItem(data, user);
  }
}
