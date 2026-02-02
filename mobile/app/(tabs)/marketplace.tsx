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
      <View className="flex-row px-4 py-2 gap-2">
        {[
          { id: "catalog", label: "Catalog" },
          { id: "rfqs", label: "RFQs" },
          { id: "orders", label: "Orders" },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setActiveTab(tab.id as TabOption)}
            className={`flex-1 py-2 rounded-lg items-center ${
              activeTab === tab.id ? "bg-primary" : "bg-secondary"
            }`}
          >
            <Text
              className={`font-bold ${
                activeTab === tab.id
                  ? "text-primary-foreground"
                  : "text-secondary-foreground"
              }`}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
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
