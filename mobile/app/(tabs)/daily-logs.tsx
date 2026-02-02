import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { database } from "../../db";
import DailyLog from "../../db/models/DailyLog";
import { Q } from "@nozbe/watermelondb";

// Helper to fetch logs (TEMPORARY: ideally use withObservables)
const useDailyLogs = () => {
  const [logs, setLogs] = useState<DailyLog[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const allLogs = await database
        .get<DailyLog>("daily_logs")
        .query(Q.sortBy("log_date", Q.desc))
        .fetch();
      setLogs(allLogs);
    };
    fetch();
  }, []);
  return logs;
};

export default function DailyLogsScreen() {
  const router = useRouter();
  const logs = useDailyLogs();

  return (
    <SafeAreaView className="flex-1 bg-background px-4">
      <View className="py-4 flex-row justify-between items-center">
        <Text className="text-2xl font-bold text-foreground">Daily Logs</Text>
        <TouchableOpacity
          onPress={() => router.push("/daily-log/new")}
          className="bg-primary px-4 py-2 rounded-lg"
        >
          <Text className="text-primary-foreground font-bold">+ New Log</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/daily-log/${item.id}`)}
            className="bg-card p-4 rounded-xl border border-border mb-3"
          >
            <Text className="text-lg font-bold text-foreground">
              {new Date(item.logDate).toLocaleDateString()}
            </Text>
            <Text className="text-muted-foreground">Status: {item.status}</Text>
            {item.weatherData && (
              <Text className="text-xs text-muted-foreground mt-1">
                🌤 {item.weatherData.temp}°C {item.weatherData.condition}
              </Text>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View className="items-center py-10">
            <Text className="text-muted-foreground text-center">
              No logs found.
            </Text>
            <Text className="text-muted-foreground text-center text-xs mt-1">
              Check your active project.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
