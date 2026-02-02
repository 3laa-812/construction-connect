import React from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

// Mock RFQs
const RFQS = [
  {
    id: "101",
    title: "Cement Bulk Order",
    status: "Open",
    date: "2023-10-25",
    items: 3,
  },
  {
    id: "102",
    title: "Steel Reinforcement",
    status: "Closed",
    date: "2023-10-20",
    items: 12,
  },
];

export default function RFQListView() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-background px-4 pt-4">
      <TouchableOpacity
        onPress={() => router.push("/marketplace/rfq/new")}
        className="bg-primary py-3 rounded-lg items-center mb-4"
      >
        <Text className="text-primary-foreground font-bold">
          + Create New RFQ
        </Text>
      </TouchableOpacity>

      <FlatList
        data={RFQS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="bg-card p-4 rounded-xl border border-border mb-3">
            <View className="flex-row justify-between mb-2">
              <Text className="font-bold text-foreground text-lg">
                #{item.id} - {item.title}
              </Text>
              <View
                className={`px-2 py-1 rounded text-xs ${item.status === "Open" ? "bg-green-500/10" : "bg-gray-500/10"}`}
              >
                <Text
                  className={
                    item.status === "Open"
                      ? "text-green-500"
                      : "text-muted-foreground"
                  }
                >
                  {item.status}
                </Text>
              </View>
            </View>
            <Text className="text-muted-foreground text-sm">
              Created: {item.date}
            </Text>
            <Text className="text-muted-foreground text-sm">
              {item.items} Items requested
            </Text>
          </View>
        )}
      />
    </View>
  );
}
