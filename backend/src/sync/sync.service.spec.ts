import { SyncService } from './sync.service';
import { PurchaseOrdersService } from '../purchase-orders/purchase-orders.service';

describe('SyncService.pushChanges (LWW)', () => {
  let service: SyncService;
  let prisma: { $transaction: jest.Mock };
  let purchaseOrders: jest.Mocked<
    Pick<PurchaseOrdersService, 'createDeliveryNote'>
  >;

  beforeEach(() => {
    prisma = { $transaction: jest.fn() };
    purchaseOrders = { createDeliveryNote: jest.fn() };
    service = new SyncService(
      prisma as never,
      purchaseOrders as unknown as PurchaseOrdersService,
    );
  });

  const user = {
    sub: 'user-1',
    email: 'u@example.com',
    companyId: 'co-1',
    role: 'CONTRACTOR' as const,
  };

  it('does not apply daily_logs update when incoming updated_at is older than server', async () => {
    const update = jest.fn().mockResolvedValue({});
    const syncChangeCreate = jest.fn().mockResolvedValue({});
    const tx = {
      dailyLog: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'dl-1',
          updated_at: new Date('2025-06-01T00:00:00.000Z'),
        }),
        update,
      },
      syncChange: { create: syncChangeCreate },
    };
    prisma.$transaction.mockImplementation(async (fn: (t: typeof tx) => unknown) =>
      fn(tx),
    );

    await service.pushChanges(
      {
        daily_logs: {
          updated: [
            {
              id: 'dl-1',
              updated_at: new Date('2025-01-01T00:00:00.000Z').getTime(),
              title: 'Stale from client',
            },
          ],
        },
      },
      user,
    );

    expect(update).not.toHaveBeenCalled();
    expect(syncChangeCreate).not.toHaveBeenCalled();
  });

  it('applies daily_logs update when incoming updated_at is newer than server', async () => {
    const update = jest.fn().mockResolvedValue({});
    const syncChangeCreate = jest.fn().mockResolvedValue({});
    const tx = {
      dailyLog: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'dl-1',
          updated_at: new Date('2025-01-01T00:00:00.000Z'),
        }),
        update,
      },
      syncChange: { create: syncChangeCreate },
    };
    prisma.$transaction.mockImplementation(async (fn: (t: typeof tx) => unknown) =>
      fn(tx),
    );

    await service.pushChanges(
      {
        daily_logs: {
          updated: [
            {
              id: 'dl-1',
              updated_at: new Date('2025-08-01T00:00:00.000Z').getTime(),
              title: 'Fresh from client',
            },
          ],
        },
      },
      user,
    );

    expect(update).toHaveBeenCalled();
    expect(syncChangeCreate).toHaveBeenCalled();
  });
});
