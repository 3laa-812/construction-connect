import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  NotFoundException,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CompaniesService } from './companies.service';
import { Prisma } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { Roles } from '../common/decorators/roles.decorator';
import type { MulterMemoryFile } from '../storage/upload-file.types';

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

  @Post(':id/documents')
  @Roles('CONTRACTOR', 'SUPPLIER', 'ADMIN')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 25 * 1024 * 1024 },
    }),
  )
  uploadDocument(
    @Param('id') id: string,
    @Body('doc_type') docType: string,
    @UploadedFile() file: MulterMemoryFile | undefined,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!docType?.trim()) {
      throw new BadRequestException('doc_type is required');
    }
    if (!file?.buffer?.length) {
      throw new BadRequestException('file is required');
    }
    return this.companiesService.uploadDocument(id, docType.trim(), file, user);
  }

  @Patch(':id/verify')
  @Roles('ADMIN')
  verify(@Param('id') id: string) {
    return this.companiesService.verifyCompany(id);
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
