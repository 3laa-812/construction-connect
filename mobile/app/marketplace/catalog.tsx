import React, { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";

// Mock Data
const CATEGORIES = [
  "All",
  "Cement",
  "Steel",
  "Finishing",
  "Electrical",
  "Plumbing",
];
const MATERIALS = [
  {
    id: "1",
    name: "Portland Cement (50kg)",
    category: "Cement",
    price: "$8.50",
    unit: "bag",
  },
  {
    id: "2",
    name: "Steel Rebar 12mm",
    category: "Steel",
    price: "$12.00",
    unit: "length",
  },
  {
    id: "3",
    name: "White Paint (20L)",
    category: "Finishing",
    price: "$45.00",
    unit: "bucket",
  },
  {
    id: "4",
    name: "Wiring Cable (100m)",
    category: "Electrical",
    price: "$30.00",
    unit: "roll",
  },
  {
    id: "5",
    name: 'PVC Pipe 4"',
    category: "Plumbing",
    price: "$15.00",
    unit: "length",
  },
];

export default function CatalogView() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredMaterials =
    selectedCategory === "All"
      ? MATERIALS
      : MATERIALS.filter((m) => m.category === selectedCategory);

  return (
    <View className="flex-1 bg-background">
      {/* Categories */}
      <View>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(item) => item}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelectedCategory(item)}
              className={`mr-2 px-4 py-2 rounded-full border ${
                selectedCategory === item
                  ? "bg-secondary border-primary/50"
                  : "bg-card border-border"
              }`}
            >
              <Text
                className={
                  selectedCategory === item
                    ? "text-primary font-bold"
                    : "text-muted-foreground"
                }
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Grid */}
      <FlatList
        data={filteredMaterials}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={{ padding: 16 }}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="bg-card w-[48%] rounded-xl border border-border p-3 mb-4"
            onPress={() => {
              /* Open Details or Add to RFQ */
            }}
          >
            <View className="h-24 bg-secondary rounded-lg mb-2 items-center justify-center">
              <Text className="text-4xl">📦</Text>
            </View>
            <Text
              className="font-bold text-foreground text-sm"
              numberOfLines={2}
            >
              {item.name}
            </Text>
            <Text className="text-xs text-muted-foreground mb-1">
              {item.category}
            </Text>
            <View className="flex-row justify-between items-center mt-2">
              <Text className="text-primary font-bold">{item.price}</Text>
              <Text className="text-xs text-muted-foreground">
                /{item.unit}
              </Text>
            </View>
            <TouchableOpacity
              className="mt-3 bg-primary py-2 rounded-lg items-center"
              onPress={() =>
                router.push({
                  pathname: "/marketplace/rfq/new",
                  params: { itemId: item.id },
                })
              }
            >
              <Text className="text-primary-foreground text-xs font-bold">
                Request Quote
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
