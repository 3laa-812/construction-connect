import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Q } from "@nozbe/watermelondb";
import { useDatabase } from "@nozbe/watermelondb/hooks";
import { withObservables } from "@nozbe/watermelondb/react";
import DailyLog from "../../db/models/DailyLog";
import LogPhoto from "../../db/models/LogPhoto";
import { syncData } from "../../services/sync";
import { useProjectStore } from "../../store/projectStore";
import { ErrorState } from "../../components/ErrorState";
import { SkeletonBlock } from "../../components/SkeletonRow";
import { hapticLight } from "../../services/haptics";

function weatherEmoji(condition?: string): string {
  const c = (condition || "").toLowerCase();
  if (c.includes("rain") || c.includes("drizzle")) return "🌧";
  if (c.includes("cloud")) return "☁️";
  if (c.includes("clear") || c.includes("sun")) return "☀️";
  if (c.includes("sand") || c.includes("dust")) return "😷";
  if (c.includes("fog")) return "🌫";
  return "🌤";
}

function attendanceHeadcount(raw: unknown): number {
  if (!Array.isArray(raw)) return 0;
  return raw.reduce(
    (sum, r) => sum + (Number((r as { headcount?: number }).headcount) || 0),
    0,
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    DRAFT: "bg-muted",
    SUBMITTED: "bg-blue-600/30",
    SYNCED: "bg-green-600/30",
  };
  const textMap: Record<string, string> = {
    DRAFT: "text-muted-foreground",
    SUBMITTED: "text-blue-200",
    SYNCED: "text-green-200",
  };
  const bg = map[status] ?? "bg-muted";
  const tc = textMap[status] ?? "text-muted-foreground";
  return (
    <View className={`px-2 py-1 rounded-full ${bg}`}>
      <Text className={`text-[10px] font-bold uppercase ${tc}`}>{status}</Text>
    </View>
  );
}

const LogRowInner = ({
  log,
  photos,
}: {
  log: DailyLog;
  photos: LogPhoto[];
}) => {
  const router = useRouter();
  const w = log.weatherData as
    | { temp?: number | string; condition?: string }
    | undefined;
  const emoji = weatherEmoji(w?.condition);
  const headcount = attendanceHeadcount(log.attendanceData);
  const hasWeather =
    (w?.condition != null && String(w.condition).length > 0) ||
    (w?.temp != null && String(w.temp) !== "");

  return (
    <TouchableOpacity
      onPress={() => {
        hapticLight();
        router.push(`/daily-log/${log.id}`);
      }}
      className="bg-card mx-4 mb-3 p-4 rounded-xl border border-border min-h-[72px]"
    >
      <View className="flex-row justify-between items-start mb-2">
        <Text className="text-lg font-bold text-foreground">
          {new Date(log.logDate).toLocaleDateString()}
        </Text>
        <StatusBadge status={log.status} />
      </View>
      <Text className="text-base text-muted-foreground">
        {emoji}{" "}
        {hasWeather
          ? `${w?.temp ?? "—"}° ${w?.condition ?? ""}`
          : "No weather"}
      </Text>
      <Text className="text-base text-muted-foreground mt-1">
        Workers (headcount sum): {headcount} · Photos: {photos.length}
      </Text>
    </TouchableOpacity>
  );
};

const LogRow = withObservables(["log"], ({ log }: { log: DailyLog }) => ({
  log,
  photos: log.photos,
}))(LogRowInner);

export default function DailyLogIndexScreen() {
  const router = useRouter();
  const database = useDatabase();
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const hydrated = useProjectStore((s) => s.hydrated);

  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    if (!hydrated) return;
    if (!activeProjectId) {
      setLogs([]);
      setInitializing(false);
      return;
    }
    const q = database
      .get<DailyLog>("daily_logs")
      .query(
        Q.where("project_id", activeProjectId),
        Q.sortBy("log_date", Q.desc),
      );
    const sub = q.observe().subscribe((l) => {
      setLogs(l);
      setInitializing(false);
    });
    return () => sub.unsubscribe();
  }, [database, activeProjectId, hydrated]);

  const performSync = useCallback(async () => {
    setRefreshing(true);
    setLoadError(null);
    try {
      await syncData();
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setRefreshing(false);
    }
  }, []);

  if (!hydrated) {
    return (
      <SafeAreaView edges={["bottom"]} className="flex-1 bg-background">
        <SkeletonBlock />
      </SafeAreaView>
    );
  }

  if (!activeProjectId) {
    return (
      <SafeAreaView edges={["bottom"]} className="flex-1 bg-background">
        <ErrorState
          title="Select a project"
          message="Use the project dropdown at the top to choose a site. Daily logs are scoped to that project."
        />
      </SafeAreaView>
    );
  }

  if (loadError && logs.length === 0) {
    return (
      <SafeAreaView edges={["bottom"]} className="flex-1 bg-background">
        <ErrorState
          message={loadError}
          onRetry={performSync}
          onWorkOffline={() => setLoadError(null)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-background">
      <View className="p-4 flex-row justify-between items-center min-h-[52px]">
        <Text className="text-2xl font-bold text-foreground">Today</Text>
        <TouchableOpacity
          onPress={performSync}
          className="min-h-[48px] min-w-[48px] rounded-xl bg-muted items-center justify-center px-3"
          accessibilityLabel="Refresh and sync"
        >
          <Feather name="refresh-cw" size={22} color="hsl(var(--foreground))" />
        </TouchableOpacity>
      </View>

      {initializing ? (
        <ScrollView className="flex-1 px-4">
          <SkeletonBlock />
          <SkeletonBlock />
        </ScrollView>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <LogRow log={item} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={performSync}
              tintColor="hsl(var(--primary))"
            />
          }
          ListEmptyComponent={
            <View className="items-center py-12 px-6">
              <Text className="text-muted-foreground text-center text-base mb-2">
                No logs yet this week for this project.
              </Text>
              <TouchableOpacity
                onPress={() => {
                  hapticLight();
                  router.push("/daily-log/new");
                }}
                className="min-h-[48px] px-6 mt-4 rounded-xl bg-primary items-center justify-center"
              >
                <Text className="text-primary-foreground font-bold text-base">
                  Create today&apos;s log
                </Text>
              </TouchableOpacity>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 96 }}
        />
      )}

      <TouchableOpacity
        onPress={() => {
          hapticLight();
          router.push("/daily-log/new");
        }}
        className="absolute bottom-8 right-6 w-14 h-14 min-w-[56px] min-h-[56px] rounded-full bg-primary items-center justify-center shadow-lg"
        activeOpacity={0.85}
        accessibilityLabel="New daily log"
      >
        <Feather name="plus" size={28} color="hsl(var(--primary-foreground))" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
