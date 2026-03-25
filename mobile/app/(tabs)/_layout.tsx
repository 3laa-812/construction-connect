import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { View } from "react-native";
import { useEffect } from "react";
import { useDatabase } from "@nozbe/watermelondb/hooks";
import { SyncStatusBar } from "../../components/SyncStatusBar";
import { ProjectHeader } from "../../components/ProjectHeader";
import { useProjectStore } from "../../store/projectStore";
import Project from "../../db/models/Project";

export default function TabLayout() {
  const database = useDatabase();

  useEffect(() => {
    void (async () => {
      await useProjectStore.getState().hydrateFromStorage();
      const { activeProjectId } = useProjectStore.getState();
      if (activeProjectId) return;
      const projects = await database.get<Project>("projects").query().fetch();
      if (projects.length === 1) {
        await useProjectStore.getState().setActiveProjectId(projects[0].id);
      }
    })();
  }, [database]);

  return (
    <View style={{ flex: 1 }}>
      <SyncStatusBar />
      <ProjectHeader />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: "hsl(var(--card))",
            borderTopColor: "hsl(var(--border))",
            minHeight: 56,
          },
          tabBarActiveTintColor: "hsl(var(--primary))",
          tabBarInactiveTintColor: "hsl(var(--muted-foreground))",
          tabBarLabelStyle: { fontSize: 11 },
        }}
      >
        <Tabs.Screen
          name="today"
          options={{
            title: "Today",
            tabBarIcon: ({ color }) => (
              <Feather name="sun" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="site"
          options={{
            title: "Site",
            tabBarIcon: ({ color }) => (
              <Feather name="map-pin" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="orders"
          options={{
            title: "Orders",
            tabBarIcon: ({ color }) => (
              <Feather name="package" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="marketplace"
          options={{
            title: "Market",
            tabBarIcon: ({ color }) => (
              <Feather name="shopping-cart" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="sync"
          options={{
            title: "Sync",
            tabBarIcon: ({ color }) => (
              <Feather name="refresh-cw" size={24} color={color} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}
