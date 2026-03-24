import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { useEffect } from "react";
import NetInfo from "@react-native-community/netinfo";
import { DatabaseProvider } from "@nozbe/watermelondb/DatabaseProvider";
import { useDatabase } from "@nozbe/watermelondb/hooks";
import NetworkBanner from "../components/NetworkBanner";
import { database } from "../db";
import { syncDatabase } from "../services/sync";

function RootLayoutContent() {
  const db = useDatabase();

  useEffect(() => {
    NetInfo.fetch().then((state) => {
      const online =
        state.isConnected === true && state.isInternetReachable !== false;
      if (online) {
        syncDatabase(db).catch(console.error);
      }
    });
    const unsub = NetInfo.addEventListener((state) => {
      const online =
        state.isConnected === true && state.isInternetReachable !== false;
      if (online) {
        syncDatabase(db).catch(console.error);
      }
    });
    return () => unsub();
  }, [db]);

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="light" />
      <NetworkBanner />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "transparent" },
        }}
      >
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="daily-log/[id]"
          options={{ presentation: "card", title: "Daily Log" }}
        />
        <Stack.Screen
          name="marketplace/product/[id]"
          options={{ presentation: "card", title: "Product Details" }}
        />
        <Stack.Screen
          name="marketplace/cart"
          options={{ presentation: "modal", title: "Cart" }}
        />
        <Stack.Screen
          name="daily-log/new"
          options={{ presentation: "modal", title: "New Log" }}
        />
      </Stack>
    </View>
  );
}

export default function Layout() {
  return (
    <DatabaseProvider database={database}>
      <RootLayoutContent />
    </DatabaseProvider>
  );
}
