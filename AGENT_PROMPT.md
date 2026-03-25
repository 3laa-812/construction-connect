# 🏗️ Construction Connect — Production-Readiness Master Prompt
> **For:** AI Coding Agent (Cursor / Windsurf / Claude Code / Copilot Workspace)  
> **Repo layout:** `backend/` (NestJS + Prisma + PostgreSQL) · `frontend/` (Vite + React + TanStack Query) · `mobile/` (Expo + WatermelonDB)  
> **Docs on disk:** `docs/(FRD).pdf` (B2B Marketplace MVP) · `docs/v_0.pdf` (Arabic strategy report) · `docs/v_1_0.pdf` (SaaS technical report) · `docs/v_1_1.pdf` (mobile-first FRD)

---

## 0 — Context & Ground Rules

You are a senior full-stack engineer performing a **production-readiness sprint** on an existing Construction B2B Marketplace SaaS. A thorough system audit (`SYSTEM_AUDIT.md`) has already been completed and identifies every gap between the specification and the current code. Your job is to **close every gap methodically**, never breaking existing behaviour, always writing production-quality code.

**Non-negotiable constraints:**
- Never remove working code — refactor in-place or extend.
- Every DB change must have a Prisma migration file (`prisma migrate dev --name <slug>`).
- All new endpoints must have a matching NestJS E2E test stub (Jest + `supertest`).
- All new React pages/components must have a matching Vitest unit-test stub.
- Follow existing code style: NestJS modules, Prisma services, TanStack Query hooks, WatermelonDB `@model` classes.
- Use existing env var names; add new ones to `.env.example` with comments.
- Commit each numbered section below as a **separate atomic commit** with the message prefix shown.

---

## SECTION 1 — API Security & Multi-Tenant Isolation  
**Commit prefix:** `fix(security):`

### 1.1 — Apply `AuthGuard` globally, whitelist public routes

In `backend/src/app.module.ts` (or the appropriate bootstrap file), register `JwtAuthGuard` as a global guard using `APP_GUARD`:

```ts
{ provide: APP_GUARD, useClass: JwtAuthGuard }
```

Then decorate the following routes with `@Public()` (create this decorator if it doesn't exist using `SetMetadata('isPublic', true)` and reflect it in the guard):
- `POST /auth/login`
- `POST /auth/register`
- `GET /health`

Remove any duplicate per-controller `@UseGuards(AuthGuard('jwt'))` decorators that become redundant.

### 1.2 — Attach company context to every request

Create `backend/src/common/decorators/current-user.decorator.ts`:
```ts
export const CurrentUser = createParamDecorator(
  (data, ctx) => ctx.switchToHttp().getRequest().user,
);
```

Create `backend/src/common/interfaces/jwt-payload.interface.ts`:
```ts
export interface JwtPayload {
  sub: string;       // user UUID
  companyId: string;
  role: 'CONTRACTOR' | 'SUPPLIER' | 'ADMIN';
  email: string;
}
```

Ensure `AuthService.login()` encodes `companyId` and `role` into the JWT payload. Update `JwtStrategy.validate()` to return the full `JwtPayload`.

### 1.3 — Tenant-scope every "findAll" service

For each service below, replace any un-scoped `findMany({})` with a company-scoped version using `companyId` extracted from `req.user`:

| Service file | Scope column |
|---|---|
| `projects.service.ts` → `findAll` | `company_id = user.companyId` |
| `rfqs.service.ts` → `findAll` | contractor's company **or** supplier matching categories |
| `purchase-orders.service.ts` → `findAll` | `buyer_company_id OR supplier_company_id = user.companyId` |
| `invoices.service.ts` → `findAll` | same as PO |
| `companies.service.ts` → `findAll` | Admin only; others can only read/update their own |
| `users.service.ts` → `findAll` | scoped to `user.companyId` |
| `daily-logs.service.ts` → `findAll` | scoped to `user.id` (superintendent's own logs) |

Add a `ForbiddenException` if a user attempts to read/mutate a resource belonging to another company.

### 1.4 — Role-Based Access Control (RBAC)

Create `backend/src/common/guards/roles.guard.ts` and `backend/src/common/decorators/roles.decorator.ts`. Apply the following role restrictions:

| Route | Allowed roles |
|---|---|
| `POST /rfqs` | `CONTRACTOR` |
| `POST /rfqs/:id/bids` | `SUPPLIER` |
| `PATCH /rfqs/:id/award` | `CONTRACTOR` (owner) |
| `PATCH /companies/:id/verify` | `ADMIN` |
| `GET/POST /admin/*` | `ADMIN` |
| `GET/PATCH /wallets/*` | Owner only |

---

## SECTION 2 — RFQ Award → Purchase Order (Core Loop)
**Commit prefix:** `feat(rfq):`

This is the most critical broken flow. `BidComparisonTable.tsx` currently shows a toast but never calls the backend. Fix the full vertical slice.

### 2.1 — Backend: `PATCH /rfqs/:rfqId/award/:bidId`

In `rfqs.controller.ts`, add:
```ts
@Patch(':rfqId/award/:bidId')
@Roles('CONTRACTOR')
awardBid(
  @Param('rfqId') rfqId: string,
  @Param('bidId') bidId: string,
  @CurrentUser() user: JwtPayload,
)
```

In `rfqs.service.ts`, implement `awardBid(rfqId, bidId, user)` as a **Prisma interactive transaction** (`prisma.$transaction`) that:
1. Validates RFQ belongs to `user.companyId` and is in `OPEN` status.
2. Validates `bidId` belongs to this RFQ.
3. Sets `rfq.status = 'AWARDED'`, `rfq.awarded_bid_id = bidId`.
4. Sets all other bids' status to `'REJECTED'` (with `rejection_reason = 'Another bid was selected'`).
5. Sets winning bid status to `'ACCEPTED'`.
6. Creates a `PurchaseOrder` record:
   ```
   buyer_company_id  = rfq.company_id
   supplier_company_id = bid.company_id
   rfq_id = rfq.id
   status = 'CONFIRMED'
   payment_terms = rfq.payment_terms
   required_delivery_date = rfq.required_delivery_date
   ```
7. Creates `POItem` rows from `BidItem` rows (copying `product_name`, `quantity`, `unit`, `unit_price`).
8. Emits an **in-app notification** (use the existing notification mechanism or create a simple `notifications` table — see Section 8).
9. Returns the created `PurchaseOrder`.

### 2.2 — Backend: `PATCH /rfqs/:rfqId/bids/:bidId/reject`

Add endpoint and service method. Persist `rejection_reason` (string, required) to the `bids` table. Add `rejection_reason String?` to the Prisma `Bid` model and generate a migration.

### 2.3 — Frontend: Wire `BidComparisonTable.tsx`

Replace the current `confirmAward` toast-only logic:
```ts
const awardMutation = useMutation({
  mutationFn: ({ rfqId, bidId }) =>
    api.patch(`/rfqs/${rfqId}/award/${bidId}`),
  onSuccess: (po) => {
    toast.success(`Order #${po.id} created`);
    queryClient.invalidateQueries(['rfqs', rfqId]);
    queryClient.invalidateQueries(['purchase-orders']);
    navigate(`/orders/${po.id}`);
  },
});
```

Replace the `rejectBid` toast-only logic with a mutation calling `PATCH /rfqs/:rfqId/bids/:bidId/reject` with `{ rejection_reason }`.

### 2.4 — Frontend: Update `Bids.tsx`

Wire the bid rejection dialog to call the new reject endpoint and persist the reason.

---

## SECTION 3 — Purchase Order Status Model & Fulfillment
**Commit prefix:** `feat(orders):`

### 3.1 — Prisma: Expand `POStatus` enum

Update `schema.prisma`:
```prisma
enum POStatus {
  CONFIRMED
  PROCESSING
  OUT_FOR_DELIVERY
  DELIVERED
  COMPLETED
  CANCELLED
}
```
Run `prisma migrate dev --name expand-po-status`.

### 3.2 — Backend: Status transition endpoint

Add `PATCH /purchase-orders/:id/status` accepting `{ status: POStatus, note?: string }`. Validate allowed transitions (only forward, no skipping to `COMPLETED` without `DELIVERED` first). Only the **supplier** company can move from `CONFIRMED → PROCESSING → OUT_FOR_DELIVERY`. Only the **buyer** can move `DELIVERED → COMPLETED`.

### 3.3 — Backend: Fix `createDeliveryNote` route bug

In `purchase-orders.controller.ts`, the `createDeliveryNote` handler must enforce `poId` from the **route param**, not the request body:
```ts
@Post(':id/delivery-notes')
createDeliveryNote(
  @Param('id') poId: string,
  @Body() dto: CreateDeliveryNoteDto,
  @CurrentUser() user: JwtPayload,
) {
  return this.service.createDeliveryNote(poId, dto, user);
}
```
In the service, validate that the PO belongs to the supplier (`user.companyId`).

### 3.4 — Backend: Inventory / partial deliveries

Add `Inventory` table to `schema.prisma`:
```prisma
model Inventory {
  id         String   @id @default(uuid())
  project_id String
  product_name String
  unit       String
  qty_on_hand Decimal @default(0)
  updated_at DateTime @updatedAt
  project    Project  @relation(fields: [project_id], references: [id])
}
```
When a `GRNItem` is created (goods received), add a service method `updateInventory(projectId, items[])` that upserts inventory rows (increment `qty_on_hand`). Also compute and return `remaining_qty = po_item.quantity - SUM(grn_items.received_qty)` on every PO detail response.

### 3.5 — Frontend: Wire `GoodsReceivedNote.tsx`

In `Orders.tsx`, the `GoodsReceivedNote` component is imported but never mounted. Mount it in the order detail view conditionally when `order.status === 'OUT_FOR_DELIVERY'`. Wire its submit handler to call `POST /purchase-orders/:id/delivery-notes` with proper payload including `grn_items`.

### 3.6 — Frontend: Reflect full status lifecycle

Update the order status badge/stepper in `Orders.tsx` to display all 5 states: `Confirmed → Processing → Out for Delivery → Delivered → Completed`. Map `POStatus` enum values from the backend to human-readable labels with colour coding.

---

## SECTION 4 — Mobile Sync Fix (Critical)
**Commit prefix:** `fix(sync):`

The mobile sync is currently broken on two fronts: missing JWT header and wrong request body shape.

### 4.1 — Fix `mobile/services/sync.ts`

The `syncPush` function must:
1. **Attach JWT:** Read the stored token from `SecureStore` (or whichever storage the auth module uses) and set `Authorization: Bearer <token>` on the fetch call.
2. **Fix body shape:** The NestJS `sync.controller.ts` expects `{ changes: SyncChangesDto, lastPulledAt: number }`. The mobile client must send exactly this shape, not a raw Watermelon envelope.
3. **Fix `SYNC_API_URL`:** Use the same base URL as `mobile/services/api.ts` (read from `Constants.expoConfig.extra.apiUrl`), appending `/sync`.

```ts
// mobile/services/sync.ts
export async function synchronize(database: Database) {
  const token = await SecureStore.getItemAsync('auth_token');
  await watermelonSync({
    database,
    pullChanges: async ({ lastPulledAt }) => {
      const res = await fetch(`${API_BASE}/sync/pull?last_pulled_at=${lastPulledAt ?? 0}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Pull failed');
      const { changes, timestamp } = await res.json();
      return { changes, timestamp };
    },
    pushChanges: async ({ changes }) => {
      const res = await fetch(`${API_BASE}/sync/push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ changes }),
      });
      if (!res.ok) throw new Error('Push failed');
    },
  });
}
```

### 4.2 — Backend: Proper LWW conflict resolution in `sync.service.ts`

In `processPush`, for each incoming record, compare `incoming.updated_at` with the row's `updated_at` in Postgres. Only apply the update if `incoming.updated_at >= existing.updated_at`. This implements Last Write Wins correctly. Add a comment block explaining the strategy.

### 4.3 — Backend: Add `products` to sync `processOrder`

In `sync.service.ts`, the `processOrder` array for push processing must include `'products'` so the mobile catalog hydration path works. Products are **read-only** from mobile (pull only), so only implement pull-side hydration for this table.

### 4.4 — Prisma: Add `SYNCED` to `DailyLogStatus`

```prisma
enum DailyLogStatus {
  DRAFT
  SUBMITTED
  SYNCED   // ← add this
}
```
Run `prisma migrate dev --name add-daily-log-synced-status`. Update the sync service to set status to `SYNCED` after a successful push of a daily log.

---

## SECTION 5 — Real Materials Catalog API
**Commit prefix:** `feat(catalog):`

### 5.1 — Backend: Replace materials stub with DB-backed CRUD

In `materials.service.ts`, replace the hardcoded array with Prisma `Product` queries:

```ts
findAll(filters: { category?: string; supplierId?: string }) {
  return this.prisma.product.findMany({
    where: {
      ...(filters.category && { category: filters.category }),
      ...(filters.supplierId && { supplier_company_id: filters.supplierId }),
      is_active: true,
    },
    include: { supplier: { select: { name: true, is_verified: true } } },
    orderBy: { created_at: 'desc' },
  });
}
```

Add `POST /materials` (supplier only), `PATCH /materials/:id` (supplier owner only), `DELETE /materials/:id` (soft delete: `is_active = false`).

Ensure `Product` in `schema.prisma` has: `id`, `name`, `category`, `sub_category`, `unit`, `base_price`, `description`, `image_url`, `is_active`, `supplier_company_id`, `created_at`, `updated_at`. Run migration if fields are missing.

### 5.2 — Backend: Admin catalog management

Add `POST /admin/categories`, `GET /admin/categories` backed by a new `Category` table:
```prisma
model Category {
  id          String  @id @default(uuid())
  name        String  @unique
  parent_id   String?
  parent      Category? @relation("CategoryTree", fields: [parent_id], references: [id])
  children    Category[] @relation("CategoryTree")
  unit_options String[]
}
```
Run migration. Wire to `CatalogManagement.tsx` in the frontend.

### 5.3 — Mobile: Catalog hydration on sync

In the mobile sync pull handler, after `watermelonSync` completes, write the received `products` into the local WatermelonDB `products` table. The `catalog.tsx` screen must read from this local table (it already does), so offline browsing will work after first sync.

---

## SECTION 6 — S3 Upload Pipeline (Documents & Photos)
**Commit prefix:** `feat(storage):`

### 6.1 — Backend: Create `StorageModule`

Create `backend/src/storage/storage.module.ts`, `storage.service.ts`:

```ts
@Injectable()
export class StorageService {
  private s3 = new S3Client({ region: process.env.AWS_REGION });

  async uploadFile(
    buffer: Buffer,
    mimeType: string,
    folder: 'kyb-docs' | 'rfq-attachments' | 'site-photos' | 'delivery-notes',
  ): Promise<string> {
    const key = `${folder}/${uuid()}-${Date.now()}`;
    await this.s3.send(new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      ServerSideEncryption: 'AES256',  // NFR-04
    }));
    return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  }

  async getSignedUrl(key: string): Promise<string> {
    return getSignedUrl(this.s3, new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
    }), { expiresIn: 3600 });
  }
}
```

Add to `.env.example`:
```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=construction-connect-prod
```

### 6.2 — Backend: KYB document upload endpoint

Add `POST /companies/:id/documents` accepting `multipart/form-data` with fields `file` (the document) and `doc_type` (`CR | TAX_ID | VAT_CERT | COMPANY_LOGO`). Use `StorageService.uploadFile(buffer, mime, 'kyb-docs')`. Store the returned URL in a new `CompanyDocument` table:

```prisma
model CompanyDocument {
  id          String   @id @default(uuid())
  company_id  String
  doc_type    String
  file_url    String
  uploaded_at DateTime @default(now())
  company     Company  @relation(fields: [company_id], references: [id])
}
```

On `PATCH /companies/:id/verify` (Admin), verify that required doc types are present before setting `is_verified = true`.

### 6.3 — Backend: RFQ BOQ file upload

Add `POST /rfqs/:id/attachments` accepting `multipart/form-data`. Store in S3 `rfq-attachments/` folder and save URL to a new `RFQAttachment` table:
```prisma
model RFQAttachment {
  id       String @id @default(uuid())
  rfq_id   String
  file_url String
  file_name String
  rfq      RFQ    @relation(fields: [rfq_id], references: [id])
}
```

### 6.4 — Frontend: Wire file uploads

In `RFQWizard.tsx`, after RFQ creation succeeds, upload any attached `File[]` to `POST /rfqs/:id/attachments` using `FormData`.

In `Register.tsx` / onboarding flow, wire the document upload fields to `POST /companies/:id/documents`.

### 6.5 — Mobile: S3 photo upload worker

In `mobile/services/photoUpload.ts` (create if absent), implement:
```ts
export async function uploadPendingPhotos(database: Database) {
  const pending = await database
    .get<LogPhoto>('log_photos')
    .query(Q.where('s3_url', null))
    .fetch();

  for (const photo of pending) {
    const formData = new FormData();
    formData.append('file', { uri: photo.localPath, type: 'image/jpeg', name: 'photo.jpg' } as any);
    const res = await api.post('/daily-logs/photos', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    await photo.update(p => { p.s3Url = res.data.url; });
  }
}
```

Compress photos before upload using `expo-image-manipulator` to target `<500 KB` (NFR). Call this worker from the sync service after a successful push.

---

## SECTION 7 — Audit Logging (NFR-05)
**Commit prefix:** `feat(audit):`

### 7.1 — Prisma: `AuditLog` table

```prisma
model AuditLog {
  id          String   @id @default(uuid())
  user_id     String
  company_id  String
  action      String   // e.g. "rfq.created", "bid.awarded", "po.status_changed"
  entity_type String   // e.g. "RFQ", "PurchaseOrder"
  entity_id   String
  old_value   Json?
  new_value   Json?
  ip_address  String?
  user_agent  String?
  created_at  DateTime @default(now())
}
```
Run `prisma migrate dev --name add-audit-log`.

### 7.2 — NestJS: `AuditInterceptor`

Create `backend/src/common/interceptors/audit.interceptor.ts` as an `NestInterceptor`. After each mutating request (`POST`, `PATCH`, `DELETE`) completes successfully (in `tap()`), write an `AuditLog` row asynchronously (fire-and-forget, don't fail the request). Capture `user_id`, `company_id` from `req.user`, `action` from `req.method + route`, `entity_id` from the response body's `id` field.

Register as global interceptor in `app.module.ts`.

### 7.3 — Frontend: Admin audit log viewer

Add a route `/admin/audit-logs` with a `<AuditLogViewer />` component that queries `GET /admin/audit-logs` (paginated, filterable by `entity_type` and date range). Display in a table: Timestamp, User, Action, Entity, Details.

---

## SECTION 8 — In-App Notifications
**Commit prefix:** `feat(notifications):`

### 8.1 — Prisma: `Notification` table

```prisma
model Notification {
  id         String   @id @default(uuid())
  user_id    String
  title      String
  body       String
  type       String   // "rfq_awarded" | "bid_received" | "order_status" | "kyb_approved"
  entity_id  String?
  is_read    Boolean  @default(false)
  created_at DateTime @default(now())
  user       User     @relation(fields: [user_id], references: [id])
}
```

### 8.2 — Backend: Notifications service & controller

Create `NotificationsModule` with:
- `POST /notifications/mark-read/:id`
- `POST /notifications/mark-all-read`
- `GET /notifications?unread=true` (JWT protected, returns own notifications)
- `NotificationsService.create(userId, { title, body, type, entityId })` — called from other services on key events.

**Trigger notifications on:**
- RFQ awarded → notify winning supplier
- New bid received → notify RFQ owner (contractor)
- PO status changed → notify the other party
- KYB approved → notify company admin

### 8.3 — Frontend: Notification bell

Add a `<NotificationBell />` component in the main navbar. Poll `GET /notifications?unread=true` every 30 seconds (or use TanStack Query `refetchInterval`). Show badge count. On click, display a dropdown list of recent notifications with links to the relevant entity.

---

## SECTION 9 — Daily Logs Completion
**Commit prefix:** `feat(daily-logs):`

### 9.1 — Mobile: OpenWeatherMap integration (REQ-DL-01)

In `mobile/components/WeatherWidget.tsx`, replace the mock `fetchWeather` with a real call:
```ts
const res = await fetch(
  `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_KEY}&units=metric`
);
const data = await res.json();
return { temp: data.main.temp, condition: data.weather[0].main, humidity: data.main.humidity };
```

Add `EXPO_PUBLIC_OPENWEATHER_KEY=` to `.env.example`. Handle the offline case gracefully (show manual input form).

### 9.2 — Mobile: Attendance hours & validation (REQ-DL-02)

In `AttendanceSheet.tsx`, add per-row `hours_worked` number input. Add client-side validation: `hours_worked <= 16` per worker per day (configurable constant). Update the `attendance_data` JSONB structure to `{ company: string, trade: string, headcount: number, hours_worked: number }[]`.

Update the backend `DailyLog` Prisma schema to reflect this structure in a comment (JSONB — no migration needed, just documentation).

### 9.3 — Mobile: GRN linked to PO (REQ-DL-04)

The `MaterialReceiptForm.tsx` must allow the user to select an open `PurchaseOrder` first, then show its line items as checkboxes with `received_qty` inputs. On submit, call `POST /purchase-orders/:id/delivery-notes` (from Section 3.3) with the GRN items. After a successful API call (or sync push), update the local inventory model in WatermelonDB.

---

## SECTION 10 — Invoicing & Compliance (ZATCA Phase 1)
**Commit prefix:** `feat(invoicing):`

### 10.1 — Backend: Auto-generate invoice on delivery

In the PO status transition service (Section 3.2), when status moves to `DELIVERED`, automatically create an `Invoice` record:
```ts
await this.prisma.invoice.create({
  data: {
    po_id: po.id,
    buyer_company_id: po.buyer_company_id,
    supplier_company_id: po.supplier_company_id,
    issue_date: new Date(),
    due_date: addDays(new Date(), po.payment_terms === 'CREDIT' ? 30 : 0),
    subtotal: po.total_amount,
    vat_rate: po.buyer_company.country === 'SA' ? 0.15 : 0.14,
    vat_amount: po.total_amount * vatRate,
    total_amount: po.total_amount * (1 + vatRate),
    status: 'ISSUED',
    currency: po.buyer_company.country === 'SA' ? 'SAR' : 'EGP',
  },
});
```

### 10.2 — Backend: ZATCA QR code generation (KSA — Phase 1)

Install `npm i qrcode`. In `InvoicesService`, add a `generateZatcaQr(invoice)` method that encodes the ZATCA Phase 1 TLV fields (Seller name, VAT number, timestamp, total, VAT amount) in Base64 and stores the result in `invoice.zatca_qr_code`. Call this after invoice creation for KSA companies.

```ts
// TLV encoding helper
function tlv(tag: number, value: string): Buffer {
  const val = Buffer.from(value, 'utf8');
  return Buffer.concat([
    Buffer.from([tag]),
    Buffer.from([val.length]),
    val,
  ]);
}
```

### 10.3 — Backend: Invoice PDF generation

Install `npm i pdfkit`. Create `InvoicesService.generatePdf(invoiceId)` that builds a PDF with: company logos, invoice table (line items, subtotal, VAT, total), QR code image (for KSA), ZATCA-required Arabic text labels, and saves it to S3 `delivery-notes/`. Return a signed URL from `GET /invoices/:id/pdf`.

### 10.4 — Frontend: Invoice view with PDF download

In `InvoiceView.tsx`, add a "Download PDF" button calling `GET /invoices/:id/pdf`. Display the ZATCA QR code image inline for KSA invoices. Wire `PaymentUpload.tsx` to `POST /invoices/:id/payment-proof` saving a bank receipt image to S3.

---

## SECTION 11 — Authentication: OTP & KYB Flow
**Commit prefix:** `feat(auth):`

### 11.1 — Backend: OTP on registration (FR-A-01)

Install `npm i otplib`. On `POST /auth/register`:
1. Create the user with `status = 'PENDING_VERIFICATION'`.
2. Generate a 6-digit TOTP and store as `otp_hash` (bcrypt) + `otp_expires_at` on the user record. Add these fields to the Prisma `User` model.
3. Send via email (use `nodemailer` with SMTP config from env) OR SMS (use Twilio if `TWILIO_ACCOUNT_SID` is set).
4. Return `{ message: 'OTP sent', userId }`.

Add `POST /auth/verify-otp` accepting `{ userId, otp }`. On success, set `status = 'ACTIVE'` and return a JWT.

Add to `.env.example`:
```
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=
```

### 11.2 — Frontend: OTP verification screen

After registration, redirect to `/auth/verify-otp` with a 6-digit input. On submit, call `POST /auth/verify-otp`. On success, redirect to `/onboarding`.

### 11.3 — Frontend: KYB onboarding flow

Create `/onboarding` route with a multi-step form:
- Step 1: Company profile (name, address, country `SA | EG`, type `CONTRACTOR | SUPPLIER`)
- Step 2: Document uploads (using the S3 upload from Section 6.4). Contractors: CR + Tax ID + Logo. Suppliers: CR + Tax ID + VAT Certificate + categories.
- Step 3: "Under Review" confirmation screen.

---

## SECTION 12 — Frontend Polish & UX
**Commit prefix:** `fix(ui):`

### 12.1 — RTL / i18n depth

In `frontend/src/i18n.ts`, verify all string keys used in production components have Arabic translations. Add missing keys for: order status labels, notification messages, invoice fields, KYB steps. In `frontend/src/index.css` (or global styles), ensure `dir="rtl"` on `<html>` when language is Arabic and that Tailwind's `rtl:` variants are applied on flex/padding/margin for the following components: Navbar, Sidebar, DataTable headers, Form labels.

### 12.2 — Empty states

Add a `<EmptyState icon title description action />` component. Mount it in: `RFQs.tsx` (no RFQs yet), `Orders.tsx` (no orders), `SupplierRFQFeed.tsx` (no matching RFQs), `Financials.tsx` (no invoices).

### 12.3 — Error boundaries

Wrap each major page in `<ErrorBoundary fallback={<ErrorPage />}>`. Create `frontend/src/components/ErrorBoundary.tsx` using React class component pattern or `react-error-boundary`.

### 12.4 — Loading skeletons

Replace `<Spinner />` on list pages with `<SkeletonTable rows={5} />` and `<SkeletonCard />` components to reduce layout shift.

### 12.5 — Form validation

Audit all forms that currently only validate client-side. Ensure `react-hook-form` + `zod` schemas are consistent with backend DTOs for: `RegisterForm`, `RFQWizard`, `SupplierQuoteForm`, `CreateDeliveryNote`.

---

## SECTION 13 — Mobile Polish
**Commit prefix:** `fix(mobile):`

### 13.1 — Mobile RFQ list: replace mocks

In `mobile/app/marketplace/rfq/list.tsx`, replace hardcoded mock data with a real API call to `GET /rfqs` (supplier feed). Use TanStack Query's `useQuery` (already in the stack). Show a skeleton loader while fetching. Cache results locally in WatermelonDB for offline viewing.

### 13.2 — Mobile cart → PO checkout

In `mobile/app/marketplace/cart.tsx`, implement the checkout flow:
1. On "Submit Order", call `POST /purchase-orders` with cart items mapped to `POItem` format.
2. On success, clear the cart (delete local WatermelonDB cart records).
3. Navigate to the new order's tracking screen.

### 13.3 — Offline data encryption

In `mobile/db/index.ts`, ensure WatermelonDB is initialised with SQLCipher encryption:
```ts
const adapter = new SQLiteAdapter({
  schema,
  dbName: 'construction_connect',
  jsi: true,
  onSetUpError: (error) => console.error('DB setup error:', error),
  // SQLCipher key from SecureStore
  encryptionKey: await SecureStore.getItemAsync('db_encryption_key'),
});
```
Generate and store the key on first launch if absent.

### 13.4 — Sync status indicator

Add a `<SyncStatusBar />` component visible at the top of the main tab layout. It shows: "🟢 Synced", "🟡 Syncing…", "🔴 Offline – X changes pending". Read pending count from WatermelonDB query on `sync_changes` (or count unsynced records).

---

## SECTION 14 — Observability & Production Hardening
**Commit prefix:** `chore(ops):`

### 14.1 — Structured logging

Replace all `console.log` in backend with NestJS `Logger`:
```ts
private readonly logger = new Logger(ServiceName.name);
this.logger.log(`Syncing ${changes.length} records`);
this.logger.error(`Sync failed`, error.stack);
```

### 14.2 — Global exception filter

Create `backend/src/common/filters/http-exception.filter.ts` as a `@Catch(HttpException)` filter. Return structured JSON: `{ statusCode, message, timestamp, path }`. Register globally in `main.ts`.

### 14.3 — Health check endpoint

Install `@nestjs/terminus`. Add `GET /health` returning DB ping status (Prisma) and disk space. Mark as `@Public()`.

### 14.4 — Rate limiting

Install `@nestjs/throttler`. Apply `ThrottlerModule.forRoot({ ttl: 60, limit: 100 })` globally. Override with `@Throttle(5, 60)` on `POST /auth/login` and `POST /auth/register`.

### 14.5 — CORS & Helmet

In `main.ts`, ensure:
```ts
app.use(helmet());
app.enableCors({ origin: process.env.FRONTEND_URL, credentials: true });
```

### 14.6 — Prisma query optimisation

For every `findMany` that `include`s relations, add explicit `select` to avoid over-fetching. Specifically fix `rfqs.service.ts` findAll (includes all bid data by default) and `purchase-orders.service.ts` (includes all invoice/delivery note data).

---

## SECTION 15 — Testing
**Commit prefix:** `test:`

### 15.1 — Backend E2E tests

Create `backend/test/rfq-award.e2e-spec.ts` covering the complete happy path:
1. Register contractor + supplier, verify OTP.
2. Contractor creates RFQ.
3. Supplier submits bid.
4. Contractor awards bid → assert PO created with correct `supplier_company_id`.
5. Supplier changes PO status to `PROCESSING`.
6. Assert notification created for contractor.

### 15.2 — Backend unit tests

Create unit tests for:
- `rfqs.service.ts → awardBid()`: test that non-owner gets `ForbiddenException`, test that already-awarded RFQ gets `BadRequestException`.
- `sync.service.ts → processPush()`: test LWW — incoming record with older timestamp must not overwrite newer DB record.
- `invoices.service.ts → generateZatcaQr()`: test TLV output is valid Base64.

### 15.3 — Frontend unit tests

Create Vitest tests for:
- `BidComparisonTable.tsx`: assert `awardMutation` is called on confirm; assert reject modal calls reject endpoint.
- `GoodsReceivedNote.tsx`: assert submit calls `POST /purchase-orders/:id/delivery-notes`.

---

## Final Checklist

Before marking the sprint complete, verify:

- [ ] `GET /health` returns 200
- [ ] `POST /auth/register` → `POST /auth/verify-otp` → login flow works end-to-end
- [ ] Creating an RFQ, receiving a bid, and awarding it creates a PO in the DB
- [ ] Reject bid persists `rejection_reason`
- [ ] PO status can transition through all 5 states
- [ ] GRN creates inventory row and updates `remaining_qty`
- [ ] Mobile sync push includes JWT and correct body shape
- [ ] Daily log created offline syncs within 60s of reconnection
- [ ] Site photo uploads to S3 with `AES256` encryption
- [ ] KYB document uploads to S3 `kyb-docs/` folder
- [ ] ZATCA QR code appears on KSA invoice PDF
- [ ] All `findAll` services are tenant-scoped
- [ ] `POST /purchase-orders` without JWT returns 401
- [ ] `AuditLog` row created after every POST/PATCH/DELETE
- [ ] Notification created when bid is awarded
- [ ] RTL layout correct in Arabic mode
- [ ] `npm run build` (frontend) exits 0
- [ ] `npm run build` (backend) exits 0
- [ ] All E2E tests pass: `npm run test:e2e`

---

*End of prompt. Work through sections in order 1 → 15. Commit after each section.*
