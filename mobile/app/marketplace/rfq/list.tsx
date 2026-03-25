import React from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

const RFQS: { id: string; title: string; status: string; date: string; items: number }[] = [];

export default function RFQListView() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-background px-4 pt-4">
      <TouchableOpacity
        onPress={() => router.push("/marketplace/rfq/new")}
        className="min-h-[48px] bg-primary py-3 rounded-xl items-center justify-center mb-4 px-4"
      >
        <Text className="text-primary-foreground font-bold text-base">
          + Request a quote
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
        ListEmptyComponent={
          <View className="items-center py-12 px-4">
            <Text className="text-muted-foreground text-center text-base mb-4">
              No RFQs sent yet. Request pricing from suppliers when you are online
              or offline — full RFQ sync is coming soon.
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/marketplace/rfq/new")}
              className="min-h-[48px] px-6 rounded-xl bg-secondary items-center justify-center"
            >
              <Text className="text-secondary-foreground font-semibold text-base">
                Request a quote
              </Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}
