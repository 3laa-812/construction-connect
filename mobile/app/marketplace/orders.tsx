import React from "react";
import { View, Text, FlatList } from "react-native";

// Mock Orders
const ORDERS = [
  {
    id: "PO-900",
    supplier: "BuildPro Supplies",
    status: "In Transit",
    total: "$1,250",
    delivery: "Tomorrow",
  },
  {
    id: "PO-885",
    supplier: "Steel Masters Co.",
    status: "Delivered",
    total: "$4,500",
    delivery: "Oct 15",
  },
];

export default function OrdersView() {
  return (
    <View className="flex-1 bg-background px-4 pt-4">
      <FlatList
        data={ORDERS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="bg-card p-4 rounded-xl border border-border mb-3">
            <View className="flex-row justify-between mb-1">
              <Text className="font-bold text-foreground text-lg">
                {item.id}
              </Text>
              <Text className="font-bold text-primary">{item.total}</Text>
            </View>
            <Text className="text-foreground font-semibold mb-2">
              {item.supplier}
            </Text>

            <View className="flex-row justify-between items-center border-t border-border pt-2 mt-2">
              <View className="flex-row items-center gap-2">
                <View
                  className={`w-2 h-2 rounded-full ${item.status === "In Transit" ? "bg-blue-500" : "bg-green-500"}`}
                />
                <Text className="text-sm text-foreground">{item.status}</Text>
              </View>
              <Text className="text-xs text-muted-foreground">
                Est: {item.delivery}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View className="items-center py-10">
            <Text className="text-muted-foreground">No active orders.</Text>
          </View>
        }
      />
    </View>
  );
}
