# Construction Connect — System Audit

**Audience:** Tech lead / production readiness review  
**Audit date:** 2026-03-24  
**Documentation reviewed:** `docs/(FRD).pdf` (B2B Marketplace MVP), `docs/v_1.1.pdf` (mobile-first operations FRD). Full PDF text was extracted via `pdftotext`; line-level spec detail beyond excerpts was not mechanically verified.

**Code reviewed:** `backend/` (NestJS + Prisma), `frontend/` (Vite + React), `mobile/` (Expo + WatermelonDB).

---

## 1. Executive summary

The codebase implements a **credible data model** (PostgreSQL via Prisma) for contractors, suppliers, RFQs, bids, purchase orders, partial deliveries (delivery notes + GRN line items), invoices, wallets, daily logs, and a sync changelog table. **However, production-critical gaps are large:** many HTTP APIs are **unauthenticated**, **multi-tenant isolation is absent** on several `findAll` services, **RFQ award → order conversion is not persisted** from the web UI, **mobile sync is wired incorrectly** (JWT + request body shape), **catalog/materials and ZATCA/S3 flows are mostly stub or UI-only**, and **audit logging (NFR) does not exist** in code.

**Doc vs implementation:** The older FRD specifies **Next.js** for web; the repo ships **Vite + React Router** (`frontend/vite.config.ts`, `frontend/src/App.tsx`). Treat this as documentation drift.

---

## 2. Architecture (mental model)

| Layer | Stack | Role |
|--------|--------|------|
| **Backend** | NestJS, Prisma, PostgreSQL | REST API, JWT auth (`AuthGuard` on some routes only) |
| **Web** | React, TanStack Query, WatermelonDB provider | Office workflows: RFQ, bids, orders list, financials, admin-style screens |
| **Mobile** | Expo, WatermelonDB (SQLite) | Offline-first UI for daily logs, marketplace shell, local cart/PO models |
| **Sync** | `sync_changes` table + `/sync/pull` & `/sync/push` | Intended Watermelon-style pull/push; **implementation is incomplete and client integrations diverge** |

---

## 3. Feature matrix

Legend: **✅** full vertical slice usable end-to-end · **⚠️** partial / disconnected · **❌** documented but not implemented (or only stub).

| Feature | Status | Frontend | Backend | Mobile | Notes |
|--------|--------|----------|---------|--------|------|
| **Auth (email/password)** | ⚠️ | `frontend/src/contexts/AuthContext.tsx`, `frontend/src/pages/auth/*` | `backend/src/auth/*` | `mobile/app/login.tsx` | No OTP/KYB depth per FRD-A. Register mapping vs backend DTO may be lossy. |
| **KYB / doc upload / admin approve** | ⚠️ | `Approvals.tsx`, `Register.tsx` (UI hints) | `companies.is_verified`, patch on `companies` | ❌ | No secure document pipeline; Approvals uses API but companies API is **unauthenticated** (see §7). |
| **Projects & sites** | ⚠️ | `frontend/src/pages/Projects.tsx` | `backend/src/projects/*`, schema `Project`/`Site` | `mobile/app/(tabs)/dashboard.tsx`, `mobile/db/models/Project.ts` | `projects.findAll()` returns **all** projects (no company scoping). Maps/geofence not productized on web. |
| **BOQ** | ⚠️ | Indirect (RFQ wizard, model on web) | `BOQItem` in Prisma | ❌ | No dedicated BOQ management screen found. |
| **RFQ create/list** | ⚠️ | `RFQBuilder.tsx`, `RFQs.tsx`, `RFQWizard.tsx` | `backend/src/rfqs/*` | `marketplace/rfq/list.tsx` | Web talks to API; **mobile RFQ list is hardcoded mock data** (`mobile/app/marketplace/rfq/list.tsx`). |
| **RFQ attachments (BOQ file)** | ⚠️ | `RFQWizard.tsx` (local `File[]` state) | ❌ no file storage API evident | ❌ | Files not uploaded to S3/backend. |
| **Supplier RFQ feed** | ⚠️ | `SupplierRFQFeed.tsx` | `GET /rfqs` (unauthenticated) | ❌ | Feed relies on open API; no category-matching engine visible. |
| **Submit quote (bid)** | ⚠️ | `SupplierQuoteForm.tsx` → `api.post(/rfqs/:id/bids)` | `POST /rfqs/:id/bids` | ❌ | Backend path exists; mobile not integrated. |
| **Partial bidding** | ⚠️ | UI complexity in quote form | `BidItem` + `RFQItem` in schema | ❌ | Depends on submitted payload; not audited line-by-line against FRD-C-06. |
| **Bid comparison** | ⚠️ | `BidComparisonTable.tsx` | Uses RFQ/bid data via query | ❌ | **Award confirms with toast only — no `PATCH` RFQ / create `PurchaseOrder`.** |
| **Award → order (FRD-C-08)** | ❌ | Toasts in `BidComparisonTable.tsx`, `Bids.tsx` | PO create endpoint exists but **not called from award flow** | ❌ | Core marketplace flow **broken for persistence**. |
| **Bid rejection + reason (FRD-C-09)** | ⚠️ | `Bids.tsx` (dialog + toast) | ❌ | ❌ | Reason not persisted to backend. |
| **Orders list (web)** | ⚠️ | `Orders.tsx` → `GET /purchase-orders` | `purchase-orders` service includes `delivery_notes` | ❌ | Works for read; status model on UI **does not match** Prisma `POStatus` (`CONFIRMED|PROCESSING|COMPLETED` only). |
| **Orders (mobile)** | ⚠️ | ❌ | Sync/API partial | `marketplace/orders.tsx` | Lists **local** `purchase_orders` only; refresh calls `syncData()` which is **currently non-functional** (§5). |
| **Delivery notes / GRN (API)** | ⚠️ | ❌ | `POST/GET :id/delivery-notes` in `purchase-orders.controller.ts` | ❌ | `createDeliveryNote` **ignores route `poId`** — uses body only (footgun). |
| **GRN / POD (web UI)** | ⚠️ | `GoodsReceivedNote.tsx` (rich UI); **not mounted** in `Orders.tsx` (import + state unused) | Possible via API | ❌ | **No API call from GRN component** (simulated upload comment in component). |
| **GRN / material receipt (mobile)** | ⚠️ | — | — | `MaterialReceiptForm.tsx`, `daily_logs.material_receipt_data` JSON | Form is generic; **no PO linkage flow** like REQ-DL-04; no inventory update. |
| **Inventory & partial deliveries** | ⚠️ | — | `DeliveryNote`, `GRNItem`, `POItem` | ❌ | Schema supports story; **no inventory table**, no “remaining qty” aggregation service. |
| **Materials / catalog API** | ⚠️ | Not wired to real catalog | `GET /materials` returns **hardcoded array** (`materials.service.ts`) | Catalog reads **local** `products` | `Product` exists in Prisma but **not used** by materials service. |
| **Marketplace: catalog UX (mobile)** | ⚠️ | — | ❌ | `marketplace/catalog.tsx`, local DB | Offline browsing **only if products seeded locally** — no `GET /materials` + hydration path verified. |
| **Cart & checkout (mobile)** | ⚠️ | — | ❌ | `cart.tsx`, `product/[id].tsx` | Cart is **offline-only**; no checkout → PO creation API hookup. |
| **Direct order tracking / geofence** | ❌ | — | ❌ | ❌ | REQ-MP-03 geofencing / statuses absent (no tracking endpoints). |
| **Daily logs: weather** | ⚠️ | ❌ | `DailyLog.weather_data` | `WeatherWidget.tsx` — **mock `fetchWeather`** | Not OpenWeatherMap; REQ-DL-01 not met. |
| **Daily logs: attendance** | ⚠️ | ❌ | JSON on log | `AttendanceSheet.tsx` — headcount only, **no hours/validation** | REQ-DL-02 partial (no subcontractor matrix, no hour caps). |
| **Daily logs: photos + GPS** | ⚠️ | ❌ | `LogPhoto` | `daily-log/new.tsx` — camera + GPS on device | **No S3 upload worker**; `s3_url` unlikely populated. |
| **Daily logs: CRUD + API** | ⚠️ | ❌ | `daily-logs` controller **JWT protected** | Local Watermelon + intended sync | Mobile does not show REST writes for logs in audited paths; relies on sync. |
| **Daily log status `SYNCED`** | ⚠️ | — | `DailyLogStatus`: `DRAFT`/`SUBMITTED` only | — | Doc v1.1 mentions **`SYNCED`** — **missing in Prisma enum**. |
| **Invoices / ZATCA fields** | ⚠️ | `Financials.tsx`, `InvoiceView.tsx` | `Invoice` model with ZATCA-shaped fields | ❌ | **No e-invoice clearing**, QR generation pipeline unverified; mostly schema + UI. |
| **Wallet / ledger** | ⚠️ | `Financials.tsx` → wallet summary | `wallets/*` **JWT protected** | ❌ | Backend ledger exists; mobile not integrated. |
| **Offline payments (receipt upload)** | ⚠️ | `PaymentUpload.tsx` (UI) | ❌ | ❌ | No verified persistence/API. |
| **Admin: team, catalog, commission** | ⚠️ | `TeamManagement.tsx`, `CatalogManagement.tsx`, settings patches | `CompanySettings` JSON blobs | ❌ | **Commission config** (FR-F-03) not verified as enforced on orders. |
| **Localization RTL** | ⚠️ | `LanguageContext`, `i18n.ts` | N/A | N/A | RTL claims in FRD; depth not audited. |
| **Audit logs (NFR-05)** | ❌ | — | No `audit` module / table | — | **Not implemented** (grep `audit` empty). |
| **Encrypted S3 for docs** | ❌ | Simulated / local files | No storage module in backend scan | Local URIs | NFR not met. |
| **Sync: push/pull endpoints** | ⚠️ | `frontend/src/lib/sync.ts` | `backend/src/sync/sync.controller.ts` | `mobile/services/sync.ts` | See §5 — **mobile push body + auth broken**; server push **no real LWW**. |
| **Conflict resolution (LWW)** | ❌ | — | Comments only; **last push overwrites** | — | Doc v1.1 requires LWW by timestamp — **not implemented server-side**. |

---

## 4. Missing features (موجودة في الـ docs تقريبًا / غير مكتملة في الكود)

Aggregated strictly from FRD PDFs + code scan:

1. **OTP verification** على التسجيل (FR-A-01).
2. **رفع وثائق KYB فعلي + تخزين آمن + مسار موافقة يعتمد الملفات** وليس حقل `is_verified` فقط.
3. **Google Maps / تثبيت الموقع** كمنتج في الواجهات (FR-B-02).
4. **RFQ → ربط ملفات BOQ بالـ backend/S3** (FR-C-02).
5. **تحويل العطاء المقبول إلى أمر شراء** من الواجهة (FR-C-08) — حاليًا toast فقط.
6. **تسجيل سبب الرفض** في الـ API (FR-C-09).
7. **حالة أمر الشراء الكاملة** من المستند: Confirmed → Processing → Out for delivery → Delivered → Completed — الـ Prisma `POStatus` أضيق من ذلك، ولا يوجد تتبع شاحن جغرافي (REQ-MP-03).
8. **Delivery Note PDF وتوليد رسمي** (FR-D-02).
9. **POD على الموبايل مع توقيع يصلاً للـ API وتحديث الحالة** مع عمل دون اتصال ثم مزامنة (FR-D-03) — المكونات جزئية والمزامنة معطلة.
10. **مزامنة كتالوج للعرض دون اتصال** مع مصدر حقيقي (REQ-MP-01).
11. **RFQ “blast” لأقرب 3 موردين + إشعارات** (REQ-MP-02).
12. **OpenWeather لليوميات** (REQ-DL-01).
13. **Attendance بالساعات والتحقق** (REQ-DL-02).
14. **GRN مرتبط بـ PO وكميات جزئية وتحديث مخزون** (REQ-DL-04) — الجداول تقارب الفكرة لكن المنتج غير مكتمل.
15. **حالة `SYNCED` لليوميات** (وثيقة v1.1).
16. **جدول `material_orders` بالاسم** من الوثيقة — مُستبدل بـ `purchase_orders` (مقبول كقرار تصميم، لكن **غير موثَّق** في المستودع).
17. **سجلات تدقيق شاملة** (NFR-05).
18. **تخزين مشفّر S3** (NFR-04).

---

## 5. Sync system audit (critical)

### 5.1 What exists

- **Endpoints:** `GET /sync/pull`, `POST /sync/push` under `backend/src/sync/sync.controller.ts`, guarded by **JWT**.
- **Server logic:** `backend/src/sync/sync.service.ts` reads `sync_changes` since `last_pulled_at`, groups by table/operation, **hydrates** created/updated rows from Postgres, writes on push in a fixed `processOrder`, appends `sync_change` rows.
- **Web client:** `frontend/src/lib/sync.ts` sends **Bearer token**, `POST` body is **`JSON.stringify(changes)`** — matches Nest `@Body() changes`.
- **Mobile client:** `mobile/services/sync.ts` uses **raw `fetch` without `Authorization`**, and `POST` body is **`JSON.stringify({ changes, lastPulledAt })`** — server treats entire body as `changes`, so **push from mobile cannot work** as written.
- **Local queue:** WatermelonDB tracks local mutations; that is the offline queue **in principle**.

### 5.2 Gaps (production)

| Topic | Finding |
|--------|---------|
| **Auth** | Mobile sync calls **will fail** with 401 even if URL is correct. |
| **Payload shape** | Mobile push wrapper **`{ changes, lastPulledAt }`** does not match backend. |
| **`products` table** | Mapped in `mapTableNameToModel` but **`processOrder` omits `products`** — catalog pushes from clients that include `products` are **silently ignored**. |
| **LWW / conflicts** | No comparison of `updated_at` or vector clocks; **`update` overwrites** last writer. Doc v1.1 promises LWW by server timestamp — **not implemented**. |
| **Deleted records pull** | Deletes tracked as IDs; aligns with typical Watermelon pull **if** client handles tombstones — not verified against Watermelon version. |
| **Initial sync / bootstrap** | Pull only returns rows referenced by `sync_changes`; **brand-new clients** may see **empty** history unless a separate seed/full-sync exists (none seen). |
| **Observability** | Heavy `console.log` in sync path — not production logging. |

---

## 6. Database vs documentation

### 6.1 Implemented (Postgres / Prisma)

Source: `backend/prisma/schema.prisma`

- Companies, users, wallets, transactions  
- Projects, sites, BOQ items  
- Products (table present)  
- RFQs, RFQ items, bids, bid items  
- Purchase orders, PO items, delivery notes, GRN items  
- Invoices (ZATCA-shaped fields)  
- Company settings (JSON)  
- `sync_changes`  
- `daily_logs`, `log_photos`  

### 6.2 Drift vs docs

| Doc expectation | Code reality |
|-----------------|--------------|
| `daily_logs.status` includes **SYNCED** (v1.1) | Enum `DRAFT`, `SUBMITTED` only |
| `material_orders` (v1.1 excerpt) | Named `purchase_orders` + related tables |
| Dedicated **audit** table | **Missing** |
| **Inventory levels** after GRN | **No inventory table** |
| Catalog from verified suppliers | `materials.service.ts` **stub**; Prisma `Product` unused there |

---

## 7. API coverage checklist

| Endpoint / area | Exists | Auth | Notes |
|-----------------|--------|------|------|
| `POST /auth/login`, `register` | ✅ | Public | — |
| `GET /sync/pull`, `POST /sync/push` | ✅ | JWT | Mobile integration broken (§5). |
| `GET /materials`, `GET /materials/:id` | ✅ | JWT | **Hardcoded data**, not DB-backed catalog. |
| `GET/POST /purchase-orders`, delivery-notes sub-routes | ✅ | **No guard** | **Critical security gap.** |
| `GET/POST/PATCH /rfqs`, bids | ✅ | **No guard** | **Critical security gap.** |
| `GET/POST/PATCH /invoices` | ✅ | **No guard** | **Critical security gap.** |
| `GET/POST/PATCH /projects`, sites, boqs | ✅ | **No guard** | **Critical security gap.** |
| `GET/PATCH /companies` | ✅ | **No guard** | KYB approval can be abused. |
| `GET/PATCH /users` | ✅ | **No guard** | — |
| `GET/PATCH /settings/company/:id` | ✅ | JWT | — |
| `GET/POST /wallets/...` | ✅ | JWT | — |
| `GET/POST/PATCH /daily-logs` | ✅ | JWT | — |
| **Dedicated tracking** (shipment/geofence) | ❌ | — | — |

---

## 8. Frontend & mobile coverage

- **Web:** Dashboard, RFQ, bids, orders **read** from API; award/reject flows **do not persist**. GRN component **not integrated** into `Orders.tsx`. Watermelon **schema** (`frontend/src/model/schema.ts`) **omits** `daily_logs` / `log_photos` — web is not the daily-log client in this schema.
- **Mobile:** Strong skeleton for Watermelon models (`mobile/db/schema.ts`), daily log capture (`mobile/app/daily-log/new.tsx`), marketplace tabs; **RFQs mocked**, **sync HTTP broken**, **no PO selection GRN**, catalog depends on local seeding.

---

## 9. Critical gaps (high priority)

1. **Secure the API:** Add `AuthGuard` + **company/project authorization** on `projects`, `rfqs`, `purchase-orders`, `invoices`, `companies`, `users` (or global `RolesGuard` + resource rules).
2. **Fix tenant isolation:** Replace “return all rows” (`projects.service.ts`, `rfqs`, `purchase-orders`, etc.) with queries scoped to `req.user.company_id` / membership.
3. **Complete RFQ award:** On award, transactionally `PATCH` RFQ status + create `PurchaseOrder` + `POItem` lines from bid; reject reason persisted.
4. **Repair mobile sync:** Attach JWT to sync `fetch`; post **only** `changes` (or change backend to accept Watermelon envelope); align `SYNC_API_URL` with `api.ts` base URL strategy.
5. **Wire GRN/POD to API** (web and/or mobile) and fix `createDeliveryNote` to enforce `poId` from route or validated body.
6. **Replace materials stub** with Prisma `Product` CRUD + admin catalog + mobile seed/pull.
7. **Implement audit log / activity table** or wire Nest interceptors if NFR-05 is in scope.

---

## 10. Suggested next steps (priority roadmap)

| Priority | Action | Rationale |
|----------|--------|-----------|
| **P0** | JWT + RBAC + tenant filters on all non-public routes | Stops data leaks and cross-company tampering. |
| **P0** | Persist RFQ award → PO | Core B2B loop from FRD-C-08. |
| **P0** | Fix mobile `sync.ts` (auth + body) + add `products` to `processOrder` | Unblocks offline-first story. |
| **P1** | GRN end-to-end + correct PO status model | Fulfillment + partial delivery promise. |
| **P1** | Real catalog API + mobile hydration | Marketplace MVP. |
| **P2** | S3 upload pipeline for photos/docs + signed URLs | NFR + REQ-DL-03 / FR-C-02. |
| **P2** | Audit log table + middleware | Compliance / disputes. |
| **P3** | OpenWeather, geofencing, PDF DN | Differentiation / doc-complete. |

---

## 11. Key code references

| Area | Path |
|------|------|
| Prisma schema | `backend/prisma/schema.prisma` |
| Sync service | `backend/src/sync/sync.service.ts`, `backend/src/sync/sync.controller.ts` |
| Web sync | `frontend/src/lib/sync.ts` |
| Mobile sync | `mobile/services/sync.ts` |
| Mobile API | `mobile/services/api.ts` |
| Materials stub | `backend/src/materials/materials.service.ts` |
| Unsecured PO controller | `backend/src/purchase-orders/purchase-orders.controller.ts` |
| Award UI (no API) | `frontend/src/components/bids/BidComparisonTable.tsx` (`confirmAward`) |
| GRN (unused in page) | `frontend/src/components/orders/GoodsReceivedNote.tsx`, `frontend/src/pages/Orders.tsx` |
| Mobile RFQ mock | `mobile/app/marketplace/rfq/list.tsx` |
| Daily log model | `mobile/db/models/DailyLog.ts`, `backend/src/daily-logs/*` |

---

*End of audit.*
