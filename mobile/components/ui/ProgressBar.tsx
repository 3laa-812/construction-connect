import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing as ReanimatedEasing } from 'react-native-reanimated';
import { Svg, Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts } from '../../constants/theme';
import { AmberGlow } from '../../constants/glass';
import { getProgressColor, ProgressBreakdown } from '../../lib/progress';

export interface ProgressBarProps {
  value: number;            // 0–100
  variant?: 'default' | 'segmented' | 'radial';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animated?: boolean;
  label?: string;
  color?: string;           // overrides calculated color
  breakdown?: ProgressBreakdown; // Used only for segmented
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function ProgressBar({
  value,
  variant = 'default',
  size = 'md',
  showLabel = false,
  animated = true,
  label,
  color,
  breakdown
}: ProgressBarProps) {
  const safeValue = Math.min(100, Math.max(0, value || 0));
  const trackColor = 'rgba(42,46,43,0.8)';
  
  if (variant === 'radial') {
    return <RadialProgress value={safeValue} color={color} animated={animated} />;
  }

  if (variant === 'segmented' && breakdown) {
    return <SegmentedProgress breakdown={breakdown} animated={animated} />;
  }

  // Default linear progress bar
  const heightParams = { sm: 3, md: 6, lg: 8 };
  const h = heightParams[size];

  return (
    <View style={styles.container}>
      {label && <Text style={styles.topLabel}>{label}</Text>}
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <View style={[styles.track, { height: h, backgroundColor: trackColor }]}>
          <LinearFill value={safeValue} height={h} color={color} animated={animated} />
        </View>
        {showLabel && <Text style={[styles.sideLabel, { height: h + 10, lineHeight: h + 10 }]}>{Math.round(safeValue)}%</Text>}
      </View>
    </View>
  );
}

function LinearFill({ value, height, color, animated }: { value: number; height: number; color?: string; animated: boolean }) {
  const [width, setWidth] = useState(0);
  const animatedWidth = useSharedValue(0);

  useEffect(() => {
    if (width > 0) {
      const target = (value / 100) * width;
      if (animated) {
        animatedWidth.value = withTiming(target, {
          duration: 600,
          easing: ReanimatedEasing.bezier(0.16, 1, 0.3, 1)
        });
      } else {
        animatedWidth.value = target;
      }
    }
  }, [value, width, animated]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: animatedWidth.value,
  }));

  const resolvedColor = color ?? getProgressColor(value);
  const bgGradient = color 
    ? [color, color]
    : [Colors.amberDim, resolvedColor];
  
  const glowStyle = Platform.OS === 'ios' ? AmberGlow.bar : {};

  return (
    <View 
      style={StyleSheet.absoluteFill} 
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
    >
      <Animated.View style={[styles.fillContainer, animatedStyle, glowStyle]}>
        <LinearGradient
          colors={bgGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

function SegmentedProgress({ breakdown, animated }: { breakdown: ProgressBreakdown; animated: boolean }) {
  const segments = [
    { key: 'budget', label: 'Budget', val: breakdown.budget },
    { key: 'procu', label: 'Procu.', val: breakdown.procurement },
    { key: 'deliv', label: 'Deliv.', val: breakdown.delivery },
    { key: 'time', label: 'Time', val: breakdown.timeline },
  ];

  return (
    <View style={styles.segmentedContainer}>
      {segments.map(seg => (
        <View key={seg.key} style={styles.segment}>
          <Text style={styles.segmentLabel}>{seg.label}</Text>
          <ProgressBar value={seg.val} variant="default" size="sm" showLabel={false} animated={animated} />
          <Text style={styles.segmentValue}>{Math.round(seg.val)}%</Text>
        </View>
      ))}
    </View>
  );
}

function RadialProgress({ value, color, animated }: { value: number; color?: string; animated: boolean }) {
  const size = 56;
  const strokeWidth = 4;
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  
  const animatedOffset = useSharedValue(circumference);
  
  useEffect(() => {
    const target = circumference - (value / 100) * circumference;
    if (animated) {
      animatedOffset.value = withTiming(target, {
        duration: 800,
        easing: ReanimatedEasing.bezier(0.16, 1, 0.3, 1)
      });
    } else {
      animatedOffset.value = target;
    }
  }, [value, animated]);

  const animatedStyle = useAnimatedStyle(() => ({
    strokeDashoffset: animatedOffset.value,
  }));

  const indicatorColor = color ?? getProgressColor(value);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(42,46,43,0.8)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={indicatorColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeLinecap="round"
          originX={size / 2}
          originY={size / 2}
          rotation="-90"
          animatedProps={animatedStyle as any}
        />
      </Svg>
      <View style={StyleSheet.absoluteFill}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={styles.radialText}>{Math.round(value)}%</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  track: {
    flex: 1,
    borderRadius: 999,
    overflow: 'hidden',
  },
  fillContainer: {
    height: '100%',
    borderRadius: 999,
    overflow: 'hidden',
  },
  topLabel: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.text2,
    marginBottom: 4,
  },
  sideLabel: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.text2,
    marginLeft: 8,
  },
  segmentedContainer: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  segment: {
    flex: 1,
  },
  segmentLabel: {
    fontFamily: Fonts.body,
    fontSize: 9,
    textTransform: 'uppercase',
    color: Colors.text3,
    marginBottom: 4,
  },
  segmentValue: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.text2,
    marginTop: 2,
  },
  radialText: {
    fontFamily: Fonts.mono,
    fontWeight: 'bold',
    fontSize: 14,
    color: Colors.text1,
  }
});
