import { synchronize } from '@nozbe/watermelondb/sync';
import { database } from '../db';
import api from './api';
import * as Network from 'expo-network';

let isSyncing = false;

export async function sync() {
  if (isSyncing) {
      console.log('Sync already in progress, skipping.');
      return;
  }

  const networkState = await Network.getNetworkStateAsync();
  if (!networkState.isConnected) {
      console.log('No network connection, skipping sync.');
      return;
  }

  isSyncing = true;
  try {
      const startTime = Date.now();
      await synchronize({
        database,
        pullChanges: async ({ lastPulledAt }) => {
          try {
            const timestamp = lastPulledAt || 0;
            const response = await api.get(`/sync/pull?last_pulled_at=${timestamp}`);
            
            if (!response.data) {
              throw new Error('Sync pull failed: No data');
            }

            const { changes, timestamp: newTimestamp } = response.data;
            return { changes, timestamp: newTimestamp };
          } catch (error) {
            console.error('Sync pull error:', error);
            throw new Error('Sync pull failed');
          }
        },
        pushChanges: async ({ changes, lastPulledAt }) => {
            try {
                await api.post('/sync/push', { changes, last_pulled_at: lastPulledAt });
            } catch (error) {
                console.error('Sync push error:', error);
                throw new Error('Sync push failed');
            }
        },
        migrationsEnabledAtVersion: 1,
      });
      console.log(`Sync completed in ${Date.now() - startTime}ms`);
  } catch (error) {
      console.error('Sync failed:', error);
  } finally {
      isSyncing = false;
  }
}
