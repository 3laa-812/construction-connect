import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Wallet, Transaction, Prisma, TransactionType } from '@prisma/client';

@Injectable()
export class WalletsService {
  constructor(private prisma: PrismaService) {}

  // Wallets
  async findOrCreateWallet(companyId: string): Promise<Wallet> {
    let wallet = await this.prisma.wallet.findFirst({
      where: { company_id: companyId },
      include: { transactions: { orderBy: { created_at: 'desc' }, take: 10 } },
    });

    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: {
          company: { connect: { id: companyId } },
          balance: 0,
          currency: 'SAR',
        },
        include: { transactions: true },
      });
    }

    return wallet;
  }

  async findWalletByCompany(companyId: string): Promise<Wallet | null> {
    return this.prisma.wallet.findFirst({
      where: { company_id: companyId },
      include: {
        transactions: {
          orderBy: { created_at: 'desc' },
          include: {
            invoice: true,
            purchase_order: true,
          },
        },
      },
    });
  }

  // Transactions
  async findAllTransactions(companyId?: string, walletId?: string): Promise<Transaction[]> {
    const where: Prisma.TransactionWhereInput = {};
    
    if (companyId) {
      const wallet = await this.prisma.wallet.findFirst({
        where: { company_id: companyId },
      });
      if (wallet) {
        where.wallet_id = wallet.id;
      } else {
        return []; // No wallet means no transactions
      }
    } else if (walletId) {
      where.wallet_id = walletId;
    }

    return this.prisma.transaction.findMany({
      where,
      include: {
        wallet: { include: { company: true } },
        invoice: true,
        purchase_order: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOneTransaction(id: string): Promise<Transaction | null> {
    return this.prisma.transaction.findUnique({
      where: { id },
      include: {
        wallet: { include: { company: true } },
        invoice: true,
        purchase_order: true,
      },
    });
  }

  async createTransaction(data: Prisma.TransactionCreateInput): Promise<Transaction> {
    // Use a transaction to ensure atomicity
    return this.prisma.$transaction(async (tx) => {
      // Create the transaction
      const transaction = await tx.transaction.create({
        data,
        include: {
          wallet: true,
          invoice: true,
          purchase_order: true,
        },
      });

      // Update wallet balance based on transaction type
      const wallet = await tx.wallet.findUnique({
        where: { id: transaction.wallet_id },
      });

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      let currentBalance = Number(wallet.balance);
      const txAmount = Number(transaction.amount);
      
      if (transaction.type === TransactionType.DEPOSIT || transaction.type === TransactionType.REFUND) {
        currentBalance = currentBalance + txAmount;
      } else if (transaction.type === TransactionType.WITHDRAWAL || transaction.type === TransactionType.PAYMENT) {
        currentBalance = currentBalance - txAmount;
      }

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: currentBalance },
      });

      return transaction;
    });
  }

  async getWalletSummary(companyId: string): Promise<{
    wallet: Wallet;
    totalSpent: number;
    outstandingDues: number;
    recentTransactions: Transaction[];
  }> {
    const wallet = await this.findWalletByCompany(companyId);
    
    if (!wallet) {
      const newWallet = await this.findOrCreateWallet(companyId);
      return {
        wallet: newWallet,
        totalSpent: 0,
        outstandingDues: 0,
        recentTransactions: [],
      };
    }

    // Calculate total spent (all PAYMENT and WITHDRAWAL transactions)
    const allTransactions = await this.prisma.transaction.findMany({
      where: { wallet_id: wallet.id },
    });

    const totalSpent = allTransactions
      .filter(
        (t) =>
          t.type === TransactionType.PAYMENT || t.type === TransactionType.WITHDRAWAL
      )
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Calculate outstanding dues (invoices that are not CLEARED)
    const outstandingInvoices = await this.prisma.invoice.findMany({
      where: {
        OR: [
          { supplier_id: companyId, status: { not: 'CLEARED' } },
          { buyer_id: companyId, status: { not: 'CLEARED' } },
        ],
      },
    });

    const outstandingDues = outstandingInvoices.reduce(
      (sum, inv) => sum + Number(inv.total_amount || 0),
      0
    );

    // Fetch recent transactions separately since wallet might not include them
    const recentTransactions = await this.prisma.transaction.findMany({
      where: { wallet_id: wallet.id },
      include: {
        invoice: true,
        purchase_order: true,
      },
      orderBy: { created_at: 'desc' },
      take: 50,
    });

    return {
      wallet,
      totalSpent,
      outstandingDues,
      recentTransactions,
    };
  }
}
