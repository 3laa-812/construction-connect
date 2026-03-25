# 🎨 Design Sprint — Frontend & Mobile UI/UX 2026
> **Scope:** `frontend/` (Vite + React + Tailwind) · `mobile/` (Expo + React Native)
> **Goal:** Transform both apps into a world-class, award-worthy product UI — the kind that wins Awwwards and gets featured on Mobbin
> **Stack constraints:** Tailwind CSS (web) · StyleSheet / NativeWind (mobile) · No new UI libraries unless specified
> **One commit per section**, prefix shown at each section header

---

## Design Direction & System

Before touching a single file, internalize this brief:

**This is a construction B2B platform for Egypt & Saudi Arabia.** The users are procurement engineers, site superintendents, and building material suppliers. They are serious professionals, not consumers. The aesthetic must communicate **trust, precision, and operational power** — not playful SaaS.

### The Visual Identity

**Aesthetic:** Industrial Precision — think the interior of a Rolls-Royce factory, not a Silicon Valley startup. Raw material textures meeting surgical clarity. Heavy typography, disciplined grids, amber/gold as a warm accent against deep neutral surfaces.

**Web palette (dark-first):**
```css
--color-ground:     #0D0F0E;   /* near-black with green undertone — concrete */
--color-surface:    #141716;   /* card / panel backgrounds */
--color-surface-2:  #1C1F1D;   /* elevated surfaces */
--color-border:     #2A2E2B;   /* subtle dividers */
--color-border-2:   #363B37;   /* stronger borders */
--color-amber:      #D4920A;   /* primary accent — molten steel */
--color-amber-dim:  #8A5F06;   /* muted amber for secondary states */
--color-amber-glow: rgba(212,146,10,0.12); /* ambient glow */
--color-text-1:     #F0EDE8;   /* primary text — warm white */
--color-text-2:     #9A9890;   /* secondary text */
--color-text-3:     #5C5A55;   /* placeholder / disabled */
--color-success:    #2D7A4F;   /* delivered / completed */
--color-warning:    #B87333;   /* copper — processing / pending */
--color-danger:     #8B2E2E;   /* rejected / error */
--color-info:       #2E5A8B;   /* informational */
```

**Mobile palette (lighter, field-readable in sunlight):**
```ts
const colors = {
  ground:    '#F5F3EF',   // warm off-white — paper
  surface:   '#FFFFFF',
  surface2:  '#F0EDE8',
  border:    '#DDD9D2',
  amber:     '#C4820A',   // slightly deeper for contrast on light bg
  amberSoft: '#FFF3D6',   // amber tint for backgrounds
  text1:     '#1A1816',   // near-black warm
  text2:     '#6B6560',
  text3:     '#A8A39D',
  success:   '#1D6B3E',
  warning:   '#A0622A',
  danger:    '#7A2020',
}
```

**Typography:**
- Web display / headings: `"DM Serif Display"` (Google Fonts) — old-money editorial weight
- Web body / UI: `"Geist Mono"` for data, numbers, IDs · `"Geist"` for prose
- Mobile headings: `"Fraunces"` (Google Fonts, variable) — warm, authoritative
- Mobile body: `"DM Sans"` — clean, high legibility in outdoor sunlight

**Motion principle:** Purposeful and fast. 150ms for micro-interactions, 250ms for panel transitions, 400ms for page entrances. Use `ease-out` everywhere. No bouncing, no springy playfulness — this is industrial software.

**Spacing scale:** 4px base. Use multiples: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96.

**Border radius:** Restrained. Cards: 8px. Buttons: 6px. Inputs: 6px. Badges: 4px. Avoid rounded-full except for avatars.

---

## SECTION 1 — Design Tokens & Global Styles
**Commit:** `design(tokens): establish global design system`

### 1.1 — Web: CSS custom properties

Create `frontend/src/styles/tokens.css`. Import it in `frontend/src/index.css` before all other styles:

```css
/* frontend/src/styles/tokens.css */
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500&display=swap');

:root {
  /* Colors */
  --ground:      #0D0F0E;
  --surface:     #141716;
  --surface-2:   #1C1F1D;
  --border:      #2A2E2B;
  --border-2:    #363B37;
  --amber:       #D4920A;
  --amber-dim:   #8A5F06;
  --amber-glow:  rgba(212,146,10,0.12);
  --text-1:      #F0EDE8;
  --text-2:      #9A9890;
  --text-3:      #5C5A55;
  --success:     #2D7A4F;
  --success-bg:  rgba(45,122,79,0.12);
  --warning:     #B87333;
  --warning-bg:  rgba(184,115,51,0.12);
  --danger:      #8B2E2E;
  --danger-bg:   rgba(139,46,46,0.12);
  --info:        #2E5A8B;
  --info-bg:     rgba(46,90,139,0.12);

  /* Typography */
  --font-display: 'DM Serif Display', Georgia, serif;
  --font-body:    'Geist', system-ui, sans-serif;
  --font-mono:    'Geist Mono', 'Fira Code', monospace;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;

  /* Radii */
  --radius-sm: 4px;
  --radius:    6px;
  --radius-md: 8px;
  --radius-lg: 12px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.4);
  --shadow:    0 2px 8px rgba(0,0,0,0.5), 0 0 0 1px var(--border);
  --shadow-lg: 0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px var(--border);
  --shadow-amber: 0 0 0 1px var(--amber-dim), 0 4px 16px rgba(212,146,10,0.2);

  /* Transitions */
  --ease: cubic-bezier(0.16, 1, 0.3, 1);
  --duration-fast: 120ms;
  --duration: 200ms;
  --duration-slow: 350ms;
}

* { box-sizing: border-box; margin: 0; }

html { background: var(--ground); color: var(--text-1); }

body {
  font-family: var(--font-body);
  font-size: 14px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  background: var(--ground);
  /* Subtle noise texture for depth */
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
}

/* Scrollbar */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: var(--surface); }
::-webkit-scrollbar-thumb { background: var(--border-2); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--text-3); }

/* Selection */
::selection { background: var(--amber-glow); color: var(--amber); }

/* Focus ring */
:focus-visible {
  outline: 2px solid var(--amber);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}
```

### 1.2 — Web: Tailwind config

Update `frontend/tailwind.config.js` to extend with the design tokens:

```js
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
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
        display: ['"DM Serif Display"', 'Georgia', 'serif'],
        body: ['"Geist"', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', 'monospace'],
      },
      borderRadius: {
        sm: '4px', DEFAULT: '6px', md: '8px', lg: '12px',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
};
```

### 1.3 — Mobile: Design tokens file

Create `mobile/constants/tokens.ts`:

```ts
export const colors = {
  ground:    '#F5F3EF',
  surface:   '#FFFFFF',
  surface2:  '#F0EDE8',
  border:    '#DDD9D2',
  border2:   '#CAC5BC',
  amber:     '#C4820A',
  amberSoft: '#FFF3D6',
  amberDeep: '#7A5005',
  text1:     '#1A1816',
  text2:     '#6B6560',
  text3:     '#A8A39D',
  success:   '#1D6B3E',
  successBg: '#E8F5EE',
  warning:   '#A0622A',
  warningBg: '#FFF0E0',
  danger:    '#7A2020',
  dangerBg:  '#FDEAEA',
  info:      '#1E4D7A',
  infoBg:    '#E8F0FA',
};

export const spacing = {
  1: 4, 2: 8, 3: 12, 4: 16, 5: 20,
  6: 24, 8: 32, 10: 40, 12: 48, 16: 64,
};

export const radius = {
  sm: 4, base: 6, md: 8, lg: 12, xl: 16,
};

export const shadows = {
  sm: {
    shadowColor: '#1A1816',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#1A1816',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#1A1816',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const typography = {
  displayLg:  { fontFamily: 'Fraunces_700Bold',   fontSize: 32, lineHeight: 38 },
  displayMd:  { fontFamily: 'Fraunces_600SemiBold', fontSize: 24, lineHeight: 30 },
  displaySm:  { fontFamily: 'Fraunces_500Medium',  fontSize: 20, lineHeight: 26 },
  headingLg:  { fontFamily: 'DMSans_600SemiBold',  fontSize: 18, lineHeight: 24 },
  headingMd:  { fontFamily: 'DMSans_600SemiBold',  fontSize: 16, lineHeight: 22 },
  headingSm:  { fontFamily: 'DMSans_500Medium',    fontSize: 14, lineHeight: 20 },
  bodyLg:     { fontFamily: 'DMSans_400Regular',   fontSize: 16, lineHeight: 24 },
  bodyMd:     { fontFamily: 'DMSans_400Regular',   fontSize: 14, lineHeight: 20 },
  bodySm:     { fontFamily: 'DMSans_400Regular',   fontSize: 12, lineHeight: 16 },
  label:      { fontFamily: 'DMSans_500Medium',    fontSize: 11, lineHeight: 14, letterSpacing: 0.8, textTransform: 'uppercase' as const },
  mono:       { fontFamily: 'SpaceMono_400Regular', fontSize: 13, lineHeight: 18 },
};
```

---

## SECTION 2 — Web: Core Component Library
**Commit:** `design(components): build core component library`

Create `frontend/src/components/ui/` directory. Every component below goes in its own file.

### 2.1 — Button

```tsx
// frontend/src/components/ui/Button.tsx
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg';

const base = `
  inline-flex items-center justify-center gap-2 font-body font-medium
  transition-all duration-[120ms] ease-out-expo cursor-pointer
  disabled:opacity-40 disabled:cursor-not-allowed select-none
  focus-visible:ring-2 focus-visible:ring-amber focus-visible:ring-offset-2
  focus-visible:ring-offset-ground
`;

const variants = {
  primary:   'bg-amber text-ground hover:bg-[#E0A020] active:scale-[0.98] shadow-[0_1px_0_rgba(255,255,255,0.1)_inset]',
  secondary: 'bg-surface-2 text-text-1 border border-border-2 hover:border-amber/40 hover:bg-[#1F2420] active:scale-[0.98]',
  ghost:     'text-text-2 hover:text-text-1 hover:bg-surface-2 active:scale-[0.98]',
  danger:    'bg-[#8B2E2E] text-[#F0EDE8] hover:bg-[#A03535] active:scale-[0.98]',
  outline:   'border border-amber/40 text-amber hover:bg-amber-glow active:scale-[0.98]',
};

const sizes = {
  sm: 'h-7 px-3 text-xs rounded-sm',
  md: 'h-9 px-4 text-sm rounded',
  lg: 'h-11 px-6 text-sm rounded-md',
};
```

### 2.2 — Card

```tsx
// frontend/src/components/ui/Card.tsx
// Three variants:
// <Card> — standard surface card with border
// <Card elevated> — stronger shadow, subtle amber border on hover
// <Card flat> — no shadow, just border
```

Standard card styles:
```css
background: var(--surface);
border: 1px solid var(--border);
border-radius: var(--radius-md);
transition: border-color 200ms ease-out;
```
Hover on elevated: `border-color: var(--amber-dim)` + `box-shadow: var(--shadow-amber)`.

### 2.3 — Badge / Status chip

```tsx
// frontend/src/components/ui/Badge.tsx
// Maps status strings to visual treatment

const statusMap = {
  OPEN:             { label: 'Open',           dot: '#D4920A', bg: 'rgba(212,146,10,0.12)',  text: '#D4920A'  },
  CONFIRMED:        { label: 'Confirmed',       dot: '#2E5A8B', bg: 'rgba(46,90,139,0.12)',   text: '#6B9DD4'  },
  PROCESSING:       { label: 'Processing',      dot: '#B87333', bg: 'rgba(184,115,51,0.12)',  text: '#D4924A'  },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery',dot: '#8A6BBF', bg: 'rgba(138,107,191,0.12)', text: '#A98FD4'  },
  DELIVERED:        { label: 'Delivered',       dot: '#2D7A4F', bg: 'rgba(45,122,79,0.12)',   text: '#4CAF7A'  },
  COMPLETED:        { label: 'Completed',       dot: '#2D7A4F', bg: 'rgba(45,122,79,0.08)',   text: '#4CAF7A'  },
  AWARDED:          { label: 'Awarded',         dot: '#D4920A', bg: 'rgba(212,146,10,0.12)',  text: '#D4920A'  },
  REJECTED:         { label: 'Rejected',        dot: '#8B2E2E', bg: 'rgba(139,46,46,0.12)',   text: '#C45A5A'  },
  PENDING:          { label: 'Pending KYB',     dot: '#9A9890', bg: 'rgba(154,152,144,0.12)', text: '#9A9890'  },
};

// Render: small pulsing dot + label in a pill
// Dot pulses (CSS animation) for active states (OPEN, PROCESSING, OUT_FOR_DELIVERY)
```

### 2.4 — Data table

```tsx
// frontend/src/components/ui/DataTable.tsx
// Styled table with:
// - Sticky header (position: sticky, top: 0, z-index: 10)
// - Header: bg var(--surface-2), border-bottom var(--border-2)
// - Font-mono for numeric columns
// - Row hover: bg var(--surface-2) with 150ms transition
// - Alternating rows: even rows get rgba(255,255,255,0.015) tint
// - Sortable columns: show ↑↓ chevron with amber highlight on active column
// - Skeleton loading rows (animated shimmer)
// - Empty state slot
```

### 2.5 — Input / Form fields

```tsx
// frontend/src/components/ui/Input.tsx
// Base styles:
// background: var(--surface-2)
// border: 1px solid var(--border-2)
// border-radius: var(--radius)
// color: var(--text-1)
// height: 36px (sm) | 40px (md) | 44px (lg)
// padding: 0 12px
// font-family: var(--font-body)
// font-size: 13px

// Focus: border-color: var(--amber), box-shadow: 0 0 0 3px var(--amber-glow)
// Error: border-color: #8B2E2E, box-shadow: 0 0 0 3px rgba(139,46,46,0.15)
// Label: font-size 11px, font-weight 500, letter-spacing 0.5px, color var(--text-2), margin-bottom 6px
// Helper text: font-size 11px, color var(--text-3)
// Error text: font-size 11px, color #C45A5A

// <Select> same styles, custom dropdown arrow (SVG chevron in amber)
// <Textarea> min-height 80px, resize: vertical
```

### 2.6 — Modal / Dialog

```tsx
// frontend/src/components/ui/Modal.tsx
// Backdrop: rgba(0,0,0,0.7) with backdrop-filter: blur(4px)
// Panel: bg var(--surface), border var(--border-2), border-radius var(--radius-lg)
// Max-width: 480px (sm) | 600px (md) | 760px (lg)
// Entrance animation: translate3d(0, 12px, 0) → translate3d(0, 0, 0) + opacity 0→1, 250ms ease-out-expo
// Header: padding 20px 24px, border-bottom var(--border)
// Title: font-display, 18px, color var(--text-1)
// Body: padding 24px
// Footer: padding 16px 24px, border-top var(--border), flex row justify-end gap-2
```

### 2.7 — Toast notifications

```tsx
// frontend/src/components/ui/Toast.tsx
// Position: bottom-right, 16px from edges
// Stack vertically with 8px gap
// Each toast: bg var(--surface-2), border var(--border-2), border-radius var(--radius-md)
// Left border: 3px solid (amber=success, #C45A5A=error, var(--warning)=warning, var(--info)=info)
// Icon + message text + dismiss X button
// Entrance: slide in from right (translateX 100%→0) + opacity 0→1, 250ms
// Auto-dismiss after 4s with progress bar on bottom edge
// Progress bar color matches left border color
```

---

## SECTION 3 — Web: Navigation & Layout
**Commit:** `design(layout): sidebar, topbar, and page shell`

### 3.1 — Sidebar

Replace the existing sidebar in `frontend/src/components/layout/Sidebar.tsx`:

**Structure:**
```
┌─────────────────┐
│  ◈ Construction │  ← Logo mark + wordmark
│    Connect      │
├─────────────────┤
│  [Project dropdown] │  ← Active project selector
├─────────────────┤
│  Navigation     │
│  ─────────────  │
│  ◉ Dashboard    │  ← Active: left 2px amber bar + amber text + amber glow bg
│  ○ RFQs         │
│  ○ Orders       │
│  ○ Suppliers    │
│  ○ Financials   │
│  ○ Projects     │
├─────────────────┤
│  ─────────────  │
│  ○ Admin        │  ← Only for ADMIN role
│  ○ Team         │
├─────────────────┤
│  [User card]    │  ← Avatar + name + role badge + logout
└─────────────────┘
```

**Visual specs:**
- Width: 220px (collapsed: 56px — icon only with tooltip)
- Background: `var(--surface)` with right border `1px solid var(--border)`
- Logo mark: geometric diamond shape in amber SVG
- Nav items: 36px height, 8px horizontal padding, 4px border-radius, 14px body font
- Active state: `background: rgba(212,146,10,0.08)`, `border-left: 2px solid var(--amber)`, `color: var(--amber)`, `padding-left: calc(original - 2px)`
- Hover: `background: var(--surface-2)`, smooth 120ms
- Icons: 16px, Lucide icons, color inherits from text
- Section labels: 10px, letter-spacing 1px, uppercase, `var(--text-3)`, margin-top 16px
- Project dropdown: styled select with project name + a dot indicating status

### 3.2 — Top bar

`frontend/src/components/layout/TopBar.tsx`:

```
┌────────────────────────────────────────────────────────┐
│ Breadcrumb > Page Title     [Search] [Notif] [Sync]   │
└────────────────────────────────────────────────────────┘
```

- Height: 52px
- Background: `var(--ground)` with `border-bottom: 1px solid var(--border)`
- `backdrop-filter: blur(8px)` + `position: sticky; top: 0; z-index: 40`
- Page title: 16px, `font-display`, `var(--text-1)`
- Breadcrumb: 12px, `var(--text-3)`, separator `/`
- Global search: 280px wide input with `⌘K` shortcut badge
- Notification bell: badge with unread count (amber pill)
- Sync indicator: animated icon when syncing

### 3.3 — Page shell

`frontend/src/components/layout/PageShell.tsx`:

```tsx
// Wraps every page with consistent:
// - Page header (title + subtitle + right-side action buttons)
// - Content area with correct padding (24px)
// - Responsive max-width (1280px)

// Page header:
// Title: font-display, 24px
// Subtitle: 13px, var(--text-2), max-width 480px
// Divider: 1px solid var(--border), margin-bottom 24px
```

---

## SECTION 4 — Web: Dashboard Page
**Commit:** `design(dashboard): metrics, activity feed, and KPIs`

Redesign `frontend/src/pages/Dashboard.tsx` completely.

### Layout: asymmetric 3-column grid

```
┌─────────────────────────────────────────────────────────┐
│  [KPI Card] [KPI Card] [KPI Card] [KPI Card]            │  ← Row 1: 4 metrics
├──────────────────────────┬──────────────────────────────┤
│                          │                              │
│   Active RFQs table      │   Recent Activity feed       │  ← Row 2: 60/40 split
│   (last 5 open)          │   (timeline)                 │
│                          │                              │
├──────────────────────────┴──────────────────────────────┤
│   Order Pipeline (horizontal status bar chart)          │  ← Row 3: full width
└─────────────────────────────────────────────────────────┘
```

### KPI Cards

Each card (`<KPICard>`):
```
┌──────────────────────────┐
│  [Icon]    +12% ↑        │  ← trend badge
│                          │
│  142                     │  ← large number, font-mono 36px
│  Active Orders           │  ← label, 11px uppercase
│                          │
│  ─────────────────────── │  ← mini sparkline (7-day trend)
│  vs 127 last week        │  ← comparison, var(--text-3)
└──────────────────────────┘
```

The 4 KPIs: Active Orders · Open RFQs · Pending Invoices (SAR/EGP total) · Materials Delivered This Month.

Sparkline: thin amber line, 40px tall, 7 data points, no axes — pure shape.

### Activity feed

Timeline list of recent events, newest at top:
```
  ● [amber dot]  RFQ #4421 received 3 bids          [2h ago]
  ─ [line]       Order #PO-0089 marked Delivered     [5h ago]
  ─              Ahmed Al-Rashidi joined the team     [Yesterday]
  ─              Invoice #INV-0044 auto-generated     [Yesterday]
```

Each event has: colored dot (amber=RFQ, green=delivered, blue=team, grey=invoice), description with entity link in amber, relative timestamp.

### Order Pipeline bar

Horizontal segmented bar showing count of orders per status. Each segment labeled with status name and count. Amber for active states, muted for completed/cancelled.

---

## SECTION 5 — Web: RFQ Pages
**Commit:** `design(rfq): RFQ list, wizard, and bid comparison`

### 5.1 — RFQ List (`RFQs.tsx`)

Two-panel layout:
- Left: filterable list of RFQs (status tabs at top: All · Open · Awaiting Bids · Awarded · Closed)
- Right: slide-in detail panel when a row is clicked (no full page navigation)

RFQ row:
```
┌─────────────────────────────────────────────────────────┐
│ #RFQ-0421  Steel Rebar - Grade 60      [OPEN ●]  2d ago │
│            Riyadh Villa · 3 bids received               │
│            Required: 15 Jan 2026 · Cash                 │
└─────────────────────────────────────────────────────────┘
```

### 5.2 — RFQ Wizard

Multi-step form with a fixed left progress rail:

```
┌──────────────────┬────────────────────────────────────┐
│                  │                                    │
│  ① Materials  ●  │   Step content here                │
│  ② Delivery   ○  │                                    │
│  ③ Suppliers  ○  │                                    │
│  ④ Review     ○  │                                    │
│                  │                                    │
│                  │          [Back]  [Continue →]      │
└──────────────────┴────────────────────────────────────┘
```

Progress rail: 2px line connecting circles. Completed steps: filled amber circle with checkmark. Active: amber ring. Pending: grey ring.

Step 4 Review: full summary card with all entered data, editable inline on hover.

### 5.3 — Bid Comparison Table

This is the most important screen for the contractor. Redesign as a comparison matrix:

```
┌──────────────────┬──────────────┬──────────────┬──────────────┐
│                  │ Al-Rashidi   │ Gulf Steel   │ Ezz Trading  │
│                  │ Trading  ✓   │              │              │
├──────────────────┼──────────────┼──────────────┼──────────────┤
│ Unit Price       │ SAR 4,200  ★ │ SAR 4,650    │ SAR 4,100  ★ │
│ Delivery Date    │ Jan 15  ★    │ Jan 20       │ Jan 18       │
│ Delivery Cost    │ Free         │ SAR 800      │ SAR 500      │
│ Valid Until      │ 48h          │ 72h          │ 24h ⚠        │
│ Brand            │ Ezz Steel    │ ArcelorMittal│ Hadeed       │
├──────────────────┼──────────────┼──────────────┼──────────────┤
│ TOTAL COST       │ SAR 420,000  │ SAR 465,800  │ SAR 410,500★ │
├──────────────────┼──────────────┼──────────────┼──────────────┤
│                  │ [Select]     │ [Select]     │ [Select]     │
└──────────────────┴──────────────┴──────────────┴──────────────┘
```

★ = best in column (auto-computed, shown in amber).
Best total cost column gets a subtle amber left border.
"Select" button → confirmation modal with order summary before POST.

---

## SECTION 6 — Web: Orders & Fulfillment
**Commit:** `design(orders): order detail, status stepper, GRN`

### 6.1 — Orders list

Kanban-style view toggle (default) ↔ Table view toggle:

**Kanban:** 5 columns (one per status). Cards show: PO number, supplier name, item count, total value, days until delivery. Drag-and-drop disabled (status changes via API only) — but visually drag-like animations on status update.

**Table:** standard DataTable with columns: PO# · Supplier · Items · Total · Required Date · Status · Actions.

### 6.2 — Order detail page

Three-column layout:
```
┌──────────────────────────────────────────────────────────────┐
│ ← Orders    PO #0089 — Al-Rashidi Trading        [CONFIRMED] │
├─────────────────────┬──────────────┬───────────────────────────┤
│                     │              │                           │
│  Line Items         │  Timeline    │  Actions panel            │
│  (table)            │  (vertical   │  - Change status          │
│                     │  activity    │  - Download DN            │
│  Supplier card      │  feed)       │  - Record GRN             │
│  Site location map  │              │  - Upload payment         │
│                     │              │                           │
└─────────────────────┴──────────────┴───────────────────────────┘
```

### 6.3 — Status stepper (inline)

Horizontal stepper inside the order header:
```
[Confirmed] ──●── [Processing] ──○── [Out for Delivery] ──○── [Delivered] ──○── [Completed]
```
Completed steps: filled green. Active step: pulsing amber. Future: grey. Clicking an active step shows a "Mark as [next status]" confirmation.

### 6.4 — GRN modal

Opens from the Actions panel. Full-screen modal with:
- PO items list, each with a quantity received input
- Camera button to attach delivery ticket photo
- Preview of attached photo
- Submit button (amber, disabled until at least one qty > 0 and photo attached)

---

## SECTION 7 — Web: Financials Page
**Commit:** `design(financials): invoice list, wallet, and payment upload`

### 7.1 — Layout

Split view:
- Left 40%: wallet summary card + invoice list
- Right 60%: invoice detail / PDF preview

### 7.2 — Wallet card

```
┌─────────────────────────────────┐
│  💼 Company Wallet              │
│                                 │
│  Total Spent                    │
│  SAR 2,840,500                  │  ← large, font-mono
│                                 │
│  ─────────────────────────────  │
│  Outstanding  SAR 420,000       │
│  This month   SAR 180,000       │
└─────────────────────────────────┘
```

Subtle amber top border (3px) on the wallet card to differentiate it.

### 7.3 — Invoice row

```
INV-0044  |  PO #0089  |  Al-Rashidi Trading  |  SAR 420,000  |  Jan 10  |  [ISSUED ●]  |  [↓PDF]
```

Overdue invoices: `var(--danger)` text on amount.

---

## SECTION 8 — Web: Admin Pages
**Commit:** `design(admin): catalog management, team, audit log`

### 8.1 — Catalog management

Two-panel: category tree on left (collapsible), products grid on right. "Add Category" and "Add Product" as floating action buttons in amber. Products shown as data table rows with inline edit (click cell to edit).

### 8.2 — Team management

Card grid of team members. Each card: avatar (initials fallback with seeded color), name, role badge, "last active" timestamp, action menu (⋮). "Invite member" card at end of grid with dashed amber border.

### 8.3 — Audit log viewer

Full-width table. Left-aligned timestamp (mono font), user pill (avatar + name), action badge (color-coded by action type), entity link, chevron to expand details. Filterable by date range, user, entity type.

---

## SECTION 9 — Mobile: Design System Setup
**Commit:** `design(mobile-tokens): fonts, theme provider, base styles`

### 9.1 — Load custom fonts

In `mobile/app/_layout.tsx`, load fonts using `expo-font`:

```ts
import {
  useFonts,
  Fraunces_400Regular,
  Fraunces_500Medium,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
} from '@expo-google-fonts/fraunces';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
} from '@expo-google-fonts/dm-sans';
import { SpaceMono_400Regular } from '@expo-google-fonts/space-mono';

// In component:
const [fontsLoaded] = useFonts({
  Fraunces_400Regular,
  Fraunces_500Medium,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  SpaceMono_400Regular,
});
if (!fontsLoaded) return <SplashScreen />;
```

Install: `npx expo install @expo-google-fonts/fraunces @expo-google-fonts/dm-sans @expo-google-fonts/space-mono`

### 9.2 — Theme context

Create `mobile/context/ThemeContext.tsx` providing the tokens object. Wrap `_layout.tsx` with `<ThemeProvider>`. All components consume via `useTheme()` hook.

### 9.3 — Base components

Create `mobile/components/ui/` with these base components:

**`Text.tsx`** — wraps RN `Text`, accepts `variant` prop matching `typography` keys:
```tsx
<Text variant="displayLg">Hello</Text>
<Text variant="bodyMd" color="text2">Subtitle</Text>
```

**`Surface.tsx`** — styled `View` with card background, border, border-radius, shadow:
```tsx
<Surface elevated>...</Surface>  // adds md shadow + amber hover border
<Surface flat>...</Surface>      // border only
```

**`Divider.tsx`** — thin horizontal line in `colors.border`.

**`Spacer.tsx`** — `<Spacer size={4} />` renders a View with height/width from spacing scale.

---

## SECTION 10 — Mobile: Tab Bar & Navigation Shell
**Commit:** `design(mobile-nav): custom tab bar and header`

### 10.1 — Custom tab bar

Replace the default Expo tab bar in `mobile/app/(tabs)/_layout.tsx` with a fully custom tab bar component:

`mobile/components/navigation/TabBar.tsx`:

```tsx
// Tab bar specs:
// Height: 68px + safe area bottom inset
// Background: colors.surface
// Top border: 1px solid colors.border
// Shadow (iOS): soft upward shadow
// 5 tabs: Today | Site | Orders | Market | Sync

// Each tab:
// Icon: 22px, Lucide icon
// Label: 10px, DMSans_500Medium, letter-spacing 0.3px
// Active: icon color amber, label color amber, icon scales to 1.1 with spring animation
// Inactive: icon color text3, label color text3
// Active indicator: 2px amber line at very top of tab bar above active tab, 24px wide, centered
// Tap animation: scale 0.92 → 1.0 with spring (mass 0.5, stiffness 300)

// Badge (for Orders tab when pending): amber pill, white text, 10px font, positioned top-right of icon
```

### 10.2 — Screen header

Create `mobile/components/navigation/ScreenHeader.tsx`:

```tsx
// Height: 52px + safe area top
// Background: colors.surface
// Bottom border: 1px solid colors.border
// Left: back button (chevron-left, 24px, text2 color) if navigated
// Center: title (DMSans_600SemiBold, 16px, text1) — always centered
// Right: action slot (icon button or text button)

// On scroll: subtle bottom shadow appears (animated with ScrollView onScroll)
```

Use this header on every stack screen. The tab screens do not have this header — their content starts with a full-bleed top area.

### 10.3 — Today tab header (special)

The "Today" tab has a special hero header instead of a standard nav header:

```
┌─────────────────────────────────────────────────┐
│  Good morning, Ahmed ☀️           [Sync ↻]      │
│  Tuesday, 14 January 2026                       │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │ 🏗️  Riyadh Villa Compound    ▼          │    │
│  │     Project · Active                    │    │
│  └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
```

Background: `colors.amberSoft` gradient → `colors.ground`. Height: ~160px. Project selector is a pressable card that opens a bottom sheet.

---

## SECTION 11 — Mobile: Daily Log Screens
**Commit:** `design(mobile-dailylog): log form and list screens`

### 11.1 — Log list (Today tab)

```
┌─────────────────────────────────────────────────┐
│  [Hero header — see 10.3]                       │
├─────────────────────────────────────────────────┤
│  TODAY'S LOG                          [+ New]   │  ← section label
│  ┌─────────────────────────────────────────┐    │
│  │  📋 Draft · 0 photos · 0 workers        │    │
│  │  Tap to continue →                      │    │
│  └─────────────────────────────────────────┘    │
├─────────────────────────────────────────────────┤
│  THIS WEEK                                      │
│  ┌─────────────────────────────────────────┐    │
│  │  Mon 13  ✓ Synced  8 workers  5 photos  │    │
│  │  Sun 12  ✓ Synced  12 workers 3 photos  │    │
│  │  Sat 11  ● Submitted                    │    │
│  └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
```

### 11.2 — Log form screen

Full-screen scroll. Each section is a `<Surface>` card with a header row:

```
Section header:
┌─────────────────────────────────────────────────┐
│  🌤️  WEATHER                    [Collapse ∧]   │
├─────────────────────────────────────────────────┤
│  [Weather widget content]                       │
└─────────────────────────────────────────────────┘
```

Section headers: `colors.surface2` background, `typography.label` text, amber icon, collapse chevron.

**Progress indicator at top:**
```
  ● ─── ● ─── ○ ─── ○ ─── ○
 Date  Weather  Staff Photos  GRN
```
Amber filled dot = complete. Grey = empty. Connecting line fills amber left-to-right as sections complete.

**Floating bottom bar (replaces scattered buttons):**
```
┌─────────────────────────────────────────────────┐
│  [Save Draft]              [Submit Log →]       │
└─────────────────────────────────────────────────┘
```
Background: `colors.surface` + top border + safe area bottom padding. Save Draft: secondary button. Submit: full amber primary button. Submit disabled until required sections (weather + attendance) are non-empty.

### 11.3 — Weather section UI

When loaded:
```
┌─────────────────────────────────────────────────┐
│  ⛅  Partly Cloudy · 32°C                       │
│     Feels like 36°C · Humidity 45% · Wind 12kph │
│                                  [Override ✎]   │
│  Auto-fetched at 08:14                          │
└─────────────────────────────────────────────────┘
```

Weather icon: large emoji or OWM icon (72px). Temperature: `typography.displayMd`, amber color. Details row: `typography.bodySm`, `text2`.

### 11.4 — Attendance section UI

Each row is a card:
```
┌─────────────────────────────────────────────────┐
│  Own Crew · Carpenters                  [✕]     │
│  ┌────────────┐  ┌──────────────────────────┐   │
│  │ ➖  5  ➕  │  │  8.0 hrs                 │   │
│  │ Headcount  │  │  Hours worked            │   │
│  └────────────┘  └──────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

Stepper (➖/➕): large touch targets (44px). Hours: keyboard numeric. Validation errors appear as red text below the field, inline.

Bottom of section: totals chip row: `Total: 17 workers · 136 man-hours`

### 11.5 — Photos section UI

Horizontal scroll of photo thumbnails (80×80px, border-radius 8px) + an "Add Photo" tile at the end:

```
[Photo1] [Photo2] [Photo3] [+ Add]
```

Photo tile: image with bottom-left GPS badge (`📍`) and top-right delete button (`✕`). "Add" tile: dashed amber border, camera icon, "Add Photo" text. Tapping opens the in-app camera.

---

## SECTION 12 — Mobile: GRN Screen
**Commit:** `design(mobile-grn): goods receipt note UI`

### 12.1 — Step indicator

```
  [① Select PO] ──── [② Verify Items] ──── [③ Photo] ──── [④ Confirm]
```

Horizontal stepper at top, persistent across all steps. Progress fills amber line as steps complete.

### 12.2 — Step 1: PO selection cards

```
┌─────────────────────────────────────────────────┐
│  📦 PO #0089                     OUT FOR DELIVERY│
│  Al-Rashidi Trading                             │
│  5 items · Expected Jan 14                     │
│  ─────────────────────────────────────────────  │
│  ████████░░  3 of 5 items partially received    │
└─────────────────────────────────────────────────┘
```

Progress bar (amber fill, grey track) showing partially received items.

### 12.3 — Step 2: Item verification

Each item row:
```
┌─────────────────────────────────────────────────┐
│  Steel Rebar 16mm                               │
│  Ordered: 100 Ton · Received so far: 60 Ton     │
│                                                 │
│  Receiving now:  [────────────── 40 ──] Ton     │
│                                                 │
│  Condition: [Good ●] [Damaged] [Rejected]       │
└─────────────────────────────────────────────────┘
```

Quantity slider + numeric input. Condition: segmented button (3 options). Damaged/Rejected shows a "Add note" text field below.

### 12.4 — Step 4: Confirm screen

Summary card with amber top accent:
```
┌─────────────────────────────────────────────────┐
│ ─── amber top line ─────────────────────────── │
│  ✓ Ready to Submit                              │
│                                                 │
│  PO #0089 · Al-Rashidi Trading                  │
│  Receiving 40 Ton Steel Rebar                   │
│  Condition: Good                                │
│  📸 1 delivery ticket photo                     │
│                                                 │
│  [Confirm Receipt ✓]                            │
│  Works offline — will sync automatically        │
└─────────────────────────────────────────────────┘
```

---

## SECTION 13 — Mobile: Marketplace Screens
**Commit:** `design(mobile-market): catalog, cart, RFQ`

### 13.1 — Catalog grid

```
┌─────────────────────────────────────────────────┐
│  🔍 Search materials...                         │
│                                                 │
│  [All] [Concrete] [Steel] [Electrical] [More]   │  ← horizontal chip scroll
│                                                 │
│  Sort: Nearest ▼                                │
│                                                 │
│  ┌───────────┐  ┌───────────┐                  │
│  │ [Image]   │  │ [Image]   │                  │
│  │ Steel     │  │ Cement    │                  │
│  │ Rebar 16  │  │ Portland  │                  │
│  │ SAR 4,200 │  │ SAR 28    │                  │
│  │ /Ton      │  │ /bag      │                  │
│  │ ✓ Verified│  │ ✓ Verified│                  │
│  │ [+ Cart]  │  │ [+ Cart]  │                  │
│  └───────────┘  └───────────┘                  │
└─────────────────────────────────────────────────┘
```

Product card: `colors.surface`, `radius.md`, `shadows.sm`. Image: 100% width, 100px height, `borderTopLeftRadius + borderTopRightRadius: radius.md`. Price: `typography.headingMd`, amber. Unit: `typography.bodySm`, `text2`. Supplier verified badge: green dot + "Verified" in 10px. "+ Cart" button: full-width, secondary style.

### 13.2 — Cart screen

```
┌─────────────────────────────────────────────────┐
│  ← Cart (3 items)                               │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │  Steel Rebar 16mm · Al-Rashidi     [✕]  │    │
│  │  SAR 4,200/Ton    [─] 100 Ton [+]       │    │
│  │                   SAR 420,000           │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  ──────────────────────────────────────────     │
│  Subtotal                       SAR 687,500     │
│  VAT (15%)                       SAR 103,125    │
│  ──────────────────────────────────────────     │
│  Total                          SAR 790,625     │
│                                                 │
│  [Place Order]                                  │
│  ⚡ Works offline — queued if no connection     │
└─────────────────────────────────────────────────┘
```

### 13.3 — RFQ Blast flow

Step 1: category + material input — full screen, large inputs.
Step 2: vendor cards (pre-selected 3, amber checkbox, can deselect):

```
┌─────────────────────────────────────────────────┐
│  [✓] Al-Rashidi Trading                         │
│      ✓ Verified · ⭐ 4.8 · 2.3km away           │
│      Specializes in: Steel, Rebar               │
└─────────────────────────────────────────────────┘
```

Step 3: blast button — large amber button, full width, 56px height:
`Send RFQ to 3 Vendors →`

After tap: confetti-like success animation (simple: 3 amber dots radiate outward and fade). Then navigate to RFQ list.

---

## SECTION 14 — Mobile: Orders & Tracking
**Commit:** `design(mobile-orders): order list and status screens`

### 14.1 — Order list

Status filter chips at top (horizontal scroll). Default: "Active" (shows CONFIRMED + PROCESSING + OUT_FOR_DELIVERY).

Order card:
```
┌─────────────────────────────────────────────────┐
│  PO #0089                    [OUT FOR DELIVERY] │
│  Al-Rashidi Trading                             │
│  5 items · SAR 420,000                         │
│                                                 │
│  ○───●───●───○───○                              │  ← mini status stepper
│  Confirmed Processing OutForDel Delivered Done  │
│                                                 │
│  Expected: Jan 14 · Tomorrow ⚠️                 │
└─────────────────────────────────────────────────┘
```

### 14.2 — Delivery approaching alert banner

When geofence fires, show a persistent banner at the top of the Orders tab (above the list):

```
┌─────────────────────────────────────────────────┐
│  🚚 Delivery approaching! · PO #0089           │
│  Al-Rashidi is 0.8km from site   [Record GRN →]│
└─────────────────────────────────────────────────┘
```

Background: `colors.amberSoft`, border: `colors.amber`, bold amber text. Pulses gently (opacity 0.85 → 1.0 loop, 1.5s).

---

## SECTION 15 — Mobile: Sync Tab
**Commit:** `design(mobile-sync): sync status and manual controls`

The Sync tab is the superintendent's control panel for offline state:

```
┌─────────────────────────────────────────────────┐
│  Sync Status                                    │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │  🟢 All synced                          │    │
│  │  Last synced: 2 minutes ago             │    │
│  │                        [Sync Now]       │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  PENDING CHANGES                                │
│  Nothing pending ✓                              │
│                                                 │
│  RECENT SYNC LOG                                │
│  ┌─────────────────────────────────────────┐    │
│  │  ✓  Daily Log #44 synced     08:14      │    │
│  │  ✓  GRN #12 synced           08:13      │    │
│  │  ✓  3 photos uploaded        08:13      │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  STORAGE                                        │
│  ┌─────────────────────────────────────────┐    │
│  │  Local DB    12.4 MB                    │    │
│  │  Pending photos  0                      │    │
│  │  Cached catalog  847 items              │    │
│  └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
```

When syncing, "Sync Now" becomes a spinner. Status card changes to blue "Syncing…" state. When errors exist: red card with error message + "Retry" button.

---

## Final Design Checklist

### Web
- [ ] All pages use `var(--ground)` background — no white/light backgrounds anywhere
- [ ] `DM Serif Display` renders on page titles and modal headers
- [ ] `Geist Mono` renders on all numbers: invoice amounts, quantities, IDs
- [ ] Status badges have pulsing dot on active states
- [ ] Sidebar active state shows amber left border
- [ ] Bid comparison table shows ★ on best values per column
- [ ] Toast slides in from right with progress bar
- [ ] Scrollbar styled to match design system
- [ ] All focus states use amber ring (not blue browser default)
- [ ] `npm run build` exits 0 with no TypeScript errors

### Mobile
- [ ] `Fraunces` renders on Today tab hero header
- [ ] `DMSans` renders on all body text
- [ ] Tab bar shows amber indicator line above active tab
- [ ] Amber color passes WCAG AA contrast on `colors.ground` background
- [ ] Today hero header shows correct greeting (morning/afternoon/evening)
- [ ] Log form progress dots fill amber as sections complete
- [ ] Floating bottom bar sits above keyboard when input is focused
- [ ] Photo thumbnails load from local file system instantly (no flash)
- [ ] GRN step indicator advances correctly through 4 steps
- [ ] Delivery approaching banner pulses correctly
- [ ] All tap targets ≥ 48px height (audit with Expo's accessibility inspector)
- [ ] RTL layouts correct in Arabic locale
- [ ] `npx expo start` builds without TypeScript errors
- [ ] Test on both iOS simulator and Android emulator

---

*Work sections 1 → 15 in order. Section 1 (tokens) is a blocker — every component depends on the design system being in place first.*
