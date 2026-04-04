# AGENT QUICK-REFERENCE CARD
## Construction Connect Mobile App — Updated with Real Design System

Read MOBILE_TECH_SPEC.md, MOBILE_IMPLEMENTATION_PLAN.md, and AGENT_PROMPT.md fully before writing any code.

---

## COLORS (from frontend/tailwind.config.ts — exact)
ground=#0D0F0E  surface=#141716  surface-2=#1C1F1D
border=#2A2E2B  border-2=#363B37
amber=#D4920A   amber-dim=#8A5F06   amber-hover=#E0A020
text-1=#F0EDE8  text-2=#9A9890   text-3=#5C5A55
danger-bg=#8B2E2E

## FONTS (from frontend/tailwind.config.ts — exact)
display: DM Serif Display  body: Geist  mono: Geist Mono  arabic: Noto Sans Arabic

## RADIUS  sm=4  default=6  md=8  lg=12
## EASING  cubic-bezier(0.16, 1, 0.3, 1) — out-expo — 120ms buttons, 300ms screens

## THE ONE RULE
Every feature MUST work offline. Write to WatermelonDB first, sync later.

## SYNC
GET /sync/pull?last_pulled_at=<ms>  →  { changes: {projects,sites}, timestamp }
POST /sync/push?last_pulled_at=<ms> ← { changes: {daily_logs,...} }
last_pulled_at is in MILLISECONDS.

## NEVER
- AsyncStorage for tokens (use expo-secure-store)
- Call GET /projects/sites (routing bug — use GET /projects/:id)
- Push product records from mobile (server ignores)
- Create invoices from mobile (auto-created on DELIVERED)
- Hardcode colors outside theme.ts
