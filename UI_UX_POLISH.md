# Construction Connect Mobile — UI/UX Polish & Design Specification
## Phase: Visual Excellence, Glassmorphism System & Progress Intelligence

**Version:** 1.0  
**Depends on:** MOBILE_TECH_SPEC.md (design tokens), MOBILE_IMPLEMENTATION_PLAN.md (build order)  
**Purpose:** This document defines everything the agent needs to make the app feel premium, iconic, and modern — glassmorphism surfaces, the four-tab navigation architecture, progress measurement system, and every screen's polished visual spec.

---

## 1. THE DESIGN LANGUAGE — "FORGED GLASS"

The aesthetic direction is **Forged Glass** — industrial precision meets premium transparency. Think: a professional instrument panel. Dark matter backgrounds, amber energy, glass surfaces that breathe.

Three layers define every screen:

```
Layer 0: Ground (#0D0F0E)          ← the void, the foundation
Layer 1: Surface (#141716)         ← solid cards, list items
Layer 2: Glass                     ← floating panels, nav bar, modals
Layer 3: Amber (#D4920A)           ← energy, action, life
```

Glass surfaces sit above Layer 1 and below Layer 3. They do not replace the existing color tokens — they extend them.

---

## 2. GLASSMORPHISM SYSTEM

### 2.1 Glass Token Definitions

These are the only glass surfaces in the app. Do not create new ones.

```typescript
// mobile/constants/glass.ts
import { Platform } from 'react-native';

export const Glass = {
  // Tab bar, floating headers, modals
  nav: {
    backgroundColor: 'rgba(13, 15, 14, 0.72)',   // ground at 72% opacity
    borderTopColor:  'rgba(42, 46, 43, 0.6)',     // border at 60%
    // BlurView: intensity 80, tint 'dark'
  },

  // Cards that "float" above the surface (project header, stat cards)
  card: {
    backgroundColor: 'rgba(20, 23, 22, 0.60)',   // surface at 60%
    borderColor:     'rgba(54, 59, 55, 0.50)',   // border-2 at 50%
    // BlurView: intensity 40, tint 'dark'
  },

  // Bottom sheets, drawers
  sheet: {
    backgroundColor: 'rgba(28, 31, 29, 0.85)',   // surface-2 at 85%
    borderTopColor:  'rgba(42, 46, 43, 0.80)',
    // BlurView: intensity 60, tint 'dark'
  },

  // Toast messages, banners
  toast: {
    backgroundColor: 'rgba(20, 23, 22, 0.92)',
    borderColor:     'rgba(212, 146, 10, 0.30)',  // amber at 30%
    // BlurView: intensity 50, tint 'dark'
  },

  // Input fields (subtle glass feel)
  input: {
    backgroundColor: 'rgba(28, 31, 29, 0.70)',   // surface-2 at 70%
    borderColor:     'rgba(42, 46, 43, 0.80)',
  },
};
```

### 2.2 Implementation — `expo-blur`

```typescript
// Install: npx expo install expo-blur

// mobile/components/ui/GlassView.tsx
import { BlurView } from 'expo-blur';
import { StyleSheet, ViewStyle } from 'react-native';

interface GlassViewProps {
  variant?: 'nav' | 'card' | 'sheet' | 'toast';
  intensity?: number;
  style?: ViewStyle;
  children: React.ReactNode;
}

export function GlassView({ variant = 'card', intensity, style, children }: GlassViewProps) {
  const config = Glass[variant];
  const blurIntensity = intensity ?? {
    nav: 80, card: 40, sheet: 60, toast: 50
  }[variant];

  return (
    <BlurView
      intensity={blurIntensity}
      tint="dark"
      style={[styles.base, { borderColor: config.borderColor }, style]}
    >
      {/* Tint overlay — BlurView alone isn't dark enough on iOS */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: config.backgroundColor }]} />
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: 12,
  },
});

// Android fallback: BlurView has limited Android support
// On Android, use solid surface-2 with 0.9 opacity
// Check: Platform.OS === 'android' → skip BlurView, use View with glass.card.backgroundColor
```

### 2.3 Amber Glow Effect

Used on primary action buttons, active tab icons, and highlighted cards:

```typescript
// mobile/constants/glass.ts (continued)
export const AmberGlow = {
  // Shadow values for React Native (iOS only — Android ignores elevation glow)
  soft: {
    shadowColor: '#D4920A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,   // Android approximation
  },
  strong: {
    shadowColor: '#D4920A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.40,
    shadowRadius: 20,
    elevation: 12,
  },
  // For the progress bar fill glow
  bar: {
    shadowColor: '#D4920A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.60,
    shadowRadius: 6,
  },
};
```

### 2.4 Ambient Background Texture

Each screen's root background has a subtle noise texture and radial gradient to prevent the flat black feel:

```typescript
// mobile/components/ui/ScreenBackground.tsx
import { LinearGradient } from 'expo-linear-gradient';
// Install: npx expo install expo-linear-gradient

export function ScreenBackground({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.ground }}>
      {/* Ambient radial — amber warmth from top-right */}
      <LinearGradient
        colors={['rgba(212,146,10,0.04)', 'transparent']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 0.6 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}

// Wrap every screen's root View with <ScreenBackground>
// This gives a subtle warmth without competing with content
```

---

## 3. BOTTOM TAB NAVIGATION — FOUR MODULES

### 3.1 Architecture Decision

The app uses **4 tabs only**. No more, no less. Complexity lives inside each module.

```
Tab 1: Home      ← Dashboard + quick actions
Tab 2: Work      ← Projects + Sites + Daily Logs (contractor) / Orders (supplier)
Tab 3: Commerce  ← RFQs + Orders + Marketplace
Tab 4: Profile   ← Profile + Settings + Notifications
```

Role differences are handled within each tab, not by adding/removing tabs.

### 3.2 Tab Bar Visual Spec

The tab bar is the most visible glass surface in the app. It must feel premium.

```
Position:      Fixed bottom, above safe area inset
Height:        64px + safe area bottom inset
Background:    GlassView variant="nav" (BlurView intensity 80)
Border:        1px top, rgba(42,46,43,0.60)
Corner radius: 0 (full width bar)

Tab item layout (per tab):
  - Icon: 24×24
  - Label: 10px, font-body, tracking 0.5
  - Gap between icon and label: 4px
  - Active state:
      Icon: filled variant, color amber (#D4920A)
      Label: color text-1, font weight 600
      Indicator: 2px wide amber pill (20px wide) centered above icon, 4px from top
      AmberGlow.soft on icon container
  - Inactive state:
      Icon: outline variant, color text-3 (#5C5A55)
      Label: color text-3
  - Badge (notifications):
      Position: top-right of icon, offset 4px
      Size: 16×16 minimum, 20×20 for 2-digit counts
      Background: #8B2E2E (error)
      Text: 9px, white, font-body bold
      Max display: 99+
```

### 3.3 Tab Icons (use Ionicons from @expo/vector-icons)

```typescript
// mobile/app/(app)/_layout.tsx

const TABS = [
  {
    name: 'index',
    label: { en: 'Home', ar: 'الرئيسية' },
    icon: { active: 'home', inactive: 'home-outline' },
  },
  {
    name: 'work',
    label: { en: 'Work', ar: 'العمل' },
    icon: { active: 'briefcase', inactive: 'briefcase-outline' },
  },
  {
    name: 'commerce',
    label: { en: 'Commerce', ar: 'التجارة' },
    icon: { active: 'storefront', inactive: 'storefront-outline' },
  },
  {
    name: 'profile',
    label: { en: 'Profile', ar: 'الملف' },
    icon: { active: 'person-circle', inactive: 'person-circle-outline' },
  },
];
```

### 3.4 Tab Press Animation

```typescript
// Tab icon press: spring scale 0.88 → 1.0 on release
// Duration: 200ms, spring config: { damping: 15, stiffness: 300 }
// Haptic: Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) on tab press
// Active indicator: slide in from center with withSpring, width 0→20px
```

### 3.5 Module Contents

**Tab 1 — Home**
```
Routes under /(app)/
  index.tsx          ← Dashboard
  notifications/     ← Full notification center
```

**Tab 2 — Work** (role-aware content, same tab structure)
```
Routes under /(app)/work/
  index.tsx          ← Projects list (contractor) OR Orders list (supplier)
  projects/
    [id].tsx         ← Project detail with progress
    sites/[id].tsx   ← Site detail with progress
  daily-logs/
    index.tsx
    new.tsx
    [id].tsx
```

**Tab 3 — Commerce**
```
Routes under /(app)/commerce/
  index.tsx          ← RFQ list (contractor) OR RFQ feed (supplier)
  rfqs/
    [id].tsx
    new.tsx
  orders/
    index.tsx
    [id].tsx
    delivery.tsx
  marketplace/
    index.tsx
    [id].tsx
  financials/
    index.tsx        ← Invoices + Wallet
```

**Tab 4 — Profile**
```
Routes under /(app)/profile/
  index.tsx          ← Profile + settings
  company.tsx        ← Company info + KYB status
```

---

## 4. PROGRESS BAR SYSTEM — PROJECT & SITE COMPLETION

This is the most business-critical visual feature. Progress must be calculated from real data and displayed consistently across the app.

### 4.1 Progress Calculation Logic

**Project Completion** is a weighted composite of four signals:

```typescript
// mobile/lib/progress.ts

interface ProjectProgressInput {
  // From /projects/:id
  budgetSpent: number;          // sum of all confirmed PO amounts
  budgetTotal: number;          // project.budget
  
  // From /daily-logs?project_id=
  totalLogs: number;            // all submitted daily logs
  
  // From /purchase-orders?project_id=
  totalOrders: number;
  completedOrders: number;      // status === 'COMPLETED' or 'DELIVERED'
  
  // From /rfqs?project_id=
  totalRfqs: number;
  awardedRfqs: number;          // status === 'AWARDED'
  
  // From project itself
  startDate: Date;
  endDate: Date;
}

export function calculateProjectProgress(input: ProjectProgressInput): {
  overall: number;         // 0–100
  budget: number;          // 0–100  (budgetSpent/budgetTotal)
  procurement: number;     // 0–100  (awardedRfqs/totalRfqs)
  delivery: number;        // 0–100  (completedOrders/totalOrders)
  timeline: number;        // 0–100  (elapsed days / total duration)
  breakdown: ProgressBreakdown;
} {
  const budget = input.budgetTotal > 0
    ? Math.min(100, (input.budgetSpent / input.budgetTotal) * 100)
    : 0;

  const procurement = input.totalRfqs > 0
    ? (input.awardedRfqs / input.totalRfqs) * 100
    : 0;

  const delivery = input.totalOrders > 0
    ? (input.completedOrders / input.totalOrders) * 100
    : 0;

  const now = Date.now();
  const start = new Date(input.startDate).getTime();
  const end = new Date(input.endDate).getTime();
  const timeline = end > start
    ? Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100))
    : 0;

  // Weighted overall: delivery is most meaningful signal
  const overall = Math.round(
    budget     * 0.20 +   // 20% weight — budget consumption
    procurement* 0.30 +   // 30% weight — procurement completion
    delivery   * 0.40 +   // 40% weight — actual delivery completion
    timeline   * 0.10     // 10% weight — schedule progress (informational)
  );

  return {
    overall: Math.round(overall),
    budget: Math.round(budget),
    procurement: Math.round(procurement),
    delivery: Math.round(delivery),
    timeline: Math.round(timeline),
    breakdown: { budget, procurement, delivery, timeline },
  };
}
```

**Site Completion** is simpler — based on daily logs and deliveries for that specific site:

```typescript
interface SiteProgressInput {
  // From /daily-logs?project_id=&site_id=
  totalDaysLogged: number;      // count of submitted daily logs
  
  // From /purchase-orders filtered by site delivery address
  ordersDeliveredToSite: number;
  ordersExpectedAtSite: number;
  
  // From site.geofence check-ins (if tracked)
  lastActivityDate: Date | null;
  
  // From project dates (inherited)
  projectStartDate: Date;
  projectEndDate: Date;
}

export function calculateSiteProgress(input: SiteProgressInput): {
  overall: number;
  activity: number;    // how regularly logs are being filed
  deliveries: number;  // materials received vs expected
  daysIdle: number;    // days since last activity
} {
  const activity = input.totalDaysLogged > 0
    ? Math.min(100, (input.totalDaysLogged / 30) * 100)  // normalize to 30-day month
    : 0;

  const deliveries = input.ordersExpectedAtSite > 0
    ? (input.ordersDeliveredToSite / input.ordersExpectedAtSite) * 100
    : 0;

  const daysIdle = input.lastActivityDate
    ? Math.floor((Date.now() - new Date(input.lastActivityDate).getTime()) / 86400000)
    : 999;

  const overall = Math.round(activity * 0.4 + deliveries * 0.6);

  return { overall, activity: Math.round(activity), deliveries: Math.round(deliveries), daysIdle };
}
```

### 4.2 Progress Bar Component

```typescript
// mobile/components/ui/ProgressBar.tsx

interface ProgressBarProps {
  value: number;            // 0–100
  variant?: 'default' | 'segmented' | 'radial';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animated?: boolean;
  label?: string;
  color?: string;           // defaults to amber
}
```

**Visual spec for each variant:**

**`default` (linear)**
```
Track:
  Height: sm=3px, md=6px, lg=8px
  Background: rgba(42,46,43,0.8) — border color
  Border radius: full (999px)
  Width: 100%

Fill:
  Background: linear-gradient from amber-dim (#8A5F06) to amber (#D4920A)
  Border radius: full
  Glow: AmberGlow.bar (shadow on iOS)
  Animation: width 0 → value%, 600ms, ease-out-expo (Easing.bezier(0.16,1,0.3,1))
  Use Reanimated withTiming on mount

Label:
  Shown right of track when showLabel=true
  Format: "72%"
  Font: font-mono, 11px, text-2
```

**`segmented` (multi-signal breakdown)**
```
Used in Project Detail to show 4 sub-metrics side by side.
Each segment is a labeled mini bar:

  [  Budget  ] [Procurement] [ Delivery ] [ Timeline ]
  ████░░░░ 40% ████████ 80%  ██████░ 60%  ███░░░░ 32%

Container: flex-row, gap 8px
Each segment:
  flex: 1
  Label: text-3, 9px uppercase, mb 4px
  Bar: variant="default" size="sm"
  Value: text-2, 10px, mono, mt 2px
```

**`radial` (circular — for dashboard cards)**
```
Used on dashboard stat cards for the "Overall" metric.
Size: 56×56px

SVG circle:
  Track radius: 22px
  Track stroke: 4px, rgba(42,46,43,0.8)
  Fill stroke: 4px, amber gradient (use two arcs or stroke-dasharray trick)
  Fill arc: clockwise from top (12 o'clock)
  Stroke-linecap: round

Center text:
  Value: font-mono bold, 14px, text-1
  Format: "72%"

Animation: strokeDashoffset 0→value, 800ms, ease-out-expo
Use react-native-svg:
  npx expo install react-native-svg
```

### 4.3 Progress Color Scale

Progress value drives color automatically when `color` prop is not set:

```typescript
export function getProgressColor(value: number): string {
  if (value >= 80) return '#3A7D44';  // success green — nearly done
  if (value >= 50) return '#D4920A';  // amber — on track
  if (value >= 25) return '#8A5F06';  // amber-dim — early stage
  return '#5C5A55';                   // text-3 — barely started
}
// Always amber glow regardless of color (the glow is always amber)
```

### 4.4 Alert States on Progress

When progress signals diverge dangerously, show contextual alerts:

```typescript
export function getProgressAlerts(project: ProjectProgressInput): ProgressAlert[] {
  const alerts: ProgressAlert[] = [];
  const p = calculateProjectProgress(project);

  // Budget consumed faster than delivery progress
  if (p.budget > p.delivery + 30) {
    alerts.push({
      type: 'warning',
      message: 'Budget consumption ahead of delivery progress',
      icon: 'warning-outline',
    });
  }

  // Timeline past 75% but delivery under 40%
  if (p.timeline > 75 && p.delivery < 40) {
    alerts.push({
      type: 'error',
      message: 'Schedule risk — delivery behind timeline',
      icon: 'time-outline',
    });
  }

  // No daily logs in 7+ days on an active project
  if (p.delivery < 100 && project.totalLogs === 0) {
    alerts.push({
      type: 'info',
      message: 'No site activity logged yet',
      icon: 'clipboard-outline',
    });
  }

  return alerts;
}
```

---

## 5. SCREEN-BY-SCREEN VISUAL SPEC

### 5.1 Authentication Screens

**Login Screen**
```
Background: ScreenBackground (ground + amber radial top-right)
Layout: centered, px-6, justify-center

Logo area (top 35% of screen):
  App icon: 64×64, rounded-xl, amber on surface-2
  "Construction Connect": font-display, 28px, text-1
  Tagline: font-body, 14px, text-2, mt 4px

Form (middle 40%):
  GlassView variant="card", p-6, rounded-xl
  Inputs: Input component with glass.input style
  Email: icon="mail-outline" left prefix
  Password: icon="lock-closed-outline" left, show/hide toggle right
  "Sign In" button: variant="primary" size="lg", full width, mt 24px
  AmberGlow.soft on button

Bottom 25%:
  "Don't have an account?" text-2 + "Register" link in amber
  
Keyboard behavior: KeyboardAvoidingView, behavior="padding" iOS, "height" Android
```

**OTP Verification Screen**
```
Background: ScreenBackground

Header:
  Back button (ghost, icon only)
  Title: "Verify your account" font-display 24px
  Subtitle: "Code sent to {email}" text-2 14px

OTP Input (custom 6-box):
  6 individual TextInput boxes, each 52×64px
  GlassView variant="input" per box
  Active: border-amber, AmberGlow.soft
  Font: font-mono, 28px, text-1, center
  Auto-advance on digit entry
  Backspace: moves to previous box
  Paste support: splits pasted string into boxes

Resend row:
  "Resend code" ghost button — disabled + countdown "00:45" in amber
  Timer: 60 second countdown, resets on resend
```

---

### 5.2 Dashboard Screen

**Home Tab — Contractor**
```
Background: ScreenBackground

Header (not a nav bar — inline):
  "Good morning, {firstName}" font-display 22px text-1
  Date: text-2 13px
  Notification bell: ghost icon button, badge if unread > 0
  Sync indicator: small dot — green=synced, amber=pending, gray=offline

Stat Cards Row (horizontal scroll, px-6):
  4 cards in a horizontal ScrollView with pagingEnabled-like snapping
  Each card: 160×120px, GlassView variant="card", rounded-xl
  
  Card content:
    Top: Icon 20px text-2 + label text-3 10px uppercase
    Middle: Value font-display 28px text-1
    Bottom: RadialProgress 48×48px right-aligned OR trend "+3 this week" text-2 11px
  
  Cards:
    1. "Projects" — count — ProgressBar radial (overall progress avg)
    2. "RFQs" — open count — trend
    3. "Orders" — pending count — trend  
    4. "Alerts" — unread count — red badge

Quick Action CTA:
  Full-width card, GlassView variant="card" with amber border
  bg: rgba(212,146,10,0.06) (amber tint very subtle)
  Left: clipboard icon 32px, amber
  Text: "Log Today's Site Activity" font-body 16px semibold text-1
        "Tap to start daily report" text-2 12px
  Right: chevron-forward text-2
  AmberGlow.soft

Section: "Active Projects" (contractor) or "Pending Orders" (supplier)
  Section header: text-3 11px uppercase + "See all" amber ghost button
  List of 3 ProjectMiniCards or OrderMiniCards

ProjectMiniCard:
  GlassView variant="card", p-4, rounded-lg
  Row: Project name font-body 15px semibold text-1 + status badge
  ProgressBar variant="default" size="sm" mt 8px
  Row: "{n} sites · {m} orders" text-3 11px
  
Section: "Recent Activity"
  Timeline-style list of last 5 notifications/events
  Each: icon (amber) + text-2 13px + time text-3 11px
```

**Home Tab — Supplier**
```
Same structure, different cards:
  Cards: "Open RFQs" / "Active Orders" / "Revenue" / "Alerts"
  Quick Action: "Browse New RFQs" with storefront icon
  Section: "RFQs Awaiting Quote" — 3 RFQMiniCards
  Section: "Order Updates"
```

---

### 5.3 Work Tab — Projects

**Projects List**
```
Background: ScreenBackground

Header: "Projects" font-display 26px, px-6 pt-safe

Search bar:
  GlassView variant="input", rounded-full, mx-6
  icon="search-outline" text-3 left
  placeholder="Search projects..." text-3

Filter chips (horizontal scroll, px-6, mt 8):
  "All" | "Active" | "On Hold" | "Completed"
  Each chip: 
    Default: bg-surface-2, border-border, text-text-2, radius-full
    Active: bg-amber/10, border-amber/40, text-amber
    Height: 28px, px 12px, font-body 12px

Project Cards (FlashList, px-6, gap 12):
  GlassView variant="card" (elevated on press)
  Padding: 16px

  Header row:
    Project name: font-display 16px text-1 (flex 1)
    Status badge (right)
  
  Progress section (mt 12):
    ProgressBar variant="default" size="md"
    Row below: "{overall}% complete" text-2 11px left + "{n} sites" text-3 11px right
  
  Footer row (mt 12, border-t border-border pt-12):
    Budget: icon="card-outline" text-3 10px + amount text-2 12px
    Orders: icon="cube-outline" text-3 10px + count text-2 12px
    Date: icon="calendar-outline" text-3 10px + end date text-2 12px
  
  Press: scale 0.98, 120ms, ease-out-expo → navigate to detail

FAB:
  56×56, bg-amber, rounded-full, AmberGlow.strong
  "+" icon, color ground, 24px
  Position: bottom-right, 20px from edge, above tab bar
  Press: navigate to create project
```

**Project Detail**
```
Background: ScreenBackground

Hero section (not a separate screen header — inline):
  px-6, pt-safe
  Back button: ghost, icon="chevron-back-outline" text-1
  Project name: font-display 24px text-1 mt 8
  Row: status badge + company name text-2 13px

Progress Overview Card:
  GlassView variant="card" mx-6 mt 16 p-4 rounded-xl
  Title: "Progress" font-body 14px semibold text-2 uppercase letter-spacing 1
  
  Center: Large RadialProgress 72×72 (overall %)
  
  Below: ProgressBar variant="segmented" — 4 metrics:
    Budget / Procurement / Delivery / Timeline

  Alerts row (if any): amber/error alert pills below the bars

  Last updated: "Synced 2 min ago" text-3 10px right

Section: Sites
  SectionHeader "Sites" + count badge
  Each site: SiteMiniCard (see below)

Section: Daily Logs
  SectionHeader "Recent Logs" + "See all"
  Last 3 logs: date + weather icon + status badge + crew count

Section: RFQs
  SectionHeader "RFQs" + "New RFQ" amber button (small)
  List of RFQ status cards

Section: Orders
  SectionHeader "Orders" + count
  FlashList of order status cards
```

**Site Detail**
```
Background: ScreenBackground

Map header (full-width, 200px tall):
  react-native-maps MapView
  Custom marker: amber pin with construction helmet icon
  Geofence polygon: dashed amber border, amber/10 fill
  Overlay: GlassView variant="card" at bottom of map with site name

Site Info Card (below map):
  GlassView variant="card" mx-6 -mt-20 (overlaps map) p-4 rounded-xl
  Site name: font-display 18px text-1
  Address: text-2 13px icon="location-outline"
  Contact: text-2 13px icon="person-outline"
  Phone: text-2 13px icon="call-outline" (tappable → tel:)

Site Progress Card:
  GlassView variant="card" mx-6 mt 12 p-4
  SiteProgress values: Activity + Deliveries bars
  Days idle alert: if daysIdle > 3 → amber warning chip
  "Last log: {date}" text-3 11px

Action buttons row:
  "New Daily Log" variant="primary" size="md" flex-1
  "Navigate" variant="secondary" size="md" flex-1 (opens Apple/Google Maps)
  "New RFQ" variant="outline" size="md" flex-1

Section: Daily Logs (this site only)
Section: Materials Received (deliveries to this site)
```

---

### 5.4 Daily Log New/Edit Screen

```
Background: ScreenBackground
Full-screen modal (presented from bottom, not navigation push)

Handle bar: 4×40px rounded, bg-border-2, centered mt-12

Header:
  "Daily Log" font-display 20px text-1
  Date display: text-2 14px
  Save Draft button: ghost, text-amber, right

Step indicator (custom — not generic tabs):
  4 circles connected by lines
  Active: 24px, bg-amber, white number center, AmberGlow.soft
  Completed: 24px, bg-success, check icon
  Pending: 24px, bg-surface-2, border-border-2, number text-3
  Lines between: 2px, completed=success, pending=border

  Labels below circles: "Overview" "Crew" "Progress" "Materials"
  Font: text-3 9px uppercase

─────── STEP 1: OVERVIEW ───────
Project selector:
  GlassView variant="input" rounded-md p-4
  "Select Project" text-2 if empty, or project name text-1
  icon="chevron-down-outline" right
  Opens: BottomSheet with searchable list

Site selector (appears after project selected):
  Same pattern, filtered by project

Date picker row:
  "Date" label text-2 13px
  Current date: text-1 15px semibold
  icon="calendar-outline" amber right → opens DateTimePicker

Weather card (appears after location known):
  GlassView variant="card" p-4 rounded-lg
  Row: weather condition icon (from OpenWeather icon name) 28px amber + condition name text-1 15px
  Row: temp (large, font-display 32px text-1) + unit
  Grid 2×2: Humidity icon + % | Wind icon + speed | feels-like | UV
  Each: icon text-3 12px + value text-2 13px
  "Refresh" ghost button if stale
  "Enter manually" text link text-3 11px

─────── STEP 2: CREW ───────
Total summary chip (top):
  "{n} workers · {h} hours total" bg-amber/10 border-amber/20 text-amber
  Rounded-full px-12 py-6

Crew list (FlashList):
  Each entry: GlassView variant="card" p-4 rounded-lg
  Row: company name font-body 14px semibold text-1
  Row: trade badge (surface-2 pill) + "{n} workers" text-2 + "{h}h" text-2
  Swipe left: red delete action (reanimated swipeable)

"Add Crew" button:
  variant="secondary" full-width dashed border
  icon="add-outline" left

Add entry bottom sheet:
  GlassView variant="sheet"
  Company input, trade picker, headcount stepper, hours stepper
  Stepper: [-] [value] [+] buttons, amber, no text input for speed

─────── STEP 3: PROGRESS ───────
Notes field:
  GlassView variant="input" p-4 rounded-lg
  Multiline TextInput, min 4 rows, max 8 rows
  placeholder="Describe work completed today..." text-3
  Char counter: text-3 10px bottom-right "0/500"

Photo section:
  Label: "Site Photos" text-2 13px semibold
  Photo grid: 3-column, gap 8px
  Existing photos: 90×90px, rounded-lg, Image component
    Bottom-right: green checkmark if uploaded, amber spinner if uploading
    Long-press: haptic + delete confirm
  Add button: 90×90px, GlassView variant="card" dashed border-amber/40
    icon="camera-outline" amber 28px centered
    tap → expo-camera launch

Full-screen photo viewer (when photo tapped):
  Modal, black background, pinch-to-zoom
  Swipe down to dismiss
  Header overlay: glass with location + timestamp

─────── STEP 4: MATERIALS ───────
Receive Against PO:
  "Select Purchase Order" picker → shows open POs for this project
  If PO selected: items list
    Each item: item name text-1 + ordered qty text-2
    Received qty: numeric input inline (stepper or text)
    Over-delivery: input turns red if received > ordered

Ad-hoc entry:
  "Add Material" button → bottom sheet with name/qty/unit inputs

Delivery photo: same camera component

Submit button area (fixed bottom, glass bg):
  GlassView variant="nav" p-4
  Row: "Save Draft" ghost + "Submit Log" primary size="lg"
  Below: "{n} items pending sync" text-3 10px center (if offline)
```

---

### 5.5 Commerce Tab — RFQs & Orders

**RFQ List**
```
Header: "Commerce" font-display 26px px-6

Segment control:
  "RFQs" | "Orders" | "Marketplace"
  Active segment: bg-amber/10, border-bottom 2px amber
  Inactive: text-text-3

RFQ Cards (FlashList):
  GlassView variant="card" mx-6 p-4 rounded-xl
  Header: RFQ reference + project name text-3 11px
  Title: first item name, truncated, font-display 16px text-1
  Row: category badge + item count badge
  Row: delivery date icon="calendar-outline" text-2 + payment term badge
  Status badge (right-aligned, large)
  
  If OPEN and bids > 0:
    Amber strip at bottom: "{n} bids received — Compare"
    → navigate to bid comparison
  
  If AWARDED:
    Success strip: "Awarded to {supplier}" text-success

Bid Comparison Sheet (bottom sheet, 85% height):
  GlassView variant="sheet"
  
  Header: RFQ name + "Compare Bids" subtitle
  
  Horizontal scroll of bid cards (snap paging):
    Each card: 80% width, GlassView variant="elevated"
    Supplier: avatar + name + rating stars
    Items table: item | qty | unit price | subtotal
    Delivery cost + total row: amber, font-display
    Delivery date: date badge
    Notes: italic text-2 12px
    Validity: "Valid {n}h remaining" amber if < 12h, text-3 if longer
    
    Action buttons:
      "Award" variant="primary" full-width AmberGlow.soft
      "Reject" variant="ghost" text-error
  
  Rejection reason bottom sheet (when reject pressed):
    Reason options as pill selections:
      "Price too high" | "Delivery too late" | "Wrong specifications" | "Found better supplier"
    Text field for custom reason
    "Confirm Rejection" variant="danger"
```

**Order Detail**
```
Header: "Order #{number}" + status badge

Status Timeline (vertical, custom component):
  Each step:
    Circle: 16px, filled=success, active=amber+glow, pending=border
    Label: text-1 13px semibold
    Timestamp: text-3 11px
    Connecting line: 2px, solid=completed, dashed=pending
  
  Steps: Confirmed → Processing → Out for Delivery → Delivered → Completed

Items section:
  GlassView variant="card" p-4
  Each item: name text-1 + ordered qty text-2 + received qty text-success (if delivered)

Supplier card:
  GlassView variant="card" p-4
  Avatar + company name + contact info
  "Call" and "Message" ghost buttons
```

---

### 5.6 Profile Tab

```
Background: ScreenBackground

Avatar section (top, centered):
  Avatar: 80×80px, company logo or initials
  Ring: 2px amber border with AmberGlow.soft
  Name: font-display 20px text-1 mt 12
  Role badge: pill, text-3 background
  Company: text-2 14px
  KYB badge: "Verified" success or "Pending" warning

Sync Status Card:
  GlassView variant="card" mx-6 mt 16 p-4
  Row: icon="sync-outline" amber + "Sync Status" text-1 semibold
  Row: last synced timestamp text-2
  Row: pendingCount > 0 → amber "{n} changes pending" | 0 → green "All synced"
  "Sync Now" button variant="secondary" size="sm" right

Settings sections (grouped):
  Section: Preferences
    Language: toggle EN / AR (row with flag emojis)
    Notifications: toggle switch (amber when on)
    
  Section: Account
    Company Profile → navigate
    Change Password → navigate
    
  Section: App
    App version: text-3 (non-interactive)
    Help & Support → web browser
    
  Sign Out:
    Full-width variant="danger" size="lg" mt 24
    Confirmation: "Are you sure?" bottom sheet
```

---

## 6. COMPONENT IMPLEMENTATION DETAILS

### 6.1 RadialProgress Component

```typescript
// mobile/components/ui/RadialProgress.tsx
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, { useAnimatedProps, withTiming, useSharedValue, useEffect } from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface RadialProgressProps {
  value: number;       // 0-100
  size?: number;       // default 56
  strokeWidth?: number; // default 4
  color?: string;
}

export function RadialProgress({ value, size = 56, strokeWidth = 4, color }: RadialProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressValue = useSharedValue(0);

  useEffect(() => {
    progressValue.value = withTiming(value, {
      duration: 800,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    });
  }, [value]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progressValue.value / 100),
  }));

  const fillColor = color ?? getProgressColor(value);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Defs>
          <LinearGradient id="amberGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#8A5F06" />
            <Stop offset="100%" stopColor="#D4920A" />
          </LinearGradient>
        </Defs>
        {/* Track */}
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke="rgba(42,46,43,0.8)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress fill */}
        <AnimatedCircle
          cx={size / 2} cy={size / 2} r={radius}
          stroke="url(#amberGrad)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
        />
      </Svg>
      {/* Center label */}
      <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontFamily: Fonts.mono, fontSize: size * 0.22, color: Colors.text1 }}>
          {value}%
        </Text>
      </View>
    </View>
  );
}
```

### 6.2 Animated ProgressBar Component

```typescript
// mobile/components/ui/ProgressBar.tsx
export function ProgressBar({ value, size = 'md', showLabel, animated = true, color }: ProgressBarProps) {
  const width = useSharedValue(0);
  const fillColor = color ?? getProgressColor(value);

  useEffect(() => {
    width.value = withTiming(value, {
      duration: animated ? 600 : 0,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    });
  }, [value]);

  const heights = { sm: 3, md: 6, lg: 8 };
  const h = heights[size];

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View style={{
        flex: 1, height: h, borderRadius: 999,
        backgroundColor: 'rgba(42,46,43,0.8)',
        overflow: 'hidden',
      }}>
        <Animated.View style={[
          animatedStyle,
          {
            height: '100%',
            borderRadius: 999,
            backgroundColor: fillColor,
            // Glow — iOS only
            shadowColor: '#D4920A',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.5,
            shadowRadius: 4,
          }
        ]} />
      </View>
      {showLabel && (
        <Text style={{ fontFamily: Fonts.mono, fontSize: 11, color: Colors.text2, minWidth: 32 }}>
          {value}%
        </Text>
      )}
    </View>
  );
}
```

### 6.3 Custom Tab Bar

Replace Expo Router's default tab bar with a fully custom component:

```typescript
// mobile/components/navigation/CustomTabBar.tsx
import { GlassView } from '../ui/GlassView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';

export function CustomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <GlassView
      variant="nav"
      style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        paddingBottom: insets.bottom,
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        borderLeftWidth: 0,
        borderRightWidth: 0,
        borderBottomWidth: 0,
      }}
    >
      <View style={{ flexDirection: 'row', height: 64 }}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const tab = TABS[index];
          
          return (
            <TabItem
              key={route.key}
              tab={tab}
              isFocused={isFocused}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate(route.name);
              }}
            />
          );
        })}
      </View>
    </GlassView>
  );
}

function TabItem({ tab, isFocused, onPress }) {
  const scale = useSharedValue(1);
  const indicatorWidth = useSharedValue(isFocused ? 20 : 0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const indicatorStyle = useAnimatedStyle(() => ({
    width: withSpring(isFocused ? 20 : 0, { damping: 15, stiffness: 300 }),
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.88); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
    >
      {/* Active indicator pill */}
      <Animated.View style={[
        { height: 2, borderRadius: 999, backgroundColor: Colors.amber, marginBottom: 6 },
        indicatorStyle,
      ]} />
      <Animated.View style={[animatedStyle, { alignItems: 'center', gap: 4 }]}>
        <Ionicons
          name={isFocused ? tab.icon.active : tab.icon.inactive}
          size={24}
          color={isFocused ? Colors.amber : Colors.text3}
          style={isFocused ? AmberGlow.soft : undefined}
        />
        <Text style={{
          fontFamily: Fonts.body,
          fontSize: 10,
          letterSpacing: 0.5,
          color: isFocused ? Colors.text1 : Colors.text3,
          fontWeight: isFocused ? '600' : '400',
        }}>
          {tab.label[currentLang]}
        </Text>
      </Animated.View>
    </Pressable>
  );
}
```

---

## 7. MICRO-INTERACTIONS & HAPTICS MAP

Every interaction has a specific haptic feedback and animation. This table is the implementation contract:

| Interaction | Animation | Haptic |
|---|---|---|
| Tab press | Spring scale 0.88→1 | Light |
| Primary button press | Scale 0.98, 120ms | Light |
| Danger button press | Scale 0.98, 120ms | Medium |
| Card press (navigate) | Scale 0.97, 150ms | Light |
| Swipe-to-delete reveal | Translate X reanimated | None |
| Delete confirm | Shake animation on row | Heavy |
| Form submit success | Fade out + scale 0.95 | Success (notificationSuccess) |
| Form submit error | Horizontal shake ±6px, 3 cycles | Error |
| Photo capture | Flash overlay (white 0→1→0, 100ms) | Medium |
| Bid award | Confetti burst + scale 1→1.05→1 | Success |
| Sync complete | OfflineBanner slides up and fades | None |
| OTP digit entry | Scale 1→1.15→1 per box | Selection (tick) |
| Pull-to-refresh | Standard + amber spinner | Light on trigger |
| Bottom sheet open | Slide up + blur fade in | None |
| Bottom sheet close | Slide down + blur fade out | None |

---

## 8. SKELETON LOADING SYSTEM

Every screen that loads data shows a skeleton that matches the real layout exactly — no spinner-only states.

```typescript
// mobile/components/ui/Skeleton.tsx
// Animated shimmer: bg-surface-2 with a sliding white gradient from left to right
// Duration: 1200ms, repeat: infinite, easing: ease-in-out
// Use LinearGradient from expo-linear-gradient as the shimmer overlay
// Width: 40% of container, fully traverses in 1200ms

// Skeletons to build:
//   ProjectCardSkeleton     — matches ProjectCard exact layout
//   OrderCardSkeleton       — matches OrderCard
//   RFQCardSkeleton         — matches RFQCard
//   DashboardSkeleton       — 4 stat cards + CTA + 3 list items
//   StatCardSkeleton        — 160×120 glass card with shimmer
//   ListItemSkeleton        — single list row with shimmer
```

---

## 9. EMPTY STATES

Every list has a curated empty state that's contextual and actionable:

| Screen | Icon | Title | Subtitle | Action |
|---|---|---|---|---|
| Projects | `construct-outline` | "No Projects Yet" | "Create your first project to start tracking progress" | "New Project" primary button |
| Daily Logs | `clipboard-outline` | "No Logs Today" | "Tap below to document today's site activity" | "Start Daily Log" primary CTA |
| RFQs | `document-text-outline` | "No RFQs Open" | "Create a request for quotation to invite supplier bids" | "New RFQ" primary button |
| Orders | `cube-outline` | "No Orders" | "Orders are created when you award an RFQ bid" | "Go to RFQs" outline button |
| RFQ Feed (supplier) | `megaphone-outline` | "No Matching RFQs" | "New requests that match your catalog will appear here" | "Update Catalog" ghost button |
| Notifications | `notifications-off-outline` | "All Caught Up" | "No new notifications" | — |
| Search results | `search-outline` | "No Results" | "Try a different search term" | "Clear Search" ghost |

Empty state layout:
```
Icon: 64px, text-3, centered
Title: font-display 20px text-1 mt-16 text-center
Subtitle: font-body 14px text-2 mt-8 text-center px-32
Action button: mt-24
```

---

## 10. ADDITIONAL PACKAGES REQUIRED FOR THIS PHASE

```bash
npx expo install \
  expo-blur \
  expo-linear-gradient \
  react-native-svg \
  react-native-safe-area-context \
  @shopify/flash-list
```

These are in addition to packages listed in MOBILE_TECH_SPEC.md.

---

## 11. FILE ADDITIONS TO MONOREPO STRUCTURE

New files required by this document (add to structure in MOBILE_TECH_SPEC.md Section 3):

```
/mobile
  /constants
    glass.ts              ← Glass tokens, AmberGlow definitions (Section 2.1-2.3)
  /components
    /ui
      GlassView.tsx       ← BlurView wrapper (Section 2.2)
      ProgressBar.tsx     ← linear + segmented variants (Section 4.2, 6.2)
      RadialProgress.tsx  ← SVG circular progress (Section 4.2, 6.1)
      Skeleton.tsx        ← shimmer loader system (Section 8)
      ScreenBackground.tsx← ambient gradient wrapper (Section 2.4)
    /navigation
      CustomTabBar.tsx    ← glass bottom tab bar (Section 3.2, 6.3)
    /progress
      ProjectProgressCard.tsx   ← composite progress display (Section 4.4)
      SiteProgressCard.tsx      ← site-level progress (Section 4.1)
      ProgressAlertChip.tsx     ← inline alert pill (Section 4.4)
  /lib
    progress.ts           ← all calculation functions (Section 4.1)
```

---

## 12. IMPLEMENTATION ORDER FOR THIS PHASE

Build in this sequence (each step depends on the previous):

```
1. Install new packages (Section 10)
2. constants/glass.ts         ← tokens before any component
3. components/ui/GlassView.tsx
4. components/ui/ScreenBackground.tsx
5. lib/progress.ts            ← pure functions, no dependencies
6. components/ui/ProgressBar.tsx
7. components/ui/RadialProgress.tsx
8. components/ui/Skeleton.tsx
9. components/navigation/CustomTabBar.tsx
10. components/progress/ProjectProgressCard.tsx
11. components/progress/SiteProgressCard.tsx
12. Update all screens with new visual spec (Section 5)
13. Add micro-interactions to all interactive elements (Section 7)
14. Add skeleton states to all loading screens (Section 8)
15. Add empty states to all list screens (Section 9)
```

---

## 13. SIGN-OFF CHECKLIST FOR THIS PHASE

Before marking UI/UX polish complete:

- [ ] Tab bar is glass, animated, 4 tabs only — correct icons and labels
- [ ] All screens use ScreenBackground (no flat pure-black root views)
- [ ] Glass cards have correct blur intensity (test on physical device — simulator does not accurately render BlurView)
- [ ] Android fallback for BlurView tested (solid surface-2 at 0.9 opacity)
- [ ] All progress bars animate on mount (not instant)
- [ ] Project progress shows all 4 segments with correct calculated values
- [ ] Site progress shows activity + delivery bars + idle warning
- [ ] Every list has a skeleton loader (never a blank white flash)
- [ ] Every list has an empty state (never "undefined" or raw blank)
- [ ] Every interactive element has correct haptic feedback
- [ ] AmberGlow.soft appears on primary buttons and active tab icons (test on device — shadows invisible on simulator)
- [ ] RTL: tab bar labels flip to Arabic correctly, no layout breaks
- [ ] RadialProgress animates smoothly from 0 on first render
- [ ] Progress alerts appear correctly for divergent signals (test with mock data: budget=90, delivery=20)
- [ ] All fonts load before first render (use expo-font useFonts hook, show splash until ready)
