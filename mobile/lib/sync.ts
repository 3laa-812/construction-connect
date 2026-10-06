import { synchronize } from '@nozbe/watermelondb/sync';
import { Q } from '@nozbe/watermelondb';
import { database } from './watermelon';
import { api } from './api';
import { useSyncStore } from '../store/syncStore';

let isSyncRunning = false;

export async function refreshPendingCount() {
  try {
    const draftLogs = await database
      .get('daily_logs')
      .query(Q.where('status', Q.notEq('SYNCED')))
      .fetchCount();
    const pendingPhotos = await database
      .get('log_photos')
      .query(Q.where('uploaded', false))
      .fetchCount();
    useSyncStore.getState().setPendingCount(draftLogs + pendingPhotos);
  } catch {
    // no-op to keep sync resilient
  }
}

export async function syncDatabase(lastPulledAt?: number) {
  if (isSyncRunning) {
    console.log('[Sync] Synchronization already in progress, skipping...');
    return;
  }

  isSyncRunning = true;
  useSyncStore.getState().setSyncing(true);

  try {
    await refreshPendingCount();
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
    await refreshPendingCount();
  } finally {
    isSyncRunning = false;
    useSyncStore.getState().setSyncing(false);
  }
}
