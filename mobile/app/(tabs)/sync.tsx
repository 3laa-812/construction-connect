import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDatabase } from "@nozbe/watermelondb/hooks";
import { syncDatabase, countPendingLocalChanges } from "../../services/sync";
import { useSyncStore } from "../../store/syncStore";
import { ErrorState } from "../../components/ErrorState";
import { hapticLight, hapticSuccess, hapticError } from "../../services/haptics";

export default function SyncTabScreen() {
  const db = useDatabase();
  const { status, pendingCount, lastSyncedAt } = useSyncStore();
  const [error, setError] = useState<string | null>(null);
  const [localPending, setLocalPending] = useState(0);

  useEffect(() => {
    void countPendingLocalChanges(db).then(setLocalPending);
  }, [db, status, pendingCount]);

  const runSync = async () => {
    hapticLight();
    setError(null);
    try {
      await syncDatabase(db);
      hapticSuccess();
      void countPendingLocalChanges(db).then(setLocalPending);
    } catch (e) {
      hapticError();
      setError(e instanceof Error ? e.message : "Sync failed");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-4 py-4 border-b border-border">
        <Text className="text-2xl font-bold text-foreground">Sync</Text>
        <Text className="text-muted-foreground text-base mt-1">
          Background sync and pending changes
        </Text>
      </View>

      <ScrollView className="flex-1 p-4">
        <View className="bg-card border border-border rounded-2xl p-4 mb-4">
          <Text className="text-xs uppercase text-muted-foreground mb-1">Status</Text>
          <Text className="text-xl font-bold text-foreground capitalize">{status}</Text>
        </View>

        <View className="bg-card border border-border rounded-2xl p-4 mb-4">
          <Text className="text-xs uppercase text-muted-foreground mb-1">
            Pending local changes
          </Text>
          <Text className="text-foreground text-3xl font-bold">{localPending}</Text>
        </View>

        <View className="bg-card border border-border rounded-2xl p-4 mb-4">
          <Text className="text-xs uppercase text-muted-foreground mb-1">
            Last sync (UI store)
          </Text>
          <Text className="text-foreground text-base">
            {lastSyncedAt ? lastSyncedAt.toLocaleString() : "—"}
          </Text>
        </View>

        {error ? (
          <View className="mb-4">
            <ErrorState
              message={error}
              onRetry={runSync}
              onWorkOffline={() => setError(null)}
            />
          </View>
        ) : null}

        <TouchableOpacity
          onPress={runSync}
          disabled={status === "syncing"}
          className="min-h-[48px] rounded-xl bg-primary items-center justify-center flex-row gap-2 px-4"
        >
          {status === "syncing" ? (
            <ActivityIndicator color="hsl(var(--primary-foreground))" />
          ) : null}
          <Text className="text-primary-foreground font-bold text-base">
            Sync now
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
