import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  NotFoundException,
} from '@nestjs/common';
import { PurchaseOrdersService } from './purchase-orders.service';
import { POStatus, Prisma } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface';

@Controller('purchase-orders')
export class PurchaseOrdersController {
  constructor(private readonly poService: PurchaseOrdersService) {}

  @Post()
  create(
    @Body() data: Prisma.PurchaseOrderCreateInput,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.poService.create(data, user);
  }

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.poService.findAll(user);
  }

  @Post(':id/delivery-notes')
  createDeliveryNote(
    @Param('id') poId: string,
    @Body()
    data: {
      delivery_date?: string;
      status?: 'OUT_FOR_DELIVERY' | 'DELIVERED';
      pod_image_url?: string;
      pod_signature_url?: string;
      received_by?: string;
      items: Array<{ po_item_id: string; delivered_qty: number }>;
    },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.poService.createDeliveryNote(poId, data, user);
  }

  @Get(':id/delivery-notes')
  findAllDeliveryNotes(
    @Param('id') poId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.poService.findAllDeliveryNotes(poId, user);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const po = await this.poService.findOne(id, user);
    if (!po) {
      throw new NotFoundException('Purchase order not found');
    }
    return po;
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() data: Prisma.PurchaseOrderUpdateInput,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.poService.update(id, data, user);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() data: { status: POStatus; note?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    if (!data?.status) {
      throw new BadRequestException('status is required');
    }
    return this.poService.updateStatus(id, data.status, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.poService.remove(id, user);
  }
}
