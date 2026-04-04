# 🔧 SURGICAL FIX — Empty Today & Site Tabs After Login
> **Symptom:** Login succeeds but Today tab and Site tab show white page with
> "No active project / Choose a project from the header"
>
> **Root cause chain (all 5 must be fixed, in order):**
> 1. Sync never runs after login → WatermelonDB `projects` table stays empty
> 2. Even if sync runs, backend `GET /sync/pull` returns projects for ALL
>    companies (no company scoping) — or returns nothing if scoping is wrong
> 3. Even if projects land in WatermelonDB, the `projectStore` never
>    auto-selects one → `activeProject` stays `null` → UI shows the empty state
> 4. The Today tab reads `activeProject` from the store but renders the
>    empty-state message instead of triggering auto-selection
> 5. The Site tab has the same `activeProject === null` guard with no fallback
>
> **Do not touch frontend/ or backend schema unless a step explicitly says so.**
> Fix in order. One commit per step.

---

## STEP 1 — Confirm the database has projects for this company
**Commit:** `fix(debug): verify seed projects exist for contractor company`

Before touching any code, run these two checks. They tell you which
of the 5 causes above is actually active right now.

```bash
# 1a. Get a token for the contractor
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ahmed@alfarabi.sa","password":"Demo1234!"}' \
  | jq -r '.access_token')

echo "Token obtained: ${TOKEN:0:40}..."

# 1b. Hit the projects endpoint
curl -s http://localhost:3000/projects \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

**Expected:** JSON array with at least 1 project whose `company_id`
matches the contractor's company.

**If you get `[]` (empty array):** the seed did not run correctly.
Run `npx prisma db seed` from the `backend/` directory, then re-run
the check above.

**If you get `401`:** the JWT guard is blocking the projects endpoint.
Check that `ProjectsController` has `@UseGuards(JwtAuthGuard)` and the
token is valid (not expired).

**If you get projects but with wrong `company_id`:** the seed ran but
the `company_id` in the project row doesn't match what the JWT encodes
as `companyId`. Fix the seed or re-seed.

Do not proceed to Step 2 until this returns at least 1 project.

---

## STEP 2 — Fix the sync pull to return projects scoped to the caller
**Commit:** `fix(backend): sync pull scopes projects to caller's companyId`

Open `backend/src/sync/sync.service.ts`.

Find the pull handler (it likely calls something like
`this.prisma.project.findMany({})` with no `where` clause, or reads from
`sync_changes` without company filtering).

Replace the projects fetch inside the pull response with:

```ts
const projects = await this.prisma.project.findMany({
  where: {
    company_id: user.companyId,   // ← THIS IS THE CRITICAL LINE
    updated_at: { gt: since },
  },
  include: { sites: true },
});
```

Also make sure the pull controller passes the authenticated user into the
service. Open `backend/src/sync/sync.controller.ts`:

```ts
@Get('pull')
pull(
  @Query('last_pulled_at') lastPulledAt: string,
  @CurrentUser() user: JwtPayload,   // ← must be here
) {
  return this.syncService.pull(Number(lastPulledAt ?? '0'), user);
}
```

**Verify fix:** restart the backend, then:
```bash
curl -s "http://localhost:3000/sync/pull?last_pulled_at=0" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.changes.projects.created | length'
```
Must return a number > 0 (at least 1 project). If it still returns 0,
check that `since` is computed correctly:
```ts
const since = new Date(lastPulledAt);
// If lastPulledAt = 0, since = new Date(0) = Jan 1 1970
// ALL rows should be newer than this
```

---

## STEP 3 — Fix the mobile sync to actually run after login
**Commit:** `fix(mobile): trigger sync immediately after successful login`

Open `mobile/services/sync.ts`. Find the `synchronize()` call.

The two most common bugs here are:

**Bug A — JWT not attached:**
```ts
// WRONG (no auth header):
const res = await fetch(`${API_BASE}/sync/pull?last_pulled_at=0`);

// CORRECT:
const token = await authStorage.getToken();
const res = await fetch(`${API_BASE}/sync/pull?last_pulled_at=0`, {
  headers: { Authorization: `Bearer ${token}` },
});
```

**Bug B — Wrong body shape on push:**
```ts
// WRONG (sends raw WatermelonDB envelope):
body: JSON.stringify(changes)

// CORRECT (backend expects { changes: ... }):
body: JSON.stringify({ changes })
```

After fixing `sync.ts`, open `mobile/context/AuthContext.tsx` (or wherever
the `login()` function lives). After a successful login, immediately
trigger sync:

```ts
const login = async (email: string, password: string) => {
  const res = await apiFetch<{ access_token: string; user: AuthUser }>(
    '/auth/login',
    { method: 'POST', body: JSON.stringify({ email, password }) },
  );

  // 1. Persist credentials
  await authStorage.saveToken(res.access_token);
  await authStorage.saveUser(res.user);
  setToken(res.access_token);
  setUser(res.user);

  // 2. IMMEDIATELY sync so WatermelonDB is populated before navigation
  try {
    await syncDatabase(database);   // ← add this line
  } catch (e) {
    // Non-fatal: user can still navigate, data loads on next sync
    console.warn('Initial sync failed:', e);
  }
};
```

Also open `mobile/app/_layout.tsx`. Ensure there is a `useEffect` that
re-syncs when the token becomes available (covers app restarts where the
user is already logged in):

```ts
const { token } = useAuth();
const database  = useDatabase();

useEffect(() => {
  if (!token) return;
  syncDatabase(database).catch(e => console.warn('Startup sync failed:', e));
}, [token]);   // runs once when token is first set (login or app restore)
```

---

## STEP 4 — Fix the WatermelonDB schema to include the `projects` table
**Commit:** `fix(mobile): watermelonDB schema includes projects and sites tables`

Open `mobile/db/schema.ts`.

Check that a `projects` table exists. It is very common for it to be
missing or to have column name mismatches with what the backend sends.

The backend sends snake_case keys. WatermelonDB model field decorators
map them. Make sure the **schema column names are snake_case** (matching
what the backend pull returns), not camelCase:

```ts
tableSchema({
  name: 'projects',
  columns: [
    { name: 'name',        type: 'string' },
    { name: 'status',      type: 'string' },
    { name: 'company_id',  type: 'string' },   // snake_case ← critical
    { name: 'budget',      type: 'number', isOptional: true },
    { name: 'start_date',  type: 'number', isOptional: true },
    { name: 'end_date',    type: 'number', isOptional: true },
    { name: 'description', type: 'string', isOptional: true },
    { name: 'updated_at',  type: 'number' },
  ],
}),
tableSchema({
  name: 'sites',
  columns: [
    { name: 'project_id',     type: 'string' },
    { name: 'name',           type: 'string' },
    { name: 'address',        type: 'string', isOptional: true },
    { name: 'site_lat',       type: 'number', isOptional: true },
    { name: 'site_long',      type: 'number', isOptional: true },
    { name: 'receiver_name',  type: 'string', isOptional: true },
    { name: 'receiver_phone', type: 'string', isOptional: true },
    { name: 'updated_at',     type: 'number' },
  ],
}),
```

**Increment the schema version number** by 1 (e.g. from 3 to 4).

Open `mobile/db/migrations.ts`. Add a migration for the new version that
creates these tables if they didn't exist before:

```ts
addMigrations({
  migrations: [
    // ... existing migrations ...
    {
      toVersion: 4,  // match the new schema version
      steps: [
        createTable({
          name: 'projects',
          columns: [
            { name: 'name',        type: 'string' },
            { name: 'status',      type: 'string' },
            { name: 'company_id',  type: 'string' },
            { name: 'budget',      type: 'number', isOptional: true },
            { name: 'start_date',  type: 'number', isOptional: true },
            { name: 'end_date',    type: 'number', isOptional: true },
            { name: 'description', type: 'string', isOptional: true },
            { name: 'updated_at',  type: 'number' },
          ],
        }),
        createTable({
          name: 'sites',
          columns: [
            { name: 'project_id',     type: 'string' },
            { name: 'name',           type: 'string' },
            { name: 'address',        type: 'string', isOptional: true },
            { name: 'site_lat',       type: 'number', isOptional: true },
            { name: 'site_long',      type: 'number', isOptional: true },
            { name: 'receiver_name',  type: 'string', isOptional: true },
            { name: 'receiver_phone', type: 'string', isOptional: true },
            { name: 'updated_at',     type: 'number' },
          ],
        }),
      ],
    },
  ],
});
```

Open `mobile/db/models/Project.ts`. Make sure the `@field` decorators use
**camelCase property names** mapped from **snake_case column names**:

```ts
import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export default class Project extends Model {
  static table = 'projects';

  @field('name')        name!: string;
  @field('status')      status!: string;
  @field('company_id')  companyId!: string;   // column: company_id, prop: companyId
  @field('budget')      budget!: number;
  @field('start_date')  startDate!: number;
  @field('end_date')    endDate!: number;
  @field('description') description!: string;
  @field('updated_at')  updatedAt!: number;
}
```

Create `mobile/db/models/Site.ts` if it doesn't exist:

```ts
import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export default class Site extends Model {
  static table = 'sites';

  @field('project_id')    projectId!: string;
  @field('name')          name!: string;
  @field('address')       address!: string;
  @field('site_lat')      siteLat!: number;
  @field('site_long')     siteLong!: number;
  @field('receiver_name') receiverName!: string;
  @field('receiver_phone')receiverPhone!: string;
  @field('updated_at')    updatedAt!: number;
}
```

Open `mobile/db/index.ts`. Make sure `Project` and `Site` are registered
in the `modelClasses` array:

```ts
import Project from './models/Project';
import Site    from './models/Site';

const database = new Database({
  adapter,
  modelClasses: [
    Project,
    Site,
    // ... all other models
  ],
});
```

---

## STEP 5 — Fix the projectStore to auto-select after sync
**Commit:** `fix(mobile): projectStore auto-selects first project after sync`

Open `mobile/store/projectStore.ts` (create it if missing):

```ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ProjectStore {
  activeProjectId: string | null;
  setActiveProjectId: (id: string) => void;
  clearActiveProject: () => void;
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set) => ({
      activeProjectId: null,
      setActiveProjectId: (id) => set({ activeProjectId: id }),
      clearActiveProject: () => set({ activeProjectId: null }),
    }),
    {
      name: 'active-project-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
```

**Why persist?** The user shouldn't have to re-select their project every
app launch. Persisting the ID means it survives kills and restarts.

---

## STEP 6 — Fix the Today tab to auto-select and never show empty state
**Commit:** `fix(mobile): Today tab auto-selects project and renders correctly`

Open `mobile/app/(tabs)/index.tsx` (the Today tab — also check
`mobile/app/(tabs)/dashboard.tsx` since the audit names both).

Replace the entire component with this corrected version:

```tsx
import React, { useEffect } from 'react';
import { View, Text, FlatList, Pressable,
         ActivityIndicator, StyleSheet } from 'react-native';
import { useDatabase } from '@nozbe/watermelondb/hooks';
import { useQuery }    from '@nozbe/watermelondb/hooks';
import { Q }           from '@nozbe/watermelondb';
import { useAuth }     from '../../context/AuthContext';
import { useProjectStore } from '../../store/projectStore';
import { syncDatabase }    from '../../services/sync';
import Project   from '../../db/models/Project';
import DailyLog  from '../../db/models/DailyLog';
import { colors, typography, spacing, radius, shadows } from '../../constants/tokens';

export default function TodayTab() {
  const { user, token } = useAuth();
  const database = useDatabase();
  const { activeProjectId, setActiveProjectId } = useProjectStore();
  const [syncing, setSyncing] = React.useState(false);
  const [syncError, setSyncError] = React.useState<string | null>(null);

  // ── 1. Load all projects from WatermelonDB ────────────────────────────────
  const projects = useQuery(
    database
      .get<Project>('projects')
      .query(Q.sortBy('name', Q.asc)),
  );

  // ── 2. Auto-select first project if none stored ───────────────────────────
  useEffect(() => {
    if (projects.length > 0 && !activeProjectId) {
      setActiveProjectId(projects[0].id);
    }
  }, [projects, activeProjectId]);

  // ── 3. Resolve active project object ─────────────────────────────────────
  const activeProject = projects.find(p => p.id === activeProjectId)
    ?? projects[0]   // fallback: just take the first one
    ?? null;

  // If we have projects but activeProjectId points to a deleted one, fix it
  useEffect(() => {
    if (projects.length > 0 && activeProject && activeProjectId !== activeProject.id) {
      setActiveProjectId(activeProject.id);
    }
  }, [activeProject]);

  // ── 4. Load today's log for active project ────────────────────────────────
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayLogs = useQuery(
    activeProject
      ? database
          .get<DailyLog>('daily_logs')
          .query(
            Q.where('project_id', activeProject.id),
            Q.where('log_date',   Q.gte(todayStart.getTime())),
          )
      : database.get<DailyLog>('daily_logs').query(Q.where('id', 'NEVER')),
  );

  // ── 5. Load past logs ─────────────────────────────────────────────────────
  const pastLogs = useQuery(
    activeProject
      ? database
          .get<DailyLog>('daily_logs')
          .query(
            Q.where('project_id', activeProject.id),
            Q.where('log_date',   Q.lt(todayStart.getTime())),
            Q.sortBy('log_date',  Q.desc),
            Q.take(10),
          )
      : database.get<DailyLog>('daily_logs').query(Q.where('id', 'NEVER')),
  );

  // ── 6. Manual sync handler ────────────────────────────────────────────────
  const handleSync = async () => {
    if (!token) return;
    setSyncing(true);
    setSyncError(null);
    try {
      await syncDatabase(database);
    } catch (e: any) {
      setSyncError(e.message ?? 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  // ── 7. RENDER: Loading state ──────────────────────────────────────────────
  // projects array is not yet observed (initial render before WatermelonDB
  // subscription fires) — show a brief spinner, NOT the empty state
  if (projects === undefined) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.amber} />
      </View>
    );
  }

  // ── 8. RENDER: No projects at all ────────────────────────────────────────
  // Show this ONLY when we are sure WatermelonDB is ready AND has 0 rows
  if (projects.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyIcon}>🏗️</Text>
        <Text style={styles.emptyTitle}>No projects yet</Text>
        <Text style={styles.emptyBody}>
          Your projects will appear here after syncing.
          Make sure a project has been created on the web dashboard.
        </Text>
        <Pressable
          style={[styles.syncButton, syncing && styles.syncButtonDisabled]}
          onPress={handleSync}
          disabled={syncing}
        >
          {syncing
            ? <ActivityIndicator color={colors.ground} size="small" />
            : <Text style={styles.syncButtonText}>
                {syncError ? '⚠️ Retry Sync' : '↻ Sync Now'}
              </Text>
          }
        </Pressable>
        {syncError && (
          <Text style={styles.errorText}>{syncError}</Text>
        )}
      </View>
    );
  }

  // ── 9. RENDER: Normal state (project selected, data ready) ────────────────
  const todayLog = todayLogs[0] ?? null;

  return (
    <View style={styles.container}>

      {/* ── Project selector header ────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>{greeting(user?.firstName)}</Text>
          <Text style={styles.date}>{formatDate(new Date())}</Text>
        </View>
        <Pressable style={styles.syncIcon} onPress={handleSync}>
          {syncing
            ? <ActivityIndicator color={colors.amber} size="small" />
            : <Text style={styles.syncIconText}>↻</Text>
          }
        </Pressable>
      </View>

      {/* ── Project pill (tap to switch) ─────────────────────────────── */}
      <View style={styles.projectRow}>
        <Text style={styles.projectLabel}>🏗️</Text>
        <Text style={styles.projectName} numberOfLines={1}>
          {activeProject?.name ?? 'Select project'}
        </Text>
        {projects.length > 1 && (
          <Text style={styles.projectChevron}>▼</Text>
        )}
      </View>
      {/* Project switcher: show other projects as pressable pills below */}
      {projects.length > 1 && (
        <View style={styles.projectSwitcher}>
          {projects
            .filter(p => p.id !== activeProject?.id)
            .map(p => (
              <Pressable
                key={p.id}
                style={styles.projectPill}
                onPress={() => setActiveProjectId(p.id)}
              >
                <Text style={styles.projectPillText}>{p.name}</Text>
              </Pressable>
            ))
          }
        </View>
      )}

      {/* ── Today's log card ─────────────────────────────────────────── */}
      <FlatList
        data={pastLogs}
        keyExtractor={log => log.id}
        ListHeaderComponent={() => (
          <TodayLogCard log={todayLog} projectId={activeProject?.id ?? ''} />
        )}
        renderItem={({ item }) => <PastLogRow log={item} />}
        ListEmptyComponent={() => (
          <Text style={styles.noLogs}>No past logs this week</Text>
        )}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

// ── Helper: greeting ─────────────────────────────────────────────────────────
function greeting(firstName?: string): string {
  const h = new Date().getHours();
  const prefix = h < 12 ? 'Good morning'
    : h < 17 ? 'Good afternoon'
    : 'Good evening';
  return firstName ? `${prefix}, ${firstName} ☀️` : `${prefix} ☀️`;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-SA', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

// ── Sub-components ──────────────────────────────────────────────────────────
function TodayLogCard({
  log, projectId,
}: { log: DailyLog | null; projectId: string }) {
  const router = useRouter();

  if (!log) {
    return (
      <Pressable
        style={styles.newLogCard}
        onPress={() => router.push({
          pathname: '/daily-log/new',
          params: { projectId },
        })}
      >
        <Text style={styles.newLogText}>+ Start Today's Log</Text>
      </Pressable>
    );
  }

  const pct = logCompletionPct(log);
  return (
    <Pressable
      style={styles.todayCard}
      onPress={() => router.push(`/daily-log/${log.id}`)}
    >
      <View style={styles.todayCardTop}>
        <Text style={styles.todayCardTitle}>Today's Log</Text>
        <StatusBadge status={log.status} />
      </View>
      <View style={styles.todayCardMeta}>
        <Text style={styles.metaText}>
          {countAttendance(log)} workers ·{' '}
          {countPhotos(log)} photos
        </Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct}%` as any }]} />
      </View>
      <Text style={styles.continueText}>Continue →</Text>
    </Pressable>
  );
}

function PastLogRow({ log }: { log: DailyLog }) {
  const router = useRouter();
  const date   = new Date(log.logDate);
  return (
    <Pressable
      style={styles.pastRow}
      onPress={() => router.push(`/daily-log/${log.id}`)}
    >
      <View style={styles.pastRowLeft}>
        <Text style={styles.pastRowDate}>
          {date.toLocaleDateString('en-SA', { weekday: 'short', day: 'numeric', month: 'short' })}
        </Text>
        <Text style={styles.pastRowMeta}>
          {countAttendance(log)} workers · {countPhotos(log)} photos
        </Text>
      </View>
      <StatusBadge status={log.status} />
    </Pressable>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    draft:     { label: 'DRAFT',     color: colors.text2,   bg: colors.surface2 },
    submitted: { label: 'SUBMITTED', color: colors.info,    bg: colors.infoBg   },
    synced:    { label: 'SYNCED',    color: colors.success, bg: colors.successBg},
  };
  const s = map[status.toLowerCase()] ?? map.draft;
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Text style={[styles.badgeText, { color: s.color }]}>{s.label}</Text>
    </View>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function logCompletionPct(log: DailyLog): number {
  let done = 0;
  const weatherData    = log.weatherData ? JSON.parse(log.weatherData) : null;
  const attendanceData = log.attendanceData ? JSON.parse(log.attendanceData) : null;
  if (weatherData?.temp)            done++;
  if (attendanceData?.length > 0)   done++;
  return Math.round((done / 2) * 100);
}

function countAttendance(log: DailyLog): number {
  try {
    const a = JSON.parse(log.attendanceData ?? '[]');
    return a.reduce((s: number, r: any) => s + (r.headcount ?? 0), 0);
  } catch { return 0; }
}

function countPhotos(_log: DailyLog): number {
  // photos are in log_photos table, linked by daily_log_id
  // for now return 0; wire to useQuery(log_photos) for a complete implementation
  return 0;
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: colors.ground },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center',
                 padding: spacing[8], backgroundColor: colors.ground },
  header:      { flexDirection: 'row', justifyContent: 'space-between',
                 alignItems: 'flex-start', padding: spacing[6],
                 paddingTop: spacing[10] },
  headerLeft:  { flex: 1 },
  greeting:    { ...typography.displaySm, color: colors.text1 },
  date:        { ...typography.bodySm, color: colors.text2, marginTop: 2 },
  syncIcon:    { width: 36, height: 36, alignItems: 'center',
                 justifyContent: 'center' },
  syncIconText:{ fontSize: 20, color: colors.amber },
  projectRow:  { flexDirection: 'row', alignItems: 'center',
                 marginHorizontal: spacing[6], marginBottom: spacing[2],
                 backgroundColor: colors.surface, borderRadius: radius.md,
                 padding: spacing[4], ...shadows.sm },
  projectLabel:{ fontSize: 16, marginRight: spacing[2] },
  projectName: { ...typography.headingMd, color: colors.text1, flex: 1 },
  projectChevron: { ...typography.bodySm, color: colors.amber },
  projectSwitcher:{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2],
                    marginHorizontal: spacing[6], marginBottom: spacing[3] },
  projectPill: { backgroundColor: colors.surface2, borderRadius: 999,
                 paddingHorizontal: spacing[3], paddingVertical: spacing[1],
                 borderWidth: 1, borderColor: colors.border },
  projectPillText: { ...typography.bodySm, color: colors.text2 },
  list:        { padding: spacing[6] },
  newLogCard:  { height: 64, borderWidth: 1.5, borderColor: colors.amber,
                 borderStyle: 'dashed', borderRadius: radius.md,
                 alignItems: 'center', justifyContent: 'center',
                 marginBottom: spacing[6], backgroundColor: colors.amberSoft },
  newLogText:  { ...typography.headingMd, color: colors.amber },
  todayCard:   { backgroundColor: colors.surface, borderRadius: radius.md,
                 padding: spacing[5], marginBottom: spacing[6], ...shadows.sm,
                 borderWidth: 1, borderColor: colors.border },
  todayCardTop:{ flexDirection: 'row', justifyContent: 'space-between',
                 alignItems: 'center', marginBottom: spacing[2] },
  todayCardTitle: { ...typography.headingMd, color: colors.text1 },
  todayCardMeta:  { marginBottom: spacing[3] },
  metaText:    { ...typography.bodySm, color: colors.text2 },
  progressTrack: { height: 4, backgroundColor: colors.border,
                   borderRadius: 2, marginBottom: spacing[2] },
  progressFill:  { height: 4, backgroundColor: colors.amber,
                   borderRadius: 2 },
  continueText:  { ...typography.bodySm, color: colors.amber,
                   textAlign: 'right' },
  pastRow:     { flexDirection: 'row', justifyContent: 'space-between',
                 alignItems: 'center', backgroundColor: colors.surface,
                 borderRadius: radius.base, padding: spacing[4],
                 marginBottom: spacing[2], borderWidth: 1,
                 borderColor: colors.border },
  pastRowLeft: { flex: 1 },
  pastRowDate: { ...typography.headingSm, color: colors.text1 },
  pastRowMeta: { ...typography.bodySm, color: colors.text2 },
  badge:       { borderRadius: radius.sm, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText:   { ...typography.label, fontSize: 10 },
  noLogs:      { ...typography.bodySm, color: colors.text3, textAlign: 'center',
                 paddingVertical: spacing[4] },
  emptyIcon:   { fontSize: 48, marginBottom: spacing[4] },
  emptyTitle:  { ...typography.headingLg, color: colors.text1,
                 marginBottom: spacing[2], textAlign: 'center' },
  emptyBody:   { ...typography.bodyMd, color: colors.text2,
                 textAlign: 'center', marginBottom: spacing[6] },
  syncButton:  { backgroundColor: colors.amber, borderRadius: radius.md,
                 paddingHorizontal: spacing[8], paddingVertical: spacing[4],
                 minWidth: 160, alignItems: 'center' },
  syncButtonDisabled: { opacity: 0.6 },
  syncButtonText: { ...typography.headingMd, color: colors.ground },
  errorText:   { ...typography.bodySm, color: colors.danger,
                 marginTop: spacing[3], textAlign: 'center' },
});
```

---

## STEP 7 — Fix the Site tab the same way
**Commit:** `fix(mobile): Site tab reads activeProject from store`

Open `mobile/app/(tabs)/dashboard.tsx` (the Site tab, named "site" or
"dashboard" in the tab layout).

Find the section that checks for an active project. It almost certainly
looks like this:

```tsx
// BROKEN — reads from a context or local state that is never populated:
const { activeProject } = useProjectContext();
if (!activeProject) return <EmptyState ... />;
```

Replace the project-reading logic entirely:

```tsx
// CORRECT — reads from the persisted Zustand store:
const { activeProjectId } = useProjectStore();
const database = useDatabase();

// Load the project object from WatermelonDB
const projects = useQuery(
  database.get<Project>('projects').query(Q.sortBy('name', Q.asc))
);
const activeProject = projects.find(p => p.id === activeProjectId)
  ?? projects[0]
  ?? null;

// Show spinner while WatermelonDB loads (not the empty-state message)
if (projects === undefined) {
  return <View style={styles.center}><ActivityIndicator color={colors.amber} /></View>;
}

// Only show "no project" message when DB is ready AND empty
if (!activeProject) {
  return (
    <View style={styles.center}>
      <Text>No projects. Sync to load your projects.</Text>
      <Button onPress={() => syncDatabase(database)}>Sync Now</Button>
    </View>
  );
}

// Normal render with activeProject guaranteed non-null from here down
```

---

## STEP 8 — Verify the fix end-to-end
**Commit:** `test(mobile): verify Today and Site tabs show data after login`

### 8.1 Restart everything cleanly

```bash
# Terminal 1 — backend
cd backend && npm run start:dev

# Terminal 2 — mobile
cd mobile && npx expo start --clear   # --clear resets Metro cache
```

### 8.2 On the simulator/device

1. **If you were logged in before**, log out first (or clear the app's
   data/storage so WatermelonDB is wiped). This ensures you're testing
   a fresh sync, not stale data.

2. Login as `khalid@alfarabi.sa` / `Demo1234!` (Site Engineer).

3. Watch the logs in Metro / Expo terminal. You should see:
   ```
   LOG  Sync started...
   LOG  Pull: received N projects, M sites
   LOG  Sync complete
   ```

4. **Today tab** must show:
   - Project name pill: "Riyadh Villa Compound Phase 1"
   - "Start Today's Log" card (dashed amber border)
   - Past logs section (yesterday's seeded log if present)

5. **Site tab** must show the project overview, not the empty state.

### 8.3 If the Today tab still shows empty after sync

Run this in the Expo terminal (React Native Debugger or Flipper):

```js
// In the app's JS console, check WatermelonDB contents:
const db = global.__watermelonDB;  // may vary by setup
const projects = await db.get('projects').query().fetch();
console.log('Projects in WatermelonDB:', JSON.stringify(projects));
```

Expected: array with 1+ project objects.

If empty after sync: the pull response is not reaching WatermelonDB.
Add a log inside `sync.ts` pullChanges to print the raw response:

```ts
pullChanges: async ({ lastPulledAt }) => {
  const res  = await fetch(...);
  const data = await res.json();
  console.log('SYNC PULL RESPONSE:', JSON.stringify(data).slice(0, 500));
  return data;
},
```

Check that `data.changes.projects.created` is a non-empty array.

### 8.4 Expected console output (healthy sync)

```
LOG  Auth token found: eyJhbGci...
LOG  Sync started
LOG  SYNC PULL RESPONSE: {"changes":{"projects":{"created":[{"id":"seed-project-1","name":"Riyadh Villa Compound Phase 1",...}],"updated":[],"deleted":[]},...},"timestamp":1234567890}
LOG  Sync complete
LOG  projectStore: auto-selected project seed-project-1
LOG  Today tab: activeProject = Riyadh Villa Compound Phase 1
```

---

## Quick-reference: the 5 causes and their fixes

| # | Cause | Fixed in |
|---|-------|---------|
| 1 | Sync never triggered after login | Step 3 — call `syncDatabase()` inside `login()` |
| 2 | Sync pull returned wrong/empty data | Step 2 — scope projects by `companyId` |
| 3 | WatermelonDB had no `projects` table | Step 4 — add table to schema + migration |
| 4 | `projectStore` never auto-selected | Step 5 — persist store + Step 6 auto-select effect |
| 5 | Today/Site tabs showed empty state immediately | Step 6 & 7 — guard on `projects.length === 0` not `activeProject === null` |

**All 5 must be fixed. Fixing only 1–2 will not resolve the symptom.**
