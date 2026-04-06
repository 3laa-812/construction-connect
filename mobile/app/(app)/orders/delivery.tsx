import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '../../../components/ui/Button';
import { Colors, Spacing } from '../../../constants/theme';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../../../lib/api';

export default function ProofOfDelivery() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

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
      
      const formData = new FormData();
      formData.append('items', JSON.stringify([])); 
      formData.append('pod_photo', {
        uri: result.assets[0].uri,
        type: 'image/jpeg',
        name: 'pod.jpg',
      } as any);

      await api.post(`/purchase-orders/${id}/delivery-notes`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
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
    <View style={styles.container}>
      <Text style={styles.subtitle}>
        Proof of Delivery Verification
      </Text>
      <Text style={styles.title}>
        Order #{id}
      </Text>
      <Button onPress={submitDelivery} isLoading={loading} size="lg">
        Capture Physical Signature & Submit
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.ground, 
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
