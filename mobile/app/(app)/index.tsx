import React from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { useSyncStore } from '../../store/syncStore';
import { Colors, Fonts, Radius } from '../../constants/theme';
import { AmberGlow } from '../../constants/glass';
import { useSync } from '../../hooks/useSync';
import { ScreenBackground } from '../../components/ui/ScreenBackground';
import { GlassView } from '../../components/ui/GlassView';
import { ProgressBar } from '../../components/ui/ProgressBar';

export default function Dashboard() {
  const { user } = useAuthStore();
  const { isSyncing, lastSyncAt } = useSyncStore();
  const router = useRouter();
  
  useSync();

  const isContractor = user?.role === 'CONTRACTOR';

  // React Query Parallel Loads for summary info
  const { data: projects, isLoading: projectsLoading, refetch: refetchProjects } = useQuery({
    queryKey: ['projects', 'recent'],
    queryFn: () => api.get('/projects?limit=5').then(res => res.data),
    enabled: isContractor
  });

  const { data: orders, isLoading: ordersLoading, refetch: refetchOrders } = useQuery({
    queryKey: ['purchase-orders', 'recent'],
    queryFn: () => api.get('/purchase-orders?limit=5').then(res => res.data),
  });

  const { data: notifications, isLoading: notificationsLoading, refetch: refetchNotifications } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => api.get('/notifications?unread=true').then(res => res.data),
  });

  const onRefresh = async () => {
    isContractor && refetchProjects();
    refetchOrders();
    refetchNotifications();
  };

  const isLoading = projectsLoading || ordersLoading || notificationsLoading;

  const today = format(new Date(), 'EEEE, MMM do');
  const syncColor = isSyncing ? Colors.amber : (lastSyncAt ? Colors.success : Colors.text3);

  return (
    <ScreenBackground>
      <ScrollView 
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={Colors.amber} />}
      >
        {/* Header Inline */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning, {user?.name?.split(' ')[0] || 'User'}</Text>
            <Text style={styles.dateText}>{today}</Text>
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={[styles.syncDot, { backgroundColor: syncColor }]} />
            <TouchableOpacity onPress={() => router.push('/notifications')} style={styles.bellButton}>
              <Ionicons name="notifications-outline" size={24} color={Colors.text1} />
              {(notifications?.total || 0) > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{notifications?.total > 9 ? '9+' : notifications?.total}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Stat Cards Row */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsScrollContainer}
          snapToInterval={168} // 160 + 8 gap
          decelerationRate="fast"
        >
          {/* Projects Card */}
          <GlassView variant="card" style={styles.statCard}>
            <Text style={styles.statLabel}>{isContractor ? 'Projects' : 'Revenue'}</Text>
            <Text style={styles.statValue}>{projects?.total || 0}</Text>
            {isContractor && (
              <View style={styles.statBottomRadial}>
                <ProgressBar value={72} variant="radial" animated={true} /> 
                <Text style={styles.statDetailText}>avg progress</Text>
              </View>
            )}
          </GlassView>

          {/* RFQs Card */}
          <GlassView variant="card" style={styles.statCard}>
            <Text style={styles.statLabel}>Open RFQs</Text>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statTrendText}>+3 this week</Text>
          </GlassView>

          {/* Orders Card */}
          <GlassView variant="card" style={styles.statCard}>
            <Text style={styles.statLabel}>Orders</Text>
            <Text style={styles.statValue}>{orders?.total || 0}</Text>
            <View style={{ flexDirection: 'row', gap: 4, marginTop: 4 }}>
              <View style={styles.miniPillPending}><Text style={styles.miniPillTextAmber}>2 pending</Text></View>
              <View style={styles.miniPillDone}><Text style={styles.miniPillTextGreen}>2 done</Text></View>
            </View>
          </GlassView>

          {/* Alerts Card */}
          <GlassView variant="card" style={styles.statCard}>
            <Text style={styles.statLabel}>Alerts</Text>
            <Text style={styles.statValue}>{notifications?.total || 0}</Text>
            <Text style={styles.statAlertText}>2 unread</Text>
          </GlassView>
        </ScrollView>

        {/* Quick Action CTA */}
        {isContractor ? (
          <TouchableOpacity onPress={() => router.push('/work/daily-logs/new' as any)}>
            <GlassView variant="card" style={styles.quickActionCard}>
              <Text style={styles.quickActionTop}>Today's Action</Text>
              <View style={{ marginTop: 8 }}>
                <Ionicons name="clipboard" size={28} color={Colors.amber} style={{ marginBottom: 6 }} />
                <Text style={styles.quickActionTitle}>Log Site Activity</Text>
                <Text style={styles.quickActionSub}>Tap to start daily report</Text>
              </View>
              <View style={styles.quickActionButton}>
                <Text style={styles.quickActionBtnText}>Start Log →</Text>
              </View>
            </GlassView>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => router.push('/commerce' as any)}>
            <GlassView variant="card" style={styles.quickActionCard}>
              <Text style={styles.quickActionTop}>Today's Action</Text>
              <View style={{ marginTop: 8 }}>
                <Ionicons name="storefront" size={28} color={Colors.amber} style={{ marginBottom: 6 }} />
                <Text style={styles.quickActionTitle}>Browse New RFQs</Text>
                <Text style={styles.quickActionSub}>Discover matching requests</Text>
              </View>
              <View style={styles.quickActionButton}>
                <Text style={styles.quickActionBtnText}>View Board →</Text>
              </View>
            </GlassView>
          </TouchableOpacity>
        )}

        {/* Active Projects Section */}
        {isContractor && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active Projects</Text>
              <TouchableOpacity onPress={() => router.push('/work' as any)}>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>
            <View style={{ gap: 12 }}>
              {projects?.data?.slice(0, 3).map((p: any) => (
                <GlassView key={p.id} variant="card" style={{ padding: 16 }}>
                  <Text style={{ fontFamily: Fonts.body, color: Colors.text1, fontSize: 16 }}>{p.name}</Text>
                  <Text style={{ fontFamily: Fonts.mono, color: Colors.text3, fontSize: 12, marginTop: 4 }}>{p.location}</Text>
                </GlassView>
              ))}
              {(!projects?.data || projects.data.length === 0) && (
                <Text style={{ fontFamily: Fonts.body, color: Colors.text3, fontSize: 14 }}>No active projects.</Text>
              )}
            </View>
          </View>
        )}

        {/* Recent Activity Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
          </View>
          <View style={{ gap: 12 }}>
            <GlassView variant="card" style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="document-text" size={20} color={Colors.text2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: Fonts.body, color: Colors.text1, fontSize: 14 }}>Daily Log Submitted</Text>
                <Text style={{ fontFamily: Fonts.body, color: Colors.text3, fontSize: 12 }}>Project Alpha • 2h ago</Text>
              </View>
            </GlassView>
          </View>
        </View>

      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 64,
    marginBottom: 24,
  },
  greeting: {
    fontFamily: Fonts.display,
    fontSize: 22,
    color: Colors.text1,
  },
  dateText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.text2,
    marginTop: 2,
  },
  syncDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  bellButton: {
    position: 'relative',
    padding: 4,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Colors.error,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.ground,
  },
  badgeText: {
    fontFamily: Fonts.body,
    fontWeight: 'bold',
    fontSize: 9,
    color: Colors.text1,
  },
  statsScrollContainer: {
    paddingHorizontal: 24,
    gap: 8,
    marginBottom: 24,
  },
  statCard: {
    width: 160,
    height: 140, // increased for space
    padding: 14,
    justifyContent: 'center'
  },
  statLabel: {
    fontFamily: Fonts.body,
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: Colors.text3,
    marginBottom: 8,
  },
  statValue: {
    fontFamily: Fonts.display,
    fontSize: 28,
    color: Colors.text1,
    marginBottom: 12,
  },
  statTrendText: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.text2,
  },
  statAlertText: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.errorText,
  },
  statBottomRadial: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statDetailText: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: Colors.text2,
    flexShrink: 1,
  },
  miniPillPending: {
    backgroundColor: 'rgba(212,146,10,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(212,146,10,0.3)',
    borderRadius: 999,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  miniPillDone: {
    backgroundColor: 'rgba(58,125,68,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(58,125,68,0.3)',
    borderRadius: 999,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  miniPillTextAmber: { color: Colors.amber, fontSize: 9, fontFamily: Fonts.body },
  miniPillTextGreen: { color: Colors.successText, fontSize: 9, fontFamily: Fonts.body },
  quickActionCard: {
    marginHorizontal: 24,
    padding: 16,
    backgroundColor: 'rgba(212, 146, 10, 0.06)',
    borderColor: 'rgba(212, 146, 10, 0.25)',
    borderWidth: 1,
  },
  quickActionTop: {
    fontFamily: Fonts.body,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: Colors.text3,
  },
  quickActionTitle: {
    fontFamily: Fonts.display,
    fontSize: 18,
    color: Colors.text1,
    marginBottom: 4,
  },
  quickActionSub: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.text2,
  },
  quickActionButton: {
    marginTop: 16,
    backgroundColor: Colors.amber,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  quickActionBtnText: {
    fontFamily: Fonts.body,
    fontWeight: '600',
    fontSize: 14,
    color: Colors.ground,
  },
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: Fonts.display,
    fontSize: 20,
    color: Colors.text1,
  },
  seeAllText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.amber,
  }
});
