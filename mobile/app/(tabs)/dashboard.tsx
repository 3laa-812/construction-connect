import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { sync } from "../../services/sync";
import NetworkBanner from "../../components/NetworkBanner";

// MOCK DATA for now
const PROJECTS = [
  {
    id: "1",
    name: "Downtown Highrise",
    status: "Active",
    location: "123 Main St",
  },
  {
    id: "2",
    name: "Westside Mall Renovation",
    status: "Planning",
    location: "456 West Ave",
  },
  {
    id: "3",
    name: "City Bridge 4",
    status: "Completed",
    location: "789 River Rd",
  },
];

const ProjectCard = ({ project }: { project: any }) => (
  <TouchableOpacity className="bg-card p-4 rounded-xl border border-border mb-4 shadow-sm active:opacity-70">
    <View className="flex-row justify-between items-start">
      <View>
        <Text className="text-lg font-bold text-foreground">
          {project.name}
        </Text>
        <Text className="text-muted-foreground text-sm mt-1">
          📍 {project.location}
        </Text>
      </View>
      <View
        className={`px-2 py-1 rounded-md ${project.status === "Active" ? "bg-success/20" : "bg-secondary"}`}
      >
        <Text
          className={`text-xs font-bold ${project.status === "Active" ? "text-success" : "text-foreground"}`}
        >
          {project.status}
        </Text>
      </View>
    </View>
  </TouchableOpacity>
);

export default function Dashboard() {
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Initial Sync
    performSync();
  }, []);

  const performSync = async () => {
    setRefreshing(true);
    try {
      await sync();
      console.log("Sync completed successfully");
    } catch (e) {
      console.error("Sync failed", e);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <NetworkBanner />
      <View className="px-4 py-4 border-b border-border">
        <Text className="text-2xl font-bold text-foreground">My Projects</Text>
        <Text className="text-muted-foreground">
          Select a project to log data
        </Text>
      </View>

      <FlatList
        data={PROJECTS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ProjectCard project={item} />}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={performSync}
            tintColor="hsl(var(--primary))"
          />
        }
      />
    </SafeAreaView>
  );
}
