import { synchronize } from '@nozbe/watermelondb/sync'
import { database } from '../db'
import { API_URL } from './api'
import { getItem } from './storage'

const SYNC_API_URL = `${API_URL}/sync`

export async function syncData() {
  try {
    const token = await getItem('user_token')
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {}

    await synchronize({
      database,
      pullChanges: async ({ lastPulledAt, schemaVersion, migration }) => {
        const response = await fetch(
          `${SYNC_API_URL}/pull?last_pulled_at=${lastPulledAt ?? 0}`,
          {
            headers: {
              ...authHeaders,
            },
          },
        )
        
        if (!response.ok) {
          throw new Error(await response.text())
        }

        const { changes, timestamp } = await response.json()
        return { changes, timestamp }
      },
      pushChanges: async ({ changes, lastPulledAt }) => {
        const response = await fetch(`${SYNC_API_URL}/push`, {
            method: 'POST',
            body: JSON.stringify({ changes, lastPulledAt }),
            headers: {
                'Content-Type': 'application/json',
                ...authHeaders,
            }
        })

        if (!response.ok) {
          throw new Error(await response.text())
        }
      },
      migrationsEnabledAtVersion: 1,
    })
    console.log("Sync finished successfully")
  } catch (error) {
    console.error("Sync failed", error)
    // Optional: Alert.alert("Sync Failed", "Could not sync data. working offline.")
  }
}
