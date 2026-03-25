import { useState } from "react";
import { View, Text, FlatList, RefreshControl } from "react-native";
import { withObservables } from "@nozbe/watermelondb/react";
import { database } from "../../db";
import PurchaseOrder from "../../db/models/PurchaseOrder";
import { Q } from "@nozbe/watermelondb";
import { syncData } from "../../services/sync";

const OrderCard = ({ order }: { order: PurchaseOrder }) => (
  <View className="bg-card p-4 rounded-xl border border-border mb-3">
    <View className="flex-row justify-between mb-1">
      <Text className="font-bold text-foreground text-lg">
        PO-{order.id.slice(0, 4)}
      </Text>
      <Text className="font-bold text-primary">
        ${order.totalAmount || "0.00"}
      </Text>
    </View>
    <Text className="text-foreground font-semibold mb-2">
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

const OrdersView = ({ orders }: { orders: PurchaseOrder[] }) => {
  const [refreshing, setRefreshing] = useState(false);

  const performSync = async () => {
    setRefreshing(true);
    try {
      await syncData();
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View className="flex-1 bg-background px-4 pt-4">
      <FlatList
        data={orders}
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
          <View className="items-center py-10">
            <Text className="text-muted-foreground">No active orders.</Text>
          </View>
        }
      />
    </View>
  );
};

const enhance = withObservables([], () => ({
  orders: database
    .get<PurchaseOrder>("purchase_orders")
    .query(Q.sortBy("created_at", Q.desc)),
}));

export default enhance(OrdersView);
