import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PurchaseOrdersService } from './purchase-orders.service';
import { Prisma } from '@prisma/client';

@Controller('purchase-orders')
export class PurchaseOrdersController {
  constructor(private readonly poService: PurchaseOrdersService) {}

  @Post()
  create(@Body() data: Prisma.PurchaseOrderCreateInput) {
    return this.poService.create(data);
  }

  @Get()
  findAll() {
    return this.poService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.poService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: Prisma.PurchaseOrderUpdateInput) {
    return this.poService.update(id, data);
  }
  
  @Delete(':id')
  remove(@Param('id') id: string) {
      return this.poService.remove(id);
  }

  @Post(':id/delivery-notes')
  createDeliveryNote(@Param('id') poId: string, @Body() data: Prisma.DeliveryNoteCreateInput) {
      return this.poService.createDeliveryNote(data);
  }

  @Get(':id/delivery-notes')
  findAllDeliveryNotes(@Param('id') poId: string) {
      return this.poService.findAllDeliveryNotes(poId);
  }
}
