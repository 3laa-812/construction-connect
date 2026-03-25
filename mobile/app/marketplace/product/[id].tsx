import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { withObservables } from "@nozbe/watermelondb/react";
import { database } from "../../../db";
import Product from "../../../db/models/Product";
import { Feather } from "@expo/vector-icons";

const ProductDetails = ({ product }: { product: Product }) => {
  const router = useRouter();

  if (!product)
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Product not found</Text>
      </View>
    );

  const addToCart = async () => {
    // Basic Offline Cart Logic - Create CartItem
    try {
      await database.write(async () => {
        const projects = await database.get("projects").query().fetch();
        if (projects.length === 0) {
          alert("Please select a project first (Active Project required)");
          return;
        }
        // For MVP, just pick first project or default
        const defaultProjectId = projects[0].id;

        await database.get("cart_items").create((item: any) => {
          item.product.set(product);
          item.quantity = 1;
          item.projectId = defaultProjectId;
        });
      });
      alert("Added to offline cart!");
      router.back();
    } catch (e) {
      console.error(e);
      alert("Failed to add to cart");
    }
  };

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen
        options={{ title: "Product Details", headerBackTitle: "Catalog" }}
      />
      <ScrollView className="flex-1">
        {/* Image Placeholder */}
        <View className="h-64 bg-muted items-center justify-center mb-4">
          <Feather name="box" size={64} color="#999" />
        </View>

        <View className="p-4">
          <Text className="text-2xl font-bold text-foreground mb-1">
            {product.name}
          </Text>
          <Text className="text-muted-foreground text-lg mb-4">
            {product.category}
          </Text>

          <View className="bg-card p-4 rounded-xl border border-border mb-6">
            <Text className="text-sm text-muted-foreground uppercase font-bold mb-2">
              Specifications
            </Text>
            <Text className="text-foreground">
              {product.specifications || "No specs available."}
            </Text>
          </View>

          <View className="flex-row justify-between items-center mb-6">
            <View>
              <Text className="text-muted-foreground">Price Estimate</Text>
              <Text className="text-2xl font-bold text-primary">
                ${product.price}
              </Text>
            </View>
            <View>
              <Text className="text-muted-foreground text-right">Unit</Text>
              <Text className="text-xl font-bold text-foreground text-right">
                {product.unit}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer Action */}
      <View className="p-4 border-t border-border bg-card safe-bottom">
        <TouchableOpacity
          onPress={addToCart}
          className="bg-primary p-4 rounded-xl items-center flex-row justify-center"
        >
          <Feather
            name="shopping-cart"
            size={20}
            color="white"
            className="mr-2"
          />
          <Text className="text-primary-foreground font-bold text-lg ml-2">
            Add to Cart
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const enhance = withObservables(["id"], ({ id }: { id: string }) => ({
  product: database.get<Product>("products").findAndObserve(id),
}));

const EnhancedProductDetails = enhance(ProductDetails);

export default function ProductDetailsRoute() {
  const { id } = useLocalSearchParams();
  const productId = Array.isArray(id) ? id[0] : id;
  return <EnhancedProductDetails id={productId} />;
}
