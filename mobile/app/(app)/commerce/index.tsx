import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../../lib/api';
import { Colors, Fonts, Radius, Spacing } from '../../../constants/theme';
import { Glass, AmberGlow } from '../../../constants/glass';
import { GlassView } from '../../../components/ui/GlassView';
import { ScreenBackground } from '../../../components/ui/ScreenBackground';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { mapPurchaseOrder, mapRfq, unwrapList } from '../../../lib/apiMappers';

type Segment = 'RFQs' | 'Orders' | 'Marketplace';

export default function CommerceHub() {
  const router = useRouter();
  const [activeSegment, setActiveSegment] = useState<Segment>('RFQs');
  const [refreshing, setRefreshing] = useState(false);

  // Queries for the different segments
  const rfqsQuery = useQuery({
    queryKey: ['rfqs'],
    queryFn: () => api.get('/rfqs').then(res => res.data),
    enabled: activeSegment === 'RFQs',
  });

  const ordersQuery = useQuery({
    queryKey: ['orders'],
    queryFn: () => api.get('/purchase-orders').then(res => res.data),
    enabled: activeSegment === 'Orders',
  });

  const onRefresh = async () => {
    setRefreshing(true);
    if (activeSegment === 'RFQs') await rfqsQuery.refetch();
    if (activeSegment === 'Orders') await ordersQuery.refetch();
    setRefreshing(false);
  };
  const rfqRows = unwrapList(rfqsQuery.data).map(mapRfq);
  const orderRows = unwrapList(ordersQuery.data).map(mapPurchaseOrder);
  const TypedFlashList = FlashList as any;

  const renderRFQItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      activeOpacity={0.8}
      onPress={() => router.push(`/commerce/rfqs/${item.id}` as any)}
    >
      <GlassView variant="card" style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.refText}>RFQ-{item.id.substring(0, 6).toUpperCase()}</Text>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          </View>
          <Badge variant={item.status === 'OPEN' ? 'info' : item.status === 'AWARDED' ? 'success' : 'default'}>
            {item.status}
          </Badge>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.infoPill}>
            <Ionicons name="pricetag-outline" size={12} color={Colors.text2} />
            <Text style={styles.pillText}>Materials</Text>
          </View>
          <View style={styles.infoPill}>
            <Ionicons name="list-outline" size={12} color={Colors.text2} />
            <Text style={styles.pillText}>{item.itemsCount} Items</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.footerItem}>
            <Ionicons name="calendar-outline" size={12} color={Colors.text3} />
            <Text style={styles.footerText}>
              {item.deliveryDate ? new Date(item.deliveryDate).toLocaleDateString() : 'No due date'}
            </Text>
          </View>
          {item.bidsCount > 0 && (
             <View style={styles.bidIndicator}>
                <View style={styles.bidDot} />
                <Text style={styles.bidText}>{item.bidsCount} Bids</Text>
             </View>
          )}
        </View>

        {item.status === 'OPEN' && item.bidsCount > 0 && (
          <View style={styles.compareBanner}>
            <Text style={styles.compareText}>Bids received — Compare Now</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.amber} />
          </View>
        )}
      </GlassView>
    </TouchableOpacity>
  );

  const renderOrderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      activeOpacity={0.8}
      onPress={() => router.push(`/commerce/orders/${item.id}` as any)}
    >
      <GlassView variant="card" style={styles.card}>
         <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.refText}>ORD-{item.id.substring(0, 6).toUpperCase()}</Text>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.itemsCount} line items</Text>
          </View>
          <Badge variant={item.status === 'DELIVERED' ? 'success' : 'info'}>
            {item.status}
          </Badge>
        </View>
        
        <View style={styles.orderStatusContainer}>
           <Text style={styles.orderLabel}>Status</Text>
           <Text style={styles.orderValue}>{String(item.status).replaceAll('_', ' ')}</Text>
           <View style={styles.orderProgressTrack}>
              <View style={[styles.orderProgressFill, { width: item.status === 'COMPLETED' ? '100%' : item.status === 'DELIVERED' ? '85%' : item.status === 'OUT_FOR_DELIVERY' ? '70%' : item.status === 'PROCESSING' ? '45%' : '20%' }]} />
           </View>
        </View>

        <View style={styles.cardFooter}>
           <Text style={styles.footerText}>Supplier: {item.supplierName || '—'}</Text>
           <Text style={styles.footerText}>${item.totalAmount.toLocaleString()}</Text>
        </View>
      </GlassView>
    </TouchableOpacity>
  );

  return (
    <ScreenBackground>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Commerce</Text>
      </View>

      {/* Segmented Control */}
      <View style={styles.segmentWrapper}>
        {(['RFQs', 'Orders', 'Marketplace'] as const).map((seg) => {
          const isActive = activeSegment === seg;
          return (
            <TouchableOpacity 
              key={seg} 
              onPress={() => setActiveSegment(seg)}
              style={[styles.segmentBtn, isActive && styles.segmentBtnActive]}
            >
              <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>
                {seg}
              </Text>
              {isActive && <View style={styles.activeLine} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {activeSegment === 'RFQs' && (
        <View style={{ flex: 1 }}>
          <TypedFlashList
            data={rfqRows}
            renderItem={renderRFQItem}
            estimatedItemSize={160}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.amber} />}
            ListEmptyComponent={
              <EmptyState 
                icon="document-text-outline"
                title="No RFQs Open"
                subtitle="Create a request for quotation to invite supplier bids"
                actionLabel="New RFQ"
                onAction={() => router.push('/commerce/rfqs/new' as any)}
              />
            }
          />
        </View>
      )}

      {activeSegment === 'Orders' && (
        <View style={{ flex: 1 }}>
          <TypedFlashList
            data={orderRows}
            renderItem={renderOrderItem}
            estimatedItemSize={160}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.amber} />}
            ListEmptyComponent={
              <EmptyState 
                 icon="cube-outline"
                 title="No Orders"
                 subtitle="Orders are created when you award an RFQ bid"
                 actionLabel="Go to RFQs"
                 onAction={() => setActiveSegment('RFQs')}
                 actionVariant="outline"
              />
            }
          />
        </View>
      )}

      {activeSegment === 'Marketplace' && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
          <Ionicons name="storefront-outline" size={64} color={Colors.surface2} />
          <Text style={styles.emptyText}>Open full marketplace catalog</Text>
          <Button
            variant="primary"
            onPress={() => router.push('/commerce/marketplace' as any)}
            style={{ marginTop: 24, width: '100%' }}
          >
            Browse Marketplace
          </Button>
        </View>
      )}

      {/* FAB for New RFQ */}
      {activeSegment === 'RFQs' && (
        <TouchableOpacity 
          style={[styles.fab, AmberGlow.strong]} 
          activeOpacity={0.8}
          onPress={() => router.push('/commerce/rfqs/new' as any)}
        >
          <Ionicons name="add" size={28} color={Colors.ground} />
        </TouchableOpacity>
      )}
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 24,
    paddingTop: 64,
    marginBottom: 8,
  },
  headerTitle: {
    fontFamily: Fonts.display,
    fontSize: 26,
    color: Colors.text1,
  },
  segmentWrapper: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginTop: 16,
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  segmentBtn: {
    paddingVertical: 12,
    marginRight: 24,
    position: 'relative',
  },
  segmentBtnActive: {
    // maybe sublte bg change?
  },
  segmentText: {
    fontFamily: Fonts.body,
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text3,
  },
  segmentTextActive: {
    color: Colors.amber,
  },
  activeLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: Colors.amber,
    borderRadius: 1,
  },
  list: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardHeader: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  refText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.text3,
    letterSpacing: 1,
  },
  cardTitle: {
    fontFamily: Fonts.display,
    fontSize: 18,
    color: Colors.text1,
    marginTop: 4,
  },
  cardContent: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pillText: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.text2,
  },
  cardFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.text3,
  },
  bidIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bidDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.amber,
  },
  bidText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.amber,
    fontWeight: '600',
  },
  compareBanner: {
    backgroundColor: 'rgba(212,146,10,0.1)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(212,146,10,0.2)',
  },
  compareText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.amber,
    fontWeight: '600',
  },
  orderStatusContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  orderLabel: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.text3,
    textTransform: 'uppercase',
  },
  orderValue: {
    fontFamily: Fonts.display,
    fontSize: 16,
    color: Colors.text1,
    marginTop: 2,
  },
  orderProgressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 2,
    marginTop: 12,
    width: '100%',
  },
  orderProgressFill: {
     height: '100%',
     backgroundColor: Colors.amber,
     borderRadius: 2,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontFamily: Fonts.body,
    color: Colors.text2,
    fontSize: 15,
    textAlign: 'center',
    marginTop: 12,
  },
  fab: {
    position: 'absolute',
    bottom: 84, // above tab bar
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.amber,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
