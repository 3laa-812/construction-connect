import React from "react";
import { View, Text, FlatList, TouchableOpacity, Alert } from "react-native";
import { Stack, useRouter } from "expo-router";
import { withObservables } from "@nozbe/watermelondb/react";
import NetInfo from "@react-native-community/netinfo";
import { database } from "../../db";
import CartItem from "../../db/models/CartItem";
import Project from "../../db/models/Project";
import PendingOrder from "../../db/models/PendingOrder";
import api from "../../services/api";
import { syncDatabase } from "../../services/sync";
import { hapticSuccess } from "../../services/haptics";
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
    if (cartItems.length === 0) return;

    try {
      const project = await database
        .get<Project>("projects")
        .find(cartItems[0].projectId);
      const projectServerId = project.serverId;
      if (!projectServerId?.trim()) {
        Alert.alert(
          "Sync required",
          "Project is missing a server id. Connect and sync, then try again.",
        );
        return;
      }

      const lines: Array<{
        item_description: string;
        ordered_qty: number;
        unit_price: number;
      }> = [];
      const supplierIds = new Set<string>();

      for (const ci of cartItems) {
        const product = await ci.product.fetch();
        if (!product?.supplierId) {
          Alert.alert("Cart", "A cart row is missing product data. Try again.");
          return;
        }
        supplierIds.add(product.supplierId);
        lines.push({
          item_description: product.name,
          ordered_qty: ci.quantity,
          unit_price: Number(product.price ?? 0),
        });
      }

      if (supplierIds.size !== 1) {
        Alert.alert(
          "One supplier per order",
          "Split your cart so each checkout is from a single supplier.",
        );
        return;
      }

      const supplierId = [...supplierIds][0];
      const body = {
        project: { connect: { id: projectServerId } },
        supplier: { connect: { id: supplierId } },
        items: {
          create: lines,
        },
      };

      const net = await NetInfo.fetch();
      const online =
        net.isConnected === true && net.isInternetReachable !== false;

      if (online) {
        await api.post("/purchase-orders", body);
        await database.write(async () => {
          for (const c of cartItems) await c.destroyPermanently();
        });
        await syncDatabase(database);
        hapticSuccess();
        Alert.alert("Success", "Order placed.");
        router.back();
        return;
      }

      await database.write(async () => {
        await database.get<PendingOrder>("pending_orders").create((r) => {
          r.payloadJson = JSON.stringify(body);
          r.synced = 0;
        });
        for (const c of cartItems) await c.destroyPermanently();
      });
      hapticSuccess();
      Alert.alert(
        "Queued",
        "Order will be submitted automatically when you are online.",
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
