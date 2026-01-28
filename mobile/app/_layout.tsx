import { Slot } from "expo-router";
import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { database } from "../db";
import { DatabaseProvider } from "@nozbe/watermelondb/DatabaseProvider";

import "../global.css";

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Check if DB is ready or perform any initialization
    setIsReady(true);
  }, []);

  if (!isReady) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text>Loading Database...</Text>
      </View>
    );
  }

  return (
    <DatabaseProvider database={database}>
        <Slot />
    </DatabaseProvider>
  );
}
