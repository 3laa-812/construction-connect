import React from 'react';
import { View, Text } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../../../lib/api';
import { Colors } from '../../../../../constants/theme';
import { Card, CardHeader, CardTitle, CardDescription } from '../../../../../components/ui/Card';
import { useRouter } from 'expo-router';
import { ScreenBackground } from '../../../../../components/ui/ScreenBackground';
import { unwrapList } from '../../../../../lib/apiMappers';

export default function InvoicesList() {
  const router = useRouter();
  
  const { data, isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => api.get('/invoices').then(res => res.data),
  });
  const rows = unwrapList(data);

  const TypedFlashList = FlashList as any;

  return (
    <ScreenBackground>
      <TypedFlashList
        estimatedItemSize={80}
        data={rows}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View style={{ flex: 1, alignItems: 'center', marginTop: 40 }}>
            <Text style={{ color: Colors.text2, fontFamily: 'Geist' }}>
              {isLoading ? 'Loading invoices...' : 'No invoices found.'}
            </Text>
          </View>
        }
        renderItem={({ item }: { item: any }) => (
          <Card style={{ marginBottom: 12 }}>
            <CardHeader onTouchEnd={() => router.push(`/commerce/financials/invoices/${item.id}` as any)}>
              <CardTitle>{item.id} - ${Number(item.total_amount ?? item.total ?? 0).toLocaleString()}</CardTitle>
              <CardDescription>Status: {item.status}</CardDescription>
            </CardHeader>
          </Card>
        )}
      />
    </ScreenBackground>
  );
}
