import React from 'react';
import { BlurView } from 'expo-blur';
import { StyleSheet, View, ViewStyle, Platform } from 'react-native';
import { Glass } from '../../constants/glass';

interface GlassViewProps {
  variant?: 'nav' | 'card' | 'sheet' | 'toast' | 'input';
  intensity?: number;
  style?: ViewStyle | ViewStyle[];
  children?: React.ReactNode;
}

export function GlassView({ variant = 'card', intensity, style, children }: GlassViewProps) {
  const config = Glass[variant];
  const blurIntensity = intensity ?? {
    nav: 80, card: 40, sheet: 60, toast: 50, input: 20
  }[variant] ?? 40;
  const borderStyles = {
    borderColor: 'borderColor' in config ? (config as any).borderColor : undefined,
    borderTopColor: 'borderTopColor' in config ? (config as any).borderTopColor : undefined,
  };

  // For Android, fallback to standard View as BlurView is heavy/inconsistent
  if (Platform.OS === 'android') {
    return (
      <View
        style={[
          styles.base,
          {
            // Section 2.2 spec: use solid surface-2 @ 0.9 opacity on Android.
            backgroundColor: 'rgba(28, 31, 29, 0.9)',
          },
          borderStyles,
          style
        ]}
      >
        {children}
      </View>
    );
  }

  return (
    <BlurView
      intensity={blurIntensity}
      tint="dark"
      style={[
        styles.base,
        borderStyles,
        style
      ]}
    >
      <View style={[StyleSheet.absoluteFill, { backgroundColor: config.backgroundColor }]} />
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
    borderWidth: 1, // Will be overridden or set globally
    borderRadius: 12,
  },
});
