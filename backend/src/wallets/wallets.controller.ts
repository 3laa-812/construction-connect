import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { Prisma } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';

@Controller('wallets')
@UseGuards(AuthGuard('jwt'))
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Get('company/:companyId')
  async getWalletByCompany(@Param('companyId') companyId: string) {
    return this.walletsService.findWalletByCompany(companyId);
  }

  @Get('company/:companyId/summary')
  async getWalletSummary(@Param('companyId') companyId: string) {
    return this.walletsService.getWalletSummary(companyId);
  }

  @Get('company/:companyId/transactions')
  async getTransactionsByCompany(@Param('companyId') companyId: string) {
    return this.walletsService.findAllTransactions(companyId);
  }

  @Get('transactions')
  async getAllTransactions(@Query('companyId') companyId?: string, @Query('walletId') walletId?: string) {
    return this.walletsService.findAllTransactions(companyId, walletId);
  }

  @Get('transactions/:id')
  async getTransaction(@Param('id') id: string) {
    return this.walletsService.findOneTransaction(id);
  }

  @Post('transactions')
  async createTransaction(@Body() data: Prisma.TransactionCreateInput) {
    return this.walletsService.createTransaction(data);
  }
}
