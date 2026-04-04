import { synchronize } from '@nozbe/watermelondb/sync';
import { database } from './watermelon';
import { api } from './api';

export async function syncDatabase(lastPulledAt?: number) {
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
    migrateFromServer: false,
    sendCreatedAsUpdated: false,
  });
}
