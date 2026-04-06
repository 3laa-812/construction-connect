import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Radius } from '../../constants/theme';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { setToken } from '../../lib/auth';
import * as Notifications from 'expo-notifications';

export default function VerifyOtpScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const { login } = useAuthStore();
  
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!otp) {
      setError('Please enter the OTP code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Typically the API requires userId or email plus the OTP
      const { data } = await api.post('/auth/verify-otp', { userId, otp });
      
      await setToken(data.access_token);
      login(data.user, data.access_token);

      try {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status === 'granted') {
          const pushToken = (await Notifications.getExpoPushTokenAsync()).data;
          await api.patch('/users/push-token', { push_token: pushToken }, {
            headers: { Authorization: `Bearer ${data.access_token}` }
          });
        }
      } catch (pushErr) {
        console.warn('Push token registration failed', pushErr);
      }

      router.replace('/(app)');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid or expired OTP code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: Colors.ground }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 64, gap: 16 }}>
        <Text style={{ fontFamily: 'DMSerifDisplay', color: Colors.text1, fontSize: 32, marginBottom: 8 }}>
          Verify Email
        </Text>

        <Text style={{ fontFamily: 'Geist', fontSize: 16, color: Colors.text2, marginBottom: 16 }}>
          Please enter the One-Time Password sent to your email to verify your account.
        </Text>
        
        {error && (
          <View style={{ backgroundColor: Colors.error + '20', padding: 12, borderRadius: Radius.sm, marginBottom: 8 }}>
            <Text style={{ color: Colors.error, fontFamily: 'Geist', fontSize: 14 }}>{error}</Text>
          </View>
        )}

        <Input 
          label="Verification Code"
          value={otp}
          onChangeText={setOtp}
          placeholder="123456"
          keyboardType="number-pad"
          maxLength={6}
          autoFocus
        />

        <Button onPress={handleVerify} isLoading={loading} size="lg" style={{ marginTop: 16 }}>
          Verify and Sign In
        </Button>

        <Button variant="ghost" onPress={() => router.back()} style={{ marginTop: 8 }}>
          Back to Registration
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
