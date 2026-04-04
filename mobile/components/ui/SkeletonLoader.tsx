import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import { Colors } from '../../constants/theme';

export function SkeletonLoader({ width, height, style }: { width?: number | string, height: number, style?: any }) {
  const customOpacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(customOpacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(customOpacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [customOpacity]);

  return (
    <Animated.View style={[
      styles.skeleton, 
      { width: width || '100%', height, opacity: customOpacity }, 
      style
    ]} />
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: Colors.surface.DEFAULT,
    borderRadius: 8,
  }
});
