import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../../lib/api';
import { Colors, Spacing } from '../../../../constants/theme';
import { Card, CardTitle, CardDescription } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';

export default function RFQDetail() {
  const { id } = useLocalSearchParams();
  const [loadingBid, setLoadingBid] = useState<string | null>(null);

  const { data: rfqData, isLoading: rfqLoading } = useQuery({
    queryKey: ['rfq', id],
    queryFn: () => api.get(`/rfqs/${id}`).then(res => res.data),
  });

  const { data: bidsData } = useQuery({
    queryKey: ['rfq-bids', id],
    queryFn: () => api.get(`/rfqs/${id}/bids`).then(res => res.data),
  });

  const handleAwardBid = async (bidId: string) => {
    setLoadingBid(bidId);
    try {
      await api.patch(`/rfqs/${id}/award/${bidId}`);
      alert('Bid awarded successfully!');
    } catch (e) {
      alert('Failed to award bid');
    } finally {
      setLoadingBid(null);
    }
  };

  const rfq = rfqData?.data || {};
  const bids = bidsData?.data || [];

  if (rfqLoading) {
    return <View style={styles.container}><Text style={styles.text}>Loading RFQ...</Text></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{rfq.title || `RFQ #${id}`}</Text>
      
      <Card style={styles.card}>
        <CardTitle>Details</CardTitle>
        <CardDescription>Status: {rfq.status}</CardDescription>
        <CardDescription>Project ID: {rfq.project_id || 'N/A'}</CardDescription>
      </Card>

      <Text style={styles.sectionTitle}>Bids Received ({bids.length})</Text>
      
      {bids.length === 0 ? (
        <Text style={styles.text}>No bids placed yet.</Text>
      ) : (
        bids.map((bid: any) => (
          <Card key={bid.id} style={styles.card}>
            <Text style={styles.text}>Supplier: {bid.supplier_id}</Text>
            <Text style={styles.text}>Total: {bid.total_amount}</Text>
            
            {rfq.status === 'OPEN' && (
              <View style={styles.actions}>
                <Button 
                  variant="primary" 
                  size="sm"
                  isLoading={loadingBid === bid.id}
                  onPress={() => handleAwardBid(bid.id)}
                >
                  Award Bid
                </Button>
              </View>
            )}
          </Card>
        ))
      )}
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
    gap: Spacing.md,
  },
  title: {
    fontFamily: 'DMSerifDisplay',
    fontSize: 24,
    color: Colors.text1,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontFamily: 'Geist',
    fontWeight: '600',
    fontSize: 18,
    color: Colors.text1,
    marginTop: Spacing.lg,
  },
  card: {
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  text: {
    fontFamily: 'Geist',
    color: Colors.text2,
    fontSize: 14,
  },
  actions: {
    marginTop: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  }
});
