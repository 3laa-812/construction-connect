import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '../../../../../components/ui/Button';
import { Colors } from '../../../../../constants/theme';
import * as WebBrowser from 'expo-web-browser';
import { ScreenBackground } from '../../../../../components/ui/ScreenBackground';
import { api } from '../../../../../lib/api';

export default function InvoiceDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const handleViewPDF = async () => {
    const url = `${api.defaults.baseURL}/invoices/${id}/pdf`;
    await WebBrowser.openBrowserAsync(url);
  };

  return (
    <ScreenBackground style={{ padding: 16, justifyContent: 'center' }}>
      <Text style={{ color: Colors.text2, fontSize: 16, fontFamily: 'Geist', textAlign: 'center', marginBottom: 4 }}>
        Invoice Details
      </Text>
      <Text style={{ color: Colors.text1, fontSize: 24, marginBottom: 32, fontFamily: 'DMSerifDisplay', textAlign: 'center' }}>
        Invoice #{id}
      </Text>
      <Button onPress={handleViewPDF} size="lg">
        View PDF
      </Button>
      <Button variant="ghost" onPress={() => router.back()} style={{ marginTop: 16 }}>
        Close
      </Button>
    </ScreenBackground>
  );
}
