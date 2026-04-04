# 🏁 Final Production Sprint
## Mobile Design Parity + Codebase Cleanup + Real Data + Full Logic Verification

> **Context:** The web frontend is visually complete and approved.
> The mobile app needs to match the same design language exactly.
> After that, every line of static/dummy data must be purged and replaced with
> real API-backed data. Then the full SaaS must be smoke-tested end-to-end.
>
> **Repos:** `backend/` · `frontend/` (approved, reference only) · `mobile/`
> **Design system:** Already defined in `DESIGN_SPRINT_PROMPT.md` and
> `mobile/constants/tokens.ts` — do not invent new colors or fonts.
> **Rule:** One atomic commit per section, prefix shown at header.
> **Do not touch `frontend/` unless a bug is found during smoke testing.**

---

## PART A — Mobile Design Parity
*Goal: make every mobile screen feel like it was designed by the same hand as the web.*

---

### A-1 — Audit & Rip Out All Legacy Styles
**Commit:** `design(mobile): purge legacy styles and apply token system`

Before writing a single new style, do a full audit:

1. **Find and delete** every hardcoded color string in `mobile/` that is not
   reading from `mobile/constants/tokens.ts`.
   Search pattern: any hex code (`#[0-9a-fA-F]{3,6}`), any `rgb(`, any
   `'white'`, `'black'`, `'gray'`, `'grey'` in StyleSheet objects.
   Replace every instance with the correct token. Keep a mapping log as a
   comment at the top of each file changed.

2. **Find and delete** every hardcoded font family string that is not one of:
   `Fraunces_*`, `DMSans_*`, `SpaceMono_400Regular`.
   Replace with the correct `typography.*` token from `tokens.ts`.

3. **Find and delete** every hardcoded spacing number that is not a multiple
   of 4. Replace with `spacing[n]` from `tokens.ts`.

4. Create a lint rule to prevent regression. Add to `mobile/.eslintrc.js`:
   ```js
   'no-restricted-syntax': ['warn', {
     selector: "Literal[value=/^#[0-9a-fA-F]{3,8}$/]",
     message: "Use design tokens from constants/tokens.ts instead of raw hex values"
   }]
   ```

---

### A-2 — Shared Mobile Component Library (mirrors web)
**Commit:** `design(mobile): build shared component library`

Create `mobile/components/ui/`. Each file below is a standalone component.
They must **visually match** the web equivalents from `frontend/src/components/ui/`
— same proportions, same color roles, same interaction feedback — adapted for
touch.

#### `Button.tsx`
```tsx
// Props: variant ('primary'|'secondary'|'ghost'|'danger'|'outline')
//        size ('sm'|'md'|'lg')
//        loading (boolean) — shows ActivityIndicator, disables press
//        leftIcon / rightIcon (ReactNode)
//        fullWidth (boolean)

// Sizes:
//   sm: height 36, paddingHorizontal 12, fontSize 12
//   md: height 44, paddingHorizontal 16, fontSize 14   ← default (field-safe)
//   lg: height 52, paddingHorizontal 20, fontSize 15   ← primary CTAs

// Variants (use tokens):
//   primary:   bg amber, text ground, pressedOpacity 0.88
//   secondary: bg surface2, border border2, text text1
//   ghost:     transparent, text text2, pressed bg surface2
//   danger:    bg danger, text surface
//   outline:   border amber/40, text amber, pressed bg amberSoft

// Press feedback: scale(0.97) using Animated.spring, 80ms
// Loading: replace children with ActivityIndicator (color matches text color)
// Haptic: Haptics.impactAsync(ImpactFeedbackStyle.Light) on every press
```

#### `Card.tsx`
```tsx
// Props: elevated (boolean), flat (boolean), pressable (boolean), onPress
// Base: bg surface, border border, borderRadius radius.md, overflow hidden
// elevated: adds shadows.md, on press → shadows.sm (feels physical)
// pressable: Pressable wrapper, pressed state dims opacity to 0.92
// flat: no shadow, only border
```

#### `Badge.tsx`
```tsx
// Same statusMap as web — maps status string to { label, dotColor, bg, text }
// Pulsing dot for active states: OPEN, PROCESSING, OUT_FOR_DELIVERY
// Pulse: Animated loop, opacity 1→0.3→1, duration 1400ms
// Layout: row, dot (6px circle), label (typography.label, letterSpacing 0.6)
// Padding: 4px 8px, borderRadius radius.sm
```

#### `Input.tsx`
```tsx
// Props: label, placeholder, error, hint, leftIcon, rightIcon, ...TextInputProps
// Height: 48px (field-safe for gloves)
// Background: surface2
// Border: 1px solid border2 → amber (focused) → danger (error)
// Label: typography.label above input, color text2
// Error text: typography.bodySm, danger color, appears below with slide-down animation
// Focused border animates with Animated.timing, 150ms
// rightIcon slot used for: clear button (✕), unit label (e.g. "Ton"), show/hide password
```

#### `Select.tsx`
```tsx
// Styled pressable that opens a BottomSheet (see A-3)
// Displays: selected label or placeholder
// Arrow icon rotates 180° when open (Animated.timing)
// Same height/border/focus styles as Input
```

#### `Stepper.tsx`
```tsx
// Numeric stepper: [─] [value] [+]
// Props: value, min, max, step, onChange, unit (optional label)
// Minus/Plus: 44×44px tap targets, bg surface2, border border2
// Center: value in typography.headingMd + unit in typography.bodySm text2
// Disabled states: opacity 0.4 on minus when value===min
// Haptic on every increment/decrement
```

#### `ProgressBar.tsx`
```tsx
// Props: progress (0–1), color ('amber'|'success'|'danger'), height, animated
// Animated fill with spring (tension 60, friction 8)
// Background track: border color
// Optional label: "{pct}%" right-aligned above bar in typography.bodySm
```

#### `Skeleton.tsx`
```tsx
// Animated shimmer using Animated.loop + LinearGradient
// Props: width, height, borderRadius
// Gradient: surface → surface2 → surface, animates left→right, 1200ms loop
// Usage: <Skeleton width="100%" height={20} borderRadius={4} />
```

#### `EmptyState.tsx`
```tsx
// Props: icon (emoji string), title, description, actionLabel, onAction
// Layout: centered column, generous vertical padding (64px)
// Icon: 48px emoji in a circle (bg amberSoft, border amberSoft*1.2)
// Title: typography.headingLg, text1
// Description: typography.bodyMd, text2, textAlign center, maxWidth 260
// Action button: outline variant, amber, mt 24
```

#### `Divider.tsx`
```tsx
// Thin horizontal line: height 1, bg border, marginVertical spacing[4]
// Optional label prop: text centered on line (bg surface, px 8)
```

---

### A-3 — Bottom Sheet (global)
**Commit:** `design(mobile): reusable bottom sheet`

Install `@gorhom/bottom-sheet`. Create `mobile/components/ui/BottomSheet.tsx`
as a wrapper that:

- Uses `BottomSheetModal` with `backdropComponent` (semi-opaque dark overlay)
- Handle bar: 4×32px rounded pill, `colors.border2`, centered, mt 8
- Background: `colors.surface`, `borderTopLeftRadius: 20`, `borderTopRightRadius: 20`
- Drag to dismiss enabled
- `snapPoints` passed as prop (default `['50%', '90%']`)
- Header slot: title (typography.headingMd) + optional close button (✕)
- Content slot: `BottomSheetScrollView` with `px: spacing[6]`

Use this for:
- Project switcher (replaces any modal/alert)
- Select dropdowns (A-2 `Select.tsx`)
- Confirmation dialogs (replaces Alert.alert everywhere)
- GRN PO selection (Part A-8)
- Any screen that currently uses `Modal` from React Native — replace all

---

### A-4 — Screen Header Component
**Commit:** `design(mobile): unified screen header`

Create `mobile/components/navigation/ScreenHeader.tsx`:

```
┌──────────────────────────────────────────────────────┐
│  [←]      Page Title                   [Action]     │
└──────────────────────────────────────────────────────┘
```

- Height: 52px + `useSafeAreaInsets().top`
- Background: `colors.surface` + `borderBottom: 1px solid colors.border`
- Back button: chevron-left (Lucide), 44×44px hit slop, `colors.text2`
- Title: `typography.headingMd`, `colors.text1`, absolutely centered
- Right slot: any ReactNode (icon button, text button, or empty)
- On scroll: shadow animates in using `Animated.Value` driven by
  `ScrollView`'s `onScroll` event (interpolate scrollY 0→8 → shadow opacity 0→1)

Replace the default Expo stack header on **every** screen:
```tsx
// In each Stack.Screen:
headerShown: false
// Then render <ScreenHeader> as first element inside the screen component
```

---

### A-5 — Today Tab — Hero Header & Log List
**Commit:** `design(mobile): Today tab complete redesign`

**File:** `mobile/app/(tabs)/index.tsx` (or `today.tsx` — wherever the Today tab lives)

#### Hero header
```
┌──────────────────────────────────────────────────────┐
│                                          [↻ Sync]   │  ← safe area top
│  Good morning, Ahmed ☀️                              │  ← greeting, Fraunces_600, 22px
│  Tuesday, 14 January 2026                           │  ← date, DMSans_400, 13px, text2
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │  🏗️  Riyadh Villa Compound              ▼   │    │  ← project card
│  │      Construction · Active                  │    │
│  └──────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────┘
```

Specs:
- Container: `paddingHorizontal: spacing[6]`, `paddingTop: insets.top + spacing[4]`,
  `paddingBottom: spacing[5]`
- Background: linear gradient from `colors.amberSoft` (top) to `colors.ground` (bottom),
  height ~170px. Use `expo-linear-gradient`.
- Greeting computed: before 12 = "Good morning", 12–17 = "Good afternoon",
  after 17 = "Good evening". Sun/Moon/Sunset emoji accordingly.
- Sync button: top-right, ghost icon button, rotates 360° when syncing
  (Animated.loop while `syncStatus === 'syncing'`)
- Project card: `colors.surface`, `radius.md`, `shadows.sm`, pressable →
  opens project switcher BottomSheet

#### Log list (below hero, inside ScrollView)
Section: "TODAY" label + log card or "Create Today's Log" empty state.
Section: "THIS WEEK" label + list of past log rows.

**Today card (draft exists):**
```
┌──────────────────────────────────────────────────────┐
│  📋  Tuesday, Jan 14                    DRAFT ●     │
│      0 workers · 0 photos · Weather pending          │
│                                                      │
│      ████████░░░░░░░░  40% complete                  │  ← progress bar
│                                    Continue →        │
└──────────────────────────────────────────────────────┘
```

**Today card (no log yet):**
```
┌──────────────────────────────────────────────────────┐
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐   │
│     + Start Today's Log                              │
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘   │
└──────────────────────────────────────────────────────┘
```
Dashed amber border, amber text, 52px height. Haptic on tap.

**Past log row:**
```
  Mon 13  ✓ SYNCED    12 workers  5 photos   →
```
Height 52px, `colors.surface`, bottom border `colors.border`.
Status: green dot (SYNCED), blue dot (SUBMITTED), grey dot (DRAFT).

---

### A-6 — Daily Log Form Screen
**Commit:** `design(mobile): daily log form complete redesign`

**File:** `mobile/app/daily-log/new.tsx` (and `[id].tsx`)

#### Top progress rail
Sticky below the `ScreenHeader`. 5 nodes: Date · Weather · Staff · Photos · GRN.
```
  ●━━━━●━━━━○━━━━○━━━━○
  Date Weather Staff Photos GRN
```
Each node: 10px circle. Filled amber = complete section. Amber ring = active.
Grey = untouched. Line between nodes fills amber left-to-right as sections
complete. Implemented with `Animated.Value` per section completion state.

#### Section cards
Each section is a `<Card>` with a pressable header that collapses/expands:

```
┌──────────────────────────────────────────────────────┐
│  [Icon]  WEATHER                       ∨  [Complete ✓]│  ← header row
├──────────────────────────────────────────────────────┤
│                                                      │
│  [Section content]                                   │
│                                                      │
└──────────────────────────────────────────────────────┘
```

Header: `colors.surface2`, `typography.label`, icon 16px amber.
Collapse animation: `Animated.timing` on `maxHeight`, 200ms `ease-out`.
Complete badge: small green checkmark pill, only shows when section has data.

#### Floating action bar
Fixed at bottom, above keyboard and tab bar:
```
┌──────────────────────────────────────────────────────┐
│  [Save Draft]                   [Submit Log  →]     │
└──────────────────────────────────────────────────────┘
```
`position: absolute`, `bottom: tabBarHeight + insets.bottom`.
Background: `colors.surface` + `borderTop: 1px solid colors.border`.
`padding: spacing[4] spacing[6]`.
Both buttons use `<Button>` component. Submit is `primary` variant,
disabled (opacity 0.4) until `weather` AND `attendance` sections have data.

#### Weather section content
Already designed in `MOBILE_SUPERINTENDENT_PROMPT.md` section 3.
Apply the token system to the existing implementation.
Temperature: `typography.displayMd`, `colors.amber`.
Condition + details row: `typography.bodySm`, `colors.text2`.

#### Attendance section content
Each row uses the new `<Stepper>` component for headcount.
Hours: `<Input>` with `keyboardType="decimal-pad"`, `rightIcon="hrs"`.
Company: `<Input>` with autocomplete dropdown (inline, not bottom sheet —
show max 4 suggestions in a `View` overlaid below the input, `zIndex: 100`).
Trade: `<Select>` opening a BottomSheet with trade options.

#### Progress Notes section content
Zone: `<Input>` placeholder "Floor 3 - East Wing".
Work done: `<Input>` multiline, `numberOfLines={3}`.
Completion: `<ProgressBar>` with a `<Stepper>` below it (step=5, min=0, max=100),
shows `XX%` live as the stepper changes.
Issues: collapsible under "⚠️ Add issue" toggle.

---

### A-7 — Photos Section & Camera
**Commit:** `design(mobile): photo capture and gallery`

#### Photo gallery strip
Horizontal `FlatList` inside the Photos section card.
Each thumbnail: 80×80px, `borderRadius: radius.md`, `marginRight: spacing[2]`.
Loaded from `local_path` using `<Image source={{ uri: photo.localPath }}`.
Bottom-left overlay: `📍` badge (8px text, bg `rgba(0,0,0,0.5)`, `borderRadius: 3`).
Top-right: `✕` delete button (24×24px, bg `rgba(0,0,0,0.6)`, `borderRadius: 12`).

"Add Photo" tile at end of list:
```
┌──────────┐
│          │
│    📷    │
│  Add     │
└──────────┘
```
Width/height 80px. Dashed border (2px, `colors.amber`, approximated with a
custom dashed border component). Background `colors.amberSoft`.

#### Camera modal
Full-screen `Modal` (not bottom sheet — camera needs full height).
Uses `expo-camera` `CameraView`.
Bottom bar: large circular capture button (64px, white border, `colors.surface` bg),
flip camera button (left), close button (right).
After capture: shows preview with "Use Photo ✓" and "Retake ↺" buttons
before committing to WatermelonDB.

---

### A-8 — GRN Screen
**Commit:** `design(mobile): GRN 4-step flow redesign`

**File:** `mobile/app/daily-log/grn.tsx`

#### Step indicator (top, sticky)
```
  ① Select PO ──── ② Verify Items ──── ③ Photo ──── ④ Confirm
```
4 numbered circles. Active: filled amber circle, white number.
Complete: amber check (✓). Pending: grey ring.
Connecting line: amber (completed segments), grey (pending).
Entire stepper: `colors.surface2`, `paddingVertical: spacing[3]`,
`borderBottom: 1px solid colors.border`.

#### Step 1 — PO Selection
Each PO card:
```
┌──────────────────────────────────────────────────────┐
│  📦 PO #0089                  [OUT FOR DELIVERY 🟡] │
│  Al-Rashidi Trading                                  │
│  5 items · Expected Jan 14 · SAR 420,000             │
│                                                      │
│  ████████░░░░  3 of 5 items previously received      │
└──────────────────────────────────────────────────────┘
```
Selected state: `border: 2px solid colors.amber`, `bg: colors.amberSoft`.
`<ProgressBar>` inside: amber fill, shows ratio received.

#### Step 2 — Item verification
Each item as a card with:
- Product name: `typography.headingMd`
- "Ordered X · Received Y" in `typography.bodySm text2`
- Receiving now: `<Stepper>` (min 0, max = ordered - received, step adaptive)
- Condition segmented control:

```
  ┌──────────┬──────────┬──────────┐
  │  Good  ● │ Damaged  │ Rejected │
  └──────────┴──────────┴──────────┘
```
Segmented control: 3 equal segments, `height: 36px`.
Active Good: `bg success, text surface`.
Active Damaged: `bg warning, text surface`.
Active Rejected: `bg danger, text surface`.
Inactive: `bg surface2, text text2`.
Animated slide indicator underneath active segment.

If Damaged or Rejected: "Add note" `<Input>` slides down (Animated, 180ms).

Running total bar (sticky above keyboard):
```
Receiving 40 Ton across 2 items
```
`colors.surface`, `borderTop: 1px solid colors.border`, `padding: spacing[3] spacing[6]`.

#### Step 4 — Confirm
```
┌──────────────────────────────────────────────────────┐
│ ▬▬▬▬▬▬▬▬▬  amber top line  ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬  │
│                                                      │
│  ✓ Ready to Submit                                   │  ← Fraunces_600, 22px
│                                                      │
│  PO #0089 · Al-Rashidi Trading                       │
│  ─────────────────────────────────────────────────   │
│  40 Ton Steel Rebar    Good ✓                        │
│  5 Bags Portland Cement  Good ✓                      │
│  ─────────────────────────────────────────────────   │
│  📸 Delivery ticket attached                         │
│                                                      │
│  [Confirm Receipt ✓]          (primary, lg, full)   │
│                                                      │
│  ⚡ Works offline — syncs automatically              │  ← bodySm, text2
└──────────────────────────────────────────────────────┘
```

---

### A-9 — Marketplace: Catalog & Cart
**Commit:** `design(mobile): marketplace catalog and cart redesign`

#### Catalog screen
Search bar: full-width `<Input>` with 🔍 left icon, `height: 44px`.

Category chips: horizontal `FlatList`, `showsHorizontalScrollIndicator: false`.
Each chip: `height: 32px`, `paddingHorizontal: spacing[4]`,
`borderRadius: 999` (pill shape).
Active: `bg: colors.amber, color: colors.ground, fontFamily: DMSans_600`.
Inactive: `bg: colors.surface2, border: colors.border2, color: colors.text2`.

Product grid: `FlatList` `numColumns={2}`, `columnWrapperStyle={{ gap: spacing[3] }}`.

Product card:
```
┌─────────────────────┐
│  [Image 100% × 96px]│  ← borderTopRadius radius.md
│─────────────────────│
│  Steel Rebar 16mm   │  ← headingMd, text1
│  Al-Rashidi ✓       │  ← bodySm, text2 + green dot
│                     │
│  SAR 4,200 / Ton    │  ← headingMd amber + bodySm text3
│                     │
│  [+ Add to Cart]    │  ← secondary button, fullWidth
└─────────────────────┘
```

No image fallback: category emoji centered in a `colors.surface2` rectangle.

#### Cart screen
Each cart item row:
```
┌──────────────────────────────────────────────────────┐
│  Steel Rebar 16mm                             [✕]   │
│  Al-Rashidi Trading                                  │
│  SAR 4,200/Ton                                       │
│                                                      │
│  [─]  100 Ton  [+]              SAR 420,000         │
└──────────────────────────────────────────────────────┘
```
Swipe-left-to-delete using `react-native-swipeable` or Gesture Handler.
Delete action background: `colors.danger`, white trash icon.

Order summary card (sticky bottom):
```
┌──────────────────────────────────────────────────────┐
│  Subtotal                           SAR 687,500      │
│  VAT (15%)                          SAR 103,125      │
│  ─────────────────────────────────────────────────   │
│  Total                              SAR 790,625      │
│                                                      │
│  [Place Order →]                                     │
│  ⚡ Works offline — queued if no connection          │
└──────────────────────────────────────────────────────┘
```
All amounts: `typography.mono`, right-aligned. Divider before Total.
"Place Order" button: `primary`, `lg`, `fullWidth`.

---

### A-10 — RFQ Flow & List
**Commit:** `design(mobile): RFQ blast and list redesign`

#### RFQ list
Tabs at top: All · Active · Bids In · Awarded · Closed.
Tab bar: `colors.surface`, `borderBottom: 1px solid colors.border`.
Active tab: `borderBottom: 2px solid colors.amber`, `colors.amber` text.
Inactive: `colors.text2`.

RFQ card:
```
┌──────────────────────────────────────────────────────┐
│  #RFQ-0421                             [OPEN ●]     │
│  Steel Rebar · Grade 60                              │
│  Riyadh Villa · 100 Ton                              │
│  ─────────────────────────────────────────────────   │
│  📬 3 bids received · Delivery Jan 15 · Cash        │
└──────────────────────────────────────────────────────┘
```
"Bids received" count in amber if > 0.

#### RFQ New (blast flow)
3-step wizard. Steps shown as top tab progress (same pattern as GRN stepper).

Step 1 — full screen form:
- Category: `<Select>` (BottomSheet with grid of category cards with emojis)
- Material name: `<Input>`
- Quantity: `<Stepper>` + `<Select>` for unit
- Required delivery: pressable date field → opens `@react-native-community/datetimepicker`
- Payment terms: 3-way segmented control (Cash / Credit / Cheque)

Step 2 — vendor selection:
Each vendor card: `<Card pressable>`.
Selected: `border: 2px solid colors.amber`.
Shows: name, verified badge, rating stars (amber), distance from site.
Pre-selected top 3 get a "Recommended 🎯" chip.

Step 3 — blast:
Review summary in a Card.
"Send to X Vendors" button: `primary`, `lg`, `fullWidth`, `height: 56px`.
After tap: 3 amber dots radiate outward from button center using
`Animated.timing` (scale 0→3, opacity 1→0, 600ms staggered 0/200/400ms).
Then navigate to RFQ list with success toast.

---

### A-11 — Orders & Tracking Screen
**Commit:** `design(mobile): orders list and detail redesign`

#### Orders list
Status filter: same tab pattern as RFQ list.
Default tab: "Active" (CONFIRMED + PROCESSING + OUT_FOR_DELIVERY).

Order card:
```
┌──────────────────────────────────────────────────────┐
│  PO #0089                    [OUT FOR DELIVERY 🟡]  │
│  Al-Rashidi Trading · 5 items                        │
│  SAR 420,000                                         │
│                                                      │
│  ○──●──●──○──○                                       │  ← mini stepper (5 dots)
│                                                      │
│  📅 Expected Jan 14 — Tomorrow ⚠️                    │
└──────────────────────────────────────────────────────┘
```
"Tomorrow ⚠️" in `colors.warning` when delivery date is ≤ 1 day away.
"Overdue ⛔" in `colors.danger` when past due date.

#### Delivery approaching banner
Appears at the very top of the Orders tab when geofence fires:
```
┌──────────────────────────────────────────────────────┐
│  🚚 Delivery approaching — PO #0089 is 0.8km away  │
│  Al-Rashidi Trading                [Record GRN →]   │
└──────────────────────────────────────────────────────┘
```
Background: `colors.amberSoft`. Left border: 3px `colors.amber`.
Pulses: `Animated.loop`, opacity 0.8→1→0.8, 1600ms.
"Record GRN" navigates directly to `grn.tsx` with `poId` pre-selected.

---

### A-12 — Sync Tab Redesign
**Commit:** `design(mobile): sync tab redesign`

Full redesign of `mobile/app/(tabs)/sync.tsx` (or wherever the Sync tab lives).

```
┌──────────────────────────────────────────────────────┐
│  [ScreenHeader: "Sync Status"]                       │
│                                                      │
│  STATUS CARD                                         │
│  ┌──────────────────────────────────────────────┐    │
│  │  🟢  All synced                              │    │
│  │  Last synced 2 minutes ago                   │    │
│  │                            [Sync Now  ↻]    │    │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  PENDING  (0)                                        │
│  ─────────────────────────────────────────────────   │
│  Nothing pending ✓                                   │
│                                                      │
│  RECENT ACTIVITY                                     │
│  ─────────────────────────────────────────────────   │
│  ✓  Daily Log #44 pushed          08:14  today      │
│  ✓  GRN #12 pushed                08:13  today      │
│  ✓  3 photos uploaded             08:13  today      │
│  ✗  Sync failed (401)             07:50  today      │  ← red ✗ with error
│                                                      │
│  STORAGE                                             │
│  ─────────────────────────────────────────────────   │
│  Local database          12.4 MB                     │
│  Pending photos          0 files                     │
│  Cached products         847 items                   │
│  ─────────────────────────────────────────────────   │
│  [Clear Cache]           (ghost/danger, sm)          │
└──────────────────────────────────────────────────────┘
```

Status card colors:
- All synced: `border-left: 3px solid colors.success, bg: colors.successBg`
- Syncing: `border-left: 3px solid colors.amber, bg: colors.amberSoft`
- Error: `border-left: 3px solid colors.danger, bg: colors.dangerBg`
- Offline: `border-left: 3px solid colors.text3, bg: colors.surface2`

"Sync Now" button: `secondary` variant, spins icon while syncing.
Activity list: timestamp in `typography.mono colors.text3`, message in
`typography.bodyMd`, checkmark green / X red prefix icon.

---

## PART B — Codebase Cleanup: Purge All Static & Dummy Data

---

### B-1 — Backend: Audit and Remove All Hardcoded Data
**Commit:** `chore(backend): remove all hardcoded and stub data`

Run a full-codebase search for the following patterns in `backend/src/`:

#### 1. Materials service stub
`backend/src/materials/materials.service.ts` currently returns a hardcoded
array. This is the primary stub to kill.
Replace with real Prisma queries as specified in `AGENT_PROMPT.md` Section 5.
**Verify:** `GET /materials` must return 0 results on a fresh DB (not a
hardcoded list), and return real results after seeding (Part C).

#### 2. Any `return []` or `return {}` stubs in service methods
Search: `return \[\]` and `return \{\}` in all `*.service.ts` files.
Each one is either a legitimate empty result OR a stub that was never
implemented. For each:
- If it's a stub (method body is only `return []`): implement the real
  Prisma query.
- If it's intentionally empty: add a comment `// intentionally empty —
  no data for this query when [condition]`.

#### 3. Hardcoded IDs or UUIDs in service logic
Search: any UUID-like string literal `'[0-9a-f-]{36}'` in service files.
Replace with dynamic lookups.

#### 4. `console.log` → structured logger
Search all `console.log(`, `console.error(`, `console.warn(` in `backend/src/`.
Replace every instance with:
```ts
private readonly logger = new Logger(ClassName.name);
// then:
this.logger.log('message', { context });
this.logger.error('message', error.stack);
```

#### 5. TODO/FIXME comments
Search `// TODO` and `// FIXME` in `backend/src/`.
Each one must be either:
- Implemented (if it's a critical path)
- Converted to a GitHub issue reference `// TODO(#42): description`
- Deleted if obsolete

---

### B-2 — Frontend: Purge All Mock Data
**Commit:** `chore(frontend): remove all mock and static data`

Search `frontend/src/` for:

#### 1. Hardcoded arrays used as data sources
Pattern: `const [data] = useState([{...}])` or `const data = [{...}]` at
module level in page/component files.
Each must be replaced with a TanStack Query `useQuery` hook hitting the
real API.

#### 2. Mock API responses
Pattern: any `// mock`, `// fake`, `// dummy`, `// placeholder` comment
near data definitions.
Delete the mock, wire the real query.

#### 3. Hardcoded user/company info
Pattern: `name: 'Ahmed'`, `company: 'Test Co'`, any literal name/email
string in component state. Replace with data from `AuthContext`.

#### 4. `setTimeout` faking API calls
Pattern: `setTimeout(() => { setData(mockData) }, 1000)`.
Replace entirely with real `useQuery` / `useMutation`.

#### 5. Verify every page has a loading state
For every `useQuery` on a list page, confirm there is either a skeleton
loader or `<Skeleton>` component rendered when `isLoading === true`.
If missing, add it using the `<SkeletonTable>` or `<SkeletonCard>`
components from the design system.

#### 6. Verify every page has an empty state
For every list that can be empty, confirm there is an `<EmptyState>`
component rendered when `data.length === 0 && !isLoading`.
If missing, add it.

---

### B-3 — Mobile: Purge All Mock Data
**Commit:** `chore(mobile): remove all mock and static data`

Search `mobile/` for:

#### 1. Hardcoded RFQ list
`mobile/app/marketplace/rfq/list.tsx` — confirmed in audit to use mock data.
Replace with WatermelonDB `useQuery` on local `rfqs` table.

#### 2. Any `.ts` or `.tsx` file containing `mockData`, `dummyData`,
`fakeData`, `testData` as variable names. Delete and replace.

#### 3. Hardcoded product/supplier lists in catalog
Replace with WatermelonDB query on `products` table (populated via sync).

#### 4. Any `Math.random()` used to generate display data
Replace with real data or remove entirely.

#### 5. Any `'John Doe'`, `'Test User'`, `'Sample Co'` strings
Replace with real auth context data.

#### 6. Hardcoded coordinates (e.g. `lat: 24.7136, lon: 46.6753`)
Replace with the active project's stored `site_lat` / `site_long` from
WatermelonDB, or the device's current GPS if no project site is set.

---

### B-4 — Remove Dead Code
**Commit:** `chore: remove dead code and unused files`

#### Backend
- Run `npx ts-unused-exports tsconfig.json` (install if needed).
- Delete any exported function/class with 0 references that is not an
  entry point (controller, module, decorator).
- Delete any `*.spec.ts` file that only contains `it('should be defined')` —
  these are Nest CLI stubs, not real tests.

#### Frontend
- Run `npx knip` (install if needed) to find unused exports, files, deps.
- Delete any component file that is imported nowhere.
- Delete any page file that has no route pointing to it.
- Remove unused dependencies from `package.json`:
  `npm prune` after removing from package.json.

#### Mobile
- Same `knip` pass on `mobile/`.
- Delete any screen file not referenced in `_layout.tsx` route tree.
- Remove unused `expo-*` packages (check `app.json` plugins too).

---

## PART C — Real Data Seeding

---

### C-1 — Prisma Seed File
**Commit:** `chore(db): comprehensive seed file for development and testing`

Create `backend/prisma/seed.ts` (replace any existing minimal seed):

```ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── 1. CATEGORIES ─────────────────────────────────────────────────────────
  const categories = await Promise.all([
    prisma.category.upsert({ where: { name: 'Steel & Metal' },
      update: {}, create: { name: 'Steel & Metal',
        unit_options: ['Ton', 'KG', 'Piece'], children: { create: [
          { name: 'Rebar', unit_options: ['Ton', 'KG'] },
          { name: 'Steel Sections', unit_options: ['Ton', 'Piece'] },
          { name: 'Wire Mesh', unit_options: ['Roll', 'SQM'] },
        ]}}
    }),
    prisma.category.upsert({ where: { name: 'Concrete & Cement' },
      update: {}, create: { name: 'Concrete & Cement',
        unit_options: ['M3', 'Bag', 'Ton'], children: { create: [
          { name: 'Portland Cement', unit_options: ['Bag', 'Ton'] },
          { name: 'Ready Mix Concrete', unit_options: ['M3'] },
          { name: 'Blocks & Bricks', unit_options: ['Piece', 'Pallet'] },
        ]}}
    }),
    prisma.category.upsert({ where: { name: 'Electrical' },
      update: {}, create: { name: 'Electrical',
        unit_options: ['Roll', 'Piece', 'Box', 'M'], children: { create: [
          { name: 'Cables & Wires', unit_options: ['Roll', 'M'] },
          { name: 'Conduits', unit_options: ['Piece', 'M'] },
          { name: 'Distribution Boards', unit_options: ['Piece'] },
        ]}}
    }),
    prisma.category.upsert({ where: { name: 'Finishing Materials' },
      update: {}, create: { name: 'Finishing Materials',
        unit_options: ['SQM', 'Box', 'Piece', 'L'], children: { create: [
          { name: 'Ceramic Tiles', unit_options: ['SQM', 'Box'] },
          { name: 'Paints', unit_options: ['L', 'Gallon'] },
          { name: 'Plaster', unit_options: ['Bag', 'Ton'] },
        ]}}
    }),
  ]);
  console.log(`✅ Created ${categories.length} root categories`);

  // ── 2. COMPANIES ──────────────────────────────────────────────────────────
  const contractorCompany = await prisma.company.upsert({
    where: { email: 'ops@alfarabi-construction.sa' },
    update: {},
    create: {
      name: 'Al-Farabi Construction Co.',
      email: 'ops@alfarabi-construction.sa',
      phone: '+966501234567',
      country: 'SA',
      city: 'Riyadh',
      address: 'King Fahd Road, Riyadh',
      type: 'CONTRACTOR',
      is_verified: true,
      vat_number: '310123456700003',
      commercial_reg: 'CR-1010123456',
    },
  });

  const supplierCompany1 = await prisma.company.upsert({
    where: { email: 'sales@alrashidi-steel.sa' },
    update: {},
    create: {
      name: 'Al-Rashidi Steel Trading',
      email: 'sales@alrashidi-steel.sa',
      phone: '+966509876543',
      country: 'SA',
      city: 'Jeddah',
      address: 'Industrial City, Jeddah',
      type: 'SUPPLIER',
      is_verified: true,
      vat_number: '310987654300003',
      commercial_reg: 'CR-4030987654',
      site_lat: 21.3891,
      site_long: 39.8579,
    },
  });

  const supplierCompany2 = await prisma.company.upsert({
    where: { email: 'orders@gulf-cement.sa' },
    update: {},
    create: {
      name: 'Gulf Cement & Building Materials',
      email: 'orders@gulf-cement.sa',
      phone: '+966505551234',
      country: 'SA',
      city: 'Riyadh',
      address: 'Second Industrial Zone, Riyadh',
      type: 'SUPPLIER',
      is_verified: true,
      vat_number: '310555123400003',
      commercial_reg: 'CR-1010555123',
      site_lat: 24.6267,
      site_long: 46.7122,
    },
  });

  const egyptContractor = await prisma.company.upsert({
    where: { email: 'procurement@niledev.eg' },
    update: {},
    create: {
      name: 'Nile Development & Construction',
      email: 'procurement@niledev.eg',
      phone: '+201012345678',
      country: 'EG',
      city: 'Cairo',
      address: 'New Administrative Capital, Cairo',
      type: 'CONTRACTOR',
      is_verified: true,
      tax_id: '123-456-789',
      commercial_reg: 'CR-EG-2024-001',
    },
  });
  console.log('✅ Created companies');

  // ── 3. USERS ───────────────────────────────────────────────────────────────
  const hash = await bcrypt.hash('Password123!', 10);

  const contractorAdmin = await prisma.user.upsert({
    where: { email: 'ahmed@alfarabi-construction.sa' },
    update: {},
    create: {
      email: 'ahmed@alfarabi-construction.sa',
      password_hash: hash,
      first_name: 'Ahmed',
      last_name: 'Al-Farabi',
      phone: '+966501234568',
      role: 'CONTRACTOR',
      company_id: contractorCompany.id,
      status: 'ACTIVE',
      is_company_admin: true,
    },
  });

  const siteEngineer = await prisma.user.upsert({
    where: { email: 'khalid@alfarabi-construction.sa' },
    update: {},
    create: {
      email: 'khalid@alfarabi-construction.sa',
      password_hash: hash,
      first_name: 'Khalid',
      last_name: 'Al-Mutairi',
      phone: '+966501234569',
      role: 'CONTRACTOR',
      company_id: contractorCompany.id,
      status: 'ACTIVE',
      is_company_admin: false,
      sub_role: 'SITE_ENGINEER',
    },
  });

  const supplierUser1 = await prisma.user.upsert({
    where: { email: 'omar@alrashidi-steel.sa' },
    update: {},
    create: {
      email: 'omar@alrashidi-steel.sa',
      password_hash: hash,
      first_name: 'Omar',
      last_name: 'Al-Rashidi',
      phone: '+966509876544',
      role: 'SUPPLIER',
      company_id: supplierCompany1.id,
      status: 'ACTIVE',
      is_company_admin: true,
    },
  });

  const supplierUser2 = await prisma.user.upsert({
    where: { email: 'ali@gulf-cement.sa' },
    update: {},
    create: {
      email: 'ali@gulf-cement.sa',
      password_hash: hash,
      first_name: 'Ali',
      last_name: 'Al-Ghamdi',
      phone: '+966505551235',
      role: 'SUPPLIER',
      company_id: supplierCompany2.id,
      status: 'ACTIVE',
      is_company_admin: true,
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@construction-connect.io' },
    update: {},
    create: {
      email: 'admin@construction-connect.io',
      password_hash: hash,
      first_name: 'System',
      last_name: 'Admin',
      phone: '+966500000001',
      role: 'ADMIN',
      company_id: contractorCompany.id, // admin belongs to platform
      status: 'ACTIVE',
      is_company_admin: true,
    },
  });
  console.log('✅ Created users');

  // ── 4. WALLETS ─────────────────────────────────────────────────────────────
  await prisma.wallet.upsert({
    where: { company_id: contractorCompany.id },
    update: {},
    create: { company_id: contractorCompany.id,
      balance: 0, total_spent: 2840500, outstanding_dues: 420000,
      currency: 'SAR' },
  });
  await prisma.wallet.upsert({
    where: { company_id: supplierCompany1.id },
    update: {},
    create: { company_id: supplierCompany1.id,
      balance: 0, total_earned: 2840500, currency: 'SAR' },
  });
  console.log('✅ Created wallets');

  // ── 5. PRODUCTS ────────────────────────────────────────────────────────────
  const products = [
    // Steel & Metal
    { name: 'Steel Rebar 12mm', category: 'Steel & Metal', sub_category: 'Rebar',
      unit: 'Ton', base_price: 3800, supplier_company_id: supplierCompany1.id,
      description: 'High-tensile deformed steel rebar, Grade 60, SASO certified',
      image_url: null },
    { name: 'Steel Rebar 16mm', category: 'Steel & Metal', sub_category: 'Rebar',
      unit: 'Ton', base_price: 4200, supplier_company_id: supplierCompany1.id,
      description: 'High-tensile deformed steel rebar, Grade 60, SASO certified',
      image_url: null },
    { name: 'Steel Rebar 20mm', category: 'Steel & Metal', sub_category: 'Rebar',
      unit: 'Ton', base_price: 4350, supplier_company_id: supplierCompany1.id,
      description: 'Heavy duty deformed steel rebar, Grade 60',
      image_url: null },
    { name: 'Wire Mesh 200×200mm', category: 'Steel & Metal', sub_category: 'Wire Mesh',
      unit: 'SQM', base_price: 45, supplier_company_id: supplierCompany1.id,
      description: 'Welded wire mesh for slab reinforcement, 6mm wire',
      image_url: null },
    // Concrete
    { name: 'Portland Cement Type I', category: 'Concrete & Cement',
      sub_category: 'Portland Cement', unit: 'Bag', base_price: 28,
      supplier_company_id: supplierCompany2.id,
      description: '50kg bags, Saudi Cement, SASO 1051 compliant',
      image_url: null },
    { name: 'Portland Cement Type V', category: 'Concrete & Cement',
      sub_category: 'Portland Cement', unit: 'Bag', base_price: 32,
      supplier_company_id: supplierCompany2.id,
      description: '50kg bags, sulfate resistant, for foundations',
      image_url: null },
    { name: 'Ready Mix Concrete C25', category: 'Concrete & Cement',
      sub_category: 'Ready Mix Concrete', unit: 'M3', base_price: 280,
      supplier_company_id: supplierCompany2.id,
      description: 'C25 grade, delivered to site, min order 6 M3',
      image_url: null },
    { name: 'Concrete Blocks 20cm', category: 'Concrete & Cement',
      sub_category: 'Blocks & Bricks', unit: 'Piece', base_price: 4.5,
      supplier_company_id: supplierCompany2.id,
      description: 'Hollow concrete blocks 40×20×20cm, Grade A',
      image_url: null },
    // Finishing
    { name: 'Ceramic Floor Tiles 60×60', category: 'Finishing Materials',
      sub_category: 'Ceramic Tiles', unit: 'SQM', base_price: 85,
      supplier_company_id: supplierCompany2.id,
      description: 'Polished ceramic floor tiles, white, R9 slip resistance',
      image_url: null },
    { name: 'Gypsum Board 12mm', category: 'Finishing Materials',
      sub_category: 'Plaster', unit: 'Piece', base_price: 22,
      supplier_company_id: supplierCompany2.id,
      description: 'Standard gypsum board 1.2×2.4m, fire rated available',
      image_url: null },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { name_supplier: { name: p.name,
        supplier_company_id: p.supplier_company_id } },
      update: {},
      create: { ...p, is_active: true },
    });
  }
  console.log(`✅ Created ${products.length} products`);

  // ── 6. PROJECTS & SITES ────────────────────────────────────────────────────
  const project1 = await prisma.project.upsert({
    where: { name_company: { name: 'Riyadh Villa Compound',
      company_id: contractorCompany.id } },
    update: {},
    create: {
      name: 'Riyadh Villa Compound',
      company_id: contractorCompany.id,
      status: 'ACTIVE',
      start_date: new Date('2025-09-01'),
      end_date: new Date('2026-08-31'),
      budget: 15000000,
      description: '24-unit villa compound, Riyadh North',
      sites: { create: [{
        name: 'Main Site — North Block',
        address: 'Al-Narjis District, Riyadh',
        site_lat: 24.7577,
        site_long: 46.6934,
        receiver_name: 'Khalid Al-Mutairi',
        receiver_phone: '+966501234569',
      }]},
    },
  });

  const project2 = await prisma.project.upsert({
    where: { name_company: { name: 'New Cairo Office Tower',
      company_id: egyptContractor.id } },
    update: {},
    create: {
      name: 'New Cairo Office Tower',
      company_id: egyptContractor.id,
      status: 'ACTIVE',
      start_date: new Date('2025-11-01'),
      end_date: new Date('2027-06-30'),
      budget: 85000000,
      description: '22-floor commercial tower, New Administrative Capital',
      sites: { create: [{
        name: 'Tower Site',
        address: 'R3 District, New Administrative Capital',
        site_lat: 30.0330,
        site_long: 31.7394,
        receiver_name: 'Mohamed Hassan',
        receiver_phone: '+201012345679',
      }]},
    },
  });
  console.log('✅ Created projects and sites');

  // ── 7. BOQ ITEMS ──────────────────────────────────────────────────────────
  await prisma.bOQItem.createMany({
    skipDuplicates: true,
    data: [
      { project_id: project1.id, category: 'Steel & Metal',
        description: 'Rebar 16mm', quantity: 500, unit: 'Ton',
        unit_rate: 4500, csi_code: '03-2100' },
      { project_id: project1.id, category: 'Steel & Metal',
        description: 'Wire Mesh 200×200', quantity: 8000, unit: 'SQM',
        unit_rate: 48, csi_code: '03-2200' },
      { project_id: project1.id, category: 'Concrete & Cement',
        description: 'Portland Cement Type I', quantity: 12000, unit: 'Bag',
        unit_rate: 30, csi_code: '03-3000' },
      { project_id: project1.id, category: 'Concrete & Cement',
        description: 'Ready Mix C25', quantity: 2400, unit: 'M3',
        unit_rate: 300, csi_code: '03-3010' },
    ],
  });
  console.log('✅ Created BOQ items');

  // ── 8. OPEN RFQ (so supplier can see a feed) ──────────────────────────────
  const openRFQ = await prisma.rFQ.create({
    data: {
      company_id: contractorCompany.id,
      project_id: project1.id,
      title: 'Steel Rebar 16mm — Phase 1',
      status: 'OPEN',
      payment_terms: 'CREDIT',
      required_delivery_date: new Date(Date.now() + 7 * 86400000),
      items: { create: [{
        category: 'Steel & Metal',
        product_name: 'Steel Rebar 16mm',
        quantity: 100,
        unit: 'Ton',
        notes: 'Must be Grade 60, SASO certified. Delivery to north site.',
      }]},
    },
  });

  // ── 9. A BID on that RFQ (so contractor can see comparison) ──────────────
  await prisma.bid.create({
    data: {
      rfq_id: openRFQ.id,
      company_id: supplierCompany1.id,
      status: 'PENDING',
      delivery_cost: 0,
      quote_validity_hours: 48,
      notes: 'Brand: Hadeed (Sabic). All stock available, can deliver within 5 days.',
      items: { create: [{
        rfq_item_id: (await prisma.rFQItem.findFirst({
          where: { rfq_id: openRFQ.id } }))!.id,
        product_name: 'Steel Rebar 16mm',
        quantity: 100,
        unit: 'Ton',
        unit_price: 4200,
        total_price: 420000,
      }]},
    },
  });
  console.log('✅ Created RFQ and bid');

  // ── 10. AN AWARDED RFQ + PO (so orders list has data) ────────────────────
  const awardedRFQ = await prisma.rFQ.create({
    data: {
      company_id: contractorCompany.id,
      project_id: project1.id,
      title: 'Portland Cement — Foundation Phase',
      status: 'AWARDED',
      payment_terms: 'CASH',
      required_delivery_date: new Date(Date.now() + 2 * 86400000),
      items: { create: [{
        category: 'Concrete & Cement',
        product_name: 'Portland Cement Type I',
        quantity: 2000,
        unit: 'Bag',
      }]},
    },
  });

  const cementBid = await prisma.bid.create({
    data: {
      rfq_id: awardedRFQ.id,
      company_id: supplierCompany2.id,
      status: 'ACCEPTED',
      delivery_cost: 500,
      quote_validity_hours: 72,
      items: { create: [{
        rfq_item_id: (await prisma.rFQItem.findFirst({
          where: { rfq_id: awardedRFQ.id } }))!.id,
        product_name: 'Portland Cement Type I',
        quantity: 2000,
        unit: 'Bag',
        unit_price: 28,
        total_price: 56000,
      }]},
    },
  });

  const po = await prisma.purchaseOrder.create({
    data: {
      buyer_company_id: contractorCompany.id,
      supplier_company_id: supplierCompany2.id,
      rfq_id: awardedRFQ.id,
      project_id: project1.id,
      status: 'OUT_FOR_DELIVERY',
      payment_terms: 'CASH',
      required_delivery_date: new Date(Date.now() + 2 * 86400000),
      total_amount: 56500,
      items: { create: [{
        product_name: 'Portland Cement Type I',
        quantity: 2000,
        unit: 'Bag',
        unit_price: 28,
        total_price: 56000,
        received_qty: 0,
      }]},
    },
  });
  console.log('✅ Created PO in OUT_FOR_DELIVERY status');

  // ── 11. DAILY LOG SAMPLE ──────────────────────────────────────────────────
  const site = await prisma.site.findFirst({
    where: { project_id: project1.id } });
  if (site) {
    await prisma.dailyLog.create({
      data: {
        project_id: project1.id,
        user_id: siteEngineer.id,
        site_id: site.id,
        log_date: new Date(Date.now() - 86400000), // yesterday
        status: 'SUBMITTED',
        weather_data: {
          temp: 32, feels_like: 36, humidity: 42,
          wind_speed: 12, condition: 'Clear', icon: '01d',
          fetched_at: new Date().toISOString(),
        },
        attendance_data: [
          { id: '1', company_name: 'Own Crew', trade: 'Mason',
            headcount: 8, hours_worked: 9 },
          { id: '2', company_name: 'Al-Nour Electrical', trade: 'Electrician',
            headcount: 4, hours_worked: 8 },
        ],
        progress_notes: [
          { zone: 'Floor 2 - East Wing', work_done: 'Completed column shuttering',
            percentage: 100, issues: '' },
          { zone: 'Ground Floor', work_done: 'Rebar placement ongoing',
            percentage: 60, issues: 'Waiting on rebar delivery' },
        ],
      },
    });
  }
  console.log('✅ Created daily log sample');

  // ── 12. NOTIFICATIONS ─────────────────────────────────────────────────────
  await prisma.notification.createMany({
    skipDuplicates: true,
    data: [
      { user_id: contractorAdmin.id, title: 'New bid received',
        body: 'Al-Rashidi Steel submitted a bid on RFQ #RFQ-0001',
        type: 'rfq_bid', entity_id: openRFQ.id, is_read: false },
      { user_id: contractorAdmin.id, title: 'Order out for delivery',
        body: 'PO #PO-0001 is out for delivery — expected Jan 14',
        type: 'order_status', entity_id: po.id, is_read: false },
    ],
  });
  console.log('✅ Created notifications');

  console.log('\n🎉 Seed complete!\n');
  console.log('Test accounts (all password: Password123!):');
  console.log('  Contractor Admin : ahmed@alfarabi-construction.sa');
  console.log('  Site Engineer    : khalid@alfarabi-construction.sa');
  console.log('  Supplier 1       : omar@alrashidi-steel.sa');
  console.log('  Supplier 2       : ali@gulf-cement.sa');
  console.log('  Admin            : admin@construction-connect.io');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
```

Update `backend/package.json`:
```json
"prisma": { "seed": "ts-node prisma/seed.ts" }
```

Run: `npx prisma db seed`

---

### C-2 — Seed Verification Checklist
**Commit:** `test(seed): verify seed data integrity`

After running the seed, manually verify each API response:

```bash
# 1. Login as contractor
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ahmed@alfarabi-construction.sa","password":"Password123!"}' \
  | jq '.access_token'

# Save token as TOKEN=...

# 2. Check projects (must return Riyadh Villa Compound)
curl http://localhost:3000/projects -H "Authorization: Bearer $TOKEN" | jq '.[].name'

# 3. Check RFQs (must return 2 RFQs)
curl http://localhost:3000/rfqs -H "Authorization: Bearer $TOKEN" | jq 'length'

# 4. Check materials (must return 10 products, NOT hardcoded array)
curl http://localhost:3000/materials -H "Authorization: Bearer $TOKEN" | jq 'length'

# 5. Check purchase orders (must return 1 PO in OUT_FOR_DELIVERY)
curl http://localhost:3000/purchase-orders -H "Authorization: Bearer $TOKEN" | jq '.[].status'

# 6. Login as supplier, check RFQ feed
curl -X POST http://localhost:3000/auth/login \
  -d '{"email":"omar@alrashidi-steel.sa","password":"Password123!"}' | jq '.access_token'
# Then:
curl http://localhost:3000/rfqs -H "Authorization: Bearer $SUPPLIER_TOKEN" | jq '.[].title'

# 7. Check unauthenticated access is BLOCKED
curl http://localhost:3000/purchase-orders  # must return 401
curl http://localhost:3000/rfqs             # must return 401
```

All 7 checks must pass. Fix any failures before proceeding.

---

## PART D — Full Logic & UI Mapping Verification

---

### D-1 — Web: Smoke Test Every User Flow
**Commit:** `fix(web): smoke test fixes`

Test every flow end-to-end in the browser using the seeded data.
For each flow, if the UI is broken or disconnected from real API data,
**fix it in the same commit**.

#### Flow 1: Contractor creates RFQ and awards a bid
1. Login as `ahmed@alfarabi-construction.sa`
2. Navigate to RFQs → "New RFQ"
3. Complete all wizard steps, submit
4. **Assert:** RFQ appears in list with status OPEN
5. Login as `omar@alrashidi-steel.sa`
6. Navigate to RFQ Feed → find the new RFQ → submit a bid
7. **Assert:** Bid appears in backend (`GET /rfqs/:id/bids`)
8. Login back as Ahmed → navigate to RFQ → Bid Comparison
9. **Assert:** Bid comparison table shows Omar's bid
10. Click "Select" → confirm → **Assert:** PO created, navigated to `/orders/:id`

**Common failures to fix:**
- `BidComparisonTable` still showing toast-only (see `AGENT_PROMPT.md` §2.3)
- RFQ list not refreshing after creation (`queryClient.invalidateQueries`)
- Company filter not applied (all RFQs visible to wrong user)

#### Flow 2: PO fulfillment through to invoice
1. Navigate to Orders → find PO from seed (OUT_FOR_DELIVERY)
2. Click "Record GRN" → fill in received quantities → attach photo → submit
3. **Assert:** PO status changes to DELIVERED
4. **Assert:** Invoice auto-generated (check Financials page)
5. Navigate to Financials → find invoice → click "Download PDF"
6. **Assert:** PDF downloads (or signed URL opens)

#### Flow 3: Admin KYB approval
1. Login as `admin@construction-connect.io`
2. Navigate to Admin → User Management → find a pending supplier
3. View uploaded documents → click "Approve"
4. **Assert:** Company `is_verified` = true in DB
5. **Assert:** Supplier receives notification

#### Flow 4: Supplier manages catalog
1. Login as supplier
2. Navigate to Products → "Add Product"
3. Fill form → submit
4. **Assert:** Product appears in `GET /materials`
5. **Assert:** Product visible in mobile catalog after sync

---

### D-2 — Mobile: Smoke Test Every User Flow
**Commit:** `fix(mobile): smoke test fixes`

Using the seeded data and a real device/simulator:

#### Flow 1: Site Engineer daily log
1. Login as `khalid@alfarabi-construction.sa`
2. Today tab → "Start Today's Log"
3. Weather auto-fetches (need real OWM key in `.env`) — or test manual entry
4. Add 2 attendance rows
5. Take 1 photo
6. Save Draft → kill app → reopen
7. **Assert:** Draft log persists (WatermelonDB offline)
8. Submit → toggle airplane mode off → wait 60s
9. **Assert:** Log appears in `GET /daily-logs` on backend

#### Flow 2: GRN offline
1. Disconnect network (airplane mode)
2. Navigate to Orders → tap "Record GRN" for the seeded PO
3. Mark 1000 bags received → photo of delivery ticket → Confirm
4. **Assert:** GRN record in WatermelonDB with `synced: false`
5. Restore network → wait sync
6. **Assert:** `POST /purchase-orders/:id/delivery-notes` was called
7. **Assert:** PO status updated to DELIVERED

#### Flow 3: RFQ blast from mobile
1. Navigate to Market → RFQ → New RFQ
2. Select Steel & Metal → enter quantity → select vendors → blast
3. **Assert:** RFQ record in WatermelonDB (offline)
4. Sync → **Assert:** RFQ appears in `GET /rfqs` on backend

---

### D-3 — Fix Remaining Logic Gaps
**Commit:** `fix(logic): close remaining gaps found during smoke testing`

After running all smoke tests, create a fix list. The most common gaps
expected based on the audit:

1. **Wallet balance does not update after PO completion**
   In `purchase-orders.service.ts`, after status → `COMPLETED`, call
   `WalletsService.recordTransaction(buyerCompanyId, amount, 'DEBIT')`
   and `WalletsService.recordTransaction(supplierCompanyId, amount, 'CREDIT')`.

2. **Commission not deducted**
   In the same COMPLETED handler, read `CompanySettings.commission_rate`
   (default 0 if not set), deduct from supplier wallet transaction.

3. **Notification bell count does not clear on read**
   `PATCH /notifications/mark-read/:id` must invalidate the unread count
   query in the frontend (`queryClient.invalidateQueries(['notifications'])`).

4. **Mobile sync does not push daily logs**
   Verify `daily_logs` is in the sync `processOrder` array in
   `backend/src/sync/sync.service.ts`. If missing, add it.

5. **Delivery note PDF generates with placeholder supplier name**
   Invoice PDF generation must `include: { supplier: true, buyer: true }`
   in the Prisma query before building the PDF.

6. **Admin commission config not enforced**
   `FR-F-03`: read commission % from `company_settings` where
   `company_id = platform_admin_company_id`. Store this in a dedicated
   `platform_settings` table if not already present.

---

### D-4 — Final Pre-Production Checklist
**Commit:** `chore: final production readiness verification`

Run through every item. Do not mark complete until it passes:

#### Security
- [ ] `POST /purchase-orders` without token → `401 Unauthorized`
- [ ] `GET /rfqs` as supplier → only sees open RFQs, not other companies' awarded RFQs
- [ ] `GET /projects` as contractor A → does NOT see contractor B's projects
- [ ] `PATCH /rfqs/:id/award/:bidId` as supplier → `403 Forbidden`
- [ ] `PATCH /companies/:id/verify` as contractor → `403 Forbidden`

#### Core business logic
- [ ] RFQ created → appears in supplier feed → bid submitted → comparison shown → award → PO created
- [ ] PO status transitions: CONFIRMED → PROCESSING → OUT_FOR_DELIVERY → DELIVERED → COMPLETED
- [ ] GRN creates inventory row + updates `received_qty` on PO item
- [ ] Invoice auto-generated on DELIVERED status
- [ ] ZATCA QR code present on KSA invoices
- [ ] Wallet balances update on COMPLETED
- [ ] Audit log row created for every POST/PATCH/DELETE

#### Mobile offline
- [ ] App opens in airplane mode and shows cached data
- [ ] Daily log created offline, syncs within 60s of network restore
- [ ] GRN submitted offline, syncs correctly
- [ ] Photo taken offline, uploads to S3 after connection restore
- [ ] Cart order queued offline, placed after connection restore

#### Data integrity
- [ ] No hardcoded arrays returned by any API endpoint
- [ ] No `Math.random()` or mock data in any component
- [ ] `GET /materials` returns seeded products from DB
- [ ] `GET /rfqs` (supplier) returns only OPEN rfqs in matching categories
- [ ] All amounts displayed in correct currency (SAR for KSA, EGP for Egypt)

#### Build
- [ ] `cd backend && npm run build` exits 0
- [ ] `cd frontend && npm run build` exits 0
- [ ] `cd mobile && npx expo export` exits 0
- [ ] `cd backend && npm run test:e2e` — RFQ award flow test passes
- [ ] Zero TypeScript errors across all three packages

---

*Work in order: Part A → Part B → Part C → Part D.
Part C (seeding) must be complete before Part D (smoke testing) begins.
Any bug found in Part D must be fixed immediately in the same section commit.*
