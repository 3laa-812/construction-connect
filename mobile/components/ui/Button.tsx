import React, { forwardRef } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacityProps, ViewStyle, TextStyle, StyleSheet, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Colors, Radius, Fonts } from '../../constants/theme';
import * as Haptics from 'expo-haptics';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends TouchableOpacityProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, ViewStyle> = {
  primary:   { backgroundColor: Colors.amber },           
  secondary: { backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border2 },
  ghost:     { backgroundColor: 'transparent' },
  danger:    { backgroundColor: Colors.error },            
  outline:   { borderWidth: 1, borderColor: Colors.amber + '66' }, 
};

const variantTextStyles: Record<ButtonVariant, TextStyle> = {
  primary:   { color: Colors.ground },   
  secondary: { color: Colors.text1 },
  ghost:     { color: Colors.text2 },
  danger:    { color: Colors.text1 },
  outline:   { color: Colors.amber },
};

const sizeStyles: Record<ButtonSize, ViewStyle> = {
  sm: { height: 28, paddingHorizontal: 12, borderRadius: Radius.sm },  
  md: { height: 36, paddingHorizontal: 16, borderRadius: Radius.md },  
  lg: { height: 48, paddingHorizontal: 24, borderRadius: Radius.lg },  
  icon: { height: 36, width: 36, borderRadius: Radius.md, justifyContent: 'center', alignItems: 'center' },
};

const sizeTextStyles: Record<ButtonSize, TextStyle> = {
  sm: { fontSize: 12 },   
  md: { fontSize: 14 },   
  lg: { fontSize: 15, fontWeight: '600' },
  icon: { fontSize: 14 },
};

export const Button = forwardRef<View, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading, disabled, children, leftIcon, rightIcon, style, onPress, ...props }, ref) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
      if (!disabled && !isLoading) {
        scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
    };

    const handlePressOut = () => {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    };

    return (
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || isLoading}
        style={({ pressed }) => [
          styles.base,
          variantStyles[variant],
          sizeStyles[size],
          disabled && styles.disabled,
          style as ViewStyle,
        ]}
        {...props}
      >
        <Animated.View style={[styles.inner, animatedStyle]}>
          {isLoading ? (
            <ActivityIndicator color={variantTextStyles[variant].color} size="small" />
          ) : (
            <>
              {leftIcon}
              {typeof children === 'string' ? (
                <Text style={[
                  styles.textBase,
                  variantTextStyles[variant],
                  sizeTextStyles[size],
                ]}>
                  {children}
                </Text>
              ) : children}
              {rightIcon}
            </>
          )}
        </Animated.View>
      </Pressable>
    );
  }
);

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    height: '100%',
  },
  textBase: {
    fontFamily: Fonts.body,
    fontWeight: '500',
  },
  disabled: {
    opacity: 0.4,
  }
});

Button.displayName = 'Button';
