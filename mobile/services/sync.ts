import type { Database } from '@nozbe/watermelondb'
import { synchronize } from '@nozbe/watermelondb/sync'
import { Q } from '@nozbe/watermelondb'
import { database } from '../db'
import { API_URL } from './api'
import { getAuthToken } from './storage'
import { uploadPendingPhotos } from './photoUpload'
import { useSyncStore } from '../store/syncStore'

const SYNC_API_URL = `${API_URL}/sync`

/** Tables that participate in local sync (Watermelon `_status` tracking). */
const SYNC_TABLES = [
  'users',
  'projects',
  'sites',
  'daily_logs',
  'log_photos',
  'products',
  'cart_items',
  'purchase_orders',
  'po_items',
  'site_inventory',
  'attendance_companies',
] as const

export async function countPendingLocalChanges(db: Database): Promise<number> {
  let total = 0
  for (const name of SYNC_TABLES) {
    try {
      const rows = await db
        .get(name)
        .query(Q.where('_status', Q.notEq('synced')))
        .fetch()
      total += rows.length
    } catch (e) {
      console.warn('[sync] countPending failed for', name, e)
    }
  }
  return total
}

async function refreshPendingInStore(db: Database) {
  const n = await countPendingLocalChanges(db)
  useSyncStore.getState().setPending(n)
}

export async function syncDatabase(db: Database) {
  const token = await getAuthToken()
  if (!token) {
    await refreshPendingInStore(db)
    return
  }

  const { setStatus, setLastSynced } = useSyncStore.getState()
  setStatus('syncing')

  try {
    const authHeaders = { Authorization: `Bearer ${token}` }

    await synchronize({
      database: db,
      pullChanges: async ({ lastPulledAt }) => {
        const response = await fetch(
          `${SYNC_API_URL}/pull?last_pulled_at=${lastPulledAt ?? 0}`,
          { headers: { ...authHeaders } },
        )
        if (!response.ok) {
          throw new Error(await response.text())
        }
        const { changes, timestamp } = await response.json()
        return { changes, timestamp }
      },
      pushChanges: async ({ changes }) => {
        const response = await fetch(`${SYNC_API_URL}/push`, {
          method: 'POST',
          body: JSON.stringify({ changes }),
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders,
          },
        })
        if (!response.ok) {
          throw new Error(await response.text())
        }
      },
      migrationsEnabledAtVersion: 1,
    })

    try {
      const response = await fetch(`${API_URL}/materials`, { headers: authHeaders })
      if (response.ok) {
        const productsList = await response.json()
        await db.write(async () => {
          const productsCollection = db.get('products')
          for (const item of productsList) {
            try {
              const existingRecords = await productsCollection
                .query(Q.where('server_id', item.id))
                .fetch()
              if (existingRecords.length > 0) {
                await existingRecords[0].update((rec: any) => {
                  rec.name = item.name
                  rec.category = item.category
                  rec.unit = item.unit
                  rec.price = item.base_price ? Number(item.base_price) : 0
                  rec.supplier_id = item.supplier_company_id
                })
              } else {
                await productsCollection.create((rec: any) => {
                  rec.server_id = item.id
                  rec.name = item.name
                  rec.category = item.category
                  rec.unit = item.unit
                  rec.price = item.base_price ? Number(item.base_price) : 0
                  rec.supplier_id = item.supplier_company_id
                })
              }
            } catch (e) {
              console.error('Hydration item error', e)
            }
          }
        })
      }
    } catch (e) {
      console.error('Catalog hydration failed', e)
    }

    try {
      await uploadPendingPhotos(db)
    } catch (e) {
      console.error('Photo upload worker failed', e)
    }

    setLastSynced(new Date())
    setStatus('idle')
    await refreshPendingInStore(db)
    console.log('Sync finished successfully')
  } catch (error) {
    console.error('Sync failed', error)
    setStatus('error')
    await refreshPendingInStore(db)
    throw error
  }
}

/** Back-compat: sync the default app database singleton. */
export async function syncData() {
  return syncDatabase(database)
}

export { refreshPendingInStore }
