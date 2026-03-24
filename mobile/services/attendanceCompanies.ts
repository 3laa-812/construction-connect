import type { Database } from '@nozbe/watermelondb'
import { Q } from '@nozbe/watermelondb'
import AttendanceCompany from '../db/models/AttendanceCompany'

/** Upsert company names used on a saved daily log (last_used_at = now). */
export async function recordAttendanceCompanyNames(
  db: Database,
  names: string[],
): Promise<void> {
  const trimmed = [
    ...new Set(
      names
        .map((n) => n.trim())
        .filter((n) => n.length > 0),
    ),
  ]
  if (trimmed.length === 0) return

  const now = Date.now()
  await db.write(async () => {
    const col = db.get<AttendanceCompany>('attendance_companies')
    for (const name of trimmed) {
      const existing = await col
        .query(Q.where('company_name', name))
        .fetch()
      if (existing.length > 0) {
        await existing[0].update((r) => {
          r.lastUsedAt = now
        })
      } else {
        await col.create((r) => {
          r.companyName = name
          r.lastUsedAt = now
        })
      }
    }
  })
}
