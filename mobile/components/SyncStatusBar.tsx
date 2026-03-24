import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { useNetInfo } from "@react-native-community/netinfo";
import { useDatabase } from "@nozbe/watermelondb/hooks";
import { useSyncStore } from "../store/syncStore";
import { syncDatabase, refreshPendingInStore } from "../services/sync";

export function SyncStatusBar() {
  const { status, pendingCount } = useSyncStore();
  const netInfo = useNetInfo();
  const database = useDatabase();

  useEffect(() => {
    refreshPendingInStore(database).catch(console.error);
  }, [database]);

  const isOffline = netInfo.isConnected === false;

  const onRetry = () => {
    if (!isOffline) {
      syncDatabase(database).catch(console.error);
    }
  };

  if (isOffline) {
    return (
      <View style={styles.barOffline}>
        <Text style={styles.text}>
          Offline — {pendingCount} change{pendingCount === 1 ? "" : "s"} pending
        </Text>
      </View>
    );
  }

  if (status === "syncing") {
    return (
      <View style={styles.barSyncing}>
        <ActivityIndicator size="small" color="#fff" />
        <Text style={styles.text}> Syncing…</Text>
      </View>
    );
  }

  if (status === "error") {
    return (
      <Pressable onPress={onRetry} style={styles.barError}>
        <Text style={styles.text}>
          Sync failed — tap to retry ({pendingCount} pending)
        </Text>
      </Pressable>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  barOffline: {
    backgroundColor: "#7f1d1d",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  barSyncing: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1d4ed8",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  barError: {
    backgroundColor: "#b45309",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  text: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
});
