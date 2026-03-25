import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Q } from "@nozbe/watermelondb";
import { useDatabase } from "@nozbe/watermelondb/hooks";
import DailyLog from "../../db/models/DailyLog";
import SiteInventory from "../../db/models/SiteInventory";
import { useProjectStore } from "../../store/projectStore";
import { syncData } from "../../services/sync";
import { ErrorState } from "../../components/ErrorState";
import { SkeletonBlock } from "../../components/SkeletonRow";

export default function SiteOverviewScreen() {
  const database = useDatabase();
  const activeProjectId = useProjectStore((s) => s.activeProjectId);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [inventoryCount, setInventoryCount] = useState(0);
  const [photoCount, setPhotoCount] = useState(0);
  const [lastAttendance, setLastAttendance] = useState<number | null>(null);

  const load = async (offlineOnly?: boolean) => {
    if (!activeProjectId) {
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const inv = await database
        .get<SiteInventory>("site_inventory")
        .query(Q.where("project_id", activeProjectId))
        .fetch();
      setInventoryCount(inv.length);

      const logs = await database
        .get<DailyLog>("daily_logs")
        .query(
          Q.where("project_id", activeProjectId),
          Q.sortBy("log_date", Q.desc),
        )
        .fetch();

      let photos = 0;
      let maxHead = 0;
      for (const log of logs.slice(0, 14)) {
        const ps = await log.photos.fetch();
        photos += ps.length;
        const rows = log.attendanceData;
        if (Array.isArray(rows)) {
          const sum = rows.reduce(
            (s, r: { headcount?: number }) =>
              s + (Number((r as { headcount?: number }).headcount) || 0),
            0,
          );
          if (sum > maxHead) maxHead = sum;
        }
      }
      setPhotoCount(photos);
      setLastAttendance(maxHead);

      if (!offlineOnly) {
        await syncData();
      }
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Could not load site data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    void load();
  }, [activeProjectId]);

  if (!activeProjectId) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <ErrorState
          title="No active project"
          message="Choose a project from the header to see the site overview."
        />
      </SafeAreaView>
    );
  }

  if (error && !loading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <ErrorState
          message={error}
          onRetry={() => {
            setLoading(true);
            void load();
          }}
          onWorkOffline={() => {
            setLoading(true);
            void load(true);
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-4 py-4 border-b border-border">
        <Text className="text-2xl font-bold text-foreground">Site</Text>
        <Text className="text-muted-foreground text-base mt-1">
          Quick snapshot for the active project
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load();
            }}
          />
        }
      >
        {loading ? (
          <SkeletonBlock />
        ) : (
          <View className="p-4 gap-4">
            <View className="bg-card border border-border rounded-2xl p-4 min-h-[88px]">
              <Text className="text-xs uppercase text-muted-foreground mb-1">
                Attendance (recent logs)
              </Text>
              <Text className="text-2xl font-bold text-foreground">
                {lastAttendance ?? 0}
              </Text>
              <Text className="text-sm text-muted-foreground mt-1">
                Max total headcount in last two weeks of logs
              </Text>
            </View>
            <View className="bg-card border border-border rounded-2xl p-4 min-h-[88px]">
              <Text className="text-xs uppercase text-muted-foreground mb-1">
                Site photos (recent)
              </Text>
              <Text className="text-2xl font-bold text-foreground">{photoCount}</Text>
              <Text className="text-sm text-muted-foreground mt-1">
                Thumbnails across recent daily logs
              </Text>
            </View>
            <View className="bg-card border border-border rounded-2xl p-4 min-h-[88px]">
              <Text className="text-xs uppercase text-muted-foreground mb-1">
                Inventory rows
              </Text>
              <Text className="text-2xl font-bold text-foreground">
                {inventoryCount}
              </Text>
              <Text className="text-sm text-muted-foreground mt-1">
                Local site_inventory for this project
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
