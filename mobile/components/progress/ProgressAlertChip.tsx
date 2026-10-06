import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Radius } from '../../constants/theme';
import { ProgressAlert } from '../../lib/progress';

export function ProgressAlertChip({ alert }: { alert: ProgressAlert }) {
  const isError = alert.type === 'error';
  const isInfo = alert.type === 'info';

  return (
    <View
      style={[
        styles.base,
        isError ? styles.error : isInfo ? styles.info : styles.warning,
      ]}
    >
      <Ionicons
        name={alert.icon as any}
        size={14}
        color={isError ? Colors.error : isInfo ? Colors.infoText : Colors.amber}
      />
      <Text
        style={[
          styles.text,
          { color: isError ? Colors.errorText : isInfo ? Colors.infoText : Colors.amber },
        ]}
      >
        {alert.message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  warning: {
    backgroundColor: 'rgba(212,146,10,0.1)',
    borderColor: 'rgba(212,146,10,0.3)',
  },
  error: {
    backgroundColor: 'rgba(139,46,46,0.18)',
    borderColor: 'rgba(139,46,46,0.32)',
  },
  info: {
    backgroundColor: 'rgba(42,74,107,0.2)',
    borderColor: 'rgba(126,184,224,0.32)',
  },
  text: {
    fontFamily: Fonts.body,
    fontSize: 11,
    flexShrink: 1,
  },
});
