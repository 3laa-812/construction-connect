import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SyncChange } from '@prisma/client';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { PurchaseOrdersService } from '../purchase-orders/purchase-orders.service';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private prisma: PrismaService,
    private purchaseOrders: PurchaseOrdersService,
  ) {}

  async pullChanges(lastPulledAt: number, user: JwtPayload) {
    this.logger.debug(
      `pullChanges lastPulledAt=${lastPulledAt} companyId=${user.companyId}`,
    );
    const since = new Date(lastPulledAt);

    // Minimal, explicit scoped pull. This avoids relying on sync_changes
    // (which isn't guaranteed to be populated for server-seeded data).
    const [projectsRaw, sitesRaw] = await Promise.all([
      this.prisma.project.findMany({
        where: { company_id: user.companyId },
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.site.findMany({
        where: { project: { company_id: user.companyId } },
        include: { project: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    // Mobile WatermelonDB schema expects numeric timestamps for *_at / *_date fields.
    const projects = projectsRaw
      .filter((p) => p.created_at > since)
      .map((p) => ({
        id: p.id,
        name: p.name,
        company_id: p.company_id,
        status: null,
        start_date: p.start_date ? p.start_date.getTime() : null,
        end_date: p.end_date ? p.end_date.getTime() : null,
        created_at: p.created_at.getTime(),
        updated_at: p.created_at.getTime(),
      }));

    const sites = sitesRaw
      .filter((s) => s.project.created_at > since)
      .map((s) => ({
        id: s.id,
        project_id: s.project_id,
        name: s.name,
        latitude: s.latitude ? Number(s.latitude) : null,
        longitude: s.longitude ? Number(s.longitude) : null,
        geofence_polygon: s.geofence_polygon
          ? JSON.stringify(s.geofence_polygon)
          : null,
        created_at: s.project.created_at.getTime(),
        updated_at: s.project.created_at.getTime(),
      }));

    return {
      changes: {
        projects: { created: projects, updated: [], deleted: [] },
        sites: { created: sites, updated: [], deleted: [] },
      },
      timestamp: Date.now(),
    };
  }

  async pushChanges(changes: any, user: JwtPayload) {
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
                        if (typeof data.progress_notes === 'string') {
                          try {
                            data.progress_notes = JSON.parse(data.progress_notes);
                          } catch {
                            delete data.progress_notes;
                          }
                        }
                      }
                      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                      // @ts-ignore
                      await tx[modelName].create({ data });
                      
                      await tx.syncChange.create({
                          data: {
                              table_name: tableName,
                              record_id: record.id,
                              operation: 'CREATE',
                              user_id: user.sub,
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
                        if (typeof data.progress_notes === 'string') {
                          try {
                            data.progress_notes = JSON.parse(data.progress_notes);
                          } catch {
                            delete data.progress_notes;
                          }
                        }
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
                              user_id: user.sub,
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
                              user_id: user.sub,
                          }
                      });
                  }
              }
          }
      });

      await this.applyMobileGrnCreates(changes?.grn_records?.created, user);

      return { success: true };
  }

  /** Mobile-only `grn_records` table: create delivery notes + GRN lines on server. */
  private async applyMobileGrnCreates(
    records: any[] | undefined,
    user: JwtPayload,
  ) {
    if (!records?.length) return;
    for (const raw of records) {
      const poServerId = raw.po_server_id as string | undefined;
      if (!poServerId?.trim()) continue;
      let lines: Array<{
        po_item_id: string;
        received_qty: number;
        condition?: string;
      }> = [];
      try {
        lines = JSON.parse(String(raw.items_json ?? '[]'));
      } catch {
        continue;
      }
      const items = lines
        .filter(
          (l) =>
            l.condition !== 'Rejected' && Number(l.received_qty) > 0,
        )
        .map((l) => ({
          po_item_id: l.po_item_id,
          delivered_qty: Number(l.received_qty),
        }));
      if (!items.length) continue;
      try {
        await this.purchaseOrders.createDeliveryNote(
          poServerId.trim(),
          { items, status: 'DELIVERED' },
          user,
        );
      } catch (e) {
        this.logger.error(
          `GRN sync failed for PO ${poServerId}`,
          e instanceof Error ? e.stack : e,
        );
      }
    }
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
