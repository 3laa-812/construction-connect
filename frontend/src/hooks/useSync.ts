import { useState } from 'react'
import { sync } from '@/lib/sync'

export function useSync() {
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const triggerSync = async () => {
    if (isSyncing) return
    setIsSyncing(true)
    setError(null)
    try {
      await sync()
    } catch (e) {
      console.error('Sync failed', e)
      setError(e as Error)
    } finally {
      setIsSyncing(false)
    }
  }

  return { sync: triggerSync, isSyncing, error }
}
