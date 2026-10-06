import React from 'react';
import { View, Text } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../../lib/api';
import { Colors } from '../../../../constants/theme';
import { Card, CardHeader, CardTitle, CardDescription } from '../../../../components/ui/Card';
import { useRouter } from 'expo-router';
import { ScreenBackground } from '../../../../components/ui/ScreenBackground';
import { unwrapList } from '../../../../lib/apiMappers';

export default function OrdersList() {
  const router = useRouter();
  
  const { data, isLoading } = useQuery({
    queryKey: ['purchase-orders'],
    queryFn: () => api.get('/purchase-orders').then(res => res.data),
  });
  const rows = unwrapList(data);

  return (
    <ScreenBackground>
      <FlashList
        estimatedItemSize={80}
        data={rows}
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
            <CardHeader onTouchEnd={() => router.push(`/commerce/orders/${item.id}` as any)}>
              <CardTitle>{item.id} - {item.status}</CardTitle>
              <CardDescription>Click to begin Photo Signature & Delivery</CardDescription>
            </CardHeader>
          </Card>
        )}
      />
    </ScreenBackground>
  );
}
