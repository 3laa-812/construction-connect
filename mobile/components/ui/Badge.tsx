import React from 'react';
import { View, Text, ViewStyle, TextStyle } from 'react-native';
import { Colors, Radius } from '../../constants/theme';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'default';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  style?: ViewStyle;
}

const badgeStyles: Record<BadgeVariant, ViewStyle> = {
  success: { backgroundColor: Colors.success },
  warning: { backgroundColor: Colors.warning },
  error: { backgroundColor: Colors.error },
  info: { backgroundColor: Colors.info },
  default: { backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border2 },
};

const textStyles: Record<BadgeVariant, TextStyle> = {
  success: { color: Colors.successText },
  warning: { color: Colors.warningText },
  error: { color: Colors.errorText },
  info: { color: Colors.infoText },
  default: { color: Colors.text2 },
};

export function Badge({ variant = 'default', children, style }: BadgeProps) {
  return (
    <View style={[{
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: Radius.sm,
      alignSelf: 'flex-start',
    }, badgeStyles[variant], style]}>
      <Text style={[{
        fontFamily: 'Geist',
        fontSize: 12,
        fontWeight: '500',
        textTransform: 'uppercase',
      }, textStyles[variant]]}>
        {children}
      </Text>
    </View>
  );
}
