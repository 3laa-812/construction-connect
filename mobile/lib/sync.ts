import { synchronize } from '@nozbe/watermelondb/sync';
import { database } from './watermelon';
import { api } from './api';
import { useSyncStore } from '../store/syncStore';

let isSyncRunning = false;

export async function syncDatabase(lastPulledAt?: number) {
  if (isSyncRunning) {
    console.log('[Sync] Synchronization already in progress, skipping...');
    return;
  }

  isSyncRunning = true;
  useSyncStore.getState().setSyncing(true);

  try {
    await synchronize({
    database,
    pullChanges: async ({ lastPulledAt, schemaVersion, migration }) => {
      const { data } = await api.get('/sync/pull', {
        params: { last_pulled_at: lastPulledAt },
      });
      return { changes: data.changes, timestamp: data.timestamp };
    },
    pushChanges: async ({ changes, lastPulledAt }) => {
      await api.post(
        '/sync/push',
        { changes },
        {
          params: { last_pulled_at: lastPulledAt },
        }
      );
    },
    sendCreatedAsUpdated: false,
    });
    useSyncStore.getState().setLastSyncAt(Date.now());
  } finally {
    isSyncRunning = false;
    useSyncStore.getState().setSyncing(false);
  }
}
