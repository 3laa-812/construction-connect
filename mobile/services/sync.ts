import { synchronize } from '@nozbe/watermelondb/sync'
import { Q } from '@nozbe/watermelondb'
import { database } from '../db'
import { API_URL } from './api'
import { getItem } from './storage'
import { uploadPendingPhotos } from './photoUpload'

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

    try {
      const response = await fetch(`${API_URL}/materials`, { headers: authHeaders })
      if (response.ok) {
        const productsList = await response.json()
        await database.write(async () => {
          const productsCollection = database.get('products')
          for (const item of productsList) {
            try {
              const existingRecords = await productsCollection.query(Q.where('server_id', item.id)).fetch()
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
               console.error("Hydration item error", e)
            }
          }
        })
      }
    } catch (e) {
      console.error("Catalog hydration failed", e)
    }

    try {
      await uploadPendingPhotos(database)
    } catch (e) {
      console.error("Photo upload worker failed", e)
    }

    console.log("Sync finished successfully")
  } catch (error) {
    console.error("Sync failed", error)
    // Optional: Alert.alert("Sync Failed", "Could not sync data. working offline.")
  }
}
