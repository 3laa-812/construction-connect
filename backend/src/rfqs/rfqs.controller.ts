import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { RFQsService } from './rfqs.service';
import { Prisma } from '@prisma/client';

@Controller('rfqs')
export class RFQsController {
  constructor(private readonly rfqsService: RFQsService) {}

  @Post()
  create(@Body() data: Prisma.RFQCreateInput) {
    return this.rfqsService.create(data);
  }

  @Get()
  findAll() {
    return this.rfqsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rfqsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: Prisma.RFQUpdateInput) {
    return this.rfqsService.update(id, data);
  }
  
  @Delete(':id')
  remove(@Param('id') id: string) {
      return this.rfqsService.remove(id);
  }

  @Post('items')
  createItem(@Body() data: Prisma.RFQItemCreateInput) {
      return this.rfqsService.createItem(data);
  }

  @Post(':id/bids')
  createBid(@Param('id') rfqId: string, @Body() data: Prisma.BidCreateInput) {
      // Ensure the bid links to the correct RFQ, though data should probably contain it or be cleaned
      return this.rfqsService.createBid(data);
  }

  @Get(':id/bids')
  findAllBids(@Param('id') rfqId: string) {
      return this.rfqsService.findAllBids(rfqId);
  }
}
