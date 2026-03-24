import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";

type Props = {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
};

export function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <View className="mb-3 border border-border rounded-xl overflow-hidden bg-card">
      <TouchableOpacity
        onPress={() => setOpen(!open)}
        className="flex-row justify-between items-center px-4 py-3 bg-muted/30"
        activeOpacity={0.7}
      >
        <Text className="font-bold text-base text-foreground">{title}</Text>
        <Feather
          name={open ? "chevron-up" : "chevron-down"}
          size={22}
          color="hsl(var(--muted-foreground))"
        />
      </TouchableOpacity>
      {open ? (
        <View className="p-4 border-t border-border">{children}</View>
      ) : null}
    </View>
  );
}
