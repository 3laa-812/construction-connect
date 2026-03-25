import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

type Props = {
  title?: string;
  message: string;
  onRetry?: () => void;
  onWorkOffline?: () => void;
};

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  onWorkOffline,
}: Props) {
  return (
    <View className="flex-1 justify-center items-center px-6 py-12">
      <Text className="text-xl font-bold text-foreground text-center mb-2">
        {title}
      </Text>
      <Text className="text-muted-foreground text-center mb-8 text-base leading-6">
        {message}
      </Text>
      <View className="w-full max-w-sm gap-3">
        {onRetry ? (
          <TouchableOpacity
            onPress={onRetry}
            className="min-h-[48px] px-4 rounded-xl bg-primary items-center justify-center"
          >
            <Text className="text-primary-foreground font-bold text-base">
              Retry
            </Text>
          </TouchableOpacity>
        ) : null}
        {onWorkOffline ? (
          <TouchableOpacity
            onPress={onWorkOffline}
            className="min-h-[48px] px-4 rounded-xl border border-border bg-card items-center justify-center"
          >
            <Text className="text-foreground font-semibold text-base">
              Work offline
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}
