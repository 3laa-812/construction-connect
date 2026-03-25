import React, { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";

type Props = {
  height?: number;
  className?: string;
};

export function SkeletonRow({ height = 14, className = "" }: Props) {
  const opacity = useSharedValue(0.35);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.85, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);

  const anim = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[{ height, borderRadius: 8 }, anim]}
      className={`bg-muted-foreground/20 w-full ${className}`}
    />
  );
}

export function SkeletonBlock({ className }: { className?: string }) {
  return (
    <View className={`gap-3 p-4 ${className ?? ""}`}>
      <SkeletonRow height={20} className="w-3/5" />
      <SkeletonRow height={14} className="w-full" />
      <SkeletonRow height={14} className="w-4/5" />
    </View>
  );
}
