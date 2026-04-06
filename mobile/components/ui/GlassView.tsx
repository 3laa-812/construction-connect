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

  const combinedStyles: ViewStyle = Array.isArray(style) 
    ? Object.assign({}, ...style) 
    : style || {};

  // For Android, fallback to standard View as BlurView is heavy/inconsistent
  if (Platform.OS === 'android') {
    return (
      <View
        style={[
          styles.base,
          { 
            backgroundColor: config.backgroundColor,
            borderColor: 'borderColor' in config ? (config as any).borderColor : undefined,
            borderTopColor: 'borderTopColor' in config ? (config as any).borderTopColor : undefined
          },
          combinedStyles
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
        { 
          borderColor: 'borderColor' in config ? (config as any).borderColor : undefined,
          borderTopColor: 'borderTopColor' in config ? (config as any).borderTopColor : undefined 
        },
        combinedStyles
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
