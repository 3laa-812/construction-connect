import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Colors, Fonts } from '../../constants/theme';
import { AmberGlow, Glass } from '../../constants/glass';
import { GlassView } from '../../components/ui/GlassView';
import { ScreenBackground } from '../../components/ui/ScreenBackground';
import * as Notifications from 'expo-notifications';
import { useAuthStore } from '../../store/authStore';
import { setToken } from '../../lib/auth';
import { api } from '../../lib/api';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const { login } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data } = await api.post('/auth/login', { email, password });
      
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
      setError(err.response?.data?.message || 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenBackground>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          
          {/* Logo Area (Top 35%) */}
          <View style={styles.logoArea}>
            <View style={styles.appIconWrapper}>
              <Ionicons name="construct" size={32} color={Colors.amber} />
            </View>
            <Text style={styles.title}>Construction Connect</Text>
            <Text style={styles.tagline}>Intelligent Project Management</Text>
          </View>

          {/* Form Area (Middle 40%) */}
          <GlassView variant="card" style={styles.formContainer}>
            <View style={{ gap: 16 }}>
              <Input
                label="Email Address"
                placeholder="your@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                // @ts-ignore (Assuming leftIcon will be added or we manually handle it)
                leftIcon={<Ionicons name="mail-outline" size={20} color={Colors.text3} />}
                style={Glass.input}
              />
              
              <Input
                label="Password"
                placeholder="••••••••"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                error={error || undefined}
                // @ts-ignore
                leftIcon={<Ionicons name="lock-closed-outline" size={20} color={Colors.text3} />}
                style={Glass.input}
              />

              <View style={[styles.glowWrapper, Platform.OS === 'ios' ? AmberGlow.soft : undefined]}>
                <Button onPress={handleLogin} isLoading={loading} size="lg" style={{ width: '100%', marginTop: 8 }}>
                  Sign In
                </Button>
              </View>
            </View>
          </GlassView>

          {/* Bottom 25% */}
          <View style={styles.bottomArea}>
            <Text style={styles.noAccountText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.registerLink}>Register</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: 48,
  },
  appIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: 28,
    color: Colors.text1,
    textAlign: 'center',
  },
  tagline: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.text2,
    marginTop: 4,
    textAlign: 'center',
  },
  formContainer: {
    padding: 24,
    borderRadius: 16,
  },
  glowWrapper: {
    width: '100%',
  },
  bottomArea: {
    marginTop: 48,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noAccountText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.text2,
  },
  registerLink: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.amber,
    fontWeight: '600',
  }
});
