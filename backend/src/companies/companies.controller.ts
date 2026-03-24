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
import { CompaniesService } from './companies.service';
import { Prisma } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @Roles('ADMIN')
  create(@Body() data: Prisma.CompanyCreateInput) {
    return this.companiesService.create(data);
  }

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.companiesService.findAll(user);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const company = await this.companiesService.findOne(id, user);
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    return company;
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() data: Prisma.CompanyUpdateInput,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.companiesService.update(id, data, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.companiesService.remove(id, user);
  }
}
