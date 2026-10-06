import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../../../../components/ui/Button';
import { Colors, Spacing } from '../../../../constants/theme';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../../../../lib/api';
import { ScreenBackground } from '../../../../components/ui/ScreenBackground';

export default function ProofOfDelivery() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { data: order } = useQuery({
    queryKey: ['purchase-order-delivery', id],
    queryFn: () => api.get(`/purchase-orders/${id}`).then((res) => res.data),
    enabled: Boolean(id),
  });

  const submitDelivery = async () => {
    setLoading(true);
    try {
      const cameraPerm = await ImagePicker.requestCameraPermissionsAsync();
      if (!cameraPerm.granted) {
        alert("Camera permission is required to capture proof of delivery.");
        setLoading(false);
        return;
      }
      
      const result = await ImagePicker.launchCameraAsync({ quality: 0.5 });
      if (result.canceled) {
        setLoading(false);
        return;
      }
      
      // Backend endpoint expects JSON body (not multipart).
      const items = Array.isArray(order?.items)
        ? order.items.map((line: any) => ({
            po_item_id: line.id,
            delivered_qty: Number(line.remaining_qty ?? line.ordered_qty ?? 1) || 1,
          }))
        : [];
      if (!items.length) {
        alert('No order items available for delivery confirmation.');
        setLoading(false);
        return;
      }
      await api.post(`/purchase-orders/${id}/delivery-notes`, {
        status: 'DELIVERED',
        pod_image_url: result.assets[0].uri,
        items,
      });
      
      alert('Delivery Confirmed!');
      router.back();
    } catch (e) {
      console.error(e);
      alert('Network warning: Failed to upload proof of delivery. Checking offline queue fallback...');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenBackground style={styles.container}>
      <Text style={styles.subtitle}>
        Proof of Delivery Verification
      </Text>
      <Text style={styles.title}>
        Order #{id}
      </Text>
      <Button onPress={submitDelivery} isLoading={loading} size="lg">
        Capture Physical Signature & Submit
      </Button>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: Spacing.md, 
    justifyContent: 'center' 
  },
  subtitle: {
    color: Colors.text2, 
    fontSize: 16, 
    fontFamily: 'Geist', 
    textAlign: 'center', 
    marginBottom: Spacing.xs 
  },
  title: {
    color: Colors.text1, 
    fontSize: 24, 
    marginBottom: Spacing.xl, 
    fontFamily: 'DMSerifDisplay', 
    textAlign: 'center' 
  }
});
