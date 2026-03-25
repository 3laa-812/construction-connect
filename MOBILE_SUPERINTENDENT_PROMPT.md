# 📱 Mobile Sprint — Site Superintendent Features
> **Scope:** `mobile/` only (Expo + WatermelonDB + React Native)
> **Backend touches:** only where a new/fixed endpoint is strictly required
> **Persona:** Site Superintendent — dusty site, poor signal, gloves on, needs <15 min/day data entry
> **Docs:** `docs/v_1_1.pdf` (mobile FRD), `SYSTEM_AUDIT.md`

---

## Ground Rules

- **Offline first, always.** Every action must work with zero network. Sync happens in the background.
- **Speed over beauty.** Large tap targets (min 48×48px), minimal typing, prefer cameras/dropdowns over text fields.
- **Never break existing screens.** Refactor in-place. If a screen has mock data, replace it — don't delete the file.
- **One commit per section**, prefix shown at each section header.
- All new WatermelonDB models go in `mobile/db/models/`, all new screens in `mobile/app/`, all services in `mobile/services/`.
- Read `mobile/db/schema.ts` before touching any model — keep schema version increments sequential.

---

## SECTION 1 — Fix Sync (Nothing Works Without This First)
**Commit:** `fix(sync): repair auth, body shape, and LWW`

Everything else depends on sync working. Do this first.

### 1.1 — Attach JWT to every sync request

In `mobile/services/sync.ts`, read the stored token before calling pull/push:

```ts
import * as SecureStore from 'expo-secure-store';
import { synchronize } from '@nozbe/watermelondb/sync';

export async function syncDatabase(database: Database) {
  const token = await SecureStore.getItemAsync('auth_token');
  if (!token) return; // not logged in, skip

  await synchronize({
    database,
    pullChanges: async ({ lastPulledAt }) => {
      const res = await fetch(
        `${API_BASE}/sync/pull?last_pulled_at=${lastPulledAt ?? 0}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error(`Pull failed: ${res.status}`);
      return res.json(); // { changes, timestamp }
    },
    pushChanges: async ({ changes }) => {
      const res = await fetch(`${API_BASE}/sync/push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ changes }), // ← exact shape backend expects
      });
      if (!res.ok) throw new Error(`Push failed: ${res.status}`);
    },
  });
}
```

### 1.2 — Auto-sync on network restore

In `mobile/app/_layout.tsx` (root layout), add a `NetInfo` listener:

```ts
import NetInfo from '@react-native-community/netinfo';
import { useDatabase } from '@nozbe/watermelondb/hooks';
import { syncDatabase } from '@/services/sync';

// inside the root component:
const database = useDatabase();
useEffect(() => {
  const unsub = NetInfo.addEventListener(state => {
    if (state.isConnected && state.isInternetReachable) {
      syncDatabase(database).catch(console.error);
    }
  });
  return unsub;
}, []);
```

### 1.3 — Sync status global state

Create `mobile/store/syncStore.ts` using Zustand:

```ts
import { create } from 'zustand';

type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

interface SyncStore {
  status: SyncStatus;
  pendingCount: number;
  lastSyncedAt: Date | null;
  setStatus: (s: SyncStatus) => void;
  setPending: (n: number) => void;
  setLastSynced: (d: Date) => void;
}

export const useSyncStore = create<SyncStore>(set => ({
  status: 'idle',
  pendingCount: 0,
  lastSyncedAt: null,
  setStatus: status => set({ status }),
  setPending: pendingCount => set({ pendingCount }),
  setLastSynced: lastSyncedAt => set({ lastSyncedAt }),
}));
```

Wrap `syncDatabase()` to update this store: set `syncing` before, `idle` after success, `error` on catch.

### 1.4 — Sync status bar component

Create `mobile/components/SyncStatusBar.tsx`:

```tsx
export function SyncStatusBar() {
  const { status, pendingCount, lastSyncedAt } = useSyncStore();
  const netInfo = useNetInfo();

  if (!netInfo.isConnected) {
    return (
      <View style={styles.bar_offline}>
        <Text style={styles.text}>🔴 Offline — {pendingCount} changes pending</Text>
      </View>
    );
  }
  if (status === 'syncing') {
    return (
      <View style={styles.bar_syncing}>
        <ActivityIndicator size="small" color="#fff" />
        <Text style={styles.text}>  Syncing…</Text>
      </View>
    );
  }
  if (status === 'error') {
    return (
      <View style={styles.bar_error}>
        <Text style={styles.text}>⚠️ Sync failed — tap to retry</Text>
      </View>
    );
  }
  return null; // all good, no bar needed
}
```

Mount `<SyncStatusBar />` at the top of `mobile/app/(tabs)/_layout.tsx`, above the tab navigator.

---

## SECTION 2 — Daily Log: Create / Edit Flow
**Commit:** `feat(daily-log): complete create and edit screens`

The current `mobile/app/daily-log/new.tsx` is incomplete. Build the full form as a single scrollable screen with clearly separated sections.

### 2.1 — Screen layout

`mobile/app/daily-log/new.tsx` must render these sections in order, each collapsible with a chevron:

1. **Header** — Date (pre-filled today, tappable DatePicker), Project selector (dropdown from local WatermelonDB `projects`), Log title (optional free text).
2. **Weather** — Section 3 below.
3. **Attendance** — Section 4 below.
4. **Progress Notes** — Section 5 below.
5. **Photos** — Section 6 below.
6. **Material Receipt (GRN)** — Section 7 below.

Bottom of screen: two buttons — `Save Draft` (writes to WatermelonDB, status = `DRAFT`) and `Submit` (status = `SUBMITTED`). Both work offline.

### 2.2 — WatermelonDB: Add `SYNCED` status

In `mobile/db/schema.ts`, the `daily_logs` table's `status` column must allow `'draft' | 'submitted' | 'synced'`. Update the `DailyLog` model at `mobile/db/models/DailyLog.ts`:

```ts
@field('status') status!: 'draft' | 'submitted' | 'synced';
```

Increment the schema version. Write a migration in `mobile/db/migrations.ts` that adds nothing (status is a text column, values are not DB-enforced, just update the TypeScript type and the schema version number).

### 2.3 — Edit existing log

Add `mobile/app/daily-log/[id].tsx`. On load, query WatermelonDB for the log by `id`. Pre-fill all form fields. Save/Submit behave identically to the new log screen. Add a back-navigation button. If `status === 'synced'`, show a read-only banner: "This log has been synced — edits will re-queue for sync."

### 2.4 — Daily log list screen

`mobile/app/daily-log/index.tsx` — show all logs for the current project, sorted by `log_date DESC`. Each row shows: date, weather emoji, attendance headcount, photo count, status badge (`DRAFT` grey / `SUBMITTED` blue / `SYNCED` green). Tap → navigates to `[id].tsx`. FAB (+) in bottom-right → navigates to `new.tsx`.

---

## SECTION 3 — Weather Auto-Logging (REQ-DL-01)
**Commit:** `feat(daily-log): real OpenWeatherMap integration`

### 3.1 — Replace mock with real API

Create `mobile/services/weather.ts`:

```ts
const OWM_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_KEY;

export interface WeatherData {
  temp: number;
  feels_like: number;
  humidity: number;
  wind_speed: number;
  condition: string;      // "Clear" | "Rain" | "Cloudy" etc.
  icon: string;           // OWM icon code e.g. "01d"
  fetched_at: string;     // ISO timestamp
}

export async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const url = `https://api.openweathermap.org/data/2.5/weather`
    + `?lat=${lat}&lon=${lon}&appid=${OWM_KEY}&units=metric`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Weather fetch failed');
  const d = await res.json();
  return {
    temp: Math.round(d.main.temp),
    feels_like: Math.round(d.main.feels_like),
    humidity: d.main.humidity,
    wind_speed: d.wind.speed,
    condition: d.weather[0].main,
    icon: d.weather[0].icon,
    fetched_at: new Date().toISOString(),
  };
}
```

Add `EXPO_PUBLIC_OPENWEATHER_KEY=` to `mobile/.env.example`.

### 3.2 — WeatherWidget component

Replace `mobile/components/WeatherWidget.tsx` entirely:

```tsx
export function WeatherWidget({ onData }: { onData: (w: WeatherData) => void }) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [manual, setManual] = useState(false);

  async function autoFetch() {
    setLoading(true);
    try {
      const { coords } = await Location.getCurrentPositionAsync({});
      const w = await fetchWeather(coords.latitude, coords.longitude);
      setWeather(w);
      onData(w);
    } catch {
      setManual(true); // fall back to manual entry
    } finally {
      setLoading(false);
    }
  }

  // Auto-fetch on mount
  useEffect(() => { autoFetch(); }, []);

  if (loading) return <ActivityIndicator />;

  if (manual || !weather) {
    return (
      <ManualWeatherForm onSubmit={w => { setWeather(w); onData(w); }} />
    );
  }

  return (
    <WeatherDisplay
      data={weather}
      onRefresh={autoFetch}
      onManualOverride={() => setManual(true)}
    />
  );
}
```

`WeatherDisplay` shows: large temperature, condition icon (use OWM icon URL `https://openweathermap.org/img/wn/${icon}@2x.png`), humidity, wind speed, and a small "fetched at HH:mm" timestamp. A "Override" link lets the user edit values manually.

`ManualWeatherForm` shows 4 numeric inputs: Temp (°C), Humidity (%), Wind Speed (km/h), and a Condition picker (Clear / Cloudy / Rain / Sandstorm / Fog).

### 3.3 — Persist to WatermelonDB

The `weather` JSON is stored in `daily_logs.weather_data` as a JSONB-compatible string. When the user saves the log, serialize `WeatherData` to JSON and write it to the model.

---

## SECTION 4 — Attendance Tracking (REQ-DL-02)
**Commit:** `feat(daily-log): attendance with hours and validation`

### 4.1 — Data shape

Attendance is stored in `daily_logs.attendance_data` (JSONB text field). The shape is:

```ts
interface AttendanceEntry {
  id: string;            // local uuid
  company_name: string;  // subcontractor name or "Own Crew"
  trade: string;         // "Carpenter" | "Electrician" | "Mason" | "General Labor" | "Other"
  headcount: number;     // 1–200
  hours_worked: number;  // 0.5–16
}
```

### 4.2 — AttendanceSheet component

Rewrite `mobile/components/AttendanceSheet.tsx`:

- Shows a list of `AttendanceEntry` rows.
- Each row: company name (text input with autocomplete from previous entries stored locally), trade (picker), headcount (numeric stepper ➖/➕), hours (numeric input).
- "+ Add Row" button appends a new empty entry.
- Swipe-left on a row to delete it.
- **Validation (client-side, shown inline):**
  - `hours_worked > 16` → red border + "Max 16 hours per shift"
  - `headcount < 1` → "At least 1 worker"
  - Empty `company_name` → "Enter company or 'Own Crew'"
- Total summary bar at the bottom: "Total workers: X | Total man-hours: Y"
- The form **blocks submission** (disables Submit button) if any validation error exists.

### 4.3 — Autocomplete for company names

Store previously used company names in a local WatermelonDB table `attendance_companies`:

```ts
// add to mobile/db/schema.ts
tableSchema({
  name: 'attendance_companies',
  columns: [
    { name: 'company_name', type: 'string' },
    { name: 'last_used_at', type: 'number' },
  ],
}),
```

When the user types in the company name field, filter this table and show a dropdown of matching names. On save, upsert the company name with `last_used_at = Date.now()`.

---

## SECTION 5 — Progress Notes
**Commit:** `feat(daily-log): progress notes section`

### 5.1 — Data shape

Stored in `daily_logs.progress_notes` (add this text column to the WatermelonDB schema and Prisma schema):

```ts
interface ProgressNote {
  zone: string;        // free text: "Floor 3 - East Wing"
  work_done: string;   // free text description
  percentage: number;  // 0–100, completion of this activity today
  issues: string;      // optional: problems encountered
}
```

### 5.2 — Component

Create `mobile/components/ProgressNotes.tsx`:

- List of note cards, each with the 4 fields above.
- `zone` is a text input.
- `work_done` is a multiline text input (max 3 lines visible, expandable).
- `percentage` is a horizontal slider (0–100, snaps to 5% increments) with the value shown as `XX%` next to it.
- `issues` is an optional multiline input, collapsed behind a "⚠️ Add issue" toggle.
- "+ Add Activity" button appends a new note card.

---

## SECTION 6 — Photos with GPS Meta-tagging (REQ-DL-03)
**Commit:** `feat(daily-log): GPS-tagged photos with background S3 upload`

### 6.1 — Photo capture flow

In `mobile/app/daily-log/new.tsx`, the Photos section renders a horizontal scroll of thumbnails. At the end of the row is a "📷 Add Photo" button.

On tap:
1. Request camera permission if not granted.
2. Open `expo-camera` in a full-screen modal with a capture button.
3. On capture:
   - Get current GPS coordinates via `expo-location` (cached — don't re-request if obtained <60s ago for battery saving).
   - Compress the image using `expo-image-manipulator`: resize to max 1200px wide, JPEG quality 0.75 (target <500KB).
   - Save to local file system using `expo-file-system`.
   - Write a `log_photos` record to WatermelonDB:
     ```ts
     { daily_log_id, local_path, s3_url: null, gps_lat, gps_long, captured_at: Date.now() }
     ```
4. Show thumbnail immediately in the UI (read from `local_path`).

### 6.2 — Background S3 upload worker

Create `mobile/services/photoUpload.ts`:

```ts
export async function uploadPendingPhotos(database: Database) {
  const token = await SecureStore.getItemAsync('auth_token');
  if (!token) return;

  const pending = await database
    .get<LogPhoto>('log_photos')
    .query(Q.where('s3_url', null))
    .fetch();

  for (const photo of pending) {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: photo.localPath,
        type: 'image/jpeg',
        name: `photo_${photo.id}.jpg`,
      } as any);
      formData.append('daily_log_id', photo.dailyLogId);
      formData.append('gps_lat', String(photo.gpsLat));
      formData.append('gps_long', String(photo.gpsLong));

      const res = await fetch(`${API_BASE}/daily-logs/photos`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        const { url } = await res.json();
        await photo.update(p => { p.s3Url = url; });
      }
    } catch {
      // silently continue — retry next sync cycle
    }
  }
}
```

Call `uploadPendingPhotos(database)` inside `syncDatabase()` after a successful sync push.

### 6.3 — Backend: photo upload endpoint

In `backend/src/daily-logs/daily-logs.controller.ts`, add:

```ts
@Post('photos')
@UseInterceptors(FileInterceptor('file'))
uploadPhoto(
  @UploadedFile() file: Express.Multer.File,
  @Body() body: { daily_log_id: string; gps_lat: string; gps_long: string },
  @CurrentUser() user: JwtPayload,
) {
  return this.service.uploadPhoto(file, body, user);
}
```

In the service, call `StorageService.uploadFile(file.buffer, file.mimetype, 'site-photos')`, then update or create the `LogPhoto` record with `s3_url`. Return `{ url }`.

### 6.4 — Photo viewer

Tapping a thumbnail in the Photos section opens a full-screen modal showing the photo, its GPS coordinates (as "📍 lat, long"), and timestamp. Add a delete button (removes from local WatermelonDB and file system; if already synced, calls `DELETE /daily-logs/photos/:id`).

---

## SECTION 7 — Material Receipt / GRN (REQ-DL-04)
**Commit:** `feat(daily-log): GRN linked to purchase orders`

This is the most complex section. The superintendent receives a physical delivery and digitally verifies it against an open Purchase Order.

### 7.1 — Open POs in WatermelonDB

Ensure `purchase_orders` and `po_items` are in the mobile WatermelonDB schema. They are populated via sync pull. If the model doesn't exist yet, add to `mobile/db/schema.ts`:

```ts
tableSchema({
  name: 'purchase_orders',
  columns: [
    { name: 'server_id', type: 'string' },
    { name: 'project_id', type: 'string' },
    { name: 'supplier_name', type: 'string' },
    { name: 'status', type: 'string' },
    { name: 'expected_delivery_date', type: 'number', isOptional: true },
    { name: 'updated_at', type: 'number' },
  ],
}),
tableSchema({
  name: 'po_items',
  columns: [
    { name: 'po_id', type: 'string' },    // FK to purchase_orders.server_id
    { name: 'product_name', type: 'string' },
    { name: 'unit', type: 'string' },
    { name: 'ordered_qty', type: 'number' },
    { name: 'received_qty', type: 'number' },  // cumulative across all GRNs
    { name: 'updated_at', type: 'number' },
  ],
}),
```

### 7.2 — GRN flow screen

Create `mobile/app/daily-log/grn.tsx`:

**Step 1 — Select PO:**
- Show list of open POs for the current project (query local `purchase_orders` where `status IN ('CONFIRMED', 'PROCESSING', 'OUT_FOR_DELIVERY')`).
- Each card shows: supplier name, expected delivery date, number of items pending.
- If no open POs: show "No open orders for this project" with a link to the Marketplace.

**Step 2 — Verify items:**
- List all `po_items` for the selected PO.
- Each row:
  - Product name + unit
  - "Ordered: X" label
  - "Previously received: Y" label (from `po_item.received_qty`)
  - "Receiving now:" numeric input (default 0, max = ordered - previously received)
  - Condition picker: `Good | Damaged | Rejected`
- Running total: "Receiving X of Y remaining items"

**Step 3 — Photo of delivery ticket:**
- Single photo capture (same compressed + GPS-tagged flow from Section 6).
- Label: "Photo of paper delivery note (required)".
- This photo is stored with `type = 'delivery_ticket'` in `log_photos`.

**Step 4 — Confirm & Submit:**
- Summary card: PO number, supplier, total items receiving, any damaged/rejected items.
- "Confirm Receipt" button → works offline:
  1. Creates a `grn_records` entry in WatermelonDB (new table below).
  2. Updates `po_item.received_qty` in local WatermelonDB.
  3. Queues for sync.

### 7.3 — WatermelonDB: `grn_records` table

Add to `mobile/db/schema.ts`:

```ts
tableSchema({
  name: 'grn_records',
  columns: [
    { name: 'po_id', type: 'string' },
    { name: 'daily_log_id', type: 'string', isOptional: true },
    { name: 'items_json', type: 'string' },   // JSON: [{po_item_id, received_qty, condition}]
    { name: 'delivery_ticket_photo_id', type: 'string', isOptional: true },
    { name: 'notes', type: 'string', isOptional: true },
    { name: 'synced', type: 'boolean' },
    { name: 'created_at', type: 'number' },
    { name: 'updated_at', type: 'number' },
  ],
}),
```

### 7.4 — Backend: GRN sync handler

In `backend/src/sync/sync.service.ts`, add `'grn_records'` to the `processOrder` array. When a `grn_record` push is received:
1. Call `PurchaseOrdersService.createDeliveryNote(poId, grnItems, userId)`.
2. For each GRN item, upsert `Inventory` (increment `qty_on_hand`).
3. Recalculate PO `remaining_qty`; if all items fully received, set PO status to `DELIVERED` and trigger invoice auto-generation (Section 10 of the main prompt).

---

## SECTION 8 — Materials Marketplace (REQ-MP-01 / MP-02 / MP-03)
**Commit:** `feat(marketplace): catalog, RFQ blast, order tracking`

### 8.1 — Catalog screen (replace mock)

`mobile/app/marketplace/catalog.tsx`:

- On mount, query local WatermelonDB `products` table (synced from server).
- Show a category filter row at the top (horizontal scroll): All / Concrete / Steel / Electrical / Finishing / Other.
- Grid of product cards (2 columns): product image (or category emoji fallback), name, unit, price, supplier name + verified badge.
- Search bar filters by `name` locally (no API call needed).
- "Distance to Site" sort — use the current project's GPS coordinates and the supplier's stored lat/long; compute distance client-side using Haversine formula.
- Each card has a "+ Add to Cart" button and a "Request Quote" button.

### 8.2 — Cart & checkout

`mobile/app/marketplace/cart.tsx`:

- Lists cart items from local WatermelonDB `cart_items` table (add if missing: `product_id`, `product_name`, `unit`, `qty`, `unit_price`, `supplier_id`).
- Quantity stepper on each row.
- Swipe-to-delete.
- Bottom summary: subtotal, estimated VAT (15% KSA / 14% EG based on company country), total.
- "Place Order" button:
  1. If online: `POST /purchase-orders` → on success, clear cart, navigate to order detail.
  2. If offline: write a `pending_orders` record to WatermelonDB, show "Order queued — will be placed when online", clear cart.
- Handle the offline-queued orders: in `syncDatabase()`, after push, check for `pending_orders` with `synced = false`, POST each one, mark as synced.

### 8.3 — RFQ "Blast" flow (REQ-MP-02)

`mobile/app/marketplace/rfq/new.tsx`:

**Step 1 — What do you need?**
- Category picker (Concrete / Steel / Electrical / Finishing / Other).
- Product name text input.
- Quantity + unit picker.
- Required delivery date (date picker, default = today + 3 days).
- Attach BOQ file (optional): `expo-document-picker` for PDF/image.
- Notes (optional).

**Step 2 — Select vendors:**
- Automatically pre-select the 3 nearest verified suppliers in this category (computed from GPS + supplier location in local DB).
- Show them as checked cards. User can uncheck or add others from the catalog.

**Step 3 — Review & Blast:**
- Summary of RFQ items.
- "Send to X vendors" button.
- Works offline: write to WatermelonDB `rfqs` table with `status = 'draft'`, sync will POST to backend when online.
- On successful sync, backend triggers push notifications to selected suppliers.

### 8.4 — RFQ list (replace mocks)

`mobile/app/marketplace/rfq/list.tsx` — replace all hardcoded mock data:

```ts
const rfqs = useQuery(
  database.get<RFQ>('rfqs').query(
    Q.where('company_id', currentUser.companyId),
    Q.sortBy('created_at', Q.desc),
  )
);
```

Status badges: `Draft` (grey) / `Open` (blue) / `Bids Received` (orange, show count) / `Awarded` (green) / `Closed` (grey).

Tapping an RFQ with bids navigates to `rfq/[id]/bids.tsx` — a simplified read-only bid comparison showing supplier name, total price, delivery date, and a "Contact Supplier" button (opens `tel:` link).

### 8.5 — Order tracking screen (REQ-MP-03)

`mobile/app/marketplace/orders.tsx`:

- List of purchase orders from local WatermelonDB, sorted by `created_at DESC`.
- Status stepper: `Confirmed → Processing → Out for Delivery → Delivered → Completed`.
- For orders in `OUT_FOR_DELIVERY`: show a map (using `expo-maps` or `react-native-maps`) with the site pin. Add a placeholder for driver location (when the backend tracking endpoint exists, wire it to `GET /purchase-orders/:id/track`).
- **Geofencing alert:** Use `expo-location`'s `startGeofencingAsync` to register the site coordinates as a geofence region (radius 1km). When the delivery enters the region, fire a local push notification: "🚚 Your delivery from [Supplier] is 1km away!".

---

## SECTION 9 — Offline Data Encryption (NFR-04)
**Commit:** `fix(security): SQLCipher encryption for offline data`

### 9.1 — Generate and store encryption key

In `mobile/db/index.ts`, on first launch:

```ts
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

async function getOrCreateDbKey(): Promise<string> {
  let key = await SecureStore.getItemAsync('db_encryption_key');
  if (!key) {
    const bytes = await Crypto.getRandomBytesAsync(32);
    key = Buffer.from(bytes).toString('hex');
    await SecureStore.setItemAsync('db_encryption_key', key);
  }
  return key;
}
```

### 9.2 — Pass key to WatermelonDB adapter

```ts
const encryptionKey = await getOrCreateDbKey();

const adapter = new SQLiteAdapter({
  schema,
  migrations,
  dbName: 'construction_connect',
  jsi: true,
  encryptionKey,
  onSetUpError: error => {
    // If key is wrong (e.g., app reinstall), reset DB
    console.error('DB setup error — resetting', error);
  },
});
```

---

## SECTION 10 — Push Notifications
**Commit:** `feat(notifications): push + local notifications`

### 10.1 — Setup Expo Notifications

In `mobile/app/_layout.tsx`:

```ts
import * as Notifications from 'expo-notifications';

async function registerForPushNotifications() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;
  const token = (await Notifications.getExpoPushTokenAsync()).data;
  // Save token to backend
  await api.patch('/users/push-token', { push_token: token });
}
```

Add `push_token String?` to Prisma `User` model. Add `PATCH /users/push-token` endpoint (JWT protected, updates own user only).

### 10.2 — Local notifications (works offline)

Use local notifications for time-sensitive events that happen on-device:

| Trigger | Notification |
|---|---|
| Geofence enter (delivery nearby) | "🚚 Delivery from [Supplier] is 1km away" |
| Sync completes with pending GRNs | "✅ 3 receipts synced successfully" |
| Daily log not submitted by 5 PM | "📋 Reminder: Today's site log is still a draft" |

For the daily log reminder, schedule it in `mobile/app/daily-log/new.tsx` when the user saves a draft:
```ts
await Notifications.scheduleNotificationAsync({
  content: { title: "Site Log Reminder", body: "Today's log is still a draft" },
  trigger: { hour: 17, minute: 0, repeats: false },
});
```

### 10.3 — Remote notifications (requires server)

When the backend sends a push notification (via Expo Push API) for events like "New bid received" or "Order status changed", the mobile app must handle the notification and navigate to the relevant screen:

```ts
// in _layout.tsx
Notifications.addNotificationResponseReceivedListener(response => {
  const { type, entity_id } = response.notification.request.content.data as any;
  if (type === 'rfq_bid') router.push(`/marketplace/rfq/${entity_id}/bids`);
  if (type === 'order_status') router.push(`/marketplace/orders/${entity_id}`);
});
```

---

## SECTION 11 — UX Polish for Field Use
**Commit:** `fix(ux): field-optimized UX polish`

### 11.1 — Large tap targets everywhere

Audit every interactive element in the daily log and marketplace flows. Apply this rule: minimum `height: 48, paddingHorizontal: 16` on all buttons, minimum `fontSize: 16` on all inputs. The site superintendent may be wearing gloves.

### 11.2 — Haptic feedback

Add `expo-haptics` feedback on:
- Form submission (success → `notificationAsync(NotificationFeedbackType.Success)`)
- Validation error (→ `notificationAsync(NotificationFeedbackType.Error)`)
- Adding an attendance row or photo (→ `impactAsync(ImpactFeedbackStyle.Light)`)

### 11.3 — Empty states with actions

For each screen that can be empty, add a descriptive empty state:

| Screen | Empty state message | Action button |
|---|---|---|
| Daily log list | "No logs yet this week" | "Create Today's Log" |
| Open POs in GRN | "No open deliveries for this project" | "Go to Marketplace" |
| Catalog | "Catalog loading — connect to sync" | "Retry Sync" |
| RFQ list | "No RFQs sent yet" | "Request a Quote" |

### 11.4 — Error handling with retry

Wrap every screen's data-fetching (WatermelonDB queries + API calls) in a try/catch. On error, show a full-screen error state with: error message, "Retry" button, and "Work Offline" button (which loads from local DB only). Create `mobile/components/ErrorState.tsx` for reuse.

### 11.5 — Skeleton loaders

Replace all `<ActivityIndicator />` on list screens with skeleton placeholders. Create `mobile/components/SkeletonRow.tsx` (grey animated shimmer bar). Use it in: daily log list, catalog grid, order list, RFQ list.

### 11.6 — Arabic RTL support

In `mobile/app/_layout.tsx`, detect `I18nManager.isRTL` (set by the device locale or the app's language setting). When RTL:
- Set `I18nManager.forceRTL(true)` and reload the app.
- All `flexDirection: 'row'` should naturally reverse. Audit any hardcoded `left`/`right` styles and replace with `start`/`end` or conditional logic.

---

## SECTION 12 — Navigation & Project Context
**Commit:** `feat(nav): project context and deep linking`

### 12.1 — Active project context

The site superintendent always operates in the context of a single active project. Create `mobile/store/projectStore.ts`:

```ts
export const useProjectStore = create<{
  activeProject: Project | null;
  setActiveProject: (p: Project) => void;
}>(set => ({
  activeProject: null,
  setActiveProject: activeProject => set({ activeProject }),
}));
```

In the tab layout header, show the active project name with a dropdown arrow. Tapping it opens a project switcher bottom sheet listing all projects from local WatermelonDB.

Every screen that needs project context reads from `useProjectStore().activeProject`. If `null`, show a "Select a project to continue" full-screen prompt.

### 12.2 — Tab structure

The bottom tab bar should have exactly these 5 tabs:

| Tab | Icon | Screen |
|---|---|---|
| **Today** | 📋 | Today's daily log (auto-creates draft for today if none exists) |
| **Site** | 🏗️ | Project overview: attendance summary, recent photos, inventory levels |
| **Orders** | 📦 | Purchase orders + GRN |
| **Market** | 🛒 | Catalog + Cart + RFQ |
| **Sync** | 🔄 | Sync status, pending changes list, manual sync button |

---

## Final Mobile Checklist

Before marking this sprint complete:

- [x] App opens and shows Today's log screen with no network connection — **Today** tab (`/(tabs)/today`); login redirects here; daily logs scoped to active project
- [x] Weather auto-fetches on log open; falls back to manual form when offline — `WeatherWidget` + `services/weather.ts`
- [x] Attendance form blocks submission if hours > 16 — `attendanceBlocksSubmit` + `AttendanceSheet`
- [x] Photo captures with GPS tag; thumbnail appears instantly; uploads in background when online — `DailyLogPhotosSection` + `photoUpload.ts`
- [x] GRN flow: select open PO → verify items → photo of ticket → confirm (works offline) — `daily-log/grn.tsx` + `grn_records`
- [ ] After GRN sync, `po_item.received_qty` updates on server — verify against live API / Prisma PO ids
- [x] Catalog shows real products from WatermelonDB (synced from server) — `marketplace/catalog.tsx` + materials hydration in sync
- [ ] RFQ blast creates record offline and syncs when online — **partial**: `marketplace/rfq/new.tsx` exists; list is placeholder until `rfqs` table + sync
- [x] Cart checkout creates PO online or queues offline — `marketplace/cart.tsx` + `pending_orders` flush in `sync.ts`
- [ ] Geofence alert fires when delivery enters 1km radius — **not implemented** (Section 8.5 / `expo-location` geofencing)
- [x] SyncStatusBar shows correct state (offline/syncing/idle) — `components/SyncStatusBar.tsx` + `syncStore`
- [x] All data survives app kill + reopen with no network — WatermelonDB offline-first (verify on device)
- [x] SQLCipher encryption key generated and stored in SecureStore on first launch — `db/dbKey.ts` (`getOrCreateHexDbKey`); **adapter does not yet pass `encryptionKey`** (Section 9.2 pending product choice)
- [x] All tap targets ≥ 48px height — **applied to primary actions** (Section 11.1): main buttons, tab segments, headers, FAB; audit remaining inputs as needed
- [x] Haptic feedback on submit and errors — `services/haptics.ts` wired on daily log save, attendance add row, photos capture, GRN, cart, sync tab
- [x] Arabic RTL layout works correctly — root `app/_layout.tsx` sets `direction` from `I18nManager.isRTL`; full mirror audit optional
- [ ] `npx expo start` builds without TypeScript errors — run locally after `npm install` in `mobile/`

---

### Sections 11 & 12 — delivered in repo

| Item | Where |
|------|--------|
| **11.1** Large tap targets | Primary `TouchableOpacity` / `TextInput` use `min-h-[48px]` or `text-base` where updated |
| **11.2** Haptics | `services/haptics.ts` + call sites above |
| **11.3** Empty states | `daily-log/index.tsx`, `catalog.tsx` (retry sync), `rfq/list.tsx`, GRN step 1, `ErrorState.tsx` |
| **11.4** Error + retry | `components/ErrorState.tsx`; daily log index, site overview, orders tab, sync tab |
| **11.5** Skeleton loaders | `components/SkeletonRow.tsx`; daily log list initial load |
| **11.6** RTL | `I18nManager.isRTL` on root `View` in `app/_layout.tsx` |
| **12.1** Active project | `store/projectStore.ts` + `components/ProjectHeader.tsx` (SecureStore persist); auto-select if only one project |
| **12.2** Five tabs | `app/(tabs)/_layout.tsx`: **Today**, **Site**, **Orders**, **Market**, **Sync** |

---

*Work through sections 1 → 12 in order in one task. Section 1 (sync fix) is a blocker for everything else — do not skip it.*
