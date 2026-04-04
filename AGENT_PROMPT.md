# AGENT PROMPT — Construction Connect Mobile App

---

You are building the **React Native (Expo) mobile app** for **Construction Connect** — a B2B construction procurement platform. The backend (NestJS) and web dashboard (React/Vite) are fully built and in production. Your job is to build the mobile app inside the existing monorepo's `/mobile` directory so it shares the same database and data as the web app in real time.

## READ THESE FILES FIRST — IN THIS ORDER

Before writing a single line of code, read these files from the project root. They contain everything you need:

1. `MOBILE_TECH_SPEC.md` — Full technical specification: stack, WatermelonDB schema, all API endpoints, all screens and flows, design system, security rules, performance targets, known backend constraints.
2. `MOBILE_IMPLEMENTATION_PLAN.md` — sprint plan, day-by-day execution order, dependency graph, code snippets, pitfalls, sign-off criteria.
3. `TECHNICAL_DOCUMENTATION.md` — The existing backend API contract (all routes, request/response shapes, auth, roles).
4. `AGENT_QUICK_REF.md` — QUICK-REFERENCE CARD

Do not proceed until you have read all three.

---

## THE THREE NON-NEGOTIABLES

**1. Offline first, always.**
Every single screen must display data and accept user input with no internet connection. Data writes go to WatermelonDB locally first, then sync to the server when connectivity returns. A screen that shows a blank state or throws an error when offline fails QA immediately.

**2. Same design system as the web — zero deviation.**
The mobile app is a sibling of the web dashboard. Users will use both. The design must feel like the same product. Every color, font, corner radius, spacing, and animation is extracted from the existing frontend files. Do not invent new tokens.

**3. Same data, same database.**
A project created on the web dashboard must appear on mobile. An order marked delivered on mobile must update the web dashboard. This works via the existing `/sync/pull` and `/sync/push` endpoints using WatermelonDB's `synchronize()` function — use it exactly as documented.

---

## DESIGN SYSTEM — EXACT VALUES (from frontend source files)

Do not use any color, font, or radius value that isn't in this list.

### Colors
```
ground:     #0D0F0E    ← deepest background (root screens)
surface:    #141716    ← card / panel background
surface-2:  #1C1F1D    ← elevated surface (modals, inputs, dropdowns)
border:     #2A2E2B    ← default border
border-2:   #363B37    ← active / stronger border
amber:      #D4920A    ← PRIMARY ACTION COLOR (buttons, active tabs, focus rings)
amber-dim:  #8A5F06    ← amber hover on dark surfaces
amber-hover:#E0A020    ← button hover state
text-1:     #F0EDE8    ← primary text (headings, labels, values)
text-2:     #9A9890    ← secondary text (descriptions, meta, subtitles)
text-3:     #5C5A55    ← tertiary text (placeholders, timestamps, disabled)
error-bg:   #8B2E2E    ← danger button background
```

Semantic status colors (for badges and tags — not in tailwind config, derive from above):
```
success:    background #3A7D44, text #7EC893
warning:    background #8A5F06 (amber-dim), text #D4920A (amber)
error:      background #8B2E2E, text #F0A0A0
info:       background #2A4A6B, text #7EB8E0
```

### Typography
```
font-display:  DM Serif Display   ← screen titles, card titles (CardTitle in web)
font-body:     Geist              ← all UI text, buttons, inputs, descriptions
font-mono:     Geist Mono         ← IDs, codes, numbers
font-arabic:   Noto Sans Arabic   ← override for lang="ar"
```
Download: Geist from vercel.com/font. DM Serif Display and Noto Sans Arabic from Google Fonts.

### Corner Radius
```
sm:  4px    ← small chips, small buttons
md:  6px    ← default buttons, inputs
lg:  8px    ← cards, modals, medium containers
xl:  12px   ← large cards, sheets
```

### Easing & Duration
```
Primary easing: cubic-bezier(0.16, 1, 0.3, 1)  ← "out-expo" — use for all transitions
Button transition: 120ms
Card hover: 200ms
Screen animation: 300ms
Reanimated: Easing.bezier(0.16, 1, 0.3, 1)
```

### NativeWind tailwind.config.js (copy exactly into /mobile/tailwind.config.js)
```javascript
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
```
This makes `className="bg-ground text-text-1 border-border rounded-md"` work on mobile identically to the web.

### Button Variants (port from frontend/src/components/ui/button.tsx)
```
primary:   bg-amber, text-ground, hover bg-[#E0A020]
secondary: bg-surface-2, text-text-1, border border-2, hover border-amber/40
ghost:     transparent bg, text-text-2, hover text-text-1 bg-surface-2
danger:    bg-[#8B2E2E], text-[#F0EDE8]
outline:   border border-amber/40, text-amber

Sizes:
sm:   height 28, px 12, text-xs (12px), radius-sm
md:   height 36, px 16, text-sm (14px), radius (6px)  ← default
lg:   height 44, px 24, text-sm (14px), radius-md (8px)
icon: 36×36, radius (6px)

All buttons: active press → scale 0.98 (reanimated withSpring)
Disabled: opacity 0.4
Focus ring: amber color
```

### Card Variants (port from frontend/src/components/ui/card.tsx)
```
default:  bg-surface, border-border, rounded-md, shadow-sm
elevated: default + press state with amber border glow
flat:     no shadow

CardTitle:       font-display, text-text-1
CardDescription: text-sm, text-text-2
CardHeader:      padding 24px
CardContent:     padding 24px, no top padding
CardFooter:      flex-row items-center, padding 24px, no top padding
```

---

## ARCHITECTURE RULES

### Auth
- JWT stored ONLY in `expo-secure-store`. Never AsyncStorage.
- Attach as `Authorization: Bearer <token>` on all requests via Axios interceptor.
- JWT payload shape: `{ sub, email, companyId, role: 'CONTRACTOR'|'SUPPLIER'|'ADMIN', companyCountry? }`
- On 401: clear SecureStore token, redirect to login.
- After login: register Expo push token via `PATCH /users/push-token` with body `{ push_token: string }`.

### WatermelonDB Sync
- Use `synchronize()` from `@nozbe/watermelondb/sync`.
- Pull endpoint: `GET /sync/pull?last_pulled_at=<ms>` — returns `{ changes: { projects, sites }, timestamp }`
- Push endpoint: `POST /sync/push?last_pulled_at=<ms>` — body: `{ changes: { daily_logs, ... } }`
- `last_pulled_at` is in **milliseconds**.
- Trigger sync: on app foreground, on network reconnect, after every form submit, every 5 min.
- Photos are NOT synced via WatermelonDB. Use a separate upload queue: capture → save to expo-file-system → upload to `POST /daily-logs/photos` (multipart) → update record with s3_url.

### What lives in WatermelonDB (offline tables)
- projects, sites, daily_logs, log_photos, notifications

### What is REST-only (React Query, no local DB)
- purchase-orders, rfqs, bids, invoices, materials, wallets, companies

### Critical backend rules
- `GET /projects/sites` does NOT exist — always use `GET /projects/:id` to get a project, sites are embedded or fetched separately via the site endpoints documented in the spec.
- Products pushed from mobile are **ignored by the server** — never write product records from mobile.
- Invoices are **auto-created by the backend** when a PO reaches DELIVERED — never call invoice create from mobile.
- Throttle: 100 req/min per IP — batch sync, use exponential backoff on retry.
- Company scoping is server-enforced — never attempt to fetch another company's data.

---

## SCREENS TO BUILD (priority order)

### Phase 1 — Build first
1. **Auth**: Login, Register, OTP Verify
2. **Dashboard**: Role-aware summary cards (contractor vs supplier)
3. **Daily Log (NEW)**: Multi-step wizard — overview/attendance/progress/materials. This is the primary mobile feature. Must work fully offline. Save as DRAFT locally, submit when ready.
4. **Daily Log List**: Grouped by date, status indicators (DRAFT/SUBMITTED/SYNCED)
5. **Projects List + Detail**: From WatermelonDB, offline
6. **Sync infrastructure**: SyncBanner, OfflineBanner, background sync

### Phase 2 — Build second
7. **Orders List + Detail**: Status timeline, role-based actions
8. **Proof of Delivery (POD)**: Photo capture + items checklist → POST delivery-notes
9. **RFQ List + Detail** (contractor): Compare bids, award/reject
10. **RFQ Feed** (supplier): Browse open RFQs, submit bids
11. **Marketplace**: Browse materials catalog

### Phase 3 — Build third
12. **Invoices + Financials**
13. **Wallet**: Balance + transaction history
14. **Notifications**: Full center with deeplinks
15. **Profile + Settings**: Language toggle, sync status, sign out

---

## TAB NAVIGATION (role-aware)

```
CONTRACTOR tabs: Dashboard | Site Logs | Orders | RFQs | Notifications
SUPPLIER tabs:   Dashboard | Orders | RFQ Feed | Notifications
ADMIN tabs:      All tabs
```

All tab icons use `@expo/vector-icons` (Ionicons or Feather). Active tab: amber tint. Inactive: text-3.

---

## COMPONENT BUILD ORDER

Build in this exact sequence. Each depends on the previous:

```
1. constants/theme.ts          ← all color/spacing/radius/font tokens
2. mobile/tailwind.config.js   ← NativeWind config (exact copy of web config)
3. lib/auth.ts                 ← SecureStore: getToken/setToken/clearToken
4. lib/api.ts                  ← Axios instance with Bearer interceptor + 401 handler
5. models/schema.ts            ← WatermelonDB schema (all tables)
6. models/*.ts                 ← WatermelonDB model classes
7. lib/watermelon.ts           ← Database instance
8. lib/sync.ts                 ← synchronize() wrapper
9. store/authStore.ts          ← Zustand: user, token, login, logout
10. store/syncStore.ts         ← Zustand: isSyncing, pendingCount, lastSyncAt
11. components/ui/Button.tsx   ← exact port of web button
12. components/ui/Card.tsx     ← exact port of web card
13. components/ui/Badge.tsx    ← status pills
14. components/ui/Input.tsx    ← form input
15. components/ui/SkeletonLoader.tsx
16. components/ui/EmptyState.tsx
17. components/sync/SyncBanner.tsx
18. components/sync/OfflineBanner.tsx
19. app/_layout.tsx            ← root layout: providers stack
20. app/(auth)/_layout.tsx     ← auth stack
21. app/(auth)/login.tsx
22. app/(auth)/register.tsx
23. app/(auth)/verify-otp.tsx
24. app/(app)/_layout.tsx      ← role-aware tab navigator
25. app/(app)/index.tsx        ← dashboard
26. (continue per screen list above)
```

---

## DAILY LOG FORM — DETAILED SPEC (most complex screen)

This is a wizard with 4 tabs. All data saves to WatermelonDB instantly on each step change.

**Tab 1 — Overview**
- Project selector: searchable dropdown from WatermelonDB projects query
- Site selector: filtered list based on selected project (from WatermelonDB sites)
- Date: defaults today, DatePicker (no future dates)
- Weather section: "Fetch Weather" button (calls OpenWeatherMap with GPS coords), shows temp/humidity/wind/condition. If offline: manual numeric inputs
- Status shows: DRAFT badge until submitted

**Tab 2 — Attendance**
- "Add Entry" button opens bottom sheet:
  - Company name text input (or select from recent)
  - Trade dropdown: Carpenter, Mason, Electrician, Plumber, Painter, Laborer, Other
  - Headcount: numeric, min 1, max 500
  - Hours: numeric, min 0.5, max 24
- Running list of entries: swipe-left to delete
- Footer shows total: "X workers · Y worker-hours"
- Validation: reject if hours > 24 × headcount

**Tab 3 — Progress**
- Multiline text input for progress notes (max 500 chars, char counter)
- Photo section:
  - Camera button (expo-camera): launches in-app camera
  - On capture: compress to <500KB with expo-image-manipulator, save to expo-file-system, create log_photos WatermelonDB record with local_path, gps_lat/long (expo-location), uploaded=false
  - Grid shows captured photos (3-col, 80px each): tap = full-screen viewer, long-press = delete
  - Max 10 photos per log
  - Upload queue: when online, POST to /daily-logs/photos (multipart), update record s3_url, mark uploaded=true, delete local file

**Tab 4 — Materials (GRN)**
- "Receive Against PO" button: fetches open POs for this project via React Query
- For selected PO: show items list with ordered qty and "received qty" numeric input
- "Ad-hoc entry" option: free-text material name + quantity + unit
- Photo of delivery ticket (same camera flow as Tab 3)

**Save/Submit behavior:**
- Every tab change: auto-save current data to WatermelonDB (status: DRAFT)
- "Save Draft" button: explicit save, stay on screen, show toast "Draft saved"
- "Submit" button (final tab): set status=SUBMITTED, attempt sync immediately, if offline set status=SUBMITTED and show "Will sync when online", navigate back to list
- Once synced: status → SYNCED, DRAFT/SUBMITTED badge disappears

---

## PROOF OF DELIVERY FLOW — DETAILED SPEC

Triggered from an order with status `OUT_FOR_DELIVERY`.

1. **Items step**: Show PO items list. For each: ordered qty (read-only) + "Received qty" numeric input. All must be filled.
2. **Photo step**: Required photo of delivered materials. Same camera flow as daily log. Min 1 photo.
3. **Confirm step**: Summary of received items + photo thumbnail. "Confirm Delivery" button.
4. **Submit**: `POST /purchase-orders/:id/delivery-notes` with multipart: items JSON array + pod_photo file.
5. Backend advances order to DELIVERED automatically. Invoice auto-created.
6. Navigate back to orders list, show success toast.
7. Offline: save locally, queue for sync, show "Will submit when online".

---

## RTL / ARABIC RULES

Matches web: `[dir="rtl"]` + `[lang="ar"]` from index.css.

```typescript
// On language switch to Arabic:
I18nManager.forceRTL(true);
// Restart app (Expo Updates or alert user to restart)

// In components:
const isRTL = I18nManager.isRTL;
flexDirection: isRTL ? 'row-reverse' : 'row'
textAlign: 'auto'  // never hardcode 'left' or 'right'

// Font: when lang=ar, use Fonts.arabic (Noto Sans Arabic) in all Text components
// Currency: companyCountry === 'SA' → 'SAR', companyCountry === 'EG' → 'EGP'
// from JWT payload: user.companyCountry
```

---

## ENVIRONMENT VARIABLES

```env
# mobile/.env
EXPO_PUBLIC_API_URL=https://your-api-domain.com
EXPO_PUBLIC_OPENWEATHER_API_KEY=your_key_here
```

Never hardcode these. Never commit .env to git.

---

## SIGN-OFF CHECKLIST PER FEATURE

Before marking any feature complete, verify all of these:

- [ ] Works fully with phone in airplane mode (offline test)
- [ ] Data appears on web dashboard after sync (shared DB test)
- [ ] Loading state shows skeleton loaders (not spinner-only)
- [ ] Empty state shows illustration + helpful message + action button
- [ ] Error state shows message + retry button
- [ ] Offline state shows cached data (never blank)
- [ ] Tested with CONTRACTOR account AND SUPPLIER account
- [ ] RTL layout doesn't break (flip phone to RTL in device settings)
- [ ] No hardcoded strings (all text through i18n)
- [ ] No console.log in production paths
- [ ] No AsyncStorage usage for tokens

---

## IF YOU GET STUCK

1. API contract unclear → read `TECHNICAL_DOCUMENTATION.md` section 6
2. Sync behavior unclear → read `MOBILE_TECH_SPEC.md` section 5
3. Component design unclear → look at `frontend/src/components/ui/` source files — port directly
4. Screen flow unclear → read `MOBILE_TECH_SPEC.md` section 6
5. Build order unclear → follow the component build order list above exactly

When in doubt: **write to WatermelonDB first, sync later.**
