import React, { useState } from 'react';
import { View, Text, StyleSheet, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../../lib/api';
import { Colors, Spacing } from '../../../../constants/theme';
import { Card, CardTitle, CardDescription, CardHeader } from '../../../../components/ui/Card';
import { Badge } from '../../../../components/ui/Badge';
import { FAB } from '../../../../components/ui/FAB';
import { ScreenBackground } from '../../../../components/ui/ScreenBackground';
import { mapRfq, unwrapList } from '../../../../lib/apiMappers';

export default function RFQsList() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['rfqs'],
    queryFn: () => api.get('/rfqs').then(res => res.data),
  });
  const rows = unwrapList(data).map(mapRfq);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const getStatusVariant = (status: string) => {
    switch(status) {
      case 'OPEN': return 'info';
      case 'AWARDED': return 'success';
      case 'CLOSED': return 'warning';
      default: return 'default';
    }
  };

  return (
    <ScreenBackground style={styles.container}>
      <FlashList
        estimatedItemSize={100}
        data={rows}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.amber} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {isLoading ? 'Loading RFQs...' : 'No RFQs found.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <CardHeader onTouchEnd={() => router.push(`/commerce/rfqs/${item.id}` as any)}>
              <View style={styles.headerRow}>
                <CardTitle style={{ flex: 1 }}>{item.title || `RFQ #${item.id.substring(0, 8)}`}</CardTitle>
                <Badge variant={getStatusVariant(item.status)}>{item.status}</Badge>
              </View>
              <CardDescription>{item.itemsCount} items • {item.bidsCount} bids</CardDescription>
            </CardHeader>
          </Card>
        )}
      />

      <FAB 
        icon="plus" 
        onPress={() => router.push('/commerce/rfqs/new' as any)}
        style={{ bottom: Spacing.xl, right: Spacing.xl }}
      />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: Spacing.md,
  },
  card: {
    marginBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    color: Colors.text2,
    fontFamily: 'Geist',
  }
});
