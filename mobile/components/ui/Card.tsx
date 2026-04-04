import React from 'react';
import { View, ViewProps, Text, TextProps, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing } from '../../constants/theme';

interface CardProps extends ViewProps {
  variant?: 'default' | 'elevated' | 'flat';
}

export function Card({ variant = 'default', style, ...props }: CardProps) {
  return (
    <View
      style={[
        styles.card,
        variant === 'elevated' && styles.elevated,
        variant === 'flat' && styles.flat,
        style,
      ]}
      {...props}
    />
  );
}

export function CardHeader({ style, ...props }: ViewProps) {
  return <View style={[styles.header, style]} {...props} />;
}

export function CardContent({ style, ...props }: ViewProps) {
  return <View style={[styles.content, style]} {...props} />;
}

export function CardFooter({ style, ...props }: ViewProps) {
  return <View style={[styles.footer, style]} {...props} />;
}

export function CardTitle({ style, ...props }: TextProps) {
  return <Text style={[styles.title, style]} {...props} />;
}

export function CardDescription({ style, ...props }: TextProps) {
  return <Text style={[styles.description, style]} {...props} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  elevated: {
    backgroundColor: Colors.surface2,
    shadowOpacity: 0.2,
    elevation: 4,
    borderColor: Colors.amber + '66',
  },
  flat: {
    shadowOpacity: 0,
    elevation: 0,
    borderWidth: 0,
  },
  header: {
    padding: Spacing.lg,
  },
  content: {
    padding: Spacing.lg,
    paddingTop: 0,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    paddingTop: 0,
  },
  title: {
    fontFamily: 'DMSerifDisplay',
    fontSize: 20,
    color: Colors.text1,
  },
  description: {
    fontFamily: 'Geist',
    fontSize: 14,
    color: Colors.text2,
    marginTop: 4,
  },
});
