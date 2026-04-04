import React, { forwardRef, useState } from 'react';
import { TextInput, TextInputProps, View, Text } from 'react-native';
import { Colors, Radius } from '../../constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, style, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
      <View style={{ marginBottom: 16 }}>
        {label && (
          <Text style={{ fontFamily: 'Geist', fontSize: 14, color: Colors.text1, marginBottom: 6 }}>
            {label}
          </Text>
        )}
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
          style={[{
            backgroundColor: Colors.surface2,
            borderWidth: 1,
            borderColor: error ? Colors.error : (isFocused ? Colors.amber : Colors.border),
            borderRadius: Radius.md,
            color: Colors.text1,
            paddingHorizontal: 12,
            height: 44,
            fontFamily: 'Geist',
          }, style as any]}
          {...props}
        />
        {error && (
          <Text style={{ fontFamily: 'Geist', fontSize: 12, color: Colors.error, marginTop: 4 }}>
            {error}
          </Text>
        )}
      </View>
    );
  }
);

Input.displayName = 'Input';
