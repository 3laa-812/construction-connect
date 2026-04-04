import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/theme';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export default function RegisterScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = () => {
    alert('Registration integration will be tied to the final Phase 3 Production specs.');
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: Colors.ground }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 64, gap: 16 }}>
        <Text style={{ fontFamily: 'DMSerifDisplay', color: Colors.text1, fontSize: 32, marginBottom: 8 }}>
          Create Profile
        </Text>
        
        <Input 
          label="Full Name"
          value={name}
          onChangeText={setName}
          placeholder="Jane Doe"
        />

        <Input 
          label="Business Email"
          value={email}
          onChangeText={setEmail}
          placeholder="jane@company.com"
          keyboardType="email-address"
        />

        <Input 
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
        />

        <Button onPress={handleRegister} size="lg" style={{ marginTop: 16 }}>
          Register Account
        </Button>

        <Button variant="ghost" onPress={() => router.push('/login')} style={{ marginTop: 8 }}>
          Already have an account? Sign in
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
