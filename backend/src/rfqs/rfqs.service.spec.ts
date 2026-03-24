import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { RFQStatus } from '@prisma/client';
import { RFQsService } from './rfqs.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { NotificationsService } from '../notifications/notifications.service';

const contractorUser = {
  sub: 'user-1',
  companyId: 'co-1',
  role: 'CONTRACTOR' as const,
  email: 'c@example.com',
};

describe('RFQsService.awardBid', () => {
  let service: RFQsService;
  let prisma: {
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = { $transaction: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RFQsService,
        { provide: PrismaService, useValue: prisma },
        { provide: StorageService, useValue: {} },
        {
          provide: NotificationsService,
          useValue: { notifyCompanyUsers: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(RFQsService);
  });

  it('throws ForbiddenException for SUPPLIER role', async () => {
    await expect(
      service.awardBid('rfq-1', 'bid-1', {
        sub: 'user-1',
        companyId: 'co-1',
        role: 'SUPPLIER',
        email: 's@example.com',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('throws ForbiddenException when contractor does not own the RFQ project', async () => {
    prisma.$transaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
      fn({
        rFQ: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'rfq-1',
            project_id: 'p1',
            status: RFQStatus.OPEN,
            project: { company_id: 'other-co' },
          }),
        },
      }),
    );

    await expect(
      service.awardBid('rfq-1', 'bid-1', contractorUser),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws BadRequestException when RFQ is already awarded', async () => {
    prisma.$transaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
      fn({
        rFQ: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'rfq-1',
            project_id: 'p1',
            status: RFQStatus.AWARDED,
            project: { company_id: 'co-1' },
          }),
        },
      }),
    );

    await expect(
      service.awardBid('rfq-1', 'bid-1', contractorUser),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
