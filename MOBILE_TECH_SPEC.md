# Construction Connect — Mobile App Technical Specification
## React Native (Expo) — Production-Ready Implementation Guide

**Version:** 1.0  
**Target:** AI Agent / Senior Developer  
**Stack:** React Native (Expo SDK 54+), WatermelonDB, NestJS Backend (existing), PostgreSQL  
**Architecture:** Offline-First, Synchronized with Web Dashboard

---

## 1. CRITICAL CONTEXT — READ FIRST

The backend and web dashboard are **fully built and in production**. The mobile app must:
1. **Share the same PostgreSQL database** — no separate DB, no data duplication
2. **Use the existing NestJS REST API** — all endpoints are documented below
3. **Sync bidirectionally** via the existing `/sync/pull` and `/sync/push` endpoints (WatermelonDB protocol)
4. **Respect the same JWT auth** — same login, same roles, same company scoping

The mobile app directory exists in the monorepo as a minimal Expo stub. You are building it from scratch within that directory.

**Mobile primary persona:** Site Superintendent / Field Engineer  
**Secondary persona:** Supplier (receives order alerts, updates delivery status)

---

## 2. TECH STACK (MOBILE)

| Layer | Choice | Reason |
|---|---|---|
| Framework | React Native via Expo SDK 54 | Already in monorepo |
| Language | TypeScript (strict) | Consistency with backend |
| Local DB | WatermelonDB (`@nozbe/watermelondb`) | Matches backend sync protocol exactly |
| Navigation | Expo Router | Modern, type-safe |
| State | Zustand + TanStack Query v5 | Lightweight, same as web |
| Auth Storage | `expo-secure-store` | Encrypted JWT storage |
| Styling | NativeWind v5 (Tailwind for RN) | Already configured |
| Icons | `@expo/vector-icons` + Lucide RN | Consistent icon set |
| Camera | `expo-camera` | Photo capture for POD/GRN |
| Location | `expo-location` | GPS for geofencing + geotagging |
| Notifications | `expo-notifications` | Push tokens stored on backend |
| File System | `expo-file-system` | Local photo storage before S3 upload |
| Image | `expo-image` | Optimized image rendering |
| Haptics | `expo-haptics` | Tactile feedback on actions |
| Maps | `react-native-maps` | Site location display |
| Offline Detection | `@react-native-community/netinfo` | Sync trigger |
| Animations | `react-native-reanimated`  | Smooth transitions |
| Gestures | `react-native-gesture-handler` | Swipe actions |
| Forms | `react-hook-form` + `zod` | Validation |
| HTTP | `axios` | Consistent with web |
| Date | `dayjs` | Lightweight date utility |
| PDF Viewer | `expo-web-browser` | Open S3 signed URL PDFs |

---

## 3. MONOREPO STRUCTURE

```
/mobile
  /app                    ← Expo Router file-based routes
    /(auth)
      login.tsx
      register.tsx
      verify-otp.tsx
    /(app)
      _layout.tsx         ← Tab navigator (role-aware)
      index.tsx           ← Dashboard
      /projects
        index.tsx
        [id].tsx
        /sites
          [siteId].tsx
      /rfqs
        index.tsx
        [id].tsx
        new.tsx
      /orders
        index.tsx
        [id].tsx
        delivery.tsx      ← POD capture (mobile-only)
      /daily-logs
        index.tsx
        [id].tsx
        new.tsx           ← Core mobile feature
      /marketplace
        index.tsx         ← Browse materials
        rfq.tsx           ← Create RFQ from field
      /notifications
        index.tsx
      /profile
        index.tsx
  /components
    /ui                   ← Atomic design system
    /forms
    /sync
    /offline
  /lib
    api.ts                ← Axios instance (same base URL as web)
    watermelon.ts         ← WatermelonDB setup
    sync.ts               ← Pull/push sync logic
    auth.ts               ← JWT management
    storage.ts            ← SecureStore helpers
  /models                 ← WatermelonDB models
    Project.ts
    Site.ts
    DailyLog.ts
    LogPhoto.ts
    MaterialOrder.ts
    Notification.ts
  /hooks
    useSync.ts
    useOffline.ts
    useAuth.ts
    usePermissions.ts
  /store
    authStore.ts          ← Zustand
    syncStore.ts
  /constants
    api.ts
    theme.ts
  /types
    index.ts
```

---

## 4. AUTHENTICATION

### 4.1 API Endpoints (existing, no changes needed)

```
POST /auth/register     → { message, userId }
POST /auth/verify-otp   → { access_token, user }
POST /auth/login        → { access_token, user }
GET  /auth/profile      → user object
PATCH /users/push-token → store Expo push token
```

### 4.2 JWT Payload Shape
```typescript
interface JwtPayload {
  sub: string;        // userId
  email: string;
  companyId: string;
  role: 'CONTRACTOR' | 'SUPPLIER' | 'ADMIN';
  companyCountry?: string;
}
```

### 4.3 Auth Flow
1. Store JWT in `expo-secure-store` (never AsyncStorage)
2. Attach `Authorization: Bearer <token>` to all requests via Axios interceptor
3. On 401 → clear token → redirect to login
4. After login → register Expo push token via `PATCH /users/push-token`
5. On app resume → verify token not expired (check `exp` claim)

### 4.4 Role-Based Navigation
- **CONTRACTOR**: Dashboard, Projects, Daily Logs, Orders, Marketplace, Notifications
- **SUPPLIER**: Dashboard, Orders (supplier view), Notifications, Materials
- **ADMIN**: All tabs

---

## 5. OFFLINE-FIRST ARCHITECTURE

### 5.1 WatermelonDB Configuration

The backend sync endpoint uses **WatermelonDB pull/push protocol**:
- `GET /sync/pull?last_pulled_at=<timestamp>` → returns `{ changes, timestamp }`
- `POST /sync/push?last_pulled_at=<timestamp>` → sends `{ changes }`

### 5.2 Local Schema (must match backend Prisma models)

```typescript
// mobile/models/schema.ts
import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'projects',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'status', type: 'string' },
        { name: 'company_id', type: 'string' },
        { name: 'budget', type: 'number', isOptional: true },
        { name: 'start_date', type: 'number', isOptional: true },
        { name: 'end_date', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'sites',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'project_id', type: 'string', isIndexed: true },
        { name: 'address', type: 'string', isOptional: true },
        { name: 'gps_lat', type: 'number', isOptional: true },
        { name: 'gps_long', type: 'number', isOptional: true },
        { name: 'geofence', type: 'string', isOptional: true }, // JSON
        { name: 'contact_name', type: 'string', isOptional: true },
        { name: 'contact_phone', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'daily_logs',
      columns: [
        { name: 'project_id', type: 'string', isIndexed: true },
        { name: 'site_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'user_id', type: 'string' },
        { name: 'log_date', type: 'number' },
        { name: 'weather_data', type: 'string', isOptional: true }, // JSON
        { name: 'attendance_data', type: 'string', isOptional: true }, // JSON
        { name: 'materials_data', type: 'string', isOptional: true }, // JSON
        { name: 'progress_notes', type: 'string', isOptional: true },
        { name: 'status', type: 'string' }, // DRAFT | SUBMITTED | SYNCED
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'log_photos',
      columns: [
        { name: 'daily_log_id', type: 'string', isIndexed: true },
        { name: 'local_path', type: 'string', isOptional: true },
        { name: 's3_url', type: 'string', isOptional: true },
        { name: 'gps_lat', type: 'number', isOptional: true },
        { name: 'gps_long', type: 'number', isOptional: true },
        { name: 'uploaded', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'notifications',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'title', type: 'string' },
        { name: 'message', type: 'string' },
        { name: 'type', type: 'string' },
        { name: 'is_read', type: 'boolean' },
        { name: 'reference_id', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});
```

### 5.3 Sync Implementation

```typescript
// mobile/lib/sync.ts
import { synchronize } from '@nozbe/watermelondb/sync';
import { database } from './watermelon';
import { api } from './api';

export async function syncDatabase(lastPulledAt?: number) {
  await synchronize({
    database,
    pullChanges: async ({ lastPulledAt, schemaVersion, migration }) => {
      const { data } = await api.get('/sync/pull', {
        params: { last_pulled_at: lastPulledAt }
      });
      return { changes: data.changes, timestamp: data.timestamp };
    },
    pushChanges: async ({ changes, lastPulledAt }) => {
      await api.post('/sync/push', { changes }, {
        params: { last_pulled_at: lastPulledAt }
      });
    },
    migrateFromServer: false,
    sendCreatedAsUpdated: false,
  });
}
```

### 5.4 Auto-Sync Triggers
- On app foreground (AppState change)
- On network reconnection (NetInfo listener)
- After every form submission (optimistic local write → background sync)
- Every 5 minutes when app is active and online

### 5.5 Photo Upload Queue
Photos are **NOT** synced via WatermelonDB JSON (too large). Use a separate queue:
1. Capture photo → save to `expo-file-system` local path
2. Write `log_photos` record to WatermelonDB with `local_path`, `uploaded: false`
3. Background worker: when online, upload to `POST /daily-logs/:id/photos` (multipart)
4. On success: update record with `s3_url`, `uploaded: true`, delete local file

---

## 6. SCREENS & FEATURES

### 6.1 Authentication Screens

**Login (`/login`)**
- Email + Password fields
- "Forgot password" (future)
- Show/hide password toggle
- Loading state on submit
- Error display from API

**Register (`/register`)**
- Full name, email, phone, password
- Role selection: Contractor / Supplier
- Company name, country (Egypt / Saudi Arabia)
- Submit → OTP verification

**OTP Verification (`/verify-otp`)**
- 6-digit OTP input (split digits)
- Auto-submit on last digit
- Resend OTP countdown timer
- userId passed via route params

---

### 6.2 Dashboard (`/`)

**Contractor view:**
- Summary cards: Active Projects, Open RFQs, Pending Orders, Unread Notifications
- Today's Daily Log quick-action button (prominent CTA)
- Recent orders list (last 5)
- Pending bids awaiting action

**Supplier view:**
- Summary cards: Open RFQs matching catalog, Active Orders, Revenue (from wallet)
- New RFQ alerts (requires action)
- Recent order status updates

**Data source:** `/auth/profile` + `/projects?limit=5` + `/rfqs?status=OPEN&limit=5` + `/orders?limit=5` + `/notifications?unread=true`

---

### 6.3 Projects & Sites

**Projects List (`/projects`)**
- All projects for user's company
- Status badge: ACTIVE / COMPLETED / ON_HOLD
- Search by name
- Pull-to-refresh
- Tap → Project Detail

**Project Detail (`/projects/[id]`)**
- Project info: name, budget, dates, status
- Sites list for this project
- BOQ summary (item count, total value)
- Recent daily logs
- Related RFQs
- Related Orders

**Site Detail (`/projects/sites/[siteId]`)**
- Site name, address, contact info
- Map view (react-native-maps) showing site pin
- Geofence polygon if configured
- Navigate to site (opens Maps app)

**API endpoints:**
```
GET /projects              → list
GET /projects/:id          → detail
GET /projects/:id/sites    → sites list
GET /projects/:id/boq      → BOQ items
```

---

### 6.4 Daily Logs ← CORE MOBILE FEATURE

**Daily Logs List (`/daily-logs`)**
- Grouped by date (today, yesterday, this week)
- Status indicators: DRAFT (local), SUBMITTED, SYNCED
- Floating "+" button → new log
- Offline indicator badge

**New Daily Log (`/daily-logs/new`)**
This is the primary mobile workflow. Wizard-style with tabs:

**Tab 1: Overview**
- Project selector (searchable dropdown from local WatermelonDB)
- Site selector (filtered by project)
- Date (defaults to today)
- Auto-fetch weather button (calls OpenWeatherMap via backend proxy or directly with API key)
- Weather display: temp, humidity, wind speed, condition icon
- Manual weather override if offline

**Tab 2: Attendance**
- Add subcontractor entries:
  - Company name (text input or dropdown)
  - Trade/role (Carpenter, Mason, Electrician, etc.)
  - Headcount (number)
  - Hours worked (number, max 24)
- List of added entries
- Swipe-to-delete
- Total worker-hours auto-calculated

**Tab 3: Progress**
- Progress notes (multiline text, 500 char limit)
- Photo capture section:
  - Camera button → `expo-camera`
  - Photo grid (max 10 per log)
  - Each photo auto-tagged: GPS, timestamp, userId
  - Tap photo to view full-screen
  - Long-press to delete
- Offline: stored locally, queued for upload

**Tab 4: Materials (GRN)**
- Receive materials against open POs:
  - Select PO from list (calls `/purchase-orders`)
  - For each PO item: ordered qty vs received qty input
  - Photo of delivery ticket
  - System creates partial delivery record
- Or: log ad-hoc material usage

**Save behavior:**
- "Save Draft" → writes to WatermelonDB with status `DRAFT`, no network needed
- "Submit" → writes to WatermelonDB with status `SUBMITTED`, attempts immediate sync
- If offline: queued, synced when online, status → `SYNCED`

**Daily Log Detail (`/daily-logs/[id]`)**
- Read-only view of submitted log
- Weather, attendance summary, photos, materials
- Edit button (only for DRAFT or same-day SUBMITTED)
- PDF export (future feature)

---

### 6.5 RFQs (Contractor)

**RFQ List (`/rfqs`)**
- Tab: My RFQs | Bids Received
- Filter: OPEN / CLOSED / AWARDED
- Pull-to-refresh

**RFQ Detail (`/rfqs/[id]`)**
- Items list with quantities
- Attachments (BOQ PDF → open in browser)
- Bids received table (price comparison)
- Accept / Reject bid actions with confirmation modal
- Rejection reason required (feeds AI model)

**New RFQ (`/rfqs/new`)**
- Project + site selection
- Category picker
- Item entry: name, quantity, unit
- Payment terms selector
- Required delivery date picker
- File attachment (BOQ upload)
- Submit to marketplace

**API endpoints:**
```
GET  /rfqs              → list (role-scoped)
POST /rfqs              → create
GET  /rfqs/:id          → detail with bids
POST /rfqs/:id/attachments → upload BOQ
GET  /rfqs/:id/bids     → bids for comparison
POST /rfqs/:id/bids/:bidId/award   → award bid
POST /rfqs/:id/bids/:bidId/reject  → reject with reason
```

---

### 6.6 RFQ Feed (Supplier)

**RFQ Feed (`/rfqs` for SUPPLIER role)**
- Feed of open RFQs matching supplier's categories
- Filter by category, region
- "Submit Quote" CTA on each card

**Submit Quote Modal**
- Unit price input (currency: EGP/SAR based on companyCountry)
- Delivery cost (optional)
- Quote validity (hours: 24, 48, 72)
- Notes field (e.g., "Brand: Ezz Steel")
- Submit → `POST /rfqs/:id/bids`

---

### 6.7 Orders

**Orders List (`/orders`)**
- For CONTRACTOR: orders placed by their company
- For SUPPLIER: orders they're fulfilling
- Status badges with color coding:
  - `CONFIRMED` → blue
  - `PROCESSING` → amber
  - `OUT_FOR_DELIVERY` → orange
  - `DELIVERED` → green
  - `COMPLETED` → gray
- Filter by status
- Pull-to-refresh

**Order Detail (`/orders/[id]`)**
- Order header: PO number, date, parties
- Items list with quantities
- Current status with timeline
- Delivery notes list

**For SUPPLIER only — Status Update**
- Button to advance status: `CONFIRMED → PROCESSING → OUT_FOR_DELIVERY`
- Cannot set to `DELIVERED` (that's the contractor's POD step)

**Proof of Delivery (`/orders/delivery`) — CONTRACTOR only**

This is activated when an order is `OUT_FOR_DELIVERY`:

1. Open PO → tap "Record Delivery"
2. Items checklist: ordered qty vs received qty
3. Photo capture of delivered materials (required)
4. Digital signature on-screen (using Skia canvas or basic implementation)
5. Submit → `POST /purchase-orders/:id/delivery-notes` with items + POD photo
6. System auto-advances order to `DELIVERED`
7. Invoice auto-generated on backend
8. Offline: saves locally, syncs when online

**API endpoints:**
```
GET  /purchase-orders        → list
GET  /purchase-orders/:id    → detail
PATCH /purchase-orders/:id/status  → update status
POST /purchase-orders/:id/delivery-notes → create GRN with POD
GET  /purchase-orders/:id/delivery-notes → list delivery notes
```

---

### 6.8 Materials Marketplace

**Browse Materials (`/marketplace`)**
- Grid layout of materials/products
- Filter by category (from local WatermelonDB cache)
- Search by name
- Supplier info, price, unit
- Offline: shows cached catalog

**Material Detail**
- Product info: name, description, unit, price
- Supplier company profile
- "Request Quote" → prefills RFQ form

**API endpoints:**
```
GET /materials?category=&search=  → paginated catalog
GET /materials/:id               → detail
```

---

### 6.9 Invoices & Financials

**Invoices List (`/financials`)**
- List of invoices (buyer or supplier view)
- Status: PENDING, PAID
- Total amounts with VAT
- QR code indicator (ZATCA compliance badge)

**Invoice Detail**
- All invoice fields
- "View PDF" → opens S3 signed URL in browser
- Payment proof upload (for buyer)
- `GET /invoices/:id/pdf` → signed URL

**Wallet**
- Current balance
- Transaction history (DEPOSIT, PAYMENT, REFUND)
- "Upload Payment Proof" for outstanding invoices
- `GET /wallets/company/:id` → wallet + transactions

---

### 6.10 Notifications

**Notifications List (`/notifications`)**
- Chronological list with read/unread state
- Types: RFQ bid received, bid awarded, order status changed, delivery received
- Tap → navigate to relevant record
- Mark all read button
- Badge count on tab icon

**Push notifications:**
- Register Expo push token on login: `PATCH /users/push-token`
- Backend sends via Expo Push API (implement in backend `NotificationsService` if not done)

---

### 6.11 Profile & Settings

**Profile (`/profile`)**
- User info: name, email, role
- Company info: name, logo, country, KYB status
- Sync status: last synced timestamp, pending count
- Language toggle: Arabic / English (RTL support)
- Sign out
- App version

---

## 7. UI/UX DESIGN SYSTEM

### 7.1 Source of Truth
The mobile design system is a **direct port** of the existing web frontend. Do not invent new tokens. Every value below is extracted verbatim from:
- `frontend/tailwind.config.ts` — color palette, typography, radius, easing
- `frontend/src/components/ui/button.tsx` — all button variants and sizes
- `frontend/src/components/ui/card.tsx` — card variants and spacing
- `frontend/src/index.css` — fonts, animations, RTL setup

### 7.2 Color Tokens

```typescript
// mobile/constants/theme.ts  ← single source of truth for all RN styles
export const Colors = {
  // Backgrounds
  ground:      '#0D0F0E',   // root background (deepest level)
  surface:     '#141716',   // card / sheet background
  surface2:    '#1C1F1D',   // elevated surface (modals, dropdowns)

  // Borders
  border:      '#2A2E2B',   // default border
  border2:     '#363B37',   // stronger border (active states)

  // Primary action — amber
  amber:       '#D4920A',   // primary CTA, focus rings, active tabs
  amberDim:    '#8A5F06',   // muted amber (hover state on dark)
  amberHover:  '#E0A020',   // button hover (web: #E0A020)

  // Text
  text1:       '#F0EDE8',   // primary text (headings, labels)
  text2:       '#9A9890',   // secondary text (descriptions, meta)
  text3:       '#5C5A55',   // tertiary text (placeholders, disabled)

  // Semantic status (not in tailwind config — use these for badges/tags)
  success:     '#3A7D44',   // delivered, verified
  successText: '#7EC893',
  warning:     '#8A5F06',   // pending, processing (reuse amberDim)
  warningText: '#D4920A',
  error:       '#8B2E2E',   // danger actions, rejected (from button.tsx)
  errorText:   '#F0A0A0',
  info:        '#2A4A6B',
  infoText:    '#7EB8E0',
};

export const Spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
};

export const Radius = {
  sm: 4,    // 'sm' from tailwind config
  md: 6,    // DEFAULT from tailwind config
  lg: 8,    // 'md' from tailwind config
  xl: 12,   // 'lg' from tailwind config
};

export const Duration = {
  fast: 120,   // matches button transition-duration [120ms]
  normal: 200, // card hover
  slow: 300,   // animations from index.css (fade-in, slide-in)
};

// Easing — matches web 'out-expo': cubic-bezier(0.16, 1, 0.3, 1)
// Use with react-native-reanimated: Easing.bezier(0.16, 1, 0.3, 1)
export const Easing = {
  outExpo: [0.16, 1, 0.3, 1] as const,
};
```

### 7.3 Typography

Exact fonts from `tailwind.config.ts`:

```typescript
// mobile/constants/theme.ts (continued)
export const Fonts = {
  display: 'DMSerifDisplay',     // font-display — headings, card titles
  body:    'Geist',              // font-body — all UI text
  mono:    'GeistMono',          // font-mono — codes, IDs
  arabic:  'NotoSansArabic',     // [lang="ar"] override from index.css
};

// Font weights used in web (mirror in RN):
// 400 regular, 500 medium, 600 semibold, 700 bold, 800 extrabold
```

Load in `app.json`:
```json
{
  "expo": {
    "fonts": [
      { "asset": "./assets/fonts/DMSerifDisplay-Regular.ttf" },
      { "asset": "./assets/fonts/Geist-Regular.ttf" },
      { "asset": "./assets/fonts/Geist-Medium.ttf" },
      { "asset": "./assets/fonts/Geist-SemiBold.ttf" },
      { "asset": "./assets/fonts/Geist-Bold.ttf" },
      { "asset": "./assets/fonts/GeistMono-Regular.ttf" },
      { "asset": "./assets/fonts/NotoSansArabic-Regular.ttf" },
      { "asset": "./assets/fonts/NotoSansArabic-Bold.ttf" }
    ]
  }
}
```

Download Geist from vercel.com/font, DM Serif Display from Google Fonts, Noto Sans Arabic from Google Fonts.

### 7.4 Button Component (React Native port)

Port directly from `frontend/src/components/ui/button.tsx`. All variants and sizes must match exactly:

```typescript
// mobile/components/ui/Button.tsx
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

const variantStyles: Record<ButtonVariant, object> = {
  primary:   { backgroundColor: Colors.amber },           // bg-amber
  secondary: { backgroundColor: Colors.surface2,          // bg-surface-2
               borderWidth: 1, borderColor: Colors.border2 },
  ghost:     { backgroundColor: 'transparent' },
  danger:    { backgroundColor: Colors.error },            // bg-[#8B2E2E]
  outline:   { borderWidth: 1, borderColor: Colors.amber + '66' }, // border-amber/40
};

const variantTextStyles: Record<ButtonVariant, object> = {
  primary:   { color: Colors.ground },   // text-ground
  secondary: { color: Colors.text1 },
  ghost:     { color: Colors.text2 },
  danger:    { color: Colors.text1 },
  outline:   { color: Colors.amber },
};

const sizeStyles: Record<ButtonSize, object> = {
  sm: { height: 28, paddingHorizontal: 12, borderRadius: Radius.sm },  // h-7
  md: { height: 36, paddingHorizontal: 16, borderRadius: Radius.md },  // h-9
  lg: { height: 44, paddingHorizontal: 24, borderRadius: Radius.lg },  // h-11
  icon: { height: 36, width: 36, borderRadius: Radius.md },
};

const sizeTextStyles: Record<ButtonSize, object> = {
  sm: { fontSize: 12 },   // text-xs
  md: { fontSize: 14 },   // text-sm
  lg: { fontSize: 14 },
  icon: { fontSize: 14 },
};
// On press: scale to 0.98 (active:scale-[0.98] from web)
// Focus ring: amber color, offset from ground
// Disabled: opacity 0.4 (disabled:opacity-40 from web)
// Transition: 120ms ease-out-expo
```

### 7.5 Card Component (React Native port)

Port from `frontend/src/components/ui/card.tsx`:

```typescript
// mobile/components/ui/Card.tsx
// variant="default"  → bg-surface border-border rounded-md shadow-sm
// variant="elevated" → same + hover glow (on mobile: press state with amber glow)
// variant="flat"     → no shadow

// CardTitle uses font-display (DM Serif Display)
// CardDescription uses text-sm text-text-2
// CardHeader padding: p-6 (24px)
// CardContent padding: p-6 pt-0
// CardFooter: flex-row items-center p-6 pt-0
```

### 7.6 Component Library — Full List

```
mobile/components/ui/
  Button.tsx        ← port of web button.tsx (all variants exact)
  Card.tsx          ← port of web card.tsx (all variants exact)
  Badge.tsx         ← status pill: success/warning/error/info using semantic colors
  Input.tsx         ← border-border, bg-surface-2, focus border-amber, text-text-1
  Select.tsx        ← native picker with web-matching appearance
  BottomSheet.tsx   ← reanimated modal (replaces web Dialog)
  SyncBanner.tsx    ← amber banner: "X changes pending sync"
  Avatar.tsx        ← company/user initials on surface-2 bg
  EmptyState.tsx    ← centered icon + text-text-2 description
  SkeletonLoader.tsx← bg-surface-2 animated shimmer
  Tabs.tsx          ← horizontal scroll tabs, active=amber underline
  FAB.tsx           ← bg-amber, shadow, bottom-right fixed
  ListItem.tsx      ← bg-surface, border-b border-border, p-4
  SectionHeader.tsx ← text-text-3 uppercase text-xs tracking-widest
  Timeline.tsx      ← vertical line with step dots (amber=active, border=pending)
  PhotoGrid.tsx     ← 3-col grid, add button = dashed border-amber/40
  WeatherCard.tsx   ← surface-2 card with amber icon tint
  OfflineBanner.tsx ← ground bg, border-b border-border, text-text-2
```

### 7.7 Animations (from index.css — port to Reanimated)

```typescript
// Web keyframes → React Native Reanimated equivalents:

// fade-in: opacity 0→1, translateY 8→0, duration 300ms
// slide-in-right: opacity 0→1, translateX 16→0, duration 300ms
// slide-in-left: opacity 0→1, translateX -16→0, duration 300ms
// pulse-highlight: box-shadow pulse with amber/40 — use border color pulse on RN

// Use withTiming(value, { duration: 300, easing: Easing.bezier(0.16, 1, 0.3, 1) })
// for all transitions to match the web's ease-out-expo curve
```

### 7.8 RTL Support (from index.css)

```typescript
// index.css applies:
// [dir="rtl"] { direction: rtl; }
// [lang="ar"] { font-family: 'Noto Sans Arabic', 'Inter', ... }

// Mobile equivalent:
import { I18nManager } from 'react-native';

// On language switch to Arabic:
I18nManager.forceRTL(true);
// Font override: when lang=ar, use Fonts.arabic in all Text components
// All flex rows: use I18nManager.isRTL ? 'row-reverse' : 'row'
// All absolute positions: flip left/right based on isRTL
// Text alignment: auto (respects RTL) — never hardcode 'left'
```

### 7.9 NativeWind Configuration

```javascript
// mobile/tailwind.config.js — mirrors frontend/tailwind.config.ts exactly
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        ground: '#0D0F0E',
        surface: { DEFAULT: '#141716', 2: '#1C1F1D' },
        border: { DEFAULT: '#2A2E2B', 2: '#363B37' },
        amber: { DEFAULT: '#D4920A', dim: '#8A5F06' },
        text: { 1: '#F0EDE8', 2: '#9A9890', 3: '#5C5A55' },
      },
      fontFamily: {
        display: ['DMSerifDisplay'],
        body: ['Geist'],
        mono: ['GeistMono'],
      },
      borderRadius: {
        sm: '4px', DEFAULT: '6px', md: '8px', lg: '12px',
      },
    },
  },
};
// This makes className="bg-ground text-text-1 border-border rounded-md" work
// identically to the web — same class names, same values.
```

### 7.10 Offline UX Patterns
- **OfflineBanner**: thin strip at top of every screen when offline — `bg-ground border-b border-border text-text-2`
- **SyncBanner**: amber — `bg-amber/10 border border-amber/20 text-amber` — shown when `pendingCount > 0`
- **Draft badge**: `Badge variant="warning"` on unsynced log entries
- All lists show WatermelonDB cached data offline — no empty screens ever
- Actions that need network: write locally, show `"Saved. Will sync when online."` toast, proceed
- Retry button on sync error: ghost variant, text-text-2

---

## 8. API INTEGRATION

### 8.1 Axios Instance

```typescript
// mobile/lib/api.ts
import axios from 'axios';
import { getToken, clearToken } from './auth';

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await clearToken();
      // Navigate to login — use event emitter or router
    }
    return Promise.reject(error);
  }
);
```

### 8.2 All API Endpoints Reference

```
AUTH
  POST   /auth/register
  POST   /auth/verify-otp
  POST   /auth/login
  GET    /auth/profile
  PATCH  /users/push-token        body: { pushToken: string }

PROJECTS
  GET    /projects
  POST   /projects
  GET    /projects/:id
  PATCH  /projects/:id
  GET    /projects/:id/sites
  POST   /projects/:id/sites
  GET    /projects/:id/boq
  POST   /projects/:id/boq

RFQS
  GET    /rfqs                    query: status, project_id
  POST   /rfqs
  GET    /rfqs/:id
  PATCH  /rfqs/:id
  DELETE /rfqs/:id
  POST   /rfqs/:id/attachments    multipart
  GET    /rfqs/:id/bids
  POST   /rfqs/:id/bids           (supplier creates bid)
  PATCH  /rfqs/:id/bids/:bidId/award
  PATCH  /rfqs/:id/bids/:bidId/reject  body: { reason: string }

PURCHASE ORDERS
  GET    /purchase-orders         query: status
  POST   /purchase-orders
  GET    /purchase-orders/:id
  PATCH  /purchase-orders/:id/status  body: { status: POStatus }
  POST   /purchase-orders/:id/delivery-notes  multipart
  GET    /purchase-orders/:id/delivery-notes

INVOICES
  GET    /invoices
  GET    /invoices/:id
  GET    /invoices/:id/pdf        → { signedUrl }
  POST   /invoices/:id/payment-proof  multipart

MATERIALS
  GET    /materials               query: category_id, search, page, limit
  GET    /materials/:id
  POST   /materials               (supplier only)
  PATCH  /materials/:id           (supplier only)

DAILY LOGS
  GET    /daily-logs              query: project_id, date
  POST   /daily-logs
  GET    /daily-logs/:id
  PATCH  /daily-logs/:id
  POST   /daily-logs/:id/photos   multipart

WALLETS
  GET    /wallets/company/:companyId
  GET    /wallets/company/:companyId/transactions

NOTIFICATIONS
  GET    /notifications           query: unread, limit
  PATCH  /notifications/:id/read
  PATCH  /notifications/read-all

SYNC
  GET    /sync/pull               query: last_pulled_at (timestamp ms)
  POST   /sync/push               body: WatermelonDB changes payload

SETTINGS
  GET    /settings/:companyId
  PATCH  /settings/:companyId

ADMIN (role: ADMIN only)
  GET    /admin/categories
  POST   /admin/categories
  PATCH  /admin/categories/:id
  DELETE /admin/categories/:id
  GET    /admin/audit-logs

HEALTH
  GET    /health-check
```

---

## 9. STATE MANAGEMENT

### 9.1 Zustand Auth Store

```typescript
// mobile/store/authStore.ts
interface AuthState {
  user: JwtPayload | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
}
```

### 9.2 Zustand Sync Store

```typescript
interface SyncState {
  isSyncing: boolean;
  lastSyncAt: number | null;
  pendingCount: number;
  error: string | null;
  triggerSync: () => Promise<void>;
}
```

### 9.3 TanStack Query Usage
- Use React Query for **all server-only data** (orders, invoices, bids) that isn't in WatermelonDB
- Use WatermelonDB `withObservables` HOC for offline data (projects, sites, daily logs)
- Query keys convention: `['orders', { status: 'OPEN' }]`

---

## 10. PERMISSION HANDLING

Request on first relevant use (not on app launch):

```typescript
// mobile/hooks/usePermissions.ts
export function usePermissions() {
  const requestCamera = () => Camera.requestCameraPermissionsAsync();
  const requestLocation = () => Location.requestForegroundPermissionsAsync();
  const requestNotifications = () => Notifications.requestPermissionsAsync();
  // Always check before use; show friendly explanation if denied
}
```

---

## 11. ENVIRONMENT CONFIGURATION

```env
# mobile/.env (gitignored)
EXPO_PUBLIC_API_URL=https://api.your-domain.com
EXPO_PUBLIC_OPENWEATHER_API_KEY=xxx
```

```json
// app.json / app.config.ts additions
{
  "expo": {
    "plugins": [
      ["expo-camera", { "cameraPermission": "Camera is used to document site progress and deliveries." }],
      ["expo-location", { "locationAlwaysAndWhenInUsePermission": "Location is used to verify site attendance and tag photos." }],
      ["expo-notifications", {}]
    ],
    "ios": {
      "infoPlist": {
        "NSPhotoLibraryUsageDescription": "Save delivery and progress photos."
      }
    }
  }
}
```

---

## 12. SECURITY REQUIREMENTS

1. **JWT stored in `expo-secure-store`** only — never AsyncStorage
2. **WatermelonDB encrypted** with SQLCipher (`@nozbe/watermelondb/native/android/src/main/java/com/nozbe/watermelondb/jsi/WMDatabase.java` encrypted setup)
3. **Photos** auto-deleted from device after successful S3 upload
4. **No sensitive data** in logs (no console.log of tokens/passwords)
5. **Certificate pinning** — optional for production, recommended for sensitive markets
6. **Biometric lock** — optional app lock with Face ID / fingerprint

---

## 13. PERFORMANCE REQUIREMENTS

- App launch to interactive: **< 3 seconds**
- Screen transitions: **< 300ms**
- Sync should not block UI (background thread)
- Photo compression before upload: **< 500KB per image** (use `expo-image-manipulator`)
- List virtualization: use `FlashList` from `@shopify/flash-list` (not FlatList) for all lists
- WatermelonDB uses lazy loading — do not load all records at once

---

## 14. TESTING REQUIREMENTS

```
/mobile/__tests__/
  auth.test.ts
  sync.test.ts
  dailyLog.test.ts
  api.test.ts
```

- Unit test all Zustand store actions
- Unit test sync conflict resolution logic
- Integration test form submission flows
- Use `jest` + `@testing-library/react-native`

---

## 15. ERROR HANDLING PATTERNS

```typescript
// Consistent error handling
try {
  await someAction();
} catch (error) {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message || 'Network error';
    Toast.show({ type: 'error', text1: message });
  } else {
    Toast.show({ type: 'error', text1: 'Unexpected error' });
    console.error(error); // dev only
  }
}
```

Use `react-native-toast-message` for all user-facing feedback.

---

## 16. PUSH NOTIFICATION HANDLING

```typescript
// On login success:
const token = await Notifications.getExpoPushTokenAsync();
await api.patch('/users/push-token', { pushToken: token.data });

// Background handler:
Notifications.addNotificationReceivedListener(notification => {
  // Update notification badge count
  syncStore.getState().triggerSync(); // Sync new data
});

Notifications.addNotificationResponseReceivedListener(response => {
  // Navigate to relevant screen based on notification.data.type
  // e.g., type: 'NEW_BID' → navigate to rfqs/:rfqId
});
```

---

## 17. BUILD & DEPLOYMENT

### Development
```bash
cd mobile
npx expo start
```

### Production Build (EAS Build)
```json
// eas.json
{
  "build": {
    "production": {
      "android": { "buildType": "app-bundle" },
      "ios": { "distribution": "store" }
    },
    "preview": {
      "android": { "buildType": "apk" }
    }
  }
}
```

```bash
eas build --platform all --profile production
eas submit --platform all
```

### Environment per build profile
- `development`: points to local/dev API
- `preview`: points to staging API
- `production`: points to production API

---

## 18. KNOWN BACKEND CONSTRAINTS TO RESPECT

1. **Sync pull** currently only returns `projects` and `sites` — daily logs and notifications are REST-only. Handle accordingly (use React Query for those).
2. **Product push is ignored** by server — never write products from mobile.
3. **Invoice creation** is automatic on PO `DELIVERED` — do not call invoice create manually.
4. **Route ordering bug** in backend: do not call `GET /projects/sites` (would resolve `:id = "sites"`). Always use `GET /projects/:id/sites`.
5. **Company scoping** is enforced server-side — requests for other companies' data return 403.
6. **Throttle limit**: 100 req/min per IP — sync operations count toward this. Implement exponential backoff.
7. **ZATCA compliance** on invoices is backend-only concern. Mobile only needs to display QR.

---

## 19. PHASED DELIVERY

### Phase 1
- Auth (login, OTP, register)
- Dashboard (both roles)
- Daily Logs (full offline-first flow)
- Projects & Sites
- Offline sync (WatermelonDB)
- Push notifications
- Basic UI component library

### Phase 2
- Orders (full lifecycle + POD capture)
- RFQs (contractor: create, compare, award)
- Supplier RFQ feed + bidding
- Marketplace browsing

### Phase 3
- Invoices & Financials
- Wallet view
- Advanced GRN (goods receipt against PO)
- Analytics / reporting
- Arabic RTL full support
- Performance audit & optimization

---

## 20. DEFINITION OF "DONE" (Production-Ready)

A feature is production-ready when:
- [ ] Works fully offline and syncs correctly
- [ ] RTL Arabic display tested
- [ ] Error states handled (network fail, validation, server error)
- [ ] Loading states implemented (skeleton loaders)
- [ ] Empty states implemented
- [ ] Push notification deeplinks work
- [ ] Tested on both iOS and Android
- [ ] No console errors or warnings in production build
- [ ] Accessible (minimum: labels for all interactive elements)
