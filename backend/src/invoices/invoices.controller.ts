import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { Prisma } from '@prisma/client';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  create(@Body() data: Prisma.InvoiceCreateInput) {
    return this.invoicesService.create(data);
  }

  @Get()
  findAll() {
    return this.invoicesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.invoicesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: Prisma.InvoiceUpdateInput) {
    return this.invoicesService.update(id, data);
  }
  
  @Delete(':id')
  remove(@Param('id') id: string) {
      return this.invoicesService.remove(id);
  }
}
