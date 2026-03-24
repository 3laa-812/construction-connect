import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SyncChange } from '@prisma/client';

@Injectable()
export class SyncService {
  constructor(private prisma: PrismaService) {}

  async pullChanges(lastPulledAt: number) {
    console.log('SyncService.pullChanges called');
    const timestamp = new Date(lastPulledAt);
    const changes = await this.prisma.syncChange.findMany({
      where: {
        changed_at: {
          gt: timestamp,
        },
      },
      orderBy: {
        changed_at: 'asc',
      },
    });

    const groupedChanges = changes.reduce((acc, change) => {
      const { table_name, record_id, operation } = change;
      if (!acc[table_name]) {
        acc[table_name] = { created: [], updated: [], deleted: [] };
      }
      
      if (operation === 'CREATE') {
        acc[table_name].created.push(record_id); 
        // Note: Ideally we should fetch the actual data here. 
        // For 'created' and 'updated', we need to return the full object, not just ID.
        // This current implementation is a specialized optimized fetcher.
      } else if (operation === 'UPDATE') {
        acc[table_name].updated.push(record_id);
      } else if (operation === 'DELETE') {
        acc[table_name].deleted.push(record_id);
      }
      return acc;
    }, {});

    // Hydrate created/updated records with actual data
    // This is a naive implementation; for production, bulk fetch per table.
    for (const tableName in groupedChanges) {
        const modelName = this.mapTableNameToModel(tableName);
        if (!modelName) continue;

        // Hydrate Created
        const createdIds = groupedChanges[tableName].created;
        if (createdIds.length > 0) {
             // eslint-disable-next-line @typescript-eslint/ban-ts-comment
             // @ts-ignore
            const records = await this.prisma[modelName].findMany({ where: { id: { in: createdIds } } });
            groupedChanges[tableName].created = records.map(r => this.sanitizeOutbound(r));
        }

        // Hydrate Updated
        const updatedIds = groupedChanges[tableName].updated;
        if (updatedIds.length > 0) {
             // eslint-disable-next-line @typescript-eslint/ban-ts-comment
             // @ts-ignore
            const records = await this.prisma[modelName].findMany({ where: { id: { in: updatedIds } } });
            groupedChanges[tableName].updated = records.map(r => this.sanitizeOutbound(r));
        }
    }

    return {
        changes: groupedChanges,
        timestamp: Date.now(), 
    };
  }

  async pushChanges(changes: any, userId: string) {
       // WatermelonDB sends { [tableName]: { created: [], updated: [], deleted: [] } }
      const processOrder = [
        'companies', 'users', 
        'projects', 'sites', 'boq_items',
        'rfqs', 'rfq_items',
        'bids', 'bid_items',
        'purchase_orders', 'po_items',
        'delivery_notes', 'grn_items',
        'invoices', 
        'daily_logs', 'log_photos',
        'wallets', 'transactions',
        'products',
      ];

      await this.prisma.$transaction(async (tx) => {
          for (const tableName of processOrder) {
              if (!changes[tableName]) continue;
              
              const modelName = this.mapTableNameToModel(tableName);
              if (!modelName) continue;

              const tableChanges = changes[tableName];

              // Products are pull-only from mobile clients.
              if (tableName === 'products') {
                continue;
              }

              // Created
              if (tableChanges.created && tableChanges.created.length > 0) {
                  for (const record of tableChanges.created) {
                      const data = this.sanitizeForPrisma(record);
                      if (tableName === 'daily_logs') {
                        data.status = 'SYNCED';
                      }
                      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                      // @ts-ignore
                      await tx[modelName].create({ data });
                      
                      await tx.syncChange.create({
                          data: {
                              table_name: tableName,
                              record_id: record.id,
                              operation: 'CREATE',
                              user_id: userId,
                          }
                      });
                  }
              }

              // Updated
              if (tableChanges.updated && tableChanges.updated.length > 0) {
                  for (const record of tableChanges.updated) {
                       const data = this.sanitizeForPrisma(record);
                      if (tableName === 'daily_logs') {
                        data.status = 'SYNCED';
                      }
                      // Last-Write-Wins (LWW): only apply incoming update when it is not older
                      // than the current server record, using updated_at timestamps.
                      // If either side lacks updated_at, we keep backward compatibility and apply.
                      if (record?.id && data.updated_at) {
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        const existing = await tx[modelName].findUnique({ where: { id: record.id } });
                        const incomingUpdatedAt = new Date(data.updated_at).getTime();
                        const existingUpdatedAt =
                          existing?.updated_at instanceof Date
                            ? existing.updated_at.getTime()
                            : null;
                        if (
                          existingUpdatedAt !== null &&
                          Number.isFinite(incomingUpdatedAt) &&
                          incomingUpdatedAt < existingUpdatedAt
                        ) {
                          continue;
                        }
                      }
                      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                      // @ts-ignore
                      await tx[modelName].update({ where: { id: record.id }, data });
                      
                      await tx.syncChange.create({
                          data: {
                              table_name: tableName,
                              record_id: record.id,
                              operation: 'UPDATE',
                              user_id: userId,
                          }
                      });
                  }
              }

              // Deleted
              if (tableChanges.deleted && tableChanges.deleted.length > 0) {
                  for (const id of tableChanges.deleted) {
                       // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                       // @ts-ignore
                      await tx[modelName].delete({ where: { id: id as string } });
                      
                      await tx.syncChange.create({
                          data: {
                              table_name: tableName,
                              record_id: id as string,
                              operation: 'DELETE',
                              user_id: userId,
                          }
                      });
                  }
              }
          }
      });
      return { success: true };
  }
  
  private mapTableNameToModel(tableName: string): string | null {
      const map = {
          'projects': 'project',
          'sites': 'site',
          'boq_items': 'bOQItem', 
          'rfqs': 'rFQ',
          'rfq_items': 'rFQItem',
          'bids': 'bid',
          'bid_items': 'bidItem',
          'purchase_orders': 'purchaseOrder',
          'po_items': 'pOItem',
          'delivery_notes': 'deliveryNote',
          'grn_items': 'gRNItem',
          'invoices': 'invoice',
          'users': 'user',
          'companies': 'company',
          'wallets': 'wallet',
          'transactions': 'transaction',
          'daily_logs': 'dailyLog',
          'log_photos': 'logPhoto',
          'products': 'product'
      };
      return map[tableName] || null;
  }

  private sanitizeForPrisma(record: any): any {
    const data = { ...record };
    // Remove WatermelonDB internal fields
    delete data._status;
    delete data._changed;

    // Convert timestamps to Dates
    if (typeof data.created_at === 'number') {
        data.created_at = new Date(data.created_at);
    }
    if (typeof data.updated_at === 'number') {
        data.updated_at = new Date(data.updated_at);
    }
    if (typeof data.start_date === 'number') {
        data.start_date = new Date(data.start_date);
    }
    if (typeof data.end_date === 'number') {
        data.end_date = new Date(data.end_date);
    }
    if (typeof data.deadline === 'number') {
        data.deadline = new Date(data.deadline);
    }
    
    return data;
  }

  private sanitizeOutbound(record: any): any {
    const data = { ...record };
    // Convert Dates to timestamps for WatermelonDB
    if (data.created_at instanceof Date) data.created_at = data.created_at.getTime();
    if (data.updated_at instanceof Date) data.updated_at = data.updated_at.getTime();
    if (data.start_date instanceof Date) data.start_date = data.start_date.getTime();
    if (data.end_date instanceof Date) data.end_date = data.end_date.getTime();
    if (data.deadline instanceof Date) data.deadline = data.deadline.getTime();
    if (data.delivery_date instanceof Date) data.delivery_date = data.delivery_date.getTime();
    
    return data;
  }
}
