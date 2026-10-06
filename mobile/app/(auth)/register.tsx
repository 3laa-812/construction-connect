import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Fonts, Spacing } from '../../constants/theme';
import { Glass, AmberGlow } from '../../constants/glass';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { GlassView } from '../../components/ui/GlassView';
import { ScreenBackground } from '../../components/ui/ScreenBackground';
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
        role: role.toUpperCase(), // Backend usually expects uppercase
        crNumber,
        taxId,
      });

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
    <ScreenBackground>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer} 
          keyboardShouldPersistTaps="handled" 
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color={Colors.text1} />
            </TouchableOpacity>
            <Text style={styles.title}>Create Profile</Text>
            <Text style={styles.subtitle}>Join the Construction Connect network</Text>
          </View>

          {/* Role Switcher */}
          <View style={styles.roleContainer}>
            {(['contractor', 'supplier'] as const).map((r) => {
              const isActive = role === r;
              return (
                <TouchableOpacity
                  key={r}
                  onPress={() => setRole(r)}
                  style={[
                    styles.roleToggle,
                    isActive && styles.roleToggleActive
                  ]}
                >
                  <Text style={[
                    styles.roleToggleText,
                    isActive && { color: Colors.amber }
                  ]}>
                    {r}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          
          {error && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={16} color={Colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Form */}
          <GlassView variant="card" style={styles.formCard}>
            <Text style={styles.sectionTitle}>PERSONAL INFO</Text>
            <View style={{ gap: 16 }}>
              <Input 
                label="Full Name *"
                value={fullName}
                onChangeText={setFullName}
                placeholder="Jane Doe"
                leftIcon={<Ionicons name="person-outline" size={20} color={Colors.text3} />}
                style={Glass.input}
              />

              <Input 
                label="Business Email *"
                value={email}
                onChangeText={setEmail}
                placeholder="jane@company.com"
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon={<Ionicons name="mail-outline" size={20} color={Colors.text3} />}
                style={Glass.input}
              />

              <Input 
                label="Password *"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="••••••••"
                leftIcon={<Ionicons name="lock-closed-outline" size={20} color={Colors.text3} />}
                style={Glass.input}
              />

              <Input 
                label="Phone Number"
                value={phone}
                onChangeText={setPhone}
                placeholder="+20 123 456 789"
                keyboardType="phone-pad"
                leftIcon={<Ionicons name="call-outline" size={20} color={Colors.text3} />}
                style={Glass.input}
              />
            </View>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>COMPANY DETAILS</Text>
            <View style={{ gap: 16 }}>
              <Input 
                label="Company Name *"
                value={companyName}
                onChangeText={setCompanyName}
                placeholder="Acme Construction"
                leftIcon={<Ionicons name="business-outline" size={20} color={Colors.text3} />}
                style={Glass.input}
              />

              <Input 
                label="CR Number (Optional)"
                value={crNumber}
                onChangeText={setCrNumber}
                placeholder="CR-123456"
                leftIcon={<Ionicons name="document-text-outline" size={20} color={Colors.text3} />}
                style={Glass.input}
              />

              <Input 
                label="Tax ID (Optional)"
                value={taxId}
                onChangeText={setTaxId}
                placeholder="TAX-123456"
                leftIcon={<Ionicons name="barcode-outline" size={20} color={Colors.text3} />}
                style={Glass.input}
              />
            </View>

            <View style={[styles.buttonWrapper, Platform.OS === 'ios' ? AmberGlow.soft : undefined]}>
              <Button onPress={handleRegister} isLoading={loading} size="lg" style={{ width: '100%', marginTop: 16 }}>
                Register Account
              </Button>
            </View>
          </GlassView>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 48,
  },
  header: {
    marginBottom: 32,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginLeft: -8,
    marginBottom: 16,
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: 28,
    color: Colors.text1,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.text2,
    marginTop: 4,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  roleToggle: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
  },
  roleToggleActive: {
    borderColor: Colors.amber,
    backgroundColor: 'rgba(212,146,10,0.1)',
  },
  roleToggleText: {
    fontFamily: Fonts.body,
    fontWeight: '600',
    color: Colors.text2,
    textTransform: 'capitalize',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 12,
    borderRadius: Radius.sm,
    marginBottom: 24,
  },
  errorText: {
    flex: 1,
    color: Colors.error,
    fontFamily: Fonts.body,
    fontSize: 13,
  },
  formCard: {
    padding: 20,
    borderRadius: 20,
  },
  sectionTitle: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text3,
    letterSpacing: 1,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 24,
    opacity: 0.5,
  },
  buttonWrapper: {
    width: '100%',
  },
  footer: {
    marginTop: 32,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.text2,
  },
  loginLink: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.amber,
    fontWeight: '600',
  },
});
