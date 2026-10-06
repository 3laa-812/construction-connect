import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../../lib/api';
import { Colors, Spacing } from '../../../../constants/theme';
import { Button } from '../../../../components/ui/Button';
import { Card } from '../../../../components/ui/Card';
import { ScreenBackground } from '../../../../components/ui/ScreenBackground';

export default function OrderDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['purchase-order', id],
    queryFn: () => api.get(`/purchase-orders/${id}`).then(res => res.data),
  });

  if (isLoading) {
    return (
      <ScreenBackground style={styles.container}>
        <Text style={styles.text}>Loading order details...</Text>
      </ScreenBackground>
    );
  }

  const order = data || {};

  return (
    <ScreenBackground>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Order #{order.id || id}</Text>
        
        <Card variant="default" style={styles.card}>
          <Text style={styles.text}>Status: {order.status || 'UNKNOWN'}</Text>
          <Text style={styles.text}>Supplier: {order.supplier?.name || order.supplier_id || '—'}</Text>
          <Text style={styles.text}>Project: {order.project?.name || order.project_id || '—'}</Text>
          <Text style={styles.text}>Total: ${Number(order.total_amount ?? 0).toLocaleString()}</Text>
        </Card>

        <Button 
        onPress={() => router.push(`/commerce/orders/delivery?id=${id}` as any)}
          variant="primary"
          size="lg"
          style={{ marginTop: Spacing.lg }}
        >
          Record Delivery
        </Button>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  title: {
    fontFamily: 'DMSerifDisplay',
    fontSize: 24,
    color: Colors.text1,
    marginBottom: Spacing.md,
  },
  card: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  text: {
    fontFamily: 'Geist',
    color: Colors.text1,
    fontSize: 16,
  }
});
