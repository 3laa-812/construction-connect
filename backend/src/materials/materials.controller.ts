import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { MaterialsService } from './materials.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('materials')
@UseGuards(AuthGuard('jwt'))
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Get()
  findAll() {
    return this.materialsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.materialsService.findOne(id);
  }
}
