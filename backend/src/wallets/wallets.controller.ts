import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { Prisma } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface';

@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  private assertCompanyWallet(user: JwtPayload, companyId: string) {
    if (user.role === 'ADMIN') {
      return;
    }
    if (user.companyId !== companyId) {
      throw new ForbiddenException('Access denied');
    }
  }

  @Get('company/:companyId')
  async getWalletByCompany(
    @Param('companyId') companyId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    this.assertCompanyWallet(user, companyId);
    return this.walletsService.findWalletByCompany(companyId);
  }

  @Get('company/:companyId/summary')
  async getWalletSummary(
    @Param('companyId') companyId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    this.assertCompanyWallet(user, companyId);
    return this.walletsService.getWalletSummary(companyId);
  }

  @Get('company/:companyId/transactions')
  async getTransactionsByCompany(
    @Param('companyId') companyId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    this.assertCompanyWallet(user, companyId);
    return this.walletsService.findAllTransactions(companyId);
  }

  @Get('transactions')
  async getAllTransactions(
    @Query('companyId') companyId: string | undefined,
    @Query('walletId') walletId: string | undefined,
    @CurrentUser() user: JwtPayload,
  ) {
    if (companyId) {
      this.assertCompanyWallet(user, companyId);
    } else if (user.role !== 'ADMIN') {
      throw new ForbiddenException('companyId is required');
    }
    return this.walletsService.findAllTransactions(companyId, walletId);
  }

  @Get('transactions/:id')
  async getTransaction(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const tx = await this.walletsService.findOneTransaction(id);
    if (!tx) {
      throw new NotFoundException('Transaction not found');
    }
    if (user.role !== 'ADMIN') {
      const wallet = await this.walletsService.findWalletById(tx.wallet_id);
      if (!wallet || wallet.company_id !== user.companyId) {
        throw new ForbiddenException('Access denied');
      }
    }
    return tx;
  }

  @Post('transactions')
  async createTransaction(
    @Body() data: Prisma.TransactionCreateInput,
    @CurrentUser() user: JwtPayload,
  ) {
    if (user.role !== 'ADMIN') {
      const walletId = (data.wallet as { connect?: { id: string } })?.connect
        ?.id;
      if (!walletId) {
        throw new ForbiddenException('wallet is required');
      }
      const wallet = await this.walletsService.findWalletById(walletId);
      if (!wallet || wallet.company_id !== user.companyId) {
        throw new ForbiddenException('Access denied');
      }
    }
    return this.walletsService.createTransaction(data);
  }
}

