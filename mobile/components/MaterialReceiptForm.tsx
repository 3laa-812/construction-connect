import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";

export interface ReceivedItem {
  id: string;
  description: string;
  quantity: string;
  unit: string;
}

interface MaterialReceiptFormProps {
  items: ReceivedItem[];
  onChange: (items: ReceivedItem[]) => void;
}

export default function MaterialReceiptForm({
  items,
  onChange,
}: MaterialReceiptFormProps) {
  const [newItem, setNewItem] = useState<Partial<ReceivedItem>>({});

  const addItem = () => {
    if (!newItem.description || !newItem.quantity) return;

    const item: ReceivedItem = {
      id: Date.now().toString(),
      description: newItem.description,
      quantity: newItem.quantity,
      unit: newItem.unit || "pcs",
    };

    onChange([...items, item]);
    setNewItem({});
  };

  const removeItem = (id: string) => {
    onChange(items.filter((i) => i.id !== id));
  };

  return (
    <View className="bg-card p-4 rounded-xl border border-border mb-4">
      <Text className="text-lg font-bold text-foreground mb-4">
        Material Receipt (GRN)
      </Text>

      {/* List */}
      {items.length > 0 && (
        <View className="mb-4 bg-secondary/50 rounded-lg p-2">
          {items.map((item) => (
            <View
              key={item.id}
              className="flex-row justify-between items-center py-2 border-b border-border/50 last:border-0"
            >
              <View className="flex-1">
                <Text className="text-foreground font-semibold">
                  {item.description}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  {item.quantity} {item.unit}
                </Text>
              </View>
              <TouchableOpacity onPress={() => removeItem(item.id)}>
                <Text className="text-destructive font-bold text-xs p-2">
                  Remove
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Add New */}
      <View className="gap-2">
        <TextInput
          className="bg-secondary text-foreground p-3 rounded-lg border border-border"
          placeholder="Material Description (e.g. Cement)"
          placeholderTextColor="hsl(var(--muted-foreground))"
          value={newItem.description || ""}
          onChangeText={(t) => setNewItem({ ...newItem, description: t })}
        />
        <View className="flex-row gap-2">
          <TextInput
            className="flex-1 bg-secondary text-foreground p-3 rounded-lg border border-border"
            placeholder="Qty"
            keyboardType="numeric"
            placeholderTextColor="hsl(var(--muted-foreground))"
            value={newItem.quantity || ""}
            onChangeText={(t) => setNewItem({ ...newItem, quantity: t })}
          />
          <TextInput
            className="flex-1 bg-secondary text-foreground p-3 rounded-lg border border-border"
            placeholder="Unit"
            placeholderTextColor="hsl(var(--muted-foreground))"
            value={newItem.unit || ""}
            onChangeText={(t) => setNewItem({ ...newItem, unit: t })}
          />
        </View>
        <TouchableOpacity
          onPress={addItem}
          className="bg-secondary border border-primary/50 items-center py-3 rounded-lg mt-2"
        >
          <Text className="text-primary font-bold">+ Add Item</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
