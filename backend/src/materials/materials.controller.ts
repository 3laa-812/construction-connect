import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { MaterialsService } from './materials.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface';

@Controller('materials')
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Get()
  findAll(@Query('category') category?: string, @Query('supplierId') supplierId?: string) {
    return this.materialsService.findAll({ category, supplierId });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.materialsService.findOne(id);
  }

  @Post()
  @Roles('SUPPLIER')
  create(@Body() dto: any, @CurrentUser() user: JwtPayload) {
    return this.materialsService.create(dto, user);
  }

  @Patch(':id')
  @Roles('SUPPLIER')
  update(@Param('id') id: string, @Body() dto: any, @CurrentUser() user: JwtPayload) {
    return this.materialsService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles('SUPPLIER')
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.materialsService.remove(id, user);
  }
}
