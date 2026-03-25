import React, { useMemo, useState } from "react";
import { useDatabase } from "@nozbe/watermelondb/hooks";
import { syncData } from "../../services/sync";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { withObservables } from "@nozbe/watermelondb/react";
import { Q } from "@nozbe/watermelondb";
import { database } from "../../db";
import Product from "../../db/models/Product";
import { Feather } from "@expo/vector-icons";

const CATEGORIES = [
  "All",
  "Concrete",
  "Cement",
  "Steel",
  "Electrical",
  "Finishing",
  "Plumbing",
  "Other",
];

type SortKey = "name" | "price";

const ProductCard = ({ product }: { product: Product }) => {
  const router = useRouter();

  return (
    <TouchableOpacity
      className="bg-card w-[48%] rounded-xl border border-border/60 p-3 mb-3 shadow-sm"
      onPress={() => router.push(`/marketplace/product/${product.id}`)}
    >
      <View className="h-28 bg-muted/20 rounded-lg mb-3 items-center justify-center">
        <Feather name="box" size={32} color="#999" />
      </View>
      <Text
        className="font-bold text-foreground text-sm leading-tight"
        numberOfLines={2}
      >
        {product.name}
      </Text>
      <Text className="text-xs text-muted-foreground mt-1 mb-3">
        {product.category}
      </Text>

      <View className="mt-auto">
        <View className="flex-row justify-between items-baseline mb-3">
          <Text className="text-primary font-bold text-base">
            ${Number(product.price).toFixed(2)}
          </Text>
          <Text className="text-[10px] text-muted-foreground uppercase">
            /{product.unit}
          </Text>
        </View>
        <TouchableOpacity
          className="bg-primary py-2.5 rounded-lg items-center active:opacity-90"
          onPress={() => router.push(`/marketplace/product/${product.id}`)}
        >
          <Text className="text-primary-foreground text-xs font-bold uppercase tracking-wide">
            Add to cart
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const enhanceSorted = withObservables([], () => ({
  products: database
    .get<Product>("products")
    .query(Q.sortBy("name", Q.asc)),
}));

type GridProps = {
  products: Product[];
  category: string;
  search: string;
  sort: SortKey;
  onRetrySync: () => void;
};

function ProductGrid({
  products,
  category,
  search,
  sort,
  onRetrySync,
}: GridProps) {
  const filtered = useMemo(() => {
    let list = products;
    if (category !== "All") {
      list = list.filter(
        (p) => p.category?.toLowerCase() === category.toLowerCase(),
      );
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((p) => p.name?.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      if (sort === "price") {
        return Number(a.price) - Number(b.price);
      }
      return (a.name || "").localeCompare(b.name || "");
    });
  }, [products, category, search, sort]);

  if (products.length === 0) {
    return (
      <View className="items-center py-12 px-6">
        <Text className="text-muted-foreground text-center text-base mb-2">
          Catalog is empty — connect and sync to load materials from the server.
        </Text>
        <TouchableOpacity
          onPress={onRetrySync}
          className="min-h-[48px] px-6 mt-4 rounded-xl bg-primary items-center justify-center"
        >
          <Text className="text-primary-foreground font-bold text-base">
            Retry sync
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={filtered}
      keyExtractor={(item) => item.id}
      numColumns={2}
      contentContainerStyle={{ padding: 16 }}
      columnWrapperStyle={{ justifyContent: "space-between", gap: 12 }}
      renderItem={({ item }) => <ProductCard product={item} />}
      ListEmptyComponent={
        <View className="items-center py-10">
          <Text className="text-muted-foreground text-base text-center">
            No products match your filters.
          </Text>
        </View>
      }
    />
  );
}

const EnhancedGrid = enhanceSorted(ProductGrid);

export default function CatalogView() {
  const router = useRouter();
  const database = useDatabase();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("name");

  const onRetrySync = () => {
    void syncData(database);
  };

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row px-4 py-2 items-center gap-2">
        <View className="flex-1 flex-row items-center bg-muted/20 px-3 rounded-lg">
          <Feather name="search" size={18} color="#888" />
          <TextInput
            className="flex-1 min-h-[48px] py-2.5 px-2 text-foreground text-base"
            placeholder="Search materials…"
            placeholderTextColor="#888"
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity
          onPress={() => router.push("/marketplace/cart")}
          className="min-h-[48px] min-w-[48px] p-2 bg-primary/10 rounded-lg items-center justify-center"
        >
          <Feather name="shopping-cart" size={20} color="black" />
        </TouchableOpacity>
      </View>

      <View className="flex-row px-4 pb-1 gap-2 flex-wrap">
        <Text className="text-xs text-muted-foreground self-center mr-1">
          Sort:
        </Text>
        {(
          [
            ["name", "Name"],
            ["price", "Price"],
          ] as const
        ).map(([key, label]) => (
          <TouchableOpacity
            key={key}
            onPress={() => setSort(key)}
            className={`px-3 py-1 rounded-full border ${sort === key ? "border-primary bg-primary/15" : "border-border"}`}
          >
            <Text className="text-xs font-semibold text-foreground">
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(item) => item}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
          renderItem={({ item }) => {
            const isSelected = selectedCategory === item;
            return (
              <TouchableOpacity
                onPress={() => setSelectedCategory(item)}
                className={`mr-2 px-4 py-2 rounded-full border transition-all ${
                  isSelected
                    ? "bg-primary border-primary"
                    : "bg-muted/40 border-transparent"
                }`}
              >
                <Text
                  className={`font-semibold text-xs ${
                    isSelected
                      ? "text-primary-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      <EnhancedGrid
        category={selectedCategory}
        search={search}
        sort={sort}
        onRetrySync={onRetrySync}
      />
    </View>
  );
}
