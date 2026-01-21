import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { Prisma } from '@prisma/client';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(@Body() data: Prisma.ProjectCreateInput) {
    return this.projectsService.create(data);
  }

  @Get()
  findAll() {
    return this.projectsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: Prisma.ProjectUpdateInput) {
    return this.projectsService.update(id, data);
  }
  
  @Delete(':id')
  remove(@Param('id') id: string) {
      return this.projectsService.remove(id);
  }

  @Post('sites')
  createSite(@Body() data: Prisma.SiteCreateInput) {
      return this.projectsService.createSite(data);
  }
  
  @Post('boqs')
  createBOQItem(@Body() data: Prisma.BOQItemCreateInput) {
      return this.projectsService.createBOQItem(data);
  }
}
