# Construction Connect Mobile — Implementation Plan

---

Before writing any feature code:

```bash
# 1. Verify monorepo structure
ls /mobile  # Should show: app/, components/, package.json, app.json

# 2. Install dependencies
cd mobile
npx expo install \
  @nozbe/watermelondb \
  @nozbe/with-observables \
  expo-secure-store \
  expo-camera \
  expo-location \
  expo-notifications \
  expo-file-system \
  expo-image-manipulator \
  expo-image \
  expo-haptics \
  expo-web-browser \
  @shopify/flash-list \
  react-native-maps \
  @react-native-community/netinfo \
  react-native-reanimated \
  react-native-gesture-handler \
  react-hook-form \
  zod \
  @hookform/resolvers \
  axios \
  zustand \
  @tanstack/react-query \
  react-i18next \
  i18next \
  dayjs \
  react-native-toast-message \
  nativewind

# 3. Verify API health
curl https://api.your-domain.com/health-check
# Expected: { "status": "ok" }

# 4. Test auth endpoint
curl -X POST https://api.your-domain.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"testpass"}'
```

---

## PHASE 1: FOUNDATION

### Week 1: Infrastructure Setup

**Project Configuration**

Task: Set up Expo Router, NativeWind, TypeScript config

```typescript
// app/_layout.tsx — Root layout
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 60_000 },
  },
});

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }} />
        <Toast />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
```

**WatermelonDB Setup**

```typescript
// lib/watermelon.ts
import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from '../models/schema';
import { migrations } from '../models/migrations';

const adapter = new SQLiteAdapter({
  schema,
  migrations,
  jsi: true, // Use JSI for better performance
  onSetUpError: error => console.error('WatermelonDB setup error:', error),
});

export const database = new Database({
  adapter,
  modelClasses: [Project, Site, DailyLog, LogPhoto, Notification],
});
```

**Auth System**

Build in this order:
1. `lib/auth.ts` — SecureStore helpers (getToken, setToken, clearToken)
2. `store/authStore.ts` — Zustand auth store
3. `lib/api.ts` — Axios instance with interceptors
4. `app/(auth)/login.tsx`
5. `app/(auth)/register.tsx`
6. `app/(auth)/verify-otp.tsx`
7. `app/(auth)/_layout.tsx` — Auth stack navigator
8. Root redirect logic: if token → `/(app)`, else `/(auth)/login`

**Component Library Foundation**

Build these first (everything else depends on them):
```
components/ui/Button.tsx
components/ui/Input.tsx
components/ui/Card.tsx
components/ui/Badge.tsx
components/ui/SkeletonLoader.tsx
components/ui/EmptyState.tsx
```

Design tokens in `constants/theme.ts`:
```typescript
export const Colors = {
  background: '#1C1C1E',
  surface: '#2C2C2E',
  surfaceElevated: '#3A3A3C',
  primary: '#F5A623',     // amber
  primaryDark: '#D4891A',
  text: '#FFFFFF',
  textSecondary: '#EBEBF5',
  textTertiary: '#8E8E93',
  border: '#38383A',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  info: '#007AFF',
};

export const Spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48
};

export const BorderRadius = {
  sm: 6, md: 8, lg: 12, xl: 16, full: 999
};
```

---

### Core Screens

**Tab Navigation + Dashboard**

```typescript
// app/(app)/_layout.tsx
import { Tabs } from 'expo-router';
import { useAuthStore } from '../../store/authStore';

export default function AppLayout() {
  const { user } = useAuthStore();
  const isContractor = user?.role === 'CONTRACTOR';
  const isSupplier = user?.role === 'SUPPLIER';

  return (
    <Tabs screenOptions={{ tabBarStyle: { backgroundColor: Colors.surface } }}>
      <Tabs.Screen name="index" options={{ title: 'Dashboard' }} />
      {isContractor && (
        <Tabs.Screen name="daily-logs" options={{ title: 'Site Logs' }} />
      )}
      <Tabs.Screen name="orders" options={{ title: 'Orders' }} />
      <Tabs.Screen name="rfqs" options={{ title: 'RFQs' }} />
      <Tabs.Screen name="notifications" options={{ title: 'Alerts' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
```

Dashboard must fetch in parallel:
```typescript
const { data: projects } = useQuery(['projects'], () => api.get('/projects?limit=5'));
const { data: orders } = useQuery(['orders', 'recent'], () => api.get('/purchase-orders?limit=5'));
const { data: notifications } = useQuery(['notifications', 'unread'], 
  () => api.get('/notifications?unread=true'));
```

**Sync Engine**

Build `lib/sync.ts` and `hooks/useSync.ts`.

Critical: test sync with existing web data before proceeding:
```typescript
// Test: after login, trigger sync and verify local WatermelonDB has projects
await syncDatabase();
const projects = await database.get('projects').query().fetch();
console.assert(projects.length > 0, 'Sync should populate projects from server');
```

Build offline banner component:
```typescript
// components/sync/SyncBanner.tsx
import NetInfo from '@react-native-community/netinfo';
export function SyncBanner() {
  const [isOnline, setIsOnline] = useState(true);
  const { pendingCount } = useSyncStore();
  
  useEffect(() => {
    return NetInfo.addEventListener(state => setIsOnline(state.isConnected ?? true));
  }, []);

  if (isOnline && pendingCount === 0) return null;
  
  return (
    <View style={styles.banner}>
      <Text>{isOnline ? `${pendingCount} changes pending sync` : 'Offline mode'}</Text>
    </View>
  );
}
```

**Projects & Sites Screens**

- Projects list (WatermelonDB query, offline)
- Project detail (hybrid: local + REST for bids/orders)
- Site detail with map view

---

## PHASE 2: CORE FEATURES

### Daily Logs (The Heart of the Mobile App)

This is the most important mobile feature. Spend a full week getting it right.

**Daily Log Form Architecture**

Use `react-hook-form` with a multi-step wizard approach:

```typescript
// Wizard state
const [step, setStep] = useState<'overview' | 'attendance' | 'progress' | 'materials'>('overview');

// Form schema
const dailyLogSchema = z.object({
  project_id: z.string().min(1, 'Select a project'),
  site_id: z.string().optional(),
  log_date: z.date(),
  weather_data: z.object({
    temp: z.number().optional(),
    humidity: z.number().optional(),
    wind_speed: z.number().optional(),
    condition: z.string().optional(),
  }).optional(),
  attendance: z.array(z.object({
    company: z.string(),
    trade: z.string(),
    headcount: z.number().min(1).max(500),
    hours: z.number().min(0.5).max(24),
  })),
  progress_notes: z.string().max(500).optional(),
});
```

**Camera & Photo System**

```typescript
// hooks/usePhotoCapture.ts
export function usePhotoCapture(dailyLogId: string) {
  const capture = async () => {
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,  // Compress at capture
      exif: true,
    });
    
    if (!result.canceled) {
      const location = await Location.getCurrentPositionAsync({});
      
      // Compress further if > 500KB
      const compressed = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 1200 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      
      // Save to WatermelonDB
      await database.write(async () => {
        await database.get('log_photos').create(photo => {
          photo.dailyLogId = dailyLogId;
          photo.localPath = compressed.uri;
          photo.gpsLat = location.coords.latitude;
          photo.gpsLong = location.coords.longitude;
          photo.uploaded = false;
        });
      });
      
      // Queue for upload
      PhotoUploadQueue.add(dailyLogId, compressed.uri);
    }
  };
  
  return { capture };
}
```

**Weather Integration**

```typescript
// lib/weather.ts
export async function fetchWeather(lat: number, lon: number) {
  const apiKey = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;
  const { data } = await axios.get(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
  );
  return {
    temp: Math.round(data.main.temp),
    humidity: data.main.humidity,
    wind_speed: data.wind.speed,
    condition: data.weather[0].main,
    icon: data.weather[0].icon,
  };
}
```

**GRN (Material Receipt)**

```typescript
// The GRN flow inside daily log:
// 1. Fetch open POs for this project
const { data: openPOs } = useQuery(
  ['purchase-orders', { project_id: projectId, status: 'OUT_FOR_DELIVERY' }],
  () => api.get(`/purchase-orders?project_id=${projectId}&status=OUT_FOR_DELIVERY`)
);

// 2. For selected PO, show items with received qty inputs
// 3. On submit, call delivery notes endpoint
```

---

### Orders & Proof of Delivery

**Orders List & Detail**

- Build FlashList-based orders list
- Status timeline component (visual status track)
- Role-based action buttons

**POD Capture Flow**

This is a critical workflow. Build carefully:

```typescript
// app/(app)/orders/delivery.tsx

export default function ProofOfDelivery() {
  const { id } = useLocalSearchParams();
  const [step, setStep] = useState<'items' | 'photo' | 'confirm'>('items');
  const [receivedItems, setReceivedItems] = useState([]);
  const [podPhoto, setPodPhoto] = useState<string | null>(null);

  const submitDelivery = async () => {
    const formData = new FormData();
    formData.append('items', JSON.stringify(receivedItems));
    if (podPhoto) {
      formData.append('pod_photo', {
        uri: podPhoto,
        type: 'image/jpeg',
        name: 'pod.jpg',
      } as any);
    }
    
    await api.post(`/purchase-orders/${id}/delivery-notes`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    // Order status advances to DELIVERED on backend
    // Invoice auto-created on backend
    router.push('/orders');
  };
}
```

**Supplier Order Management**

- Supplier order list filtered by their company
- Status update flow: CONFIRMED → PROCESSING → OUT_FOR_DELIVERY

---

### RFQs & Marketplace

**Contractor RFQ Flow**

- RFQ list with status tabs
- RFQ detail with bid comparison table
- Award/reject actions with confirmation
- New RFQ form with BOQ item entry

**Supplier RFQ Feed**

- Filtered feed by supplier's categories
- Quick bid submission modal
- My submitted bids view

**Marketplace Browse**

- Materials grid/list with category filters
- Material detail
- "Request Quote" shortcut

---

## PHASE 3: ADVANCED FEATURES

### Financials & Notifications

**Invoices**
- Invoice list (buyer and supplier views)
- Invoice detail with PDF viewer (via signed URL)
- Payment proof upload

**Wallet**
- Balance display
- Transaction history with FlashList
- Outstanding dues calculation

**Notifications**
- Full notification center
- Deeplink navigation from notifications
- Push token registration
- Badge count management

---

### Polish & RTL

**Arabic RTL Support**

```typescript
// i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ar from './ar.json';
import en from './en.json';

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ar: { translation: ar } },
  lng: 'en',
  fallbackLng: 'en',
});

// In any component:
// const { t, i18n } = useTranslation();
// <Text>{t('dashboard.title')}</Text>
```

RTL layout adjustment:
```typescript
// components/ui/RTLView.tsx
import { I18nManager } from 'react-native';
export function RTLView({ style, ...props }) {
  return (
    <View
      style={[{ flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row' }, style]}
      {...props}
    />
  );
}
```

**Error States & Edge Cases**

For every screen, implement:
- Loading state (skeleton loaders)
- Empty state (with illustration and action button)
- Error state (with retry button)
- Offline state (show stale data with banner)

**Animations & Micro-interactions**

```typescript
// Smooth screen transitions
// Status badge pulse animation for active deliveries
// Pull-to-refresh with haptic feedback
// Button press states with haptics
// Success/error shake animations on forms
```

---

### Testing & Production Prep

**Testing**

Write tests for:
1. Auth flow (login → OTP → token storage)
2. Sync logic (pull/push/conflict resolution)
3. Daily log form submission (online + offline)
4. Order status transitions
5. Photo upload queue

**Performance Audit**

```bash
# Check bundle size
npx expo export --platform ios --dev false

# Profile with Flipper or React Native Debugger
# Check for:
# - Memory leaks (useEffect cleanup)
# - Excessive re-renders (React.memo where needed)
# - Large list virtualization
# - Image memory usage
```

**Security Audit**

Checklist:
- [ ] JWT stored in SecureStore (grep for AsyncStorage usage of tokens)
- [ ] No hardcoded API keys (use EXPO_PUBLIC_ env vars)
- [ ] No console.log of sensitive data
- [ ] Photos deleted from device after S3 upload confirmed
- [ ] WatermelonDB encryption configured

**Day 40: Final QA**

Test matrix:
- iPhone 14 (iOS 17) — primary test device
- iPhone SE (small screen) — layout check
- Android flagship (API 34) — primary Android
- Android mid-range (API 31) — performance check
- Offline mode: airplane mode throughout flows
- Slow network: throttle to 3G, test sync behavior
- Large data set: account with 100+ projects, 1000+ logs

---

## DEPENDENCY GRAPH

Build in this strict order (each depends on the previous):

```
1. Theme/constants
2. Auth lib (SecureStore)
3. API lib (Axios)
4. WatermelonDB schema + models
5. Sync engine
6. Auth store (Zustand)
7. Root layout + navigation
8. Auth screens (login, register, OTP)
9. UI component library
10. Dashboard
11. Projects + Sites
12. Daily Logs (full flow)
13. Orders + POD
14. RFQs (contractor + supplier)
15. Marketplace
16. Invoices + Wallet
17. Notifications
18. Profile + Settings
19. RTL support
20. Push notifications
21. Testing
22. Production build
```

---

## COMMON PITFALLS TO AVOID

1. **Never AsyncStorage for JWT** — use expo-secure-store only
2. **Never block the UI thread during sync** — always background
3. **WatermelonDB `database.write()`** must wrap ALL write operations, no exceptions
4. **Expo Router file conventions**: `[id].tsx` for dynamic routes, `_layout.tsx` for navigators, `(group)` for grouping without URL impact
5. **Image uploads**: always use FormData with correct `Content-Type: multipart/form-data`
6. **Don't call `/projects/sites`** — always `/projects/:id/sites` (backend routing bug)
7. **Company-scoped data**: the backend enforces this; don't try to fetch other companies' data
8. **WatermelonDB sync protocol**: `last_pulled_at` is in milliseconds (not seconds)
9. **React Query + WatermelonDB**: don't mix them for the same data — use WatermelonDB for offline tables (projects, sites, daily logs) and React Query for server-only data (orders, bids, invoices)
10. **Throttle**: max 100 req/min — batch sync requests, don't fire per-item

---

## API RESPONSE SHAPE EXPECTATIONS

```typescript
// Standard list response
interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// Standard error response
interface ApiError {
  message: string;
  error: string;
  statusCode: number;
}

// Auth responses
interface LoginResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    company: {
      id: string;
      name: string;
      type: string;
      country: string;
      is_verified: boolean;
    };
  };
}
```

---

## BACKEND SYNC ENDPOINT CONTRACT

```typescript
// GET /sync/pull?last_pulled_at=1704067200000
// Response:
{
  changes: {
    projects: {
      created: [{ id: 'uuid', name: '...', updated_at: 1704067200000, ... }],
      updated: [...],
      deleted: ['uuid1', 'uuid2'],
    },
    sites: {
      created: [...],
      updated: [...],
      deleted: [],
    }
  },
  timestamp: 1704067260000  // Use this as next last_pulled_at
}

// POST /sync/push?last_pulled_at=1704067200000
// Body:
{
  changes: {
    daily_logs: {
      created: [{ id: 'local-uuid', ... }],
      updated: [...],
      deleted: [],
    }
  }
}
```

---

## SIGN-OFF CRITERIA

Before marking any sprint complete:

1. **Offline test**: Turn on airplane mode → perform the feature's core action → turn wifi back on → verify data appears on web dashboard
2. **Role test**: Test with both CONTRACTOR and SUPPLIER accounts
3. **Empty state test**: Test with a brand-new company account (no data)
4. **Error test**: Kill the API server → verify app handles gracefully
5. **Arabic test**: Switch language to Arabic → verify RTL and translations

---
