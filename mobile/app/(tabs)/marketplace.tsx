import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CatalogView from "../marketplace/catalog";
import OrdersView from "../marketplace/orders";
import RFQListView from "../marketplace/rfq/list"; // Use list view for RFQ tab

type TabOption = "catalog" | "rfqs" | "orders";

export default function MarketplaceScreen() {
  const [activeTab, setActiveTab] = useState<TabOption>("catalog");

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-4 py-4 border-b border-border">
        <Text className="text-2xl font-bold text-foreground">Marketplace</Text>
      </View>

      {/* Segmented Control */}
      <View className="px-4 py-3">
        <View className="flex-row bg-muted/30 p-1 rounded-xl">
          {[
            { id: "catalog", label: "Catalog" },
            { id: "rfqs", label: "RFQs" },
            { id: "orders", label: "Orders" },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id as TabOption)}
                className={`flex-1 min-h-[48px] py-2.5 rounded-lg items-center justify-center transition-all ${
                  isActive
                    ? "bg-background shadow-sm border border-border/50"
                    : "bg-transparent"
                }`}
              >
                <Text
                  className={`font-semibold text-base ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Content Area */}
      <View className="flex-1">
        {activeTab === "catalog" && <CatalogView />}
        {activeTab === "rfqs" && <RFQListView />}
        {activeTab === "orders" && <OrdersView />}
      </View>
    </SafeAreaView>
  );
}
