import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, I18nManager, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../../lib/api';
import { Colors, Fonts, Radius, Spacing } from '../../../constants/theme';
import { Glass, AmberGlow } from '../../../constants/glass';
import { GlassView } from '../../../components/ui/GlassView';
import { ScreenBackground } from '../../../components/ui/ScreenBackground';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { useAuthStore } from '../../../store/authStore';
import { clearToken } from '../../../lib/auth';
import { useSyncStore } from '../../../store/syncStore';

export default function ProfileScreen() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const { lastSyncAt, pendingCount, isSyncing } = useSyncStore();

  const { data: profile, isLoading, refetch } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get('/auth/profile').then(res => res.data),
  });

  const handleSignOut = async () => {
    // In a real app, show confirmation bottom sheet first
    await clearToken();
    logout(); // Clear Zustand store
    router.replace('/(auth)/login');
  };

  const toggleLanguage = () => {
    const isCurrentlyRTL = I18nManager.isRTL;
    I18nManager.forceRTL(!isCurrentlyRTL);
    // Real implementation requires Expo Updates restart:
    alert('Please restart the app to apply language changes.');
  };

  const user = profile?.user || profile || {};

  return (
    <ScreenBackground>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatarRing, AmberGlow.soft]}>
            <View style={styles.avatarInner}>
              {user.avatarUrl ? (
                // Image here
                <Ionicons name="person" size={40} color={Colors.amber} />
              ) : (
                <Text style={styles.avatarInitials}>
                  {(user.name || user.fullName)
                    ? String(user.name || user.fullName).split(' ').map((n: string) => n[0]).join('').toUpperCase()
                    : '--'}
                </Text>
              )}
            </View>
          </View>
          <Text style={styles.userName}>{user.name || user.fullName || 'User'}</Text>
          <View style={styles.badgeRow}>
            <Badge variant="default">{user.role || 'CONTRACTOR'}</Badge>
            <View style={styles.kybBadge}>
               <Ionicons name="checkmark-circle" size={12} color={Colors.success} />
               <Text style={styles.kybText}>Verified</Text>
            </View>
          </View>
          <Text style={styles.companyName}>{user.company?.name || user.companyName || 'No company'}</Text>
        </View>

        {/* Sync Status Card */}
        <GlassView variant="card" style={styles.syncCard}>
          <View style={styles.syncHeader}>
            <View style={styles.syncTitleRow}>
              <Ionicons name="sync-outline" size={20} color={Colors.amber} />
              <Text style={styles.syncTitle}>Sync Status</Text>
            </View>
            <Button variant="secondary" size="sm" onPress={() => refetch()}>
              Sync Now
            </Button>
          </View>
          <View style={styles.syncInfoRow}>
            <Text style={styles.syncTimestamp}>
              {lastSyncAt ? `Last synced: ${new Date(lastSyncAt).toLocaleTimeString()}` : 'Not synced yet'}
            </Text>
            <View style={styles.syncStatusIndicator}>
              <View style={[styles.statusDot, { backgroundColor: isSyncing ? Colors.amber : pendingCount > 0 ? Colors.text3 : Colors.success }]} />
              <Text style={styles.statusText}>
                {isSyncing ? 'Syncing…' : pendingCount > 0 ? `${pendingCount} pending` : 'All synced'}
              </Text>
            </View>
          </View>
        </GlassView>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>PREFERENCES</Text>
          <GlassView variant="card" style={styles.settingsGroup}>
            <TouchableOpacity style={styles.settingRow} onPress={toggleLanguage}>
              <View style={styles.settingLabelCol}>
                <Ionicons name="globe-outline" size={20} color={Colors.text2} />
                <Text style={styles.settingLabel}>Language</Text>
              </View>
              <View style={styles.languageToggle}>
                <Text style={[styles.langText, !I18nManager.isRTL && styles.langActive]}>EN</Text>
                <View style={styles.langDivider} />
                <Text style={[styles.langText, I18nManager.isRTL && styles.langActive]}>AR</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.settingRow}>
              <View style={styles.settingLabelCol}>
                <Ionicons name="notifications-outline" size={20} color={Colors.text2} />
                <Text style={styles.settingLabel}>Notifications</Text>
              </View>
              <Switch 
                value={notificationsEnabled} 
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: Colors.surface2, true: Colors.amber + '40' }}
                thumbColor={notificationsEnabled ? Colors.amber : Colors.text3}
              />
            </View>
          </GlassView>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>ACCOUNT</Text>
          <GlassView variant="card" style={styles.settingsGroup}>
            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.settingLabelCol}>
                <Ionicons name="business-outline" size={20} color={Colors.text2} />
                <Text style={styles.settingLabel}>Company Profile</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.text3} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.settingLabelCol}>
                <Ionicons name="lock-closed-outline" size={20} color={Colors.text2} />
                <Text style={styles.settingLabel}>Security & Password</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.text3} />
            </TouchableOpacity>
          </GlassView>
        </View>

        {/* App Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>APP</Text>
          <GlassView variant="card" style={styles.settingsGroup}>
            <TouchableOpacity style={styles.settingRow}>
               <View style={styles.settingLabelCol}>
                <Ionicons name="help-circle-outline" size={20} color={Colors.text2} />
                <Text style={styles.settingLabel}>Help & Support</Text>
              </View>
              <Ionicons name="open-outline" size={16} color={Colors.text3} />
            </TouchableOpacity>
            
            <View style={styles.settingRowNoBorder}>
              <View style={styles.settingLabelCol}>
                <Ionicons name="information-circle-outline" size={20} color={Colors.text2} />
                <Text style={styles.settingLabel}>Version</Text>
              </View>
              <Text style={styles.versionText}>1.0.0 (Gold)</Text>
            </View>
          </GlassView>
        </View>

        {/* Sign Out */}
        <Button 
          variant="danger" 
          size="lg" 
          onPress={handleSignOut}
          style={styles.signOutBtn}
        >
          Sign Out
        </Button>

      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 100,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: Colors.amber,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.ground,
  },
  avatarInitials: {
    fontFamily: Fonts.display,
    fontSize: 28,
    color: Colors.amber,
  },
  userName: {
    fontFamily: Fonts.display,
    fontSize: 22,
    color: Colors.text1,
    marginTop: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  kybBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(58,125,68,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  kybText: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.success,
    fontWeight: '600',
  },
  companyName: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.text2,
    marginTop: 6,
  },
  syncCard: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 32,
  },
  syncHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  syncTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  syncTitle: {
    fontFamily: Fonts.body,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text1,
  },
  syncInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  syncTimestamp: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.text3,
  },
  syncStatusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.success,
    fontWeight: '600',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeading: {
    fontFamily: Fonts.body,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text3,
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },
  settingsGroup: {
    borderRadius: 20,
    paddingHorizontal: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  settingRowNoBorder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  settingLabelCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.text1,
  },
  languageToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface2,
    padding: 2,
    borderRadius: 8,
  },
  langText: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    color: Colors.text3,
  },
  langActive: {
    backgroundColor: Colors.surface,
    color: Colors.amber,
    borderRadius: 6,
  },
  langDivider: {
    width: 1,
    height: 12,
    backgroundColor: Colors.border,
    marginHorizontal: 2,
  },
  versionText: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    color: Colors.text3,
  },
  signOutBtn: {
    marginTop: 16,
    marginBottom: 40,
  },
});
