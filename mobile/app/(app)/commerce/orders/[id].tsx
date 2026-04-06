import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../../lib/api';
import { Colors, Spacing } from '../../../../constants/theme';
import { Button } from '../../../../components/ui/Button';
import { Card } from '../../../../components/ui/Card';

export default function OrderDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['purchase-order', id],
    queryFn: () => api.get(`/purchase-orders/${id}`).then(res => res.data),
  });

  if (isLoading) {
    return <View style={styles.container}><Text style={styles.text}>Loading order details...</Text></View>;
  }

  const order = data?.data || {};

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Order #{order.id || id}</Text>
      
      <Card variant="default" style={styles.card}>
        <Text style={styles.text}>Status: {order.status || 'UNKNOWN'}</Text>
        <Text style={styles.text}>Supplier ID: {order.supplier_id}</Text>
        <Text style={styles.text}>Buyer ID: {order.buyer_id}</Text>
      </Card>

      <Button 
        onPress={() => router.push(`/orders/delivery?id=${id}`)}
        variant="primary"
        size="lg"
        style={{ marginTop: Spacing.lg }}
      >
        Record Delivery
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.ground,
  },
  content: {
    padding: Spacing.md,
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
