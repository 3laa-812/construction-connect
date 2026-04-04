import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useSyncStore } from '../../store/syncStore';
import { Colors } from '../../constants/theme';

export function SyncBanner() {
  const [isOnline, setIsOnline] = useState(true);
  const { pendingCount, isSyncing } = useSyncStore();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? true);
    });
    return unsubscribe;
  }, []);

  if (isOnline && pendingCount === 0 && !isSyncing) return null;

  let message = '';
  if (!isOnline) {
    message = 'Offline mode (Changes will sync automatically)';
  } else if (isSyncing) {
    message = 'Syncing securely...';
  } else if (pendingCount > 0) {
    message = `${pendingCount} changes waiting for connection`;
  }

  return (
    <View style={[styles.container, !isOnline ? styles.offline : styles.syncing]}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offline: {
    backgroundColor: Colors.surface2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  syncing: {
    backgroundColor: Colors.amber + '33', 
    borderBottomWidth: 1,
    borderBottomColor: Colors.amber,
  },
  text: {
    color: Colors.text2,
    fontSize: 12,
    fontFamily: 'Geist',
    fontWeight: '500',
  }
});
