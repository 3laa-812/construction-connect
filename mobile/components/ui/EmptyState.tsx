import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing } from '../../constants/theme';
import { Button, ButtonVariant } from './Button';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
  actionVariant?: ButtonVariant;
  style?: ViewStyle;
}

export function EmptyState({ 
  icon, 
  title, 
  subtitle, 
  actionLabel, 
  onAction, 
  actionVariant = 'primary',
  style 
}: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      <Ionicons name={icon} size={64} color={Colors.surface2} />
      
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      
      {actionLabel && onAction && (
        <Button 
          variant={actionVariant} 
          onPress={onAction} 
          style={styles.button}
        >
          {actionLabel}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    backgroundColor: 'transparent',
    marginTop: 60,
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: 20,
    color: Colors.text1,
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.text2,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    marginTop: 24,
    minWidth: 160,
  },
});
