import React, { useState, useEffect } from "react";
import { View, Text } from "react-native";
import * as Network from "expo-network";

export default function NetworkBanner() {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const check = async () => {
      const status = await Network.getNetworkStateAsync();
      setIsConnected(status.isConnected ?? true);
    };
    // Periodic check (simulating listener for expo-network which is basic)
    // Note: expo-network doesn't have a live listener on web/simulators easily without polling or other libs
    // But NetInfo is better for this. For this MVP, we poll or check on mount.
    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, []);

  if (isConnected) return null;

  return (
    <View className="bg-destructive px-4 py-2">
      <Text className="text-destructive-foreground text-center text-xs font-bold">
        You are Offline. Changes will be saved locally.
      </Text>
    </View>
  );
}
