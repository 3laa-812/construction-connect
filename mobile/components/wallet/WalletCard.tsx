import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/theme';
import { Card, CardContent } from '../ui/Card';

interface WalletCardProps {
  balance: number;
  outstanding: number;
  isSupplier: boolean;
}

export function WalletCard({ balance, outstanding, isSupplier }: WalletCardProps) {
  return (
    <Card style={styles.card}>
      <CardContent style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.label}>Available Balance</Text>
          <Text style={styles.value}>${balance.toLocaleString()}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.section}>
          <Text style={styles.label}>{isSupplier ? 'Outstanding Due' : 'Outstanding Payable'}</Text>
          <Text style={[styles.value, { color: isSupplier ? Colors.success.text : Colors.error.text }]}>
            ${outstanding.toLocaleString()}
          </Text>
        </View>
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface.DEFAULT,
    marginBottom: 16,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  section: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    backgroundColor: Colors.border.DEFAULT,
  },
  label: {
    color: Colors.text.text2,
    fontFamily: 'Geist',
    fontSize: 12,
    marginBottom: 8,
  },
  value: {
    color: Colors.text.text1,
    fontFamily: 'DMSerifDisplay',
    fontSize: 24,
  }
});
