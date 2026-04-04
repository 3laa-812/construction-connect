import React from 'react';
import { View, I18nManager, ViewProps } from 'react-native';

export function RTLView({ style, ...props }: ViewProps) {
  return (
    <View
      style={[{ flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row' }, style]}
      {...props}
    />
  );
}
