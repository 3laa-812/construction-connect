# Construction Connect — Full API Integration Guide
## Mobile + Frontend → Shared NestJS Backend
## "One Backend. Two Clients. Real Data."

**Read this document alongside:**
- `./MOBILE_TECH_SPEC.md` — mobile stack, WatermelonDB schema, screen specs
- `./MOBILE_IMPLEMENTATION_PLAN.md` — build order and sprint plan
- `./TECHNICAL_DOCUMENTATION.md` — backend service internals and Prisma schema
- `./UI_UX_POLISH.md` — glassmorphism design system and component specs

---

## PART 1 — MONOREPO TOPOLOGY & SHARED CONTRACT

### 1.1 Folder Structure

```
construction-connect/
├── backend/                   ← NestJS API — the single source of truth
│   ├── src/
│   │   ├── main.ts            ← boots on PORT (default 3000)
│   │   ├── app.module.ts      ← registers all feature modules + global guards
│   │   ├── auth/
│   │   ├── users/
│   │   ├── companies/
│   │   ├── projects/
│   │   ├── rfqs/
│   │   ├── purchase-orders/
│   │   ├── invoices/
│   │   ├── sync/
│   │   ├── settings/
│   │   ├── wallets/
│   │   ├── materials/
│   │   ├── daily-logs/
│   │   ├── admin/
│   │   ├── notifications/
│   │   └── health/
│   ├── prisma/
│   │   └── schema.prisma      ← PostgreSQL schema (Prisma 7)
│   └── .env                   ← PORT, DATABASE_URL, JWT_SECRET, FRONTEND_URL, S3_*
│
├── frontend/                  ← React 18 / Vite SPA
│   ├── src/
│   │   ├── lib/api.ts         ← Axios instance (reads from localStorage)
│   │   ├── lib/sync.ts        ← WatermelonDB synchronize() calls
│   │   ├── contexts/
│   │   │   ├── AuthContext.tsx
│   │   │   └── SyncContext.tsx
│   │   └── ...
│   └── .env                   ← VITE_API_URL=http://localhost:3000
│
└── mobile/                    ← Expo React Native app
    ├── app/                   ← Expo Router file-based routes
    ├── lib/
    │   ├── api.ts             ← Axios instance (reads from SecureStore)
    │   ├── sync.ts            ← WatermelonDB synchronize() calls
    │   └── auth.ts            ← SecureStore helpers
    ├── models/                ← WatermelonDB model classes
    ├── store/                 ← Zustand stores
    └── .env                   ← EXPO_PUBLIC_API_URL=http://localhost:3000
```

### 1.2 The Single Backend Contract

Both clients call the **exact same NestJS API**. There is no separate mobile API. The only differences are:

| Concern | Frontend (Web) | Mobile |
|---|---|---|
| Token storage | `localStorage` | `expo-secure-store` |
| WatermelonDB adapter | LokiJS (IndexedDB) | SQLite (on-device) |
| Auth redirect on 401 | `window.location = '/login'` | Expo Router `router.replace('/(auth)/login')` |
| Multipart file upload | Browser `File` / `FormData` | RN `{ uri, type, name }` FormData |
| Base URL source | `import.meta.env.VITE_API_URL` | `process.env.EXPO_PUBLIC_API_URL` |
| CORS origin | `http://localhost:5173` (Vite dev) | React Native has no CORS (native HTTP) |

---

## PART 2 — BACKEND CONFIGURATION (changes required)

### 2.1 CORS — Allow Both Clients

The backend currently reads `FRONTEND_URL` for CORS. It must accept both the web client and mobile.
Mobile React Native apps bypass CORS entirely (native HTTP, not a browser), but the web dev server needs explicit allow.

**File: `backend/src/main.ts`**

```typescript
// CURRENT (single origin):
app.enableCors({ origin: process.env.FRONTEND_URL });

// REPLACE WITH (multiple origins + credentials):
const allowedOrigins = [
  process.env.FRONTEND_URL,           // e.g. http://localhost:5173 (Vite dev)
  process.env.FRONTEND_URL_PROD,      // e.g. https://app.constructionconnect.com
  'http://localhost:5173',            // Vite default fallback
  'http://localhost:3001',            // alternate dev port
].filter(Boolean);

app.enableCors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

**Add to `backend/.env`:**
```env
FRONTEND_URL=http://localhost:5173
FRONTEND_URL_PROD=https://your-production-domain.com
```

### 2.2 Push Token Field — Verify Column Exists

The mobile app sends Expo push tokens via `PATCH /users/push-token`.
Confirm `backend/prisma/schema.prisma` has this on the `User` model:

```prisma
model User {
  // ... existing fields ...
  push_token  String?    // Expo push token for mobile notifications
}
```

If missing, add it and run:
```bash
cd backend
npx prisma migrate dev --name add_push_token_to_user
```

### 2.3 Daily Logs Photo Upload — Verify Route

The mobile app calls `POST /daily-logs/photos` (not `/daily-logs/:id/photos`).
Check `backend/src/daily-logs/daily-logs.controller.ts` — the route must be:

```typescript
@Post('photos')
@UseInterceptors(FileInterceptor('file'))
uploadPhoto(
  @UploadedFile() file: Express.Multer.File,
  @Body('log_photo_id') logPhotoId: string,
) { ... }
```

The `log_photo_id` body param is critical — mobile creates the WatermelonDB record first, then uploads the file referencing that ID.

### 2.4 File Upload Size Limits

Mobile photos can be larger than browser uploads. Ensure Multer is configured for adequate size:

```typescript
// backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import * as bodyParser from 'body-parser';

// After app creation:
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
```

Multer per-route limit (already in individual controllers) should be `{ limits: { fileSize: 10 * 1024 * 1024 } }` — 10MB per photo.

---

## PART 3 — ENVIRONMENT FILES

### 3.1 Backend `.env` (complete)

```env
# backend/.env

# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/construction_connect

# Auth
JWT_SECRET=your-256-bit-secret-here-change-in-production

# CORS
FRONTEND_URL=http://localhost:5173
FRONTEND_URL_PROD=https://your-production-domain.com

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
S3_BUCKET_NAME=construction-connect-uploads

# Email (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your-app-password

# SMS (Twilio) — for OTP delivery
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_PHONE_NUMBER=+1234567890
```

### 3.2 Frontend `.env` (complete)

```env
# frontend/.env

VITE_API_URL=http://localhost:3000
```

**How the frontend uses it** (`frontend/src/lib/api.ts`):
```typescript
// Already configured — confirm this pattern exists:
import axios from 'axios';
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
});
// Token attached from localStorage:
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

### 3.3 Mobile `.env` (complete)

```env
# mobile/.env
# Prefix EXPO_PUBLIC_ required for Expo to expose vars to JS bundle

EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_OPENWEATHER_API_KEY=your-openweathermap-key
```

**Local dev on physical device:** `localhost` refers to your computer, not the phone.
Use your machine's local network IP instead:

```env
# mobile/.env (physical device development)
EXPO_PUBLIC_API_URL=http://192.168.1.XXX:3000
```

Find your IP: `ipconfig` (Windows) or `ifconfig | grep inet` (Mac/Linux).
Both your dev machine and phone must be on the same WiFi network.

**Android Emulator:**
```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
```

**iOS Simulator:**
```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

---

## PART 4 — MOBILE API CLIENT (complete implementation)

### 4.1 `mobile/lib/auth.ts` — SecureStore helpers

```typescript
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'cc_access_token';
const USER_KEY  = 'cc_user';

export const getToken  = () => SecureStore.getItemAsync(TOKEN_KEY);
export const setToken  = (t: string) => SecureStore.setItemAsync(TOKEN_KEY, t);
export const clearToken = () => SecureStore.deleteItemAsync(TOKEN_KEY);

export const getUser   = async () => {
  const raw = await SecureStore.getItemAsync(USER_KEY);
  return raw ? JSON.parse(raw) : null;
};
export const setUser   = (u: object) =>
  SecureStore.setItemAsync(USER_KEY, JSON.stringify(u));
export const clearUser = () => SecureStore.deleteItemAsync(USER_KEY);

export const clearSession = async () => {
  await Promise.all([clearToken(), clearUser()]);
};
```

### 4.2 `mobile/lib/api.ts` — Axios instance

```typescript
import axios, { AxiosError } from 'axios';
import { getToken, clearSession } from './auth';
import { router } from 'expo-router';
import { EventEmitter } from 'eventemitter3';

// Global event bus — components subscribe to auth events
export const authEvents = new EventEmitter();

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

// ── REQUEST: attach JWT ──
api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── RESPONSE: handle 401 ──
let isRedirecting = false;
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    if (error.response?.status === 401 && !isRedirecting) {
      isRedirecting = true;
      await clearSession();
      authEvents.emit('logout');
      router.replace('/(auth)/login');
      setTimeout(() => { isRedirecting = false; }, 2000);
    }
    return Promise.reject(error);
  },
);

// ── Typed API error helper ──
export function getApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const msg = error.response?.data?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    if (typeof msg === 'string') return msg;
    if (error.response?.status === 403) return 'You do not have permission for this action';
    if (error.response?.status === 404) return 'Resource not found';
    if (!error.response) return 'No network connection';
  }
  return 'An unexpected error occurred';
}
```

### 4.3 `mobile/lib/upload.ts` — Multipart file upload helper

React Native FormData requires a specific shape for file uploads — different from the browser.

```typescript
import { api } from './api';

interface UploadFileParams {
  endpoint: string;           // e.g. '/daily-logs/photos'
  fileUri: string;            // local file:// URI from expo-camera or expo-image-picker
  fieldName?: string;         // default 'file'
  extraFields?: Record<string, string>;  // additional body fields
  mimeType?: string;          // default 'image/jpeg'
}

export async function uploadFile({
  endpoint,
  fileUri,
  fieldName = 'file',
  extraFields = {},
  mimeType = 'image/jpeg',
}: UploadFileParams) {
  const formData = new FormData();

  // React Native FormData file object shape (NOT the web File API)
  formData.append(fieldName, {
    uri: fileUri,
    type: mimeType,
    name: `upload_${Date.now()}.jpg`,
  } as any);

  // Append any extra text fields
  Object.entries(extraFields).forEach(([key, value]) => {
    formData.append(key, value);
  });

  const response = await api.post(endpoint, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      // Do NOT manually set boundary — axios sets it automatically
    },
    timeout: 60_000, // longer timeout for file uploads
  });

  return response.data;
}

// ── Usage examples ──
//
// Upload daily log photo:
// await uploadFile({
//   endpoint: '/daily-logs/photos',
//   fileUri: compressedPhotoUri,
//   extraFields: { log_photo_id: watermelonRecordId },
// });
//
// Upload POD photo:
// await uploadFile({
//   endpoint: `/purchase-orders/${poId}/delivery-notes`,
//   fileUri: podPhotoUri,
//   extraFields: { items: JSON.stringify(receivedItems), delivery_date: new Date().toISOString() },
// });
//
// Upload payment proof:
// await uploadFile({
//   endpoint: `/invoices/${invoiceId}/payment-proof`,
//   fileUri: receiptUri,
//   extraFields: { referenceNumber: ref, notes: notes },
// });
//
// Upload company document (KYB):
// await uploadFile({
//   endpoint: `/companies/${companyId}/documents`,
//   fileUri: documentUri,
//   mimeType: 'application/pdf',
//   extraFields: { doc_type: 'COMMERCIAL_REG' },
// });
```

---

## PART 5 — TYPED API HOOKS (mobile)

Create one hook per domain. Each hook wraps TanStack Query with the exact API contract.

### 5.1 `mobile/hooks/api/useAuth.ts`

```typescript
import { useMutation } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { setToken, setUser, clearSession } from '../../lib/auth';
import { useAuthStore } from '../../store/authStore';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';

// ── Types (matching backend response shapes exactly) ──
export interface LoginResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    fullName: string | null;
    role: 'ADMIN' | 'SITE_ENGINEER' | 'PROCUREMENT_MANAGER';
    status: string;
    company: {
      id: string;
      name: string;
      type: 'CONTRACTOR' | 'SUPPLIER';
      country: string | null;
      is_verified: boolean;
    };
  };
}

// ── Login ──
export function useLogin() {
  const { setAuth } = useAuthStore();
  return useMutation({
    mutationFn: async (body: { email: string; password: string }) => {
      const { data } = await api.post<LoginResponse>('/auth/login', body);
      return data;
    },
    onSuccess: async (data) => {
      await setToken(data.access_token);
      await setUser(data.user);
      setAuth(data.user, data.access_token);
      // Register push token
      try {
        const { data: tokenData } = await Notifications.getExpoPushTokenAsync();
        await api.patch('/users/push-token', { push_token: tokenData });
      } catch (_) { /* push token optional */ }
      router.replace('/(app)');
    },
  });
}

// ── Register ──
export function useRegister() {
  return useMutation({
    mutationFn: async (body: {
      email: string;
      password: string;
      fullName?: string;
      phone?: string;
      companyName: string;
      role: 'contractor' | 'supplier';
      crNumber?: string;
      taxId?: string;
    }) => {
      const { data } = await api.post<{ message: string; userId: string }>(
        '/auth/register',
        body,
      );
      return data;
    },
    onSuccess: (data, variables) => {
      router.push({
        pathname: '/(auth)/verify-otp',
        params: { userId: data.userId, email: variables.email },
      });
    },
  });
}

// ── Verify OTP ──
export function useVerifyOtp() {
  const { setAuth } = useAuthStore();
  return useMutation({
    mutationFn: async (body: { userId: string; otp: string }) => {
      const { data } = await api.post<LoginResponse>('/auth/verify-otp', body);
      return data;
    },
    onSuccess: async (data) => {
      await setToken(data.access_token);
      await setUser(data.user);
      setAuth(data.user, data.access_token);
      router.replace('/(app)');
    },
  });
}

// ── Logout ──
export function useLogout() {
  const { clearAuth } = useAuthStore();
  return async () => {
    await clearSession();
    clearAuth();
    router.replace('/(auth)/login');
  };
}
```

### 5.2 `mobile/hooks/api/useProjects.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

// ── Types ──
export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  budget: number | null;
  start_date: string | null;
  end_date: string | null;
  company_id: string;
  created_at: string;
  updated_at: string;
  sites?: Site[];
}

export interface Site {
  id: string;
  name: string;
  project_id: string;
  address: string | null;
  gps_lat: number | null;
  gps_long: number | null;
  geofence: any | null;
  contact_name: string | null;
  contact_phone: string | null;
}

export interface BOQItem {
  id: string;
  project_id: string;
  parent_id: string | null;
  csi_code: string | null;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number | null;
}

// ── Hooks ──
export const projectKeys = {
  all: ['projects'] as const,
  detail: (id: string) => ['projects', id] as const,
  sites: (id: string) => ['projects', id, 'sites'] as const,
  boq: (id: string) => ['projects', id, 'boq'] as const,
};

export function useProjects() {
  return useQuery({
    queryKey: projectKeys.all,
    queryFn: async () => {
      const { data } = await api.get<Project[]>('/projects');
      return data;
    },
    staleTime: 60_000,
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get<Project>(`/projects/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useProjectSites(projectId: string) {
  // NOTE: use /projects/:id — NOT /projects/sites (backend routing bug)
  return useQuery({
    queryKey: projectKeys.sites(projectId),
    queryFn: async () => {
      const { data } = await api.get<Site[]>(`/projects/${projectId}`);
      // Sites are embedded in the project response
      return (data as any).sites ?? [];
    },
    enabled: !!projectId,
  });
}

export function useProjectBOQ(projectId: string) {
  return useQuery({
    queryKey: projectKeys.boq(projectId),
    queryFn: async () => {
      const { data } = await api.get<BOQItem[]>(`/projects/${projectId}/boq`);
      return data;
    },
    enabled: !!projectId,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Partial<Project>) => {
      const { data } = await api.post<Project>('/projects', body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.all }),
  });
}
```

### 5.3 `mobile/hooks/api/useRFQs.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

export interface RFQ {
  id: string;
  project_id: string;
  title: string | null;
  status: 'OPEN' | 'CLOSED' | 'AWARDED';
  payment_term: 'CASH' | 'CREDIT' | 'CHEQUE' | null;
  delivery_date: string | null;
  created_by_id: string;
  awarded_bid_id: string | null;
  created_at: string;
  items?: RFQItem[];
  bids?: Bid[];
}

export interface RFQItem {
  id: string;
  rfq_id: string;
  boq_item_id: string | null;
  description: string;
  quantity: number;
  unit: string;
}

export interface Bid {
  id: string;
  rfq_id: string;
  supplier_company_id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  delivery_date: string | null;
  delivery_cost: number | null;
  validity_hours: number | null;
  notes: string | null;
  rejection_reason: string | null;
  total_amount: number | null;
  items?: BidItem[];
  supplier?: { id: string; name: string };
}

export interface BidItem {
  id: string;
  bid_id: string;
  rfq_item_id: string;
  unit_price: number;
  total_price: number;
  notes: string | null;
}

export const rfqKeys = {
  all: (params?: object) => ['rfqs', params] as const,
  detail: (id: string) => ['rfqs', id] as const,
  bids: (id: string) => ['rfqs', id, 'bids'] as const,
};

export function useRFQs(params?: { status?: string; project_id?: string }) {
  return useQuery({
    queryKey: rfqKeys.all(params),
    queryFn: async () => {
      const { data } = await api.get<RFQ[]>('/rfqs', { params });
      return data;
    },
  });
}

export function useRFQ(id: string) {
  return useQuery({
    queryKey: rfqKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get<RFQ>(`/rfqs/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useRFQBids(rfqId: string) {
  return useQuery({
    queryKey: rfqKeys.bids(rfqId),
    queryFn: async () => {
      const { data } = await api.get<Bid[]>(`/rfqs/${rfqId}/bids`);
      return data;
    },
    enabled: !!rfqId,
  });
}

export function useCreateRFQ() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      project_id: string;
      title?: string;
      payment_term?: string;
      delivery_date?: string;
      items: Array<{ description: string; quantity: number; unit: string }>;
    }) => {
      const { data } = await api.post<RFQ>('/rfqs', body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rfqs'] }),
  });
}

export function useAwardBid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ rfqId, bidId }: { rfqId: string; bidId: string }) => {
      // PATCH /rfqs/:rfqId/award/:bidId  (NOT /rfqs/:rfqId/bids/:bidId/award)
      const { data } = await api.patch(`/rfqs/${rfqId}/award/${bidId}`);
      return data;
    },
    onSuccess: (_, { rfqId }) => {
      qc.invalidateQueries({ queryKey: rfqKeys.detail(rfqId) });
      qc.invalidateQueries({ queryKey: rfqKeys.bids(rfqId) });
      qc.invalidateQueries({ queryKey: ['rfqs'] });
    },
  });
}

export function useRejectBid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      rfqId,
      bidId,
      rejection_reason,
    }: {
      rfqId: string;
      bidId: string;
      rejection_reason: string;
    }) => {
      // PATCH /rfqs/:rfqId/bids/:bidId/reject
      const { data } = await api.patch(
        `/rfqs/${rfqId}/bids/${bidId}/reject`,
        { rejection_reason },
      );
      return data;
    },
    onSuccess: (_, { rfqId }) => {
      qc.invalidateQueries({ queryKey: rfqKeys.bids(rfqId) });
    },
  });
}

export function useSubmitBid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      rfqId,
      body,
    }: {
      rfqId: string;
      body: {
        delivery_date?: string;
        delivery_cost?: number;
        validity_hours?: number;
        notes?: string;
        items: Array<{ rfq_item_id: string; unit_price: number; notes?: string }>;
      };
    }) => {
      const { data } = await api.post<Bid>(`/rfqs/${rfqId}/bids`, body);
      return data;
    },
    onSuccess: (_, { rfqId }) => {
      qc.invalidateQueries({ queryKey: rfqKeys.bids(rfqId) });
    },
  });
}
```

### 5.4 `mobile/hooks/api/useOrders.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { uploadFile } from '../../lib/upload';

export type POStatus =
  | 'CONFIRMED' | 'PROCESSING' | 'OUT_FOR_DELIVERY'
  | 'DELIVERED' | 'COMPLETED' | 'CANCELLED';

export interface PurchaseOrder {
  id: string;
  project_id: string;
  supplier_company_id: string;
  rfq_id: string | null;
  bid_id: string | null;
  status: POStatus;
  total_amount: number | null;
  payment_term: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items?: POItem[];
  supplier?: { id: string; name: string };
  project?: { id: string; name: string };
}

export interface POItem {
  id: string;
  po_id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
}

export interface DeliveryNote {
  id: string;
  po_id: string;
  received_by_id: string | null;
  delivery_date: string;
  status: string;
  pod_image_url: string | null;
  signature_url: string | null;
  items: GRNItem[];
}

export interface GRNItem {
  id: string;
  delivery_note_id: string;
  po_item_id: string;
  received_quantity: number;
  notes: string | null;
}

export const orderKeys = {
  all: (params?: object) => ['orders', params] as const,
  detail: (id: string) => ['orders', id] as const,
  deliveryNotes: (id: string) => ['orders', id, 'delivery-notes'] as const,
};

export function useOrders(params?: { status?: POStatus }) {
  return useQuery({
    queryKey: orderKeys.all(params),
    queryFn: async () => {
      const { data } = await api.get<PurchaseOrder[]>('/purchase-orders', { params });
      return data;
    },
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get<PurchaseOrder>(`/purchase-orders/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, note }: { id: string; status: POStatus; note?: string }) => {
      const { data } = await api.patch(`/purchase-orders/${id}/status`, { status, note });
      return data;
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: orderKeys.detail(id) });
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useCreateDeliveryNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderId,
      photoUri,
      items,
      delivery_date,
    }: {
      orderId: string;
      photoUri: string;
      items: Array<{ po_item_id: string; received_quantity: number; notes?: string }>;
      delivery_date: string;
    }) => {
      return uploadFile({
        endpoint: `/purchase-orders/${orderId}/delivery-notes`,
        fileUri: photoUri,
        fieldName: 'pod_image',
        extraFields: {
          items: JSON.stringify(items),
          delivery_date,
          status: 'DELIVERED',
        },
      });
    },
    onSuccess: (_, { orderId }) => {
      qc.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
      qc.invalidateQueries({ queryKey: orderKeys.deliveryNotes(orderId) });
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useDeliveryNotes(orderId: string) {
  return useQuery({
    queryKey: orderKeys.deliveryNotes(orderId),
    queryFn: async () => {
      const { data } = await api.get<DeliveryNote[]>(
        `/purchase-orders/${orderId}/delivery-notes`,
      );
      return data;
    },
    enabled: !!orderId,
  });
}
```

### 5.5 `mobile/hooks/api/useDailyLogs.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { uploadFile } from '../../lib/upload';

export type DailyLogStatus = 'DRAFT' | 'SUBMITTED' | 'SYNCED';

export interface DailyLog {
  id: string;
  project_id: string;
  site_id: string | null;
  user_id: string;
  log_date: string;
  weather_data: {
    temp?: number;
    humidity?: number;
    wind_speed?: number;
    condition?: string;
    icon?: string;
  } | null;
  attendance_data: Array<{
    company: string;
    trade: string;
    headcount: number;
    hours: number;
  }> | null;
  materials_data: any | null;
  progress_notes: string | null;
  status: DailyLogStatus;
  photos?: LogPhoto[];
}

export interface LogPhoto {
  id: string;
  daily_log_id: string;
  s3_url: string | null;
  gps_lat: number | null;
  gps_long: number | null;
  created_at: string;
}

export const logKeys = {
  all: (params?: object) => ['daily-logs', params] as const,
  detail: (id: string) => ['daily-logs', id] as const,
};

export function useDailyLogs(params?: { project_id?: string; date?: string }) {
  return useQuery({
    queryKey: logKeys.all(params),
    queryFn: async () => {
      const { data } = await api.get<DailyLog[]>('/daily-logs', { params });
      return data;
    },
  });
}

export function useDailyLog(id: string) {
  return useQuery({
    queryKey: logKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get<DailyLog>(`/daily-logs/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateDailyLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Partial<DailyLog>) => {
      const { data } = await api.post<DailyLog>('/daily-logs', body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['daily-logs'] }),
  });
}

export function useUpdateDailyLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Partial<DailyLog> }) => {
      const { data } = await api.patch<DailyLog>(`/daily-logs/${id}`, body);
      return data;
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: logKeys.detail(id) });
      qc.invalidateQueries({ queryKey: ['daily-logs'] });
    },
  });
}

// Photo upload — called by the background upload queue
export function useUploadLogPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      logPhotoId,      // WatermelonDB record ID — created locally first
      fileUri,
    }: {
      logPhotoId: string;
      fileUri: string;
    }) => {
      // POST /daily-logs/photos  (NOT /daily-logs/:id/photos)
      return uploadFile({
        endpoint: '/daily-logs/photos',
        fileUri,
        fieldName: 'file',
        extraFields: { log_photo_id: logPhotoId },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['daily-logs'] });
    },
  });
}
```

### 5.6 `mobile/hooks/api/useNotifications.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  reference_id: string | null;
  created_at: string;
}

export function useNotifications(params?: { unread?: boolean; limit?: number }) {
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: async () => {
      const { data } = await api.get<AppNotification[]>('/notifications', { params });
      return data;
    },
    refetchInterval: 30_000, // poll every 30s for new notifications
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // POST /notifications/mark-read/:id
      await api.post(`/notifications/mark-read/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.post('/notifications/mark-all-read');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}
```

### 5.7 `mobile/hooks/api/useFinancials.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

export interface Invoice {
  id: string;
  buyer_company_id: string;
  supplier_company_id: string;
  po_id: string | null;
  invoice_number: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  total_amount: number;
  due_date: string | null;
  zatca_uuid: string | null;
  qr_data: string | null;
  pdf_s3_key: string | null;
  created_at: string;
}

export interface Wallet {
  id: string;
  company_id: string;
  balance: number;
}

export interface Transaction {
  id: string;
  wallet_id: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'PAYMENT' | 'REFUND';
  amount: number;
  description: string | null;
  invoice_id: string | null;
  po_id: string | null;
  created_at: string;
}

export function useInvoices() {
  return useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const { data } = await api.get<Invoice[]>('/invoices');
      return data;
    },
  });
}

export function useInvoicePdf(invoiceId: string) {
  return useQuery({
    queryKey: ['invoices', invoiceId, 'pdf'],
    queryFn: async () => {
      const { data } = await api.get<{ signedUrl: string }>(
        `/invoices/${invoiceId}/pdf`,
      );
      return data.signedUrl;
    },
    enabled: !!invoiceId,
    staleTime: 5 * 60_000, // signed URLs expire; refetch after 5 min
  });
}

export function useWallet() {
  const { user } = useAuthStore();
  const companyId = user?.company?.id;

  return useQuery({
    queryKey: ['wallet', companyId],
    queryFn: async () => {
      const { data } = await api.get<Wallet>(
        `/wallets/company/${companyId}`,
      );
      return data;
    },
    enabled: !!companyId,
  });
}

export function useTransactions() {
  const { user } = useAuthStore();
  const companyId = user?.company?.id;

  return useQuery({
    queryKey: ['transactions', companyId],
    queryFn: async () => {
      const { data } = await api.get<Transaction[]>(
        `/wallets/company/${companyId}/transactions`,
      );
      return data;
    },
    enabled: !!companyId,
  });
}
```

### 5.8 `mobile/hooks/api/useMaterials.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

export interface Material {
  id: string;
  supplier_company_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  unit: string;
  unit_price: number | null;
  is_active: boolean;
  supplier?: { id: string; name: string };
  category?: { id: string; name: string };
}

export function useMaterials(params?: {
  category?: string;
  supplierId?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ['materials', params],
    queryFn: async () => {
      const { data } = await api.get<Material[]>('/materials', { params });
      return data;
    },
    staleTime: 5 * 60_000, // catalog changes infrequently
  });
}

export function useMaterial(id: string) {
  return useQuery({
    queryKey: ['materials', id],
    queryFn: async () => {
      const { data } = await api.get<Material>(`/materials/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get('/admin/categories');
      return data;
    },
    staleTime: 10 * 60_000,
  });
}
```

---

## PART 6 — WATERMELONDB SYNC (mobile)

### 6.1 `mobile/lib/sync.ts` — Complete implementation

```typescript
import { synchronize } from '@nozbe/watermelondb/sync';
import { database } from './watermelon';
import { api } from './api';
import { useSyncStore } from '../store/syncStore';

let isSyncing = false;

export async function syncDatabase(): Promise<void> {
  if (isSyncing) return; // prevent concurrent syncs
  isSyncing = true;

  const { setIsSyncing, setLastSyncAt, setError } = useSyncStore.getState();
  setIsSyncing(true);
  setError(null);

  try {
    await synchronize({
      database,

      pullChanges: async ({ lastPulledAt }) => {
        const { data } = await api.get('/sync/pull', {
          params: {
            last_pulled_at: lastPulledAt ?? 0,
            // last_pulled_at is in MILLISECONDS — backend expects ms timestamp
          },
        });
        // Response shape: { changes: { projects: { created, updated, deleted }, sites: { ... } }, timestamp: number }
        return {
          changes: data.changes,
          timestamp: data.timestamp,
        };
      },

      pushChanges: async ({ changes, lastPulledAt }) => {
        // Only push tables the backend accepts:
        // daily_logs, log_photos — other tables are server-authoritative
        const mobileChanges: Record<string, any> = {};

        if (changes.daily_logs) mobileChanges.daily_logs = changes.daily_logs;
        if (changes.log_photos) mobileChanges.log_photos = changes.log_photos;
        // DO NOT push: products (server ignores), projects/sites (server-owned)

        if (Object.keys(mobileChanges).length > 0) {
          await api.post('/sync/push', { changes: mobileChanges }, {
            params: { last_pulled_at: lastPulledAt ?? 0 },
          });
        }
      },

      migrateFromServer: false,
      sendCreatedAsUpdated: false,
      // conflict resolution: Last Write Wins (backend enforces via timestamp)
    });

    setLastSyncAt(Date.now());
  } catch (error: any) {
    const message = error?.response?.data?.message ?? error?.message ?? 'Sync failed';
    setError(message);
    console.warn('[Sync] Failed:', message);
  } finally {
    isSyncing = false;
    setIsSyncing(false);
  }
}
```

### 6.2 Auto-sync triggers

```typescript
// mobile/hooks/useAutoSync.ts
import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { syncDatabase } from '../lib/sync';

export function useAutoSync() {
  useEffect(() => {
    // Trigger on network reconnect
    const unsubNet = NetInfo.addEventListener((state) => {
      if (state.isConnected) syncDatabase();
    });

    // Trigger on app foreground
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active') syncDatabase();
    });

    // Trigger on mount
    syncDatabase();

    // Poll every 5 minutes
    const interval = setInterval(syncDatabase, 5 * 60_000);

    return () => {
      unsubNet();
      sub.remove();
      clearInterval(interval);
    };
  }, []);
}

// Use in app/(app)/_layout.tsx:
// export default function AppLayout() {
//   useAutoSync();
//   return <Tabs ... />;
// }
```

---

## PART 7 — ZUSTAND STORES (mobile)

### 7.1 `mobile/store/authStore.ts`

```typescript
import { create } from 'zustand';

interface AuthUser {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  company: {
    id: string;
    name: string;
    type: 'CONTRACTOR' | 'SUPPLIER';
    country: string | null;
    is_verified: boolean;
  };
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: AuthUser, token: string) => void;
  clearAuth: () => void;
  // Derived helpers
  isContractor: () => boolean;
  isSupplier: () => boolean;
  isAdmin: () => boolean;
  companyId: () => string | null;
  companyCountry: () => string | null;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  setAuth: (user, token) => set({ user, token, isAuthenticated: true }),
  clearAuth: () => set({ user: null, token: null, isAuthenticated: false }),

  isContractor: () => get().user?.company?.type === 'CONTRACTOR',
  isSupplier:   () => get().user?.company?.type === 'SUPPLIER',
  isAdmin:      () => get().user?.role === 'ADMIN',
  companyId:    () => get().user?.company?.id ?? null,
  companyCountry: () => get().user?.company?.country ?? null,
}));
```

### 7.2 `mobile/store/syncStore.ts`

```typescript
import { create } from 'zustand';

interface SyncState {
  isSyncing: boolean;
  lastSyncAt: number | null;
  pendingCount: number;
  error: string | null;
  setIsSyncing: (v: boolean) => void;
  setLastSyncAt: (t: number) => void;
  setPendingCount: (n: number) => void;
  setError: (e: string | null) => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  isSyncing: false,
  lastSyncAt: null,
  pendingCount: 0,
  error: null,
  setIsSyncing:    (isSyncing) => set({ isSyncing }),
  setLastSyncAt:   (lastSyncAt) => set({ lastSyncAt }),
  setPendingCount: (pendingCount) => set({ pendingCount }),
  setError:        (error) => set({ error }),
}));
```

---

## PART 8 — APP BOOTSTRAP (mobile)

### 8.1 `mobile/app/_layout.tsx` — Root with auth hydration

```typescript
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { getToken, getUser } from '../lib/auth';
import { useAuthStore } from '../store/authStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failCount, error: any) => {
        // Don't retry on auth errors
        if (error?.response?.status === 401) return false;
        if (error?.response?.status === 403) return false;
        return failCount < 2;
      },
      staleTime: 30_000,
    },
  },
});

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const { setAuth } = useAuthStore();

  useEffect(() => {
    // Hydrate auth state from SecureStore on launch
    async function hydrate() {
      try {
        const [token, user] = await Promise.all([getToken(), getUser()]);
        if (token && user) setAuth(user, token);
      } catch (_) {
        // SecureStore read failed — treat as logged out
      } finally {
        setReady(true);
      }
    }
    hydrate();
  }, []);

  if (!ready) return null; // or a splash screen

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
        </Stack>
        <Toast />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
```

### 8.2 `mobile/app/index.tsx` — Auth redirect guard

```typescript
import { Redirect } from 'expo-router';
import { useAuthStore } from '../store/authStore';

export default function Index() {
  const { isAuthenticated } = useAuthStore();
  return <Redirect href={isAuthenticated ? '/(app)' : '/(auth)/login'} />;
}
```

### 8.3 `mobile/app/(app)/_layout.tsx` — Protected layout

```typescript
import { Redirect } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useAutoSync } from '../../hooks/useAutoSync';
import { CustomTabBar } from '../../components/navigation/CustomTabBar';
import { Tabs } from 'expo-router';

export default function AppLayout() {
  const { isAuthenticated } = useAuthStore();
  useAutoSync(); // start sync cycle

  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs tabBar={(props) => <CustomTabBar {...props} />}>
      <Tabs.Screen name="index"    options={{ title: 'Home' }} />
      <Tabs.Screen name="work"     options={{ title: 'Work' }} />
      <Tabs.Screen name="commerce" options={{ title: 'Commerce' }} />
      <Tabs.Screen name="profile"  options={{ title: 'Profile' }} />
    </Tabs>
  );
}
```

---

## PART 9 — FRONTEND INTEGRATION VERIFICATION

The frontend is already connected to the backend. These are the checks to confirm it's working correctly and aligned with the mobile app.

### 9.1 Verify `frontend/src/lib/api.ts`

Confirm this exact pattern exists (not using `fetch`, not hardcoding localhost):

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default api;
```

### 9.2 Verify `frontend/src/contexts/AuthContext.tsx`

The frontend auth context stores the user with `company.type` so role-based rendering works.
Confirm `localStorage` keys match exactly:

```typescript
// Keys used by frontend — must NOT be changed or mobile will use stale data
// (mobile uses SecureStore, not localStorage — they don't share storage)
localStorage.setItem('access_token', data.access_token);
localStorage.setItem('user', JSON.stringify(data.user));
```

### 9.3 Verify `frontend/src/lib/sync.ts`

```typescript
import { synchronize } from '@nozbe/watermelondb/sync';
import api from './api';

export async function syncDatabase(database: any) {
  await synchronize({
    database,
    pullChanges: async ({ lastPulledAt }) => {
      const { data } = await api.get('/sync/pull', {
        params: { last_pulled_at: lastPulledAt },
      });
      return { changes: data.changes, timestamp: data.timestamp };
    },
    pushChanges: async ({ changes, lastPulledAt }) => {
      await api.post('/sync/push', { changes }, {
        params: { last_pulled_at: lastPulledAt },
      });
    },
  });
}
```

---

## PART 10 — RUNNING THE FULL STACK

### 10.1 Start all three simultaneously

```bash
# Terminal 1 — Backend
cd backend
npm run start:dev
# Starts NestJS on http://localhost:3000
# Watch for: "Nest application successfully started"

# Terminal 2 — Frontend
cd frontend
npm run dev
# Starts Vite on http://localhost:5173
# Watch for: "Local: http://localhost:5173"

# Terminal 3 — Mobile
cd mobile
npx expo start
# Press 'i' for iOS Simulator
# Press 'a' for Android Emulator
# Scan QR for physical device
```

### 10.2 Verify the backend is reachable from mobile

```bash
# From terminal (simulates mobile request):
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
# Expected: { "access_token": "eyJ...", "user": { ... } }

# Verify CORS for frontend:
curl -X OPTIONS http://localhost:3000/auth/login \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -v 2>&1 | grep "Access-Control"
# Expected: Access-Control-Allow-Origin: http://localhost:5173
```

### 10.3 End-to-end integration test sequence

Run these in order to verify the entire stack:

```
1. Backend health:         GET  http://localhost:3000/health-check
2. Register contractor:    POST http://localhost:3000/auth/register
3. Verify OTP:             POST http://localhost:3000/auth/verify-otp
4. Login:                  POST http://localhost:3000/auth/login → save token
5. Get profile:            GET  http://localhost:3000/auth/profile  (Bearer token)
6. List projects:          GET  http://localhost:3000/projects       (Bearer token)
7. Sync pull:              GET  http://localhost:3000/sync/pull?last_pulled_at=0
8. Create daily log:       POST http://localhost:3000/daily-logs
9. Frontend login:         http://localhost:5173/login (same credentials)
10. Verify same data:      Project created on web → appears in mobile sync pull
```

---

## PART 11 — CRITICAL INTEGRATION RULES

These are absolute — breaking any of these will cause silent data corruption or auth failures.

### DO
- Mobile sends `push_token` field name (snake_case) to `PATCH /users/push-token`
- Mobile sends `last_pulled_at` in **milliseconds** (not seconds) to sync endpoints
- Mobile uses `FormData` with RN-specific `{ uri, type, name }` object for file fields
- Mobile reads `user.company.type` to determine contractor vs supplier role
- Mobile reads `user.company.id` for all company-scoped API calls (wallets, settings)
- Frontend reads token from `localStorage.getItem('access_token')`
- Both clients use `Authorization: Bearer <token>` header (exactly this format)

### DO NOT
- Do not call `GET /projects/sites` — backend routes it as `projects/:id` with id="sites"
- Do not create invoices from mobile — backend creates them automatically on PO DELIVERED
- Do not push `products` from mobile sync — server silently ignores them
- Do not store JWT in `AsyncStorage` on mobile — use `expo-secure-store` only
- Do not hardcode `localhost:3000` in production builds
- Do not send `Content-Type: multipart/form-data` manually — axios sets the boundary automatically
- Do not call RFQ award as `PATCH /rfqs/:id/bids/:bidId/award` — correct path is `PATCH /rfqs/:rfqId/award/:bidId`
- Do not call notification mark-read as `PATCH` — backend uses `POST /notifications/mark-read/:id`
- Do not exceed 100 req/min per IP — throttler will 429 all requests from that IP

### EXACT ROUTE CORRECTIONS (common mistakes)

| Wrong | Correct |
|---|---|
| `GET /projects/sites` | `GET /projects/:id` (sites embedded) |
| `PATCH /rfqs/:id/bids/:bidId/award` | `PATCH /rfqs/:rfqId/award/:bidId` |
| `PATCH /notifications/:id/read` | `POST /notifications/mark-read/:id` |
| `POST /daily-logs/:id/photos` | `POST /daily-logs/photos` (body: `log_photo_id`) |
| `GET /settings/:companyId` | `GET /settings/company/:companyId` |
| `GET /wallets/:companyId` | `GET /wallets/company/:companyId` |

---

## PART 12 — PRODUCTION DEPLOYMENT CHECKLIST

Before going live, verify every item:

**Backend**
- [ ] `JWT_SECRET` is a cryptographically random 256-bit string (not the dev default)
- [ ] `FRONTEND_URL` and `FRONTEND_URL_PROD` set correctly in production `.env`
- [ ] `DATABASE_URL` points to production PostgreSQL (not dev)
- [ ] S3 bucket policy restricts public read; signed URL expiry set to ≤15 minutes
- [ ] Throttler limits reviewed for expected traffic (default 100 req/min may be too low)
- [ ] `NODE_ENV=production` set

**Frontend**
- [ ] `VITE_API_URL` set to production API URL (not localhost)
- [ ] Build output (`dist/`) served from HTTPS
- [ ] Auth redirect URLs updated for production domain

**Mobile**
- [ ] `EXPO_PUBLIC_API_URL` set to production API URL in EAS build profile
- [ ] `eas.json` has separate `development` / `preview` / `production` profiles with different API URLs
- [ ] Push notification credentials configured in EAS (iOS APNs + Android FCM)
- [ ] `expo-updates` configured for OTA updates (avoid re-submitting to stores for API URL changes)
