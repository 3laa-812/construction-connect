import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "hsl(var(--card))",
          borderTopColor: "hsl(var(--border))",
        },
        tabBarActiveTintColor: "hsl(var(--primary))",
        tabBarInactiveTintColor: "hsl(var(--muted-foreground))",
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Projects",
          tabBarIcon: ({ color }) => (
            <Feather name="home" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="daily-logs"
        options={{
          title: "Daily Logs",
          tabBarIcon: ({ color }) => (
            <Feather name="clipboard" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="marketplace"
        options={{
          title: "Marketplace",
          tabBarIcon: ({ color }) => (
            <Feather name="shopping-cart" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
