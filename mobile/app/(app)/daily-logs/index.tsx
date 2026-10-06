import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import { Colors, Fonts } from '../../../constants/theme';
import { GlassView } from '../../../components/ui/GlassView';
import { ScreenBackground } from '../../../components/ui/ScreenBackground';
import { Badge } from '../../../components/ui/Badge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AmberGlow } from '../../../constants/glass';
import { format } from 'date-fns';
import { api } from '../../../lib/api';
import { unwrapList } from '../../../lib/apiMappers';

function LogList({ logs }: { logs: any[] }) {
  const router = useRouter();

  const renderItem = ({ item }: { item: any }) => {
    const rawDate = item.log_date ?? item.logDate;
    const dateStr = rawDate ? format(new Date(rawDate), 'MMM dd, yyyy') : '--';
    
    // Determine badge variant
    let badgeVariant: 'default' | 'success' | 'warning' | 'error' = 'default';
    if (item.status === 'SYNCED' || item.status === 'SUBMITTED') badgeVariant = 'success';
    if (item.status === 'DRAFT') badgeVariant = 'warning';

    return (
      <TouchableOpacity 
        activeOpacity={0.8}
        // onPress={() => router.push(`/daily-logs/${item.id}`)}
      >
        <GlassView variant="card" style={styles.logCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{dateStr}</Text>
            <Badge variant={badgeVariant}>
              {item.status || 'DRAFT'}
            </Badge>
          </View>
          
          <View style={styles.cardFooter}>
            <View style={styles.footerItem}>
              <Ionicons name="location-outline" size={14} color={Colors.text3} />
              <Text style={styles.footerItemText}>{item.project?.name || 'Project'}</Text>
            </View>
          </View>
        </GlassView>
      </TouchableOpacity>
    );
  };

  const TypedFlashList = FlashList as any;

  return (
    <TypedFlashList
      estimatedItemSize={100}
      data={logs}
      keyExtractor={(item: any) => item.id || Math.random().toString()}
      contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 100 }}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      renderItem={renderItem}
      ListEmptyComponent={() => (
        <EmptyState 
           icon="clipboard-outline"
           title="No Daily Logs"
           subtitle="Your daily logs will appear here. Tap the + button to create a new draft."
           actionLabel="Create Log"
           onAction={() => router.push('/daily-logs/new' as any)}
        />
      )}
    />
  );
}

export default function DailyLogsScreen() {
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: ['daily-logs'],
    queryFn: () => api.get('/daily-logs').then((res) => res.data),
  });
  const logs = unwrapList(data);
  
  return (
    <ScreenBackground>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Daily Logs</Text>
      </View>

      {/* List */}
      {isLoading ? (
        <View style={{ paddingHorizontal: 24, marginTop: 20 }}>
          <Text style={{ color: Colors.text2, fontFamily: Fonts.body }}>Loading logs...</Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <LogList logs={logs} />
        </View>
      )}

      {/* FAB */}
      <TouchableOpacity 
        style={[styles.fab, AmberGlow.strong]} 
        activeOpacity={0.8}
        onPress={() => router.push('/daily-logs/new' as any)}
      >
        <Ionicons name="add" size={28} color={Colors.ground} />
      </TouchableOpacity>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 24,
    paddingTop: 64,
    marginBottom: 8,
  },
  headerTitle: {
    fontFamily: Fonts.display,
    fontSize: 26,
    color: Colors.text1,
  },
  logCard: {
    padding: 16,
    borderRadius: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontFamily: Fonts.display,
    fontSize: 18,
    color: Colors.text1,
    flex: 1,
    marginRight: 12,
  },
  cardFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerItemText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.text2,
  },
  fab: {
    position: 'absolute',
    bottom: 84, // Above tab bar
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.amber,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
