import React, { forwardRef, useState } from 'react';
import { TextInput, TextInputProps, View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, Fonts } from '../../constants/theme';
import { Glass } from '../../constants/glass';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, style, leftIcon, rightIcon, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
      <View style={{ marginBottom: 16 }}>
        {label && (
          <Text style={{ fontFamily: Fonts.body, fontSize: 14, color: Colors.text1, marginBottom: 6 }}>
            {label}
          </Text>
        )}
        <View style={[{
          backgroundColor: Colors.surface2,
          borderWidth: 1,
          borderColor: error ? Colors.error : (isFocused ? Colors.amber : Colors.border),
          borderRadius: Radius.md,
          flexDirection: 'row',
          alignItems: 'center',
          height: 48,
          paddingHorizontal: 12,
        }, style as any]}>
          {leftIcon && <View style={{ marginRight: 8 }}>{leftIcon}</View>}
          <TextInput
            ref={ref}
            placeholderTextColor={Colors.text3}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            style={{
              flex: 1,
              color: Colors.text1,
              fontFamily: Fonts.body,
              height: '100%',
            }}
            {...props}
          />
          {rightIcon && <View style={{ marginLeft: 8 }}>{rightIcon}</View>}
        </View>
        {error && (
          <Text style={{ fontFamily: Fonts.body, fontSize: 12, color: Colors.error, marginTop: 4 }}>
            {error}
          </Text>
        )}
      </View>
    );
  }
);

Input.displayName = 'Input';
