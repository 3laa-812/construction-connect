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
import { RFQsService } from './rfqs.service';
import { Prisma } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('rfqs')
export class RFQsController {
  constructor(private readonly rfqsService: RFQsService) {}

  @Post()
  @Roles('CONTRACTOR', 'ADMIN')
  create(
    @Body() data: Prisma.RFQCreateInput,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.rfqsService.create(data, user);
  }

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.rfqsService.findAll(user);
  }

  @Post('items')
  @Roles('CONTRACTOR', 'ADMIN')
  createItem(
    @Body() data: Prisma.RFQItemCreateInput,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.rfqsService.createItem(data, user);
  }

  @Post(':id/bids')
  @Roles('SUPPLIER')
  createBid(
    @Param('id') rfqId: string,
    @Body() data: Prisma.BidCreateInput,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.rfqsService.createBid(
      {
        ...data,
        rfq: { connect: { id: rfqId } },
      },
      user,
    );
  }

  @Get(':id/bids')
  findAllBids(@Param('id') rfqId: string, @CurrentUser() user: JwtPayload) {
    return this.rfqsService.findAllBids(rfqId, user);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const rfq = await this.rfqsService.findOne(id, user);
    if (!rfq) {
      throw new NotFoundException('RFQ not found');
    }
    return rfq;
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() data: Prisma.RFQUpdateInput,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.rfqsService.update(id, data, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.rfqsService.remove(id, user);
  }
}
