import React, { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Alert } from "react-native";
import { Stack, useRouter } from "expo-router";
import { withObservables } from "@nozbe/watermelondb/react";
import { database } from "../../db";
import CartItem from "../../db/models/CartItem";
import PurchaseOrder from "../../db/models/PurchaseOrder";
import POItem from "../../db/models/POItem";
import { Feather } from "@expo/vector-icons";

// Cart Item Component
const CartItemRow = ({ item }: { item: CartItem }) => (
  <View className="bg-card p-4 rounded-xl border border-border mb-3 flex-row justify-between items-center">
    <View className="flex-1">
      <Text className="font-bold text-foreground text-lg">
        {item.product.id ? item.product.id : "Product"}
      </Text>
      {/* Note: In real app, we need to fetch Relation product. WatermelonDB relation access is async or requires enhance */}
      <Text className="text-muted-foreground">Qty: {item.quantity}</Text>
    </View>
    <TouchableOpacity onPress={() => item.destroyPermanently()}>
      <Feather name="trash-2" size={20} color="red" />
    </TouchableOpacity>
  </View>
);

// We need to enhance list items to fetch the related product?
// Or just show ID for now? Relation fetching in list can be expensive if not careful.
// Let's rely on simple list for now, user can see product name if we join or fetch.
// Actually CartItem has `product` relation. We can make `CartItemRow` enhanced.
const enhanceItem = withObservables(["item"], ({ item }) => ({
  item,
  product: item.product, // fetch related product
}));

const EnhancedCartItemRow = enhanceItem(
  ({ item, product }: { item: CartItem; product: any }) => (
    <View className="bg-card p-4 rounded-xl border border-border mb-3 flex-row justify-between items-center">
      <View className="flex-1">
        <Text className="font-bold text-foreground text-lg">
          {product ? product.name : "Unknown Product"}
        </Text>
        <Text className="text-muted-foreground mr-2">Qty: {item.quantity}</Text>
        <Text className="text-primary font-bold">
          ${product ? (product.price * item.quantity).toFixed(2) : "0.00"}
        </Text>
      </View>
      <TouchableOpacity
        onPress={async () => {
          Alert.alert("Remove", "Remove this item?", [
            { text: "Cancel", style: "cancel" },
            {
              text: "Remove",
              style: "destructive",
              onPress: () => item.destroyPermanently(),
            },
          ]);
        }}
      >
        <Feather name="trash-2" size={20} color="red" />
      </TouchableOpacity>
    </View>
  ),
);

const CartScreen = ({ cartItems }: { cartItems: CartItem[] }) => {
  const router = useRouter();

  const checkout = async () => {
    // Create Purchase Order Logic
    // 1. Group by Supplier? Or single PO?
    // 2. Create PO locally
    // 3. Clear Cart
    // 4. Trigger Sync
    if (cartItems.length === 0) return;

    try {
      await database.write(async () => {
        // Create PO
        const po = await database
          .get<PurchaseOrder>("purchase_orders")
          .create((order: PurchaseOrder) => {
            order.projectId = cartItems[0].projectId;
            order.supplierId = "sup_1";
            order.status = "PLACED";
            order.totalAmount = 0;
          });

        for (const item of cartItems) {
          await database.get<POItem>("po_items").create((poItem: POItem) => {
            poItem.purchaseOrder.set(po);
            poItem.productId = item.productId;
            poItem.quantity = item.quantity;
            poItem.unitPrice = 10;
            poItem.name = "Item";
          });
          await item.destroyPermanently();
        }
      });
      Alert.alert(
        "Success",
        "Order placed securely offline. Will sync when online.",
      );
      router.back();
    } catch (e) {
      Alert.alert("Error", "Could not place order");
      console.error(e);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ title: "My Cart" }} />
      <FlatList
        data={cartItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <EnhancedCartItemRow item={item} />}
        contentContainerClassName="p-4"
        ListEmptyComponent={
          <View className="items-center py-10">
            <Text className="text-muted-foreground">Cart is empty</Text>
          </View>
        }
      />
      <View className="p-4 border-t border-border safe-bottom bg-card">
        <TouchableOpacity
          onPress={checkout}
          className={`bg-primary p-4 rounded-xl items-center ${cartItems.length === 0 ? "opacity-50" : ""}`}
          disabled={cartItems.length === 0}
        >
          <Text className="text-primary-foreground font-bold text-lg">
            Place Order
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const enhance = withObservables([], () => ({
  cartItems: database.get<CartItem>("cart_items").query(),
}));

export default enhance(CartScreen);
