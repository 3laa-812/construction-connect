import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { Colors } from '../../../constants/theme';
import { Card, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { useRouter } from 'expo-router';

export default function OrdersList() {
  const router = useRouter();
  
  const { data, isLoading } = useQuery({
    queryKey: ['purchase-orders'],
    queryFn: () => api.get('/purchase-orders').then(res => res.data),
  });

  return (
    <View style={{ flex: 1, backgroundColor: Colors.ground }}>
      <FlatList
        data={data?.data || []}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View style={{ flex: 1, alignItems: 'center', marginTop: 40 }}>
            <Text style={{ color: Colors.text2, fontFamily: 'Geist' }}>
              {isLoading ? 'Loading online orders...' : 'No orders found online.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Card style={{ marginBottom: 12 }}>
            <CardHeader onTouchEnd={() => router.push(`/orders/${item.id}`)}>
              <CardTitle>{item.id} - {item.status}</CardTitle>
              <CardDescription>Click to begin Photo Signature & Delivery</CardDescription>
            </CardHeader>
          </Card>
        )}
      />
    </View>
  );
}
