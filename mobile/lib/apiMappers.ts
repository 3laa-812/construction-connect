export type ApiListEnvelope<T> =
  | T[]
  | { data?: T[]; items?: T[]; total?: number; count?: number };

export function unwrapList<T>(payload: ApiListEnvelope<T> | null | undefined): T[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.items)) return payload.items;
  return [];
}

export function unwrapTotal<T>(payload: ApiListEnvelope<T> | null | undefined): number {
  if (!payload) return 0;
  if (Array.isArray(payload)) return payload.length;
  if (typeof payload.total === 'number') return payload.total;
  if (typeof payload.count === 'number') return payload.count;
  const rows = unwrapList(payload);
  return rows.length;
}

export interface ProjectVm {
  id: string;
  name: string;
  status: string;
  budget?: number;
  endDate?: string | null;
  sitesCount: number;
  ordersCount: number;
}

export interface RfqVm {
  id: string;
  title: string;
  status: string;
  itemsCount: number;
  bidsCount: number;
  deliveryDate?: string | null;
}

export interface PurchaseOrderVm {
  id: string;
  status: string;
  totalAmount: number;
  supplierName?: string;
  itemsCount: number;
}

function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function mapProject(row: any): ProjectVm {
  return {
    id: row.id,
    name: row.name ?? 'Untitled project',
    status: String(row.status ?? 'ACTIVE'),
    budget: row.budget != null ? toNumber(row.budget) : undefined,
    endDate: row.end_date ?? row.endDate ?? null,
    sitesCount: Array.isArray(row.sites) ? row.sites.length : toNumber(row.sitesCount),
    ordersCount: Array.isArray(row.purchase_orders) ? row.purchase_orders.length : toNumber(row.ordersCount),
  };
}

export function mapRfq(row: any): RfqVm {
  return {
    id: row.id,
    title: row.title ?? row.name ?? `RFQ ${String(row.id).slice(0, 8)}`,
    status: String(row.status ?? 'OPEN'),
    itemsCount: Array.isArray(row.items) ? row.items.length : toNumber(row.itemsCount),
    bidsCount: Array.isArray(row.bids) ? row.bids.length : toNumber(row.bidCount),
    deliveryDate: row.delivery_date_required ?? row.deliveryDate ?? null,
  };
}

export function mapPurchaseOrder(row: any): PurchaseOrderVm {
  return {
    id: row.id,
    status: String(row.status ?? 'CONFIRMED'),
    totalAmount: toNumber(row.total_amount ?? row.totalAmount),
    supplierName: row.supplier?.name,
    itemsCount: Array.isArray(row.items) ? row.items.length : toNumber(row.itemsCount),
  };
}
