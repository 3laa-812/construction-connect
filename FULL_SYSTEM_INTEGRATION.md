# 🔗 FULL SYSTEM INTEGRATION & PRODUCTION READINESS
## The Single Source of Truth for Making Web + Mobile + Backend Work Together

> **Root problem diagnosed:** Mobile shows empty data because it reads from
> WatermelonDB (local SQLite) which is never populated — the sync endpoint
> is broken (missing JWT, wrong body shape, missing tables in processOrder).
> The web reads from the real API but many endpoints are unauthenticated and
> unscoped, so data bleeds across companies. Core business flows (RFQ award,
> GRN, invoice) are UI-only with no backend persistence.
>
> **This document is the single prompt that fixes everything.**
> Work every section in strict order. Do not skip ahead.
> One atomic Git commit per section with the prefix shown.
>
> **Repo layout:**
> ```
> /backend/   NestJS + Prisma + PostgreSQL
> /frontend/  Vite + React + TanStack Query
> /mobile/    Expo + WatermelonDB (SQLite offline store)
> ```
> **All three share ONE PostgreSQL database.**
> Mobile reaches it through the NestJS API + WatermelonDB sync protocol.
> Web reaches it directly through the NestJS REST API.

---

## ════════════════════════════════════════════════
## PHASE 0 — ENVIRONMENT WIRING (do this before any code)
## ════════════════════════════════════════════════
**Commit:** `chore(env): unify environment configuration across all three apps`

### 0.1 — Canonical `.env` files

**`backend/.env`** (create if missing, never commit):
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/construction_connect"
JWT_SECRET="change-this-to-a-secure-random-64-char-string-in-production"
JWT_EXPIRES_IN="7d"
PORT=3000

# S3 (use LocalStack for local dev)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_S3_BUCKET=construction-connect-local
AWS_S3_ENDPOINT=http://localhost:4566   # LocalStack; remove in prod

# Email (Mailtrap for dev)
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=
SMTP_PASS=

# OpenWeatherMap (mobile uses this via backend proxy)
OPENWEATHER_API_KEY=

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

**`frontend/.env`** (create if missing):
```env
VITE_API_URL=http://localhost:3000
VITE_APP_NAME="Construction Connect"
```

**`mobile/.env`** (create if missing — Expo reads EXPO_PUBLIC_* at build time):
```env
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_APP_NAME="Construction Connect"
EXPO_PUBLIC_OPENWEATHER_KEY=
```

**`mobile/app.config.ts`** — ensure extra config is exposed:
```ts
export default {
  expo: {
    name: 'Construction Connect',
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000',
    },
  },
};
```

### 0.2 — Single API base URL utility (mobile)

Create `mobile/services/api.ts` (replace if exists):
```ts
import Constants from 'expo-constants';

export const API_BASE: string =
  (Constants.expoConfig?.extra?.apiUrl as string) ?? 'http://localhost:3000';

// Typed fetch wrapper — every service uses this, never raw fetch
export async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, ...rest } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(rest.headers as Record<string, string> ?? {}),
  };
  const res = await fetch(`${API_BASE}${path}`, { ...rest, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `HTTP ${res.status}`);
  }
  return res.json();
}
```

### 0.3 — Auth token storage (mobile)

Create `mobile/services/auth.ts`:
```ts
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'cc_auth_token';
const USER_KEY  = 'cc_auth_user';

export const authStorage = {
  saveToken: (token: string) => SecureStore.setItemAsync(TOKEN_KEY, token),
  getToken:  () => SecureStore.getItemAsync(TOKEN_KEY),
  saveUser:  (user: object) =>
    SecureStore.setItemAsync(USER_KEY, JSON.stringify(user)),
  getUser:   async () => {
    const s = await SecureStore.getItemAsync(USER_KEY);
    return s ? JSON.parse(s) : null;
  },
  clear: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  },
};
```

### 0.4 — Verify the backend is reachable from mobile

Add `GET /health` to the backend (if not already done from previous prompts):
```ts
// backend/src/app.controller.ts
@Get('health')
health() { return { status: 'ok', timestamp: new Date().toISOString() }; }
```

From the mobile `.env`, run:
```bash
curl http://localhost:3000/health   # must return {"status":"ok",...}
```
On a physical device, replace `localhost` with your machine's LAN IP
(e.g. `192.168.1.x`). Update `EXPO_PUBLIC_API_URL` accordingly.

---

## ════════════════════════════════════════════════
## PHASE 1 — BACKEND: LOCK DOWN & COMPLETE THE API
## ════════════════════════════════════════════════

### 1.1 — Global JWT Guard + Public decorator
**Commit:** `fix(backend): global JWT guard with Public decorator`

**`backend/src/common/decorators/public.decorator.ts`:**
```ts
import { SetMetadata } from '@nestjs/common';
export const IS_PUBLIC = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC, true);
```

**`backend/src/auth/guards/jwt-auth.guard.ts`** — update to check `IS_PUBLIC`:
```ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) { super(); }
  canActivate(ctx: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      ctx.getHandler(), ctx.getClass(),
    ]);
    return isPublic ? true : super.canActivate(ctx);
  }
}
```

**`backend/src/app.module.ts`** — register as global guard:
```ts
providers: [
  { provide: APP_GUARD, useClass: JwtAuthGuard },
  { provide: APP_GUARD, useClass: RolesGuard },
],
```

Mark public routes with `@Public()`:
- `POST /auth/login`
- `POST /auth/register`
- `POST /auth/verify-otp`
- `GET /health`

### 1.2 — JWT payload carries companyId + role
**Commit:** `fix(backend): JWT payload includes companyId and role`

**`backend/src/auth/auth.service.ts`** — in `login()`:
```ts
const payload = {
  sub:       user.id,
  email:     user.email,
  companyId: user.company_id,
  role:      user.role,           // 'CONTRACTOR' | 'SUPPLIER' | 'ADMIN'
  companyCountry: user.company.country,  // 'SA' | 'EG'
};
return { access_token: this.jwtService.sign(payload) };
```

**`backend/src/auth/strategies/jwt.strategy.ts`** — validate returns full payload:
```ts
validate(payload: any) {
  return {
    id:             payload.sub,
    email:          payload.email,
    companyId:      payload.companyId,
    role:           payload.role,
    companyCountry: payload.companyCountry,
  };
}
```

**`backend/src/common/decorators/current-user.decorator.ts`:**
```ts
export const CurrentUser = createParamDecorator(
  (_data, ctx) => ctx.switchToHttp().getRequest().user,
);
```

### 1.3 — Tenant isolation on every findAll
**Commit:** `fix(backend): tenant-scope all findAll queries`

Apply to every service listed. The pattern is always the same:

```ts
// BEFORE (broken — returns all rows):
findAll() { return this.prisma.project.findMany(); }

// AFTER (correct — scoped to caller's company):
findAll(user: JwtPayload) {
  return this.prisma.project.findMany({
    where: { company_id: user.companyId },
    include: { sites: true },
    orderBy: { created_at: 'desc' },
  });
}
```

Apply this pattern to:

| Service | Where clause |
|---------|-------------|
| `projects.service.ts → findAll` | `company_id: user.companyId` |
| `rfqs.service.ts → findAll` (CONTRACTOR) | `company_id: user.companyId` |
| `rfqs.service.ts → findAll` (SUPPLIER) | `status: 'OPEN'` + category match |
| `purchase-orders.service.ts → findAll` | `OR: [buyer_company_id, supplier_company_id] = user.companyId` |
| `invoices.service.ts → findAll` | same as PO |
| `daily-logs.service.ts → findAll` | `user_id: user.id` |
| `companies.service.ts → findAll` | ADMIN only; others: `id: user.companyId` |
| `users.service.ts → findAll` | `company_id: user.companyId` |
| `wallets.service.ts → findOne` | `company_id: user.companyId` |

Update every corresponding controller to pass `@CurrentUser() user` to
the service method.

### 1.4 — Prisma schema: all missing tables and fields
**Commit:** `feat(backend): prisma schema additions and migrations`

Add the following to `backend/prisma/schema.prisma` then run
`npx prisma migrate dev --name production-schema-additions`:

```prisma
// ── Expand POStatus ────────────────────────────────────────────────────────
enum POStatus {
  CONFIRMED
  PROCESSING
  OUT_FOR_DELIVERY
  DELIVERED
  COMPLETED
  CANCELLED
}

// ── Expand DailyLogStatus ──────────────────────────────────────────────────
enum DailyLogStatus {
  DRAFT
  SUBMITTED
  SYNCED
}

// ── Inventory table ────────────────────────────────────────────────────────
model Inventory {
  id           String   @id @default(uuid())
  project_id   String
  site_id      String?
  product_name String
  unit         String
  qty_on_hand  Decimal  @default(0) @db.Decimal(12, 3)
  last_grn_at  DateTime?
  created_at   DateTime @default(now())
  updated_at   DateTime @updatedAt
  project      Project  @relation(fields: [project_id], references: [id])
}

// ── AuditLog table ─────────────────────────────────────────────────────────
model AuditLog {
  id          String   @id @default(uuid())
  user_id     String
  company_id  String
  action      String
  entity_type String
  entity_id   String
  old_value   Json?
  new_value   Json?
  ip_address  String?
  created_at  DateTime @default(now())
}

// ── Notification table ─────────────────────────────────────────────────────
model Notification {
  id         String   @id @default(uuid())
  user_id    String
  title      String
  body       String
  type       String
  entity_id  String?
  is_read    Boolean  @default(false)
  created_at DateTime @default(now())
  user       User     @relation(fields: [user_id], references: [id])
}

// ── CompanyDocument table ──────────────────────────────────────────────────
model CompanyDocument {
  id          String   @id @default(uuid())
  company_id  String
  doc_type    String   // CR | TAX_ID | VAT_CERT | COMPANY_LOGO
  file_url    String
  uploaded_at DateTime @default(now())
  company     Company  @relation(fields: [company_id], references: [id])
}

// ── RFQAttachment table ────────────────────────────────────────────────────
model RFQAttachment {
  id        String @id @default(uuid())
  rfq_id    String
  file_url  String
  file_name String
  rfq       RFQ    @relation(fields: [rfq_id], references: [id])
}

// ── Bid: add rejection_reason ──────────────────────────────────────────────
// Add to existing Bid model:
//   rejection_reason  String?

// ── Product: ensure these fields exist ────────────────────────────────────
// Add to existing Product model if missing:
//   sub_category         String?
//   description          String?
//   image_url            String?
//   is_active            Boolean @default(true)
//   supplier_company_id  String
//   supplier             Company @relation(...)
```

### 1.5 — RFQ award → Purchase Order (the core broken flow)
**Commit:** `feat(backend): RFQ award creates PO transactionally`

**`backend/src/rfqs/rfqs.controller.ts`** — add:
```ts
@Patch(':rfqId/award/:bidId')
awardBid(
  @Param('rfqId') rfqId: string,
  @Param('bidId') bidId: string,
  @CurrentUser() user: JwtPayload,
) {
  return this.rfqsService.awardBid(rfqId, bidId, user);
}

@Patch(':rfqId/bids/:bidId/reject')
rejectBid(
  @Param('rfqId') rfqId: string,
  @Param('bidId') bidId: string,
  @Body('rejection_reason') reason: string,
  @CurrentUser() user: JwtPayload,
) {
  return this.rfqsService.rejectBid(rfqId, bidId, reason, user);
}
```

**`backend/src/rfqs/rfqs.service.ts`** — implement `awardBid`:
```ts
async awardBid(rfqId: string, bidId: string, user: JwtPayload) {
  return this.prisma.$transaction(async (tx) => {
    // 1. Validate ownership
    const rfq = await tx.rFQ.findUniqueOrThrow({ where: { id: rfqId },
      include: { items: true } });
    if (rfq.company_id !== user.companyId)
      throw new ForbiddenException('Not your RFQ');
    if (rfq.status !== 'OPEN')
      throw new BadRequestException(`RFQ is already ${rfq.status}`);

    // 2. Validate bid belongs to this RFQ
    const bid = await tx.bid.findUniqueOrThrow({ where: { id: bidId },
      include: { items: true, company: true } });
    if (bid.rfq_id !== rfqId)
      throw new BadRequestException('Bid does not belong to this RFQ');

    // 3. Update RFQ
    await tx.rFQ.update({ where: { id: rfqId },
      data: { status: 'AWARDED', awarded_bid_id: bidId } });

    // 4. Reject all other bids
    await tx.bid.updateMany({
      where: { rfq_id: rfqId, id: { not: bidId } },
      data: { status: 'REJECTED',
        rejection_reason: 'Another bid was selected' },
    });

    // 5. Accept winning bid
    await tx.bid.update({ where: { id: bidId },
      data: { status: 'ACCEPTED' } });

    // 6. Create Purchase Order
    const po = await tx.purchaseOrder.create({
      data: {
        buyer_company_id:    rfq.company_id,
        supplier_company_id: bid.company_id,
        rfq_id:              rfq.id,
        project_id:          rfq.project_id,
        status:              'CONFIRMED',
        payment_terms:       rfq.payment_terms,
        required_delivery_date: rfq.required_delivery_date,
        total_amount: bid.items.reduce(
          (s, i) => s + Number(i.total_price), 0),
        items: {
          create: bid.items.map(i => ({
            product_name: i.product_name,
            quantity:     i.quantity,
            unit:         i.unit,
            unit_price:   i.unit_price,
            total_price:  i.total_price,
            received_qty: 0,
          })),
        },
      },
      include: { items: true, supplier: true, buyer: true },
    });

    // 7. Notify winning supplier
    await this.notificationsService.create(bid.company.users[0]?.id, {
      title: 'Bid accepted!',
      body:  `Your bid on "${rfq.title}" has been accepted.`,
      type:  'bid_accepted',
      entity_id: po.id,
    });

    return po;
  });
}
```

### 1.6 — Purchase Order: full status transitions + GRN
**Commit:** `feat(backend): PO status transitions, GRN, and inventory update`

**`backend/src/purchase-orders/purchase-orders.controller.ts`:**
```ts
// Fix createDeliveryNote to enforce poId from route:
@Post(':id/delivery-notes')
@UseInterceptors(FileInterceptor('delivery_ticket'))
createDeliveryNote(
  @Param('id') poId: string,
  @Body() dto: CreateDeliveryNoteDto,
  @UploadedFile() file: Express.Multer.File,
  @CurrentUser() user: JwtPayload,
) {
  return this.service.createDeliveryNote(poId, dto, file, user);
}

// New: status transition
@Patch(':id/status')
updateStatus(
  @Param('id') id: string,
  @Body() dto: { status: POStatus; note?: string },
  @CurrentUser() user: JwtPayload,
) {
  return this.service.updateStatus(id, dto, user);
}
```

**`backend/src/purchase-orders/purchase-orders.service.ts`:**
```ts
async createDeliveryNote(
  poId: string,
  dto: CreateDeliveryNoteDto,
  file: Express.Multer.File | undefined,
  user: JwtPayload,
) {
  const po = await this.prisma.purchaseOrder.findUniqueOrThrow({
    where: { id: poId }, include: { items: true } });

  // Only supplier can create GRN
  if (po.supplier_company_id !== user.companyId)
    throw new ForbiddenException('Only the supplier can record delivery');

  // Upload delivery ticket photo to S3
  let ticketUrl: string | null = null;
  if (file) {
    ticketUrl = await this.storageService.uploadFile(
      file.buffer, file.mimetype, 'delivery-notes');
  }

  return this.prisma.$transaction(async (tx) => {
    // Create delivery note
    const dn = await tx.deliveryNote.create({
      data: {
        po_id:              poId,
        delivery_ticket_url: ticketUrl,
        notes:              dto.notes,
        items: {
          create: dto.items.map(item => ({
            po_item_id:   item.po_item_id,
            received_qty: item.received_qty,
            condition:    item.condition ?? 'GOOD',
            notes:        item.notes,
          })),
        },
      },
      include: { items: true },
    });

    // Update received_qty on each PO item
    for (const grnItem of dto.items) {
      await tx.pOItem.update({
        where: { id: grnItem.po_item_id },
        data: { received_qty: { increment: grnItem.received_qty } },
      });

      // Upsert inventory
      await tx.inventory.upsert({
        where: {
          project_product: {
            project_id:   po.project_id!,
            product_name: (po.items.find(i => i.id === grnItem.po_item_id)
              ?.product_name) ?? 'Unknown',
          },
        },
        create: {
          project_id:   po.project_id!,
          product_name: po.items.find(i => i.id === grnItem.po_item_id)
            ?.product_name ?? 'Unknown',
          unit:         po.items.find(i => i.id === grnItem.po_item_id)
            ?.unit ?? 'Unit',
          qty_on_hand:  grnItem.received_qty,
          last_grn_at:  new Date(),
        },
        update: {
          qty_on_hand: { increment: grnItem.received_qty },
          last_grn_at: new Date(),
        },
      });
    }

    // Check if fully delivered → auto-update PO status
    const updatedItems = await tx.pOItem.findMany({ where: { po_id: poId } });
    const fullyDelivered = updatedItems.every(
      i => Number(i.received_qty) >= Number(i.quantity));
    if (fullyDelivered) {
      await tx.purchaseOrder.update({ where: { id: poId },
        data: { status: 'DELIVERED' } });
      // Auto-generate invoice
      await this.invoicesService.generateForPO(poId, tx);
    }

    return dn;
  });
}

async updateStatus(
  id: string,
  dto: { status: POStatus; note?: string },
  user: JwtPayload,
) {
  const po = await this.prisma.purchaseOrder.findUniqueOrThrow({
    where: { id } });

  // Allowed transitions:
  const allowed: Record<string, string[]> = {
    CONFIRMED:        ['PROCESSING', 'CANCELLED'],
    PROCESSING:       ['OUT_FOR_DELIVERY'],
    OUT_FOR_DELIVERY: ['DELIVERED'],
    DELIVERED:        ['COMPLETED'],
    COMPLETED:        [],
    CANCELLED:        [],
  };

  if (!allowed[po.status]?.includes(dto.status))
    throw new BadRequestException(
      `Cannot transition from ${po.status} to ${dto.status}`);

  // Supplier moves forward, buyer completes
  if (['PROCESSING','OUT_FOR_DELIVERY'].includes(dto.status)
      && po.supplier_company_id !== user.companyId)
    throw new ForbiddenException('Only supplier can advance this status');
  if (dto.status === 'COMPLETED'
      && po.buyer_company_id !== user.companyId)
    throw new ForbiddenException('Only buyer can mark as completed');

  const updated = await this.prisma.purchaseOrder.update({
    where: { id }, data: { status: dto.status } });

  // On COMPLETED: settle wallets
  if (dto.status === 'COMPLETED') {
    await this.walletsService.settle(
      po.buyer_company_id, po.supplier_company_id, po.total_amount);
  }

  // Notify the other party
  const notifyUserId = user.companyId === po.buyer_company_id
    ? await this.getCompanyAdminId(po.supplier_company_id)
    : await this.getCompanyAdminId(po.buyer_company_id);

  await this.notificationsService.create(notifyUserId, {
    title: 'Order status updated',
    body:  `PO #${id.slice(-6).toUpperCase()} is now ${dto.status}`,
    type:  'order_status',
    entity_id: id,
  });

  return updated;
}
```

### 1.7 — Materials: replace stub with real Prisma CRUD
**Commit:** `feat(backend): materials service backed by Prisma Product table`

**`backend/src/materials/materials.service.ts`** — delete the hardcoded array entirely:
```ts
@Injectable()
export class MaterialsService {
  constructor(private prisma: PrismaService) {}

  findAll(filters: {
    category?: string;
    supplierId?: string;
    search?: string;
  }) {
    return this.prisma.product.findMany({
      where: {
        is_active: true,
        ...(filters.category && { category: filters.category }),
        ...(filters.supplierId && {
          supplier_company_id: filters.supplierId }),
        ...(filters.search && {
          name: { contains: filters.search, mode: 'insensitive' } }),
      },
      include: {
        supplier: {
          select: { id: true, name: true, is_verified: true,
            site_lat: true, site_long: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  findOne(id: string) {
    return this.prisma.product.findUniqueOrThrow({
      where: { id },
      include: { supplier: true },
    });
  }

  create(dto: CreateProductDto, user: JwtPayload) {
    return this.prisma.product.create({
      data: { ...dto, supplier_company_id: user.companyId, is_active: true },
    });
  }

  update(id: string, dto: UpdateProductDto, user: JwtPayload) {
    return this.prisma.product.update({
      where: { id, supplier_company_id: user.companyId }, // ownership check
      data: dto,
    });
  }

  softDelete(id: string, user: JwtPayload) {
    return this.prisma.product.update({
      where: { id, supplier_company_id: user.companyId },
      data: { is_active: false },
    });
  }
}
```

Update `GET /materials` controller to accept query params:
`?category=Steel&search=rebar&supplierId=xxx`

### 1.8 — Invoice auto-generation
**Commit:** `feat(backend): invoice auto-generated on PO delivered`

**`backend/src/invoices/invoices.service.ts`** — add `generateForPO`:
```ts
async generateForPO(poId: string, tx?: Prisma.TransactionClient) {
  const db = tx ?? this.prisma;
  const po = await db.purchaseOrder.findUniqueOrThrow({
    where: { id: poId },
    include: {
      items: true,
      buyer:    { include: { company: true } },
      supplier: { include: { company: true } },
    },
  });

  const isSA   = po.buyer_company.country === 'SA';
  const vatRate = isSA ? 0.15 : 0.14;
  const subtotal = Number(po.total_amount);
  const vatAmount = subtotal * vatRate;
  const total  = subtotal + vatAmount;

  const invoice = await db.invoice.create({
    data: {
      po_id:               poId,
      buyer_company_id:    po.buyer_company_id,
      supplier_company_id: po.supplier_company_id,
      issue_date:    new Date(),
      due_date:      po.payment_terms === 'CREDIT'
        ? new Date(Date.now() + 30 * 86400000)
        : new Date(),
      subtotal,
      vat_rate:   vatRate,
      vat_amount: vatAmount,
      total_amount: total,
      currency:  isSA ? 'SAR' : 'EGP',
      status:    'ISSUED',
    },
  });

  // Generate ZATCA QR for KSA
  if (isSA) {
    const qr = this.generateZatcaQr({
      sellerName: po.supplier_company.name,
      vatNumber:  po.supplier_company.vat_number ?? '',
      timestamp:  invoice.issue_date.toISOString(),
      total:      String(total),
      vatAmount:  String(vatAmount),
    });
    await db.invoice.update({ where: { id: invoice.id },
      data: { zatca_qr_code: qr } });
  }

  return invoice;
}

private generateZatcaQr(data: {
  sellerName: string; vatNumber: string;
  timestamp: string; total: string; vatAmount: string;
}): string {
  const tlv = (tag: number, val: string) => {
    const v = Buffer.from(val, 'utf8');
    return Buffer.concat([Buffer.from([tag, v.length]), v]);
  };
  const buf = Buffer.concat([
    tlv(1, data.sellerName),
    tlv(2, data.vatNumber),
    tlv(3, data.timestamp),
    tlv(4, data.total),
    tlv(5, data.vatAmount),
  ]);
  return buf.toString('base64');
}
```

### 1.9 — Sync service: fix processOrder + LWW
**Commit:** `fix(backend): sync processOrder and Last-Write-Wins`

**`backend/src/sync/sync.service.ts`:**

```ts
// processOrder must include ALL mobile-writable tables:
private readonly processOrder = [
  'daily_logs',
  'log_photos',
  'grn_records',      // new
  'rfqs',             // mobile can create RFQs offline
  'purchase_orders',  // mobile reads only (pull), not push
];

// Pull: return changes since lastPulledAt
async pull(lastPulledAt: number, user: JwtPayload) {
  const since = new Date(lastPulledAt);

  // Hydrate each table scoped to this user's company
  const [
    projects,
    sites,
    purchase_orders,
    po_items,
    products,
    rfqs,
    daily_logs,
    log_photos,
    notifications,
  ] = await Promise.all([
    this.prisma.project.findMany({
      where: { company_id: user.companyId, updated_at: { gt: since } } }),
    this.prisma.site.findMany({
      where: { project: { company_id: user.companyId },
        updated_at: { gt: since } } }),
    this.prisma.purchaseOrder.findMany({
      where: {
        OR: [{ buyer_company_id: user.companyId },
             { supplier_company_id: user.companyId }],
        updated_at: { gt: since },
      },
      include: { items: true },
    }),
    this.prisma.pOItem.findMany({
      where: { po: {
        OR: [{ buyer_company_id: user.companyId },
             { supplier_company_id: user.companyId }] },
        updated_at: { gt: since },
      },
    }),
    // Products: all active products (catalog for offline browsing)
    this.prisma.product.findMany({
      where: { is_active: true, updated_at: { gt: since } },
      include: { supplier: {
        select: { id: true, name: true, is_verified: true,
          site_lat: true, site_long: true } } },
    }),
    // RFQs
    this.prisma.rFQ.findMany({
      where: {
        OR: [
          { company_id: user.companyId },          // contractor's own
          { status: 'OPEN' },                       // supplier sees open
        ],
        updated_at: { gt: since },
      },
      include: { items: true },
    }),
    // Daily logs — own only
    this.prisma.dailyLog.findMany({
      where: { user_id: user.id, updated_at: { gt: since } } }),
    this.prisma.logPhoto.findMany({
      where: { log: { user_id: user.id }, updated_at: { gt: since } } }),
    this.prisma.notification.findMany({
      where: { user_id: user.id, created_at: { gt: since } } }),
  ]);

  return {
    changes: {
      projects:        { created: projects, updated: [], deleted: [] },
      sites:           { created: sites, updated: [], deleted: [] },
      purchase_orders: { created: purchase_orders, updated: [], deleted: [] },
      po_items:        { created: po_items, updated: [], deleted: [] },
      products:        { created: products, updated: [], deleted: [] },
      rfqs:            { created: rfqs, updated: [], deleted: [] },
      daily_logs:      { created: daily_logs, updated: [], deleted: [] },
      log_photos:      { created: log_photos, updated: [], deleted: [] },
      notifications:   { created: notifications, updated: [], deleted: [] },
    },
    timestamp: Date.now(),
  };
}

// Push: apply incoming changes with LWW
async push(changes: Record<string, any>, user: JwtPayload) {
  for (const table of this.processOrder) {
    const tableChanges = changes[table];
    if (!tableChanges) continue;

    const allRecords = [
      ...(tableChanges.created ?? []),
      ...(tableChanges.updated ?? []),
    ];

    for (const record of allRecords) {
      await this.upsertWithLWW(table, record, user);
    }
  }
}

private async upsertWithLWW(
  table: string,
  incoming: any,
  user: JwtPayload,
) {
  const incomingUpdatedAt = new Date(incoming.updated_at);

  // LWW: check existing record's updated_at
  const existing = await (this.prisma as any)[this.toCamel(table)]
    .findUnique({ where: { id: incoming.id } }).catch(() => null);

  if (existing && existing.updated_at > incomingUpdatedAt) {
    // Server has newer data — skip
    return;
  }

  // Apply the record
  switch (table) {
    case 'daily_logs':
      await this.prisma.dailyLog.upsert({
        where: { id: incoming.id },
        create: {
          id:           incoming.id,
          project_id:   incoming.project_id,
          user_id:      user.id,
          log_date:     new Date(incoming.log_date),
          status:       incoming.status ?? 'SUBMITTED',
          weather_data: incoming.weather_data,
          attendance_data: incoming.attendance_data,
          progress_notes: incoming.progress_notes,
          updated_at:   incomingUpdatedAt,
        },
        update: {
          status:       incoming.status,
          weather_data: incoming.weather_data,
          attendance_data: incoming.attendance_data,
          progress_notes: incoming.progress_notes,
          updated_at:   incomingUpdatedAt,
        },
      });
      break;

    case 'log_photos':
      await this.prisma.logPhoto.upsert({
        where: { id: incoming.id },
        create: {
          id:           incoming.id,
          daily_log_id: incoming.daily_log_id,
          local_path:   incoming.local_path,
          s3_url:       incoming.s3_url,
          gps_lat:      incoming.gps_lat,
          gps_long:     incoming.gps_long,
          updated_at:   incomingUpdatedAt,
        },
        update: {
          s3_url:     incoming.s3_url,
          updated_at: incomingUpdatedAt,
        },
      });
      break;

    case 'grn_records':
      // Delegate to PO service for inventory update
      if (!existing) {
        await this.purchaseOrdersService.createDeliveryNote(
          incoming.po_id,
          { items: JSON.parse(incoming.items_json), notes: incoming.notes },
          undefined,
          user,
        );
      }
      break;

    case 'rfqs':
      await this.prisma.rFQ.upsert({
        where: { id: incoming.id },
        create: {
          id:           incoming.id,
          company_id:   user.companyId,
          project_id:   incoming.project_id,
          title:        incoming.title,
          status:       'OPEN',
          payment_terms: incoming.payment_terms,
          required_delivery_date: incoming.required_delivery_date
            ? new Date(incoming.required_delivery_date) : undefined,
          updated_at: incomingUpdatedAt,
        },
        update: { updated_at: incomingUpdatedAt },
      });
      break;
  }
}
```

### 1.10 — Notifications module
**Commit:** `feat(backend): notifications CRUD and push service`

Create `backend/src/notifications/notifications.module.ts`,
`notifications.service.ts`, `notifications.controller.ts`:

```ts
// Controller routes:
// GET  /notifications          — own unread (JWT)
// POST /notifications/mark-read/:id
// POST /notifications/mark-all-read

// Service:
async create(userId: string, data: {
  title: string; body: string; type: string; entity_id?: string;
}) {
  if (!userId) return; // gracefully skip if no recipient
  return this.prisma.notification.create({
    data: { user_id: userId, ...data },
  });
}

async findOwn(userId: string) {
  return this.prisma.notification.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' },
    take: 50,
  });
}

async markRead(id: string, userId: string) {
  return this.prisma.notification.update({
    where: { id, user_id: userId },
    data: { is_read: true },
  });
}

async markAllRead(userId: string) {
  return this.prisma.notification.updateMany({
    where: { user_id: userId, is_read: false },
    data: { is_read: true },
  });
}
```

### 1.11 — Audit log interceptor
**Commit:** `feat(backend): global audit log interceptor`

**`backend/src/common/interceptors/audit.interceptor.ts`:**
```ts
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    const req = ctx.switchToHttp().getRequest();
    const mutating = ['POST','PATCH','PUT','DELETE']
      .includes(req.method);
    if (!mutating || !req.user) return next.handle();

    return next.handle().pipe(
      tap(async (response) => {
        try {
          await this.prisma.auditLog.create({
            data: {
              user_id:     req.user.id,
              company_id:  req.user.companyId,
              action:      `${req.method} ${req.route?.path ?? req.url}`,
              entity_type: req.route?.path?.split('/')?.[1] ?? 'unknown',
              entity_id:   response?.id ?? req.params?.id ?? 'unknown',
              new_value:   response,
              ip_address:  req.ip,
            },
          });
        } catch { /* never fail the request for an audit log */ }
      }),
    );
  }
}
```

Register globally in `app.module.ts`.

### 1.12 — Seed file
**Commit:** `chore(backend): comprehensive seed with real KSA+EG data`

Create `backend/prisma/seed.ts`:

```ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const PASSWORD = 'Demo1234!';

async function main() {
  const hash = await bcrypt.hash(PASSWORD, 10);

  // ── Companies ────────────────────────────────────────────────────────────
  const contractorSA = await prisma.company.upsert({
    where: { email: 'admin@alfarabi.sa' }, update: {},
    create: {
      name: 'Al-Farabi Construction Co.',
      email: 'admin@alfarabi.sa',
      phone: '+966501234567',
      type: 'CONTRACTOR', country: 'SA', city: 'Riyadh',
      is_verified: true, vat_number: '310123456700003',
      commercial_reg: 'CR-1010123456',
    },
  });

  const supplierSA1 = await prisma.company.upsert({
    where: { email: 'sales@alrashidi.sa' }, update: {},
    create: {
      name: 'Al-Rashidi Steel Trading',
      email: 'sales@alrashidi.sa',
      phone: '+966509876543',
      type: 'SUPPLIER', country: 'SA', city: 'Jeddah',
      is_verified: true, vat_number: '310987654300003',
      commercial_reg: 'CR-4030987654',
      site_lat: 21.3891, site_long: 39.8579,
    },
  });

  const supplierSA2 = await prisma.company.upsert({
    where: { email: 'orders@gulfcement.sa' }, update: {},
    create: {
      name: 'Gulf Cement & Building Materials',
      email: 'orders@gulfcement.sa',
      phone: '+966505551234',
      type: 'SUPPLIER', country: 'SA', city: 'Riyadh',
      is_verified: true, vat_number: '310555123400003',
      commercial_reg: 'CR-1010555123',
      site_lat: 24.6267, site_long: 46.7122,
    },
  });

  const contractorEG = await prisma.company.upsert({
    where: { email: 'admin@niledev.eg' }, update: {},
    create: {
      name: 'Nile Development & Construction',
      email: 'admin@niledev.eg',
      phone: '+201012345678',
      type: 'CONTRACTOR', country: 'EG', city: 'Cairo',
      is_verified: true, tax_id: '123-456-789',
    },
  });

  // ── Users ─────────────────────────────────────────────────────────────────
  const users = [
    // KSA contractor
    { email: 'ahmed@alfarabi.sa',   first_name: 'Ahmed',  last_name: 'Al-Farabi',
      role: 'CONTRACTOR', company_id: contractorSA.id, is_company_admin: true },
    // KSA site engineer (mobile user)
    { email: 'khalid@alfarabi.sa',  first_name: 'Khalid', last_name: 'Al-Mutairi',
      role: 'CONTRACTOR', company_id: contractorSA.id, is_company_admin: false,
      sub_role: 'SITE_ENGINEER' },
    // KSA supplier 1
    { email: 'omar@alrashidi.sa',   first_name: 'Omar',   last_name: 'Al-Rashidi',
      role: 'SUPPLIER',   company_id: supplierSA1.id,  is_company_admin: true },
    // KSA supplier 2
    { email: 'ali@gulfcement.sa',   first_name: 'Ali',    last_name: 'Al-Ghamdi',
      role: 'SUPPLIER',   company_id: supplierSA2.id,  is_company_admin: true },
    // EG contractor
    { email: 'mostafa@niledev.eg',  first_name: 'Mostafa',last_name: 'Hassan',
      role: 'CONTRACTOR', company_id: contractorEG.id, is_company_admin: true },
    // Platform admin
    { email: 'admin@cc.io',         first_name: 'System', last_name: 'Admin',
      role: 'ADMIN',      company_id: contractorSA.id, is_company_admin: true },
  ];

  const createdUsers: Record<string, any> = {};
  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email }, update: {},
      create: { ...u, password_hash: hash, status: 'ACTIVE' },
    });
    createdUsers[u.email] = user;
  }

  // ── Products (10 real SKUs) ───────────────────────────────────────────────
  const productDefs = [
    { name: 'Steel Rebar 12mm', category: 'Steel & Metal',
      sub_category: 'Rebar', unit: 'Ton', base_price: 3800,
      supplier_company_id: supplierSA1.id,
      description: 'Grade 60, SASO certified, Hadeed brand' },
    { name: 'Steel Rebar 16mm', category: 'Steel & Metal',
      sub_category: 'Rebar', unit: 'Ton', base_price: 4200,
      supplier_company_id: supplierSA1.id,
      description: 'Grade 60, SASO certified, Hadeed brand' },
    { name: 'Steel Rebar 20mm', category: 'Steel & Metal',
      sub_category: 'Rebar', unit: 'Ton', base_price: 4350,
      supplier_company_id: supplierSA1.id,
      description: 'Grade 60 heavy duty rebar' },
    { name: 'Wire Mesh 200×200mm', category: 'Steel & Metal',
      sub_category: 'Wire Mesh', unit: 'SQM', base_price: 45,
      supplier_company_id: supplierSA1.id,
      description: 'Welded wire mesh 6mm, for slabs' },
    { name: 'Portland Cement Type I', category: 'Concrete & Cement',
      sub_category: 'Portland Cement', unit: 'Bag', base_price: 28,
      supplier_company_id: supplierSA2.id,
      description: '50kg bags, Saudi Cement, SASO 1051' },
    { name: 'Portland Cement Type V', category: 'Concrete & Cement',
      sub_category: 'Portland Cement', unit: 'Bag', base_price: 32,
      supplier_company_id: supplierSA2.id,
      description: 'Sulfate resistant, for below-grade foundations' },
    { name: 'Ready Mix Concrete C25', category: 'Concrete & Cement',
      sub_category: 'Ready Mix', unit: 'M3', base_price: 280,
      supplier_company_id: supplierSA2.id,
      description: 'Delivered to site, min order 6 M3' },
    { name: 'Hollow Concrete Block 20cm', category: 'Concrete & Cement',
      sub_category: 'Blocks', unit: 'Piece', base_price: 4.5,
      supplier_company_id: supplierSA2.id,
      description: '40×20×20cm, Grade A, 1000 pcs/pallet' },
    { name: 'Ceramic Floor Tile 60×60', category: 'Finishing Materials',
      sub_category: 'Tiles', unit: 'SQM', base_price: 85,
      supplier_company_id: supplierSA2.id,
      description: 'Polished, white, R9 slip resistance' },
    { name: 'Gypsum Board 12mm', category: 'Finishing Materials',
      sub_category: 'Drywall', unit: 'Piece', base_price: 22,
      supplier_company_id: supplierSA2.id,
      description: '1.2×2.4m standard gypsum board' },
  ];

  for (const p of productDefs) {
    await prisma.product.upsert({
      where: { id: `seed-${p.name.replace(/\s/g,'_')}` },
      update: {},
      create: { id: `seed-${p.name.replace(/\s/g,'_')}`,
        ...p, is_active: true },
    });
  }

  // ── Projects & Sites ──────────────────────────────────────────────────────
  const project1 = await prisma.project.upsert({
    where: { id: 'seed-project-1' }, update: {},
    create: {
      id: 'seed-project-1',
      name: 'Riyadh Villa Compound Phase 1',
      company_id: contractorSA.id,
      status: 'ACTIVE',
      start_date: new Date('2025-09-01'),
      end_date:   new Date('2026-08-31'),
      budget:     15_000_000,
      sites: { create: [{
        name: 'North Block — Main Site',
        address: 'Al-Narjis District, Riyadh',
        site_lat: 24.7577, site_long: 46.6934,
        receiver_name: 'Khalid Al-Mutairi',
        receiver_phone: '+966501234569',
      }]},
    },
    include: { sites: true },
  });

  const project2 = await prisma.project.upsert({
    where: { id: 'seed-project-2' }, update: {},
    create: {
      id: 'seed-project-2',
      name: 'New Cairo Office Tower',
      company_id: contractorEG.id,
      status: 'ACTIVE',
      start_date: new Date('2025-11-01'),
      end_date:   new Date('2027-06-30'),
      budget:     85_000_000,
      sites: { create: [{
        name: 'Tower Footprint',
        address: 'R3 District, New Administrative Capital',
        site_lat: 30.0330, site_long: 31.7394,
        receiver_name: 'Mohamed Hassan',
        receiver_phone: '+201012345679',
      }]},
    },
  });

  // ── Open RFQ (supplier can see and bid) ───────────────────────────────────
  const openRFQ = await prisma.rFQ.upsert({
    where: { id: 'seed-rfq-open' }, update: {},
    create: {
      id: 'seed-rfq-open',
      company_id: contractorSA.id,
      project_id: project1.id,
      title: 'Steel Rebar 16mm — Foundation Phase',
      status: 'OPEN',
      payment_terms: 'CREDIT',
      required_delivery_date: new Date(Date.now() + 7 * 86400000),
      items: { create: [{
        category: 'Steel & Metal',
        product_name: 'Steel Rebar 16mm',
        quantity: 100, unit: 'Ton',
        notes: 'Must be Grade 60, SASO certified. Delivery to north site.',
      }]},
    },
    include: { items: true },
  });

  // ── Bid on that RFQ ───────────────────────────────────────────────────────
  const rfqItem = await prisma.rFQItem.findFirst({
    where: { rfq_id: openRFQ.id } });

  await prisma.bid.upsert({
    where: { id: 'seed-bid-1' }, update: {},
    create: {
      id: 'seed-bid-1',
      rfq_id: openRFQ.id,
      company_id: supplierSA1.id,
      status: 'PENDING',
      delivery_cost: 0,
      quote_validity_hours: 48,
      notes: 'Brand: Hadeed (Sabic). 5-day delivery. Stock confirmed.',
      items: rfqItem ? { create: [{
        rfq_item_id: rfqItem.id,
        product_name: 'Steel Rebar 16mm',
        quantity: 100, unit: 'Ton',
        unit_price: 4200, total_price: 420000,
      }]} : undefined,
    },
  });

  // ── PO already OUT_FOR_DELIVERY (for GRN testing) ─────────────────────────
  const confirmedPO = await prisma.purchaseOrder.upsert({
    where: { id: 'seed-po-1' }, update: {},
    create: {
      id: 'seed-po-1',
      buyer_company_id: contractorSA.id,
      supplier_company_id: supplierSA2.id,
      project_id: project1.id,
      status: 'OUT_FOR_DELIVERY',
      payment_terms: 'CASH',
      required_delivery_date: new Date(Date.now() + 2 * 86400000),
      total_amount: 56000,
      items: { create: [{
        product_name: 'Portland Cement Type I',
        quantity: 2000, unit: 'Bag',
        unit_price: 28, total_price: 56000,
        received_qty: 0,
      }]},
    },
    include: { items: true },
  });

  // ── Daily Log (yesterday, submitted) ─────────────────────────────────────
  const site1 = project1.sites?.[0];
  if (site1) {
    await prisma.dailyLog.upsert({
      where: { id: 'seed-log-1' }, update: {},
      create: {
        id: 'seed-log-1',
        project_id: project1.id,
        site_id: site1.id,
        user_id: createdUsers['khalid@alfarabi.sa'].id,
        log_date: new Date(Date.now() - 86400000),
        status: 'SUBMITTED',
        weather_data: {
          temp: 32, feels_like: 36, humidity: 42,
          wind_speed: 12, condition: 'Clear', icon: '01d',
          fetched_at: new Date().toISOString(),
        },
        attendance_data: [
          { id: '1', company_name: 'Own Crew', trade: 'Mason',
            headcount: 8, hours_worked: 9 },
          { id: '2', company_name: 'Al-Nour Electrical',
            trade: 'Electrician', headcount: 4, hours_worked: 8 },
        ],
        progress_notes: [
          { zone: 'Floor 2 - East Wing',
            work_done: 'Completed column shuttering',
            percentage: 100, issues: '' },
          { zone: 'Ground Floor',
            work_done: 'Rebar placement ongoing',
            percentage: 60, issues: 'Waiting on rebar delivery' },
        ],
      },
    });
  }

  // ── Wallets ───────────────────────────────────────────────────────────────
  for (const companyId of [contractorSA.id, supplierSA1.id,
    supplierSA2.id, contractorEG.id]) {
    await prisma.wallet.upsert({
      where: { company_id: companyId }, update: {},
      create: { company_id: companyId, balance: 0,
        currency: companyId === contractorEG.id ? 'EGP' : 'SAR' },
    });
  }

  // ── Notifications ─────────────────────────────────────────────────────────
  await prisma.notification.createMany({
    skipDuplicates: true,
    data: [
      { user_id: createdUsers['ahmed@alfarabi.sa'].id,
        title: 'New bid received',
        body:  'Al-Rashidi Steel bid on RFQ: Steel Rebar 16mm',
        type: 'rfq_bid', entity_id: openRFQ.id, is_read: false },
      { user_id: createdUsers['ahmed@alfarabi.sa'].id,
        title: 'Order out for delivery',
        body:  'PO #seed-po-1 — Portland Cement is out for delivery',
        type: 'order_status', entity_id: confirmedPO.id, is_read: false },
    ],
  });

  console.log('\n✅ Database seeded successfully!\n');
  console.log('All users — password:', PASSWORD);
  console.log('  Contractor Admin (KSA): ahmed@alfarabi.sa');
  console.log('  Site Engineer   (KSA): khalid@alfarabi.sa');
  console.log('  Supplier 1      (KSA): omar@alrashidi.sa');
  console.log('  Supplier 2      (KSA): ali@gulfcement.sa');
  console.log('  Contractor Admin (EG): mostafa@niledev.eg');
  console.log('  Platform Admin      : admin@cc.io');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
```

Add to `backend/package.json`:
```json
"prisma": { "seed": "ts-node --compiler-options '{\"module\":\"CommonJS\"}' prisma/seed.ts" }
```

Run: `npx prisma migrate reset --force` (wipes + migrates + seeds).

---

## ════════════════════════════════════════════════
## PHASE 2 — MOBILE: CONNECT TO REAL BACKEND
## ════════════════════════════════════════════════

### 2.1 — Auth context with persistent session
**Commit:** `feat(mobile): persistent auth with SecureStore`

**`mobile/context/AuthContext.tsx`** (replace or create):
```tsx
interface AuthUser {
  id: string; email: string; firstName: string; lastName: string;
  role: 'CONTRACTOR' | 'SUPPLIER' | 'ADMIN';
  companyId: string; companyCountry: 'SA' | 'EG';
  companyName: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]   = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on app launch
  useEffect(() => {
    (async () => {
      try {
        const [t, u] = await Promise.all([
          authStorage.getToken(), authStorage.getUser()]);
        if (t && u) { setToken(t); setUser(u); }
      } finally { setIsLoading(false); }
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiFetch<{ access_token: string; user: AuthUser }>(
      '/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
    await authStorage.saveToken(res.access_token);
    await authStorage.saveUser(res.user);
    setToken(res.access_token);
    setUser(res.user);
  };

  const logout = async () => {
    await authStorage.clear();
    setToken(null); setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

**`mobile/app/_layout.tsx`** — wrap with `<AuthProvider>` and redirect
unauthenticated users:
```tsx
function RootLayout() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
  }, [user, isLoading]);

  if (isLoading) return <SplashScreen />;
  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function Layout() {
  return (
    <AuthProvider>
      <DatabaseProvider database={database}>
        <RootLayout />
      </DatabaseProvider>
    </AuthProvider>
  );
}
```

### 2.2 — Login screen wired to real API
**Commit:** `feat(mobile): login screen calls real auth API`

**`mobile/app/login.tsx`:**
```tsx
export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Email and password required'); return;
    }
    setLoading(true); setError('');
    try {
      await login(email.trim().toLowerCase(), password);
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e.message ?? 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  // UI: email input, password input, login button, error text
  // Pre-fill hint in development: show seeded credentials list
}
```

### 2.3 — Sync service: the fixed implementation
**Commit:** `fix(mobile): sync service with JWT, correct body, LWW`

**`mobile/services/sync.ts`** (full replacement):
```ts
import { synchronize } from '@nozbe/watermelondb/sync';
import { Database } from '@nozbe/watermelondb';
import { API_BASE } from './api';
import { authStorage } from './auth';
import { useSyncStore } from '../store/syncStore';

export async function syncDatabase(database: Database): Promise<void> {
  const token = await authStorage.getToken();
  if (!token) throw new Error('Not authenticated');

  const { setStatus, setLastSynced } = useSyncStore.getState();
  setStatus('syncing');

  try {
    await synchronize({
      database,
      pullChanges: async ({ lastPulledAt }) => {
        const url = `${API_BASE}/sync/pull?last_pulled_at=${lastPulledAt ?? 0}`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`Pull ${res.status}`);
        return res.json(); // { changes, timestamp }
      },
      pushChanges: async ({ changes }) => {
        // Only push if there are actual changes
        const hasChanges = Object.values(changes).some(
          (t: any) =>
            t.created.length || t.updated.length || t.deleted.length
        );
        if (!hasChanges) return;

        const res = await fetch(`${API_BASE}/sync/push`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ changes }),
        });
        if (!res.ok) throw new Error(`Push ${res.status}`);
      },
      migrationsEnabledAtVersion: 1,
    });

    setStatus('idle');
    setLastSynced(new Date());
    // Upload pending photos after successful sync
    await uploadPendingPhotos(database, token);
  } catch (e) {
    setStatus('error');
    throw e;
  }
}
```

### 2.4 — WatermelonDB schema: add all required tables
**Commit:** `fix(mobile): watermelonDB schema includes all sync tables`

**`mobile/db/schema.ts`** — ensure ALL of these tables exist:

```ts
import { appSchema, tableSchema } from '@nozbe/watermelondb';

export default appSchema({
  version: 5,  // increment from current version
  tables: [
    tableSchema({
      name: 'projects',
      columns: [
        { name: 'server_id',   type: 'string', isOptional: true },
        { name: 'name',        type: 'string' },
        { name: 'status',      type: 'string' },
        { name: 'budget',      type: 'number', isOptional: true },
        { name: 'company_id',  type: 'string' },
        { name: 'start_date',  type: 'number', isOptional: true },
        { name: 'end_date',    type: 'number', isOptional: true },
        { name: 'updated_at',  type: 'number' },
      ],
    }),
    tableSchema({
      name: 'sites',
      columns: [
        { name: 'project_id',      type: 'string' },
        { name: 'name',            type: 'string' },
        { name: 'address',         type: 'string', isOptional: true },
        { name: 'site_lat',        type: 'number', isOptional: true },
        { name: 'site_long',       type: 'number', isOptional: true },
        { name: 'receiver_name',   type: 'string', isOptional: true },
        { name: 'receiver_phone',  type: 'string', isOptional: true },
        { name: 'updated_at',      type: 'number' },
      ],
    }),
    tableSchema({
      name: 'daily_logs',
      columns: [
        { name: 'project_id',      type: 'string' },
        { name: 'site_id',         type: 'string', isOptional: true },
        { name: 'user_id',         type: 'string' },
        { name: 'log_date',        type: 'number' },
        { name: 'status',          type: 'string' }, // draft|submitted|synced
        { name: 'weather_data',    type: 'string', isOptional: true }, // JSON
        { name: 'attendance_data', type: 'string', isOptional: true }, // JSON
        { name: 'progress_notes',  type: 'string', isOptional: true }, // JSON
        { name: 'updated_at',      type: 'number' },
      ],
    }),
    tableSchema({
      name: 'log_photos',
      columns: [
        { name: 'daily_log_id', type: 'string' },
        { name: 'local_path',   type: 'string' },
        { name: 's3_url',       type: 'string', isOptional: true },
        { name: 'gps_lat',      type: 'number', isOptional: true },
        { name: 'gps_long',     type: 'number', isOptional: true },
        { name: 'photo_type',   type: 'string', isOptional: true },
        { name: 'updated_at',   type: 'number' },
      ],
    }),
    tableSchema({
      name: 'purchase_orders',
      columns: [
        { name: 'buyer_company_id',    type: 'string' },
        { name: 'supplier_company_id', type: 'string' },
        { name: 'supplier_name',       type: 'string', isOptional: true },
        { name: 'project_id',          type: 'string', isOptional: true },
        { name: 'status',              type: 'string' },
        { name: 'payment_terms',       type: 'string', isOptional: true },
        { name: 'total_amount',        type: 'number', isOptional: true },
        { name: 'required_delivery_date', type: 'number', isOptional: true },
        { name: 'updated_at',          type: 'number' },
      ],
    }),
    tableSchema({
      name: 'po_items',
      columns: [
        { name: 'po_id',        type: 'string' },
        { name: 'product_name', type: 'string' },
        { name: 'unit',         type: 'string' },
        { name: 'quantity',     type: 'number' },
        { name: 'unit_price',   type: 'number', isOptional: true },
        { name: 'received_qty', type: 'number' },
        { name: 'updated_at',   type: 'number' },
      ],
    }),
    tableSchema({
      name: 'products',
      columns: [
        { name: 'name',                type: 'string' },
        { name: 'category',            type: 'string' },
        { name: 'sub_category',        type: 'string', isOptional: true },
        { name: 'unit',                type: 'string' },
        { name: 'base_price',          type: 'number' },
        { name: 'description',         type: 'string', isOptional: true },
        { name: 'image_url',           type: 'string', isOptional: true },
        { name: 'supplier_company_id', type: 'string' },
        { name: 'supplier_name',       type: 'string', isOptional: true },
        { name: 'supplier_verified',   type: 'boolean', isOptional: true },
        { name: 'supplier_lat',        type: 'number', isOptional: true },
        { name: 'supplier_long',       type: 'number', isOptional: true },
        { name: 'updated_at',          type: 'number' },
      ],
    }),
    tableSchema({
      name: 'rfqs',
      columns: [
        { name: 'company_id',             type: 'string' },
        { name: 'project_id',             type: 'string', isOptional: true },
        { name: 'title',                  type: 'string' },
        { name: 'status',                 type: 'string' },
        { name: 'payment_terms',          type: 'string', isOptional: true },
        { name: 'required_delivery_date', type: 'number', isOptional: true },
        { name: 'items_json',             type: 'string', isOptional: true },
        { name: 'updated_at',             type: 'number' },
      ],
    }),
    tableSchema({
      name: 'grn_records',
      columns: [
        { name: 'po_id',                     type: 'string' },
        { name: 'daily_log_id',              type: 'string', isOptional: true },
        { name: 'items_json',                type: 'string' },
        { name: 'delivery_ticket_photo_id',  type: 'string', isOptional: true },
        { name: 'notes',                     type: 'string', isOptional: true },
        { name: 'synced',                    type: 'boolean' },
        { name: 'updated_at',                type: 'number' },
      ],
    }),
    tableSchema({
      name: 'notifications',
      columns: [
        { name: 'title',     type: 'string' },
        { name: 'body',      type: 'string' },
        { name: 'type',      type: 'string' },
        { name: 'entity_id', type: 'string', isOptional: true },
        { name: 'is_read',   type: 'boolean' },
        { name: 'updated_at',type: 'number' },
      ],
    }),
    tableSchema({
      name: 'cart_items',
      columns: [
        { name: 'product_id',   type: 'string' },
        { name: 'product_name', type: 'string' },
        { name: 'unit',         type: 'string' },
        { name: 'quantity',     type: 'number' },
        { name: 'unit_price',   type: 'number' },
        { name: 'supplier_id',  type: 'string' },
        { name: 'updated_at',   type: 'number' },
      ],
    }),
    tableSchema({
      name: 'attendance_companies',
      columns: [
        { name: 'company_name', type: 'string' },
        { name: 'last_used_at', type: 'number' },
        { name: 'updated_at',   type: 'number' },
      ],
    }),
  ],
});
```

Write migrations in `mobile/db/migrations.ts` incrementing from current
version to version 5 (add new tables, don't drop existing ones).

### 2.5 — Auto-sync on app launch and network restore
**Commit:** `feat(mobile): auto-sync on launch and reconnect`

**`mobile/app/_layout.tsx`** — inside `RootLayout`, after user is confirmed:
```tsx
const database = useDatabase();
const { token } = useAuth();

// Sync on launch
useEffect(() => {
  if (token) syncDatabase(database).catch(console.error);
}, [token]);

// Sync on network restore
useEffect(() => {
  const unsub = NetInfo.addEventListener(state => {
    if (state.isConnected && state.isInternetReachable && token) {
      syncDatabase(database).catch(console.error);
    }
  });
  return unsub;
}, [token]);
```

### 2.6 — Today tab: reads real projects from WatermelonDB
**Commit:** `fix(mobile): Today tab reads projects from WatermelonDB after sync`

**`mobile/app/(tabs)/index.tsx`:**
```tsx
export default function TodayTab() {
  const { user } = useAuth();
  const database = useDatabase();
  const { activeProject, setActiveProject } = useProjectStore();

  // Read projects from local WatermelonDB (populated by sync)
  const projects = useQuery(
    database.get<Project>('projects').query(
      Q.where('company_id', user?.companyId ?? ''),
      Q.sortBy('name', Q.asc),
    )
  );

  // Auto-select first project if none selected
  useEffect(() => {
    if (!activeProject && projects.length > 0) {
      setActiveProject(projects[0]);
    }
  }, [projects]);

  // Today's log
  const todayLogs = useQuery(
    activeProject
      ? database.get<DailyLog>('daily_logs').query(
          Q.where('project_id', activeProject.id),
          Q.where('log_date', Q.gte(startOfDay(new Date()).getTime())),
        )
      : database.get<DailyLog>('daily_logs').query(Q.where('id', 'never')),
  );

  // ... render
}
```

**Critical:** If `projects.length === 0` after sync, show:
```
No projects found.
Pull down to sync → if still empty, ask your admin to
create a project on the web dashboard.
```
Include a "Sync Now" button that calls `syncDatabase(database)`.

### 2.7 — Orders tab: reads POs from WatermelonDB
**Commit:** `fix(mobile): orders tab reads real purchase orders`

**`mobile/app/(tabs)/orders.tsx`** (or wherever it lives):
```tsx
const { user } = useAuth();
const orders = useQuery(
  database.get<PurchaseOrder>('purchase_orders').query(
    Q.or(
      Q.where('buyer_company_id', user?.companyId ?? ''),
      Q.where('supplier_company_id', user?.companyId ?? ''),
    ),
    Q.sortBy('updated_at', Q.desc),
  )
);
```

### 2.8 — Marketplace catalog: reads products from WatermelonDB
**Commit:** `fix(mobile): catalog reads synced products`

**`mobile/app/marketplace/catalog.tsx`:**
```tsx
const [search, setSearch]     = useState('');
const [category, setCategory] = useState('All');

const products = useQuery(
  database.get<Product>('products').query(
    ...(category !== 'All' ? [Q.where('category', category)] : []),
    ...(search ? [Q.where('name', Q.like(`%${Q.sanitizeLikeString(search)}%`))] : []),
    Q.sortBy('name', Q.asc),
  )
);

// If products.length === 0 and not loading: show empty state with sync button
```

### 2.9 — RFQ list: reads from WatermelonDB
**Commit:** `fix(mobile): RFQ list removes all mock data`

**`mobile/app/marketplace/rfq/list.tsx`** — delete every hardcoded mock.
Replace with:
```tsx
const { user } = useAuth();
const rfqs = useQuery(
  database.get<RFQ>('rfqs').query(
    Q.where('company_id', user?.companyId ?? ''),
    Q.sortBy('updated_at', Q.desc),
  )
);
```

---

## ════════════════════════════════════════════════
## PHASE 3 — WEB: VERIFY ALL API CONNECTIONS
## ════════════════════════════════════════════════
**Commit:** `fix(frontend): verify and fix all API connections`

### 3.1 — Auth context passes company context

**`frontend/src/contexts/AuthContext.tsx`** — ensure the user object stored
after login contains `companyId`, `role`, `companyCountry`.
The backend now returns these in the login response.

### 3.2 — API client includes JWT on every request

**`frontend/src/lib/api.ts`** (or axios instance) — verify interceptor:
```ts
instance.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

### 3.3 — BidComparisonTable: wire award mutation
**`frontend/src/components/bids/BidComparisonTable.tsx`:**
```ts
const awardMutation = useMutation({
  mutationFn: ({ rfqId, bidId }: { rfqId: string; bidId: string }) =>
    api.patch(`/rfqs/${rfqId}/award/${bidId}`),
  onSuccess: (po) => {
    toast.success(`Purchase Order created — PO #${po.id.slice(-6).toUpperCase()}`);
    queryClient.invalidateQueries({ queryKey: ['rfqs'] });
    queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    navigate(`/orders/${po.id}`);
  },
  onError: (e: any) => toast.error(e.message),
});

// Replace the confirmAward toast-only handler with:
const confirmAward = (bidId: string) => {
  awardMutation.mutate({ rfqId: rfq.id, bidId });
};
```

### 3.4 — GoodsReceivedNote: wire to API
**`frontend/src/pages/Orders.tsx`** — mount the GRN component:
```tsx
{order.status === 'OUT_FOR_DELIVERY' && (
  <GoodsReceivedNote
    orderId={order.id}
    items={order.items}
    onSuccess={() => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast.success('Delivery recorded successfully');
    }}
  />
)}
```

**`frontend/src/components/orders/GoodsReceivedNote.tsx`** — wire submit:
```ts
const submitGRN = useMutation({
  mutationFn: (data: GRNFormData) => {
    const formData = new FormData();
    formData.append('items', JSON.stringify(data.items));
    if (data.deliveryTicket) formData.append('delivery_ticket', data.deliveryTicket);
    formData.append('notes', data.notes ?? '');
    return api.post(`/purchase-orders/${orderId}/delivery-notes`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  onSuccess: () => onSuccess(),
});
```

---

## ════════════════════════════════════════════════
## PHASE 4 — END-TO-END VERIFICATION
## ════════════════════════════════════════════════
**Commit:** `test(e2e): full system smoke test and fixes`

Run every step below. If a step fails, fix it before moving on.

### 4.1 — Setup verification
```bash
# Backend
cd backend
npx prisma migrate reset --force   # wipes, migrates, seeds
npm run start:dev                  # should start on :3000

# In another terminal:
curl http://localhost:3000/health   # → {"status":"ok"}

# Login and get token
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ahmed@alfarabi.sa","password":"Demo1234!"}' \
  | jq -r '.access_token')
echo "Token: ${TOKEN:0:50}..."

# Verify tenant isolation
curl -s http://localhost:3000/projects \
  -H "Authorization: Bearer $TOKEN" | jq '.[].name'
# → must show ONLY "Riyadh Villa Compound Phase 1"

# Verify materials returns DB data, not hardcoded array
curl -s http://localhost:3000/materials \
  -H "Authorization: Bearer $TOKEN" | jq 'length'
# → must return 10

# Verify unauthenticated is blocked
curl -s http://localhost:3000/purchase-orders | jq '.statusCode'
# → 401
```

### 4.2 — Web flow verification

**Browser: open http://localhost:5173**

1. Login as `ahmed@alfarabi.sa` / `Demo1234!`
   - ✅ Dashboard loads with real data (not empty, not mocked)
   - ✅ Notifications bell shows 2 unread

2. Navigate to Projects
   - ✅ Shows "Riyadh Villa Compound Phase 1" — no other companies' projects

3. Navigate to RFQs
   - ✅ Shows seeded open RFQ
   - Click it → Bids tab → ✅ Shows Al-Rashidi's bid
   - Click "Select" → Confirm → ✅ Redirected to new PO detail page
   - ✅ PO exists in DB (`GET /purchase-orders` returns it)

4. Navigate to Orders
   - ✅ Seeded PO (OUT_FOR_DELIVERY) visible
   - Click it → "Record GRN" → fill quantities → submit
   - ✅ PO status updates to DELIVERED
   - ✅ Invoice auto-generated (visible in Financials)

5. Login as `omar@alrashidi.sa` (supplier)
   - ✅ RFQ feed shows the open RFQ
   - ✅ Does NOT see Ahmed's POs

6. Login as `admin@cc.io`
   - ✅ Can see all companies
   - ✅ Audit log shows recent actions

### 4.3 — Mobile flow verification

**Run: `cd mobile && npx expo start`**
Open on iOS simulator or Android emulator.

1. Login as `khalid@alfarabi.sa` / `Demo1234!`
   - ✅ Login succeeds
   - ✅ App redirects to Today tab

2. Today tab
   - ✅ Shows "Riyadh Villa Compound Phase 1" in project selector
   - ✅ NOT empty — project loaded from WatermelonDB after sync
   - If empty: tap "Sync Now" → wait 5s → project appears

3. Create daily log
   - Tap "Start Today's Log"
   - ✅ Weather fetches (or shows manual form)
   - Add 2 attendance rows with hours
   - Take a photo (simulator: use photo library)
   - Tap "Submit"
   - ✅ Log saved to WatermelonDB with status SUBMITTED

4. Enable airplane mode → verify
   - ✅ App still opens
   - ✅ Yesterday's log visible
   - ✅ Can create new draft log

5. Disable airplane mode → wait 60s
   - ✅ SyncStatusBar shows "Syncing…" then "All synced"
   - ✅ Log appears in backend: `GET /daily-logs` (check with curl using khalid's token)

6. Orders tab
   - ✅ Shows seeded PO (OUT_FOR_DELIVERY)
   - Tap "Record GRN"
   - Select the PO → mark 1000 bags received → take photo → Confirm
   - ✅ GRN record in WatermelonDB
   - Re-enable network → sync
   - ✅ PO status updates to DELIVERED on backend

7. Marketplace
   - ✅ Catalog shows 10 real products (not empty)
   - Add a product to cart
   - ✅ Cart shows item
   - Place order → ✅ PO created in backend

### 4.4 — Final production checklist

**Security**
- [ ] All non-public endpoints return 401 without token
- [ ] Contractor A cannot see Contractor B's projects
- [ ] Supplier cannot award or reject bids (403)
- [ ] Admin can see all companies

**Data integrity**
- [ ] `GET /materials` returns 10 DB-backed products (not hardcoded)
- [ ] `GET /projects` scoped to calling company
- [ ] `GET /rfqs` (supplier) returns only OPEN status
- [ ] Award → PO created transactionally (no partial state possible)
- [ ] GRN → inventory updated + PO received_qty updated
- [ ] DELIVERED → invoice auto-created with correct VAT rate

**Mobile ↔ Backend sync**
- [ ] After login, sync pulls projects into WatermelonDB
- [ ] Today tab is NOT empty after first sync
- [ ] Daily log created offline syncs to backend within 60s
- [ ] Products catalog populated after sync
- [ ] Purchase orders visible in mobile orders tab
- [ ] GRN submitted offline syncs correctly

**Web ↔ Backend**
- [ ] Award bid → PO created → navigates to PO detail
- [ ] GRN submitted via web → PO status changes
- [ ] Notification bell updates after award/GRN

**Build**
- [ ] `cd backend && npm run build` exits 0
- [ ] `cd frontend && npm run build` exits 0
- [ ] `cd mobile && npx expo export` exits 0
- [ ] Zero TypeScript errors in all three packages

---

## APPENDIX — Quick Reference

### Test credentials (all password: `Demo1234!`)
| Role | Email | Platform |
|------|-------|----------|
| Contractor Admin (KSA) | ahmed@alfarabi.sa | Web + Mobile |
| Site Engineer (KSA) | khalid@alfarabi.sa | **Mobile** (daily logs, GRN) |
| Supplier 1 (KSA) | omar@alrashidi.sa | Web |
| Supplier 2 (KSA) | ali@gulfcement.sa | Web |
| Contractor Admin (EG) | mostafa@niledev.eg | Web |
| Platform Admin | admin@cc.io | Web (admin panel) |

### The root cause of "mobile is empty"
```
Mobile app opens
  └─ Reads WatermelonDB (local SQLite)
       └─ WatermelonDB is empty because sync never ran
            └─ Sync never ran because:
                 ├─ JWT was not attached to sync fetch calls  ← FIXED in 2.3
                 ├─ Request body shape was wrong              ← FIXED in 2.3
                 └─ Backend pull returned empty (no company   ← FIXED in 1.9
                    scoping in sync pull response)
```

After Phase 0–2 are complete, the sync flow is:
```
App launch
  → AuthProvider restores token from SecureStore
  → _layout.tsx calls syncDatabase(database)
  → Pull: GET /sync/pull?last_pulled_at=0
      → Backend returns: projects, sites, purchase_orders,
                         po_items, products, rfqs, daily_logs,
                         log_photos, notifications
  → WatermelonDB is populated
  → All screens read from WatermelonDB and render real data
  → Push: any local changes (daily logs, GRN records) go up
  → Done: SyncStatusBar shows "All synced"
```

---

*Work Phase 0 → 1 → 2 → 3 → 4 in strict order.*
*Phase 4 step 4.1 (curl checks) must pass before opening the browser.*
*Phase 4 step 4.2 (web) must pass before testing mobile.*
*The appendix explains exactly why mobile was empty — share it with your team.*
