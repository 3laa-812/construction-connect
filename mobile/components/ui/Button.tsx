import React, { forwardRef } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, TouchableOpacityProps, ViewStyle, TextStyle } from 'react-native';
import { Colors, Radius } from '../../constants/theme';
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
  lg: { height: 44, paddingHorizontal: 24, borderRadius: Radius.lg },  
  icon: { height: 36, width: 36, borderRadius: Radius.md, justifyContent: 'center', alignItems: 'center' },
};

const sizeTextStyles: Record<ButtonSize, TextStyle> = {
  sm: { fontSize: 12 },   
  md: { fontSize: 14 },   
  lg: { fontSize: 14 },
  icon: { fontSize: 14 },
};

export const Button = forwardRef<TouchableOpacity, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading, disabled, children, leftIcon, rightIcon, style, onPress, ...props }, ref) => {
    
    const handlePress = (e: any) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      if (onPress) onPress(e);
    };

    return (
      <TouchableOpacity
        ref={ref}
        onPress={handlePress}
        disabled={disabled || isLoading}
        activeOpacity={0.8}
        style={[
          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
          variantStyles[variant],
          sizeStyles[size],
          disabled && { opacity: 0.4 },
          style as ViewStyle,
        ]}
        {...props}
      >
        {isLoading ? (
          <ActivityIndicator color={variantTextStyles[variant].color} />
        ) : (
          <>
            {leftIcon}
            {typeof children === 'string' ? (
              <Text style={[
                { fontFamily: 'Geist', fontWeight: '500' },
                variantTextStyles[variant],
                sizeTextStyles[size],
              ]}>
                {children}
              </Text>
            ) : children}
            {rightIcon}
          </>
        )}
      </TouchableOpacity>
    );
  }
);

Button.displayName = 'Button';
