import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Q } from "@nozbe/watermelondb";
import { useDatabase } from "@nozbe/watermelondb/hooks";
import { withObservables } from "@nozbe/watermelondb/react";
import DailyLog from "../../db/models/DailyLog";
import LogPhoto from "../../db/models/LogPhoto";
import Project from "../../db/models/Project";
import { syncData } from "../../services/sync";

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

  return (
    <TouchableOpacity
      onPress={() => router.push(`/daily-log/${log.id}`)}
      className="bg-card mx-4 mb-3 p-4 rounded-xl border border-border"
    >
      <View className="flex-row justify-between items-start mb-2">
        <Text className="text-lg font-bold text-foreground">
          {new Date(log.logDate).toLocaleDateString()}
        </Text>
        <StatusBadge status={log.status} />
      </View>
      <Text className="text-sm text-muted-foreground">
        {emoji}{" "}
        {w?.temp != null && w.temp !== ""
          ? `${w.temp}° ${w.condition ?? ""}`
          : "No weather"}
      </Text>
      <Text className="text-sm text-muted-foreground mt-1">
        Workers (headcount sum): {headcount} · Photos: {photos.length}
      </Text>
    </TouchableOpacity>
  );
};

const LogRow = withObservables(["log"], ({ log }: { log: DailyLog }) => ({
  log,
  photos: log.photos,
}))(LogRowInner);

function ProjectsFilter({
  projects,
  selectedId,
  onSelect,
}: {
  projects: Project[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  return (
    <View className="px-4 pb-2 flex-row flex-wrap gap-2">
      <TouchableOpacity
        onPress={() => onSelect(null)}
        className={`px-3 py-1.5 rounded-full border ${selectedId === null ? "border-primary bg-primary/20" : "border-border"}`}
      >
        <Text className="text-xs text-foreground font-semibold">All</Text>
      </TouchableOpacity>
      {projects.map((p) => (
        <TouchableOpacity
          key={p.id}
          onPress={() => onSelect(p.id)}
          className={`px-3 py-1.5 rounded-full border ${selectedId === p.id ? "border-primary bg-primary/20" : "border-border"}`}
        >
          <Text className="text-xs text-foreground font-semibold" numberOfLines={1}>
            {p.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function DailyLogIndexScreen() {
  const router = useRouter();
  const database = useDatabase();
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filterProjectId, setFilterProjectId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const subProjects = database
      .get<Project>("projects")
      .query()
      .observe()
      .subscribe(setProjects);
    return () => subProjects.unsubscribe();
  }, [database]);

  useEffect(() => {
    const q = filterProjectId
      ? database
          .get<DailyLog>("daily_logs")
          .query(
            Q.where("project_id", filterProjectId),
            Q.sortBy("log_date", Q.desc),
          )
      : database
          .get<DailyLog>("daily_logs")
          .query(Q.sortBy("log_date", Q.desc));
    const sub = q.observe().subscribe(setLogs);
    return () => sub.unsubscribe();
  }, [database, filterProjectId]);

  const performSync = useCallback(async () => {
    setRefreshing(true);
    try {
      await syncData();
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="p-4 flex-row justify-between items-center">
        <Text className="text-2xl font-bold text-foreground">Daily Logs</Text>
        <TouchableOpacity
          onPress={performSync}
          className="p-2 rounded-lg bg-muted"
        >
          <Feather name="refresh-cw" size={20} color="hsl(var(--foreground))" />
        </TouchableOpacity>
      </View>

      <ProjectsFilter
        projects={projects}
        selectedId={filterProjectId}
        onSelect={setFilterProjectId}
      />

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
          <View className="items-center py-10 px-6">
            <Text className="text-muted-foreground text-center">
              No logs for this filter.
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 96 }}
      />

      <TouchableOpacity
        onPress={() => router.push("/daily-log/new")}
        className="absolute bottom-8 right-6 w-14 h-14 rounded-full bg-primary items-center justify-center shadow-lg"
        activeOpacity={0.85}
      >
        <Feather name="plus" size={28} color="hsl(var(--primary-foreground))" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
