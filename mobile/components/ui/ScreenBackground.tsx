import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/theme';

interface ScreenBackgroundProps {
  children?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}

export function ScreenBackground({ children, style }: ScreenBackgroundProps) {
  return (
    <View style={[{ flex: 1, backgroundColor: Colors.ground }, style]}>
      <LinearGradient
        colors={['rgba(212,146,10,0.04)', 'transparent']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 0.6 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}
