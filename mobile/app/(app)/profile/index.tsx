import React from 'react';
import { View, Text, StyleSheet, ScrollView, I18nManager } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { Colors, Spacing, Radius } from '../../../constants/theme';
import { Card, CardTitle, CardDescription } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Feather } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
// import { useTranslation } from 'react-i18next'; // Used when i18n is wired up

export default function ProfileSettings() {
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get('/auth/profile').then(res => res.data),
  });

  const handleSignOut = async () => {
    await SecureStore.deleteItemAsync('jwt_token');
    // For robust architecture we'd hook into Zustand authStore, but for routing reset:
    router.replace('/(auth)/login');
  };

  const toggleLanguage = () => {
    const isCurrentlyRTL = I18nManager.isRTL;
    I18nManager.forceRTL(!isCurrentlyRTL);
    // Real implementation requires Expo Updates restart:
    alert('Please restart the app to apply language changes.');
  };

  const user = data || {};

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.card}>
        <View style={styles.avatar}>
          <Feather name="user" size={32} color={Colors.amber} />
        </View>
        <Text style={styles.name}>{user.fullName || user.email || 'Loading...'}</Text>
        <Text style={styles.role}>{user.role || 'GUEST'}</Text>
      </Card>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <Card style={styles.cardRow}>
          <View style={styles.row}>
            <Feather name="globe" size={20} color={Colors.text2} style={{marginRight: Spacing.md}} />
            <Text style={styles.rowText}>Language</Text>
            <Button size="sm" variant="outline" onPress={toggleLanguage}>
              {I18nManager.isRTL ? 'English' : 'عربي'}
            </Button>
          </View>
        </Card>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sync & Offline</Text>
        <Card style={styles.cardRow}>
          <View style={styles.row}>
            <Feather name="cloud-off" size={20} color={Colors.text2} style={{marginRight: Spacing.md}} />
            <Text style={styles.rowText}>Sync Status</Text>
            <Text style={{color: Colors.successText, fontFamily: 'Geist'}}>Up to date</Text>
          </View>
        </Card>
      </View>

      <Button onPress={handleSignOut} variant="danger" size="lg" style={styles.logoutBtn}>
        Sign Out
      </Button>
      
      <Text style={styles.version}>App Version 1.0.0</Text>
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
    gap: Spacing.xl,
  },
  card: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  name: {
    fontFamily: 'DMSerifDisplay',
    fontSize: 24,
    color: Colors.text1,
    marginBottom: 4,
  },
  role: {
    fontFamily: 'GeistMono',
    fontSize: 14,
    color: Colors.amber,
  },
  section: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontFamily: 'Geist',
    fontWeight: '600',
    color: Colors.text2,
    textTransform: 'uppercase',
    fontSize: 12,
    letterSpacing: 1,
    marginLeft: Spacing.xs,
  },
  cardRow: {
    padding: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowText: {
    flex: 1,
    fontFamily: 'Geist',
    color: Colors.text1,
    fontSize: 16,
  },
  logoutBtn: {
    marginTop: Spacing.lg,
  },
  version: {
    fontFamily: 'GeistMono',
    color: Colors.text3,
    fontSize: 12,
    textAlign: 'center',
    marginTop: Spacing.md,
  }
});
