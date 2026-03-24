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
import { InvoicesService } from './invoices.service';
import { Prisma } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  create(
    @Body() data: Prisma.InvoiceCreateInput,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.invoicesService.create(data, user);
  }

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.invoicesService.findAll(user);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const invoice = await this.invoicesService.findOne(id, user);
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }
    return invoice;
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() data: Prisma.InvoiceUpdateInput,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.invoicesService.update(id, data, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.invoicesService.remove(id, user);
  }
}
