import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Radius } from '../../constants/theme';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { api } from '../../lib/api';

export default function RegisterScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState<'contractor' | 'supplier'>('contractor');
  const [crNumber, setCrNumber] = useState('');
  const [taxId, setTaxId] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!email || !password || !fullName || !companyName) {
      setError('Please fill out all required fields.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data } = await api.post('/auth/register', {
        email,
        password,
        fullName,
        phone,
        companyName,
        role,
        crNumber,
        taxId,
      });

      // Navigate to OTP verification screen passing the userId
      router.push({
        pathname: '/(auth)/verify-otp',
        params: { userId: data.id || data.userId || email },
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to register account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: Colors.ground }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 64, gap: 16 }}>
        <Text style={{ fontFamily: 'DMSerifDisplay', color: Colors.text1, fontSize: 32, marginBottom: 8 }}>
          Create Profile
        </Text>
        
        {error && (
          <View style={{ backgroundColor: Colors.error + '20', padding: 12, borderRadius: Radius.sm, marginBottom: 8 }}>
            <Text style={{ color: Colors.error, fontFamily: 'Geist', fontSize: 14 }}>{error}</Text>
          </View>
        )}

        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 8 }}>
          {(['contractor', 'supplier'] as const).map((r) => (
            <TouchableOpacity
              key={r}
              onPress={() => setRole(r)}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: Radius.md,
                borderWidth: 1,
                borderColor: role === r ? Colors.amber : Colors.border,
                backgroundColor: role === r ? Colors.amber + '10' : Colors.surface2,
                alignItems: 'center',
              }}
            >
              <Text style={{ 
                fontFamily: 'Geist', 
                color: role === r ? Colors.amber : Colors.text2,
                textTransform: 'capitalize' 
              }}>
                {r}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Input 
          label="Full Name *"
          value={fullName}
          onChangeText={setFullName}
          placeholder="Jane Doe"
        />

        <Input 
          label="Business Email *"
          value={email}
          onChangeText={setEmail}
          placeholder="jane@company.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Input 
          label="Password *"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
        />

        <Input 
          label="Phone Number"
          value={phone}
          onChangeText={setPhone}
          placeholder="+1234567890"
          keyboardType="phone-pad"
        />

        <View style={{ height: 1, backgroundColor: Colors.border, marginVertical: 8 }} />

        <Text style={{ fontFamily: 'Geist', color: Colors.text1, fontSize: 18, marginBottom: 4 }}>
          Company Details
        </Text>

        <Input 
          label="Company Name *"
          value={companyName}
          onChangeText={setCompanyName}
          placeholder="Acme Construction"
        />

        <Input 
          label="Commercial Registration Number"
          value={crNumber}
          onChangeText={setCrNumber}
          placeholder="CR-123456"
        />

        <Input 
          label="Tax ID"
          value={taxId}
          onChangeText={setTaxId}
          placeholder="TAX-123456"
        />

        <Button onPress={handleRegister} isLoading={loading} size="lg" style={{ marginTop: 16 }}>
          Register Account
        </Button>

        <Button variant="ghost" onPress={() => router.push('/login')} style={{ marginTop: 8, marginBottom: 40 }}>
          Already have an account? Sign in
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
