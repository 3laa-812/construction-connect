import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { withObservables } from "@nozbe/watermelondb/react";
import { database } from "../../db";
import PurchaseOrder from "../../db/models/PurchaseOrder";
import { Q } from "@nozbe/watermelondb";
import { syncData } from "../../services/sync";
import { useProjectStore } from "../../store/projectStore";
import { ErrorState } from "../../components/ErrorState";

const OrderCard = ({ order }: { order: PurchaseOrder }) => (
  <View className="bg-card p-4 rounded-xl border border-border mb-3 min-h-[80px]">
    <View className="flex-row justify-between mb-1">
      <Text className="font-bold text-foreground text-lg">
        PO-{order.serverId?.slice(0, 8) ?? order.id.slice(0, 8)}
      </Text>
      <Text className="font-bold text-primary">
        ${order.totalAmount ?? "0.00"}
      </Text>
    </View>
    <Text className="text-foreground font-semibold mb-2 text-base">
      Supplier: {order.supplierId || "Unknown"}
    </Text>
    <View className="flex-row justify-between items-center border-t border-border pt-2 mt-2">
      <View className="flex-row items-center gap-2">
        <View
          className={`w-2 h-2 rounded-full ${order.status === "PLACED" ? "bg-blue-500" : "bg-green-500"}`}
        />
        <Text className="text-sm text-foreground">{order.status}</Text>
      </View>
      <Text className="text-xs text-muted-foreground">
        {new Date(order.createdAt).toLocaleDateString()}
      </Text>
    </View>
  </View>
);

const enhance = withObservables([], () => ({
  orders: database
    .get<PurchaseOrder>("purchase_orders")
    .query(Q.sortBy("created_at", Q.desc)),
}));

function OrdersTabInner({ orders }: { orders: PurchaseOrder[] }) {
  const router = useRouter();
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!activeProjectId) return [];
    return orders.filter((o) => o.projectId === activeProjectId);
  }, [orders, activeProjectId]);

  const performSync = async () => {
    setRefreshing(true);
    setError(null);
    try {
      await syncData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setRefreshing(false);
    }
  };

  if (!activeProjectId) {
    return (
      <ErrorState
        title="No active project"
        message="Select a project in the header to view purchase orders for that site."
      />
    );
  }

  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={performSync}
        onWorkOffline={() => setError(null)}
      />
    );
  }

  return (
    <View className="flex-1 bg-background px-4 pt-4">
      <TouchableOpacity
        onPress={() =>
          router.push({
            pathname: "/daily-log/grn",
            params: { projectId: activeProjectId },
          } as never)
        }
        className="min-h-[48px] mb-4 rounded-xl bg-primary items-center justify-center px-4"
      >
        <Text className="text-primary-foreground font-bold text-base">
          Record goods receipt (GRN)
        </Text>
      </TouchableOpacity>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <OrderCard order={item} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={performSync}
            tintColor="hsl(var(--primary))"
          />
        }
        ListEmptyComponent={
          <View className="items-center py-12 px-4">
            <Text className="text-muted-foreground text-center text-base mb-4">
              No orders for this project yet. Browse the Market tab or sync.
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/marketplace")}
              className="min-h-[48px] px-6 rounded-xl bg-secondary items-center justify-center"
            >
              <Text className="text-secondary-foreground font-semibold text-base">
                Open marketplace
              </Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const Enhanced = enhance(OrdersTabInner);

export default function OrdersTab() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-4 py-4 border-b border-border">
        <Text className="text-2xl font-bold text-foreground">Orders</Text>
        <Text className="text-muted-foreground text-base mt-1">
          Purchase orders and receiving
        </Text>
      </View>
      <Enhanced />
    </SafeAreaView>
  );
}
