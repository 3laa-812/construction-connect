import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Colors } from '../../constants/theme';
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
      
      router.replace('/(app)');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: Colors.ground }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
        <View style={{ marginBottom: 48 }}>
          <Text style={{ fontFamily: 'DMSerifDisplay', fontSize: 32, color: Colors.text1, marginBottom: 8 }}>
            Welcome Back
          </Text>
          <Text style={{ fontFamily: 'Geist', fontSize: 16, color: Colors.text2 }}>
            Sign in to Construction Connect
          </Text>
        </View>

        <Input
          label="Email Address"
          placeholder="your@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        
        <Input
          label="Password"
          placeholder="••••••••"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          error={error || undefined}
        />

        <View style={{ marginTop: 24, gap: 16 }}>
          <Button onPress={handleLogin} isLoading={loading} size="lg">
            Sign In
          </Button>
          
          <Button variant="ghost" onPress={() => console.warn('Not implemented')}>
            Don't have an account? Register
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
