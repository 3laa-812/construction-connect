import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { syncDatabase } from '../lib/sync';
import { useAuthStore } from '../store/authStore';
import { useSyncStore } from '../store/syncStore';

export function useSync() {
  const { isAuthenticated } = useAuthStore();
  const { isSyncing } = useSyncStore();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (!isAuthenticated) return;

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        if (!useSyncStore.getState().isSyncing) {
          syncDatabase().catch(console.error);
        }
      }
      appState.current = nextAppState;
    });

    const unsubscribeNet = NetInfo.addEventListener(state => {
      if (state.isConnected && state.isInternetReachable !== false) {
        if (!useSyncStore.getState().isSyncing) {
          syncDatabase().catch(console.error);
        }
      }
    });

    // Initial background sync check
    syncDatabase().catch(console.error);

    return () => {
      subscription.remove();
      unsubscribeNet();
    };
  }, [isAuthenticated]);
  
  return { isSyncing };
}
