import "../global.css";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, I18nManager } from "react-native";
import { useEffect } from "react";
import NetInfo from "@react-native-community/netinfo";
import { DatabaseProvider } from "@nozbe/watermelondb/DatabaseProvider";
import { useDatabase } from "@nozbe/watermelondb/hooks";
import NetworkBanner from "../components/NetworkBanner";
import { database } from "../db";
import { syncDatabase } from "../services/sync";
import { getOrCreateHexDbKey } from "../db/dbKey";
import * as Notifications from "expo-notifications";
import api from "../services/api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function registerForPushNotifications() {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") return;
    const { data: token } = await Notifications.getExpoPushTokenAsync();
    await api.patch("/users/push-token", { push_token: token });
  } catch (e) {
    console.warn("Failed to setup push token", e);
  }
}

function RootLayoutContent() {
  const db = useDatabase();
  const router = useRouter();

  useEffect(() => {
    getOrCreateHexDbKey().catch((e) =>
      console.warn("[db] encryption key init", e),
    );
    
    registerForPushNotifications();
    const sub = Notifications.addNotificationResponseReceivedListener((response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data as any;
      if (data?.type === 'rfq_bid') {
        router.push(`/marketplace/rfq/${data.entity_id}/bids` as any);
      } else if (data?.type === 'order_status') {
        router.push(`/marketplace/orders/${data.entity_id}` as any);
      }
    });

    return () => sub.remove();
  }, [router]);

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
    <View
      className="flex-1 bg-background"
      style={{
        direction: I18nManager.isRTL ? "rtl" : "ltr",
      }}
    >
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
        <Stack.Screen
          name="daily-log/grn"
          options={{ presentation: "card", title: "Goods receipt" }}
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
