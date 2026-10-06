import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import { Colors, Fonts } from '../../../../constants/theme';
import { GlassView } from '../../../../components/ui/GlassView';
import { ProgressBar } from '../../../../components/ui/ProgressBar';
import { ScreenBackground } from '../../../../components/ui/ScreenBackground';
import { Badge } from '../../../../components/ui/Badge';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AmberGlow } from '../../../../constants/glass';
import { format } from 'date-fns';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { api } from '../../../../lib/api';
import { mapProject, unwrapList } from '../../../../lib/apiMappers';

function ProjectList({ projects }: { projects: ReturnType<typeof mapProject>[] }) {
  const router = useRouter();

  const renderItem = ({ item }: { item: ReturnType<typeof mapProject> }) => {
    const overall = item.ordersCount > 0 ? Math.min(100, Math.round((item.ordersCount / (item.ordersCount + 5)) * 100)) : 0;
    
    return (
      <TouchableOpacity 
        activeOpacity={0.8}
        onPress={() => router.push(`/work/projects/${item.id}`)}
      >
        <GlassView variant="card" style={styles.projectCard}>
          {/* Header Row */}
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
            <Badge variant={item.status === 'ACTIVE' ? 'success' : 'default'}>
              {item.status}
            </Badge>
          </View>

          {/* Progress Section */}
          <View style={styles.progressSection}>
            <ProgressBar value={overall} variant="default" size="md" />
            <View style={styles.progressRow}>
              <Text style={styles.progressTextLeft}>{overall}% complete</Text>
              <Text style={styles.progressTextRight}>{item.sitesCount} sites</Text>
            </View>
          </View>

          {/* Footer Row */}
          <View style={styles.cardFooter}>
            <View style={styles.footerItem}>
              <Ionicons name="card-outline" size={10} color={Colors.text3} />
              <Text style={styles.footerItemText}>{item.budget ? `$${item.budget.toLocaleString()}` : '--'}</Text>
            </View>
            <View style={styles.footerItem}>
              <Ionicons name="cube-outline" size={10} color={Colors.text3} />
              <Text style={styles.footerItemText}>{item.ordersCount} orders</Text>
            </View>
            <View style={styles.footerItem}>
              <Ionicons name="calendar-outline" size={10} color={Colors.text3} />
              <Text style={styles.footerItemText}>{item.endDate ? format(new Date(item.endDate), 'MMM dd, yyyy') : '--'}</Text>
            </View>
          </View>
        </GlassView>
      </TouchableOpacity>
    );
  };

  const TypedFlashList = FlashList as any;

  return (
    <TypedFlashList
      estimatedItemSize={180}
      data={projects}
      keyExtractor={(item: any) => item.id}
      contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 100 }}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      renderItem={renderItem}
      ListEmptyComponent={() => (
        <EmptyState 
           icon="construct-outline"
           title="No Projects Found"
           subtitle="Your projects will appear here once they are synced from the cloud"
           actionLabel="Sync Now"
           onAction={() => {/* Trigger manual sync if needed */}}
        />
      )}
    />
  );
}

export default function ProjectsScreen() {
  const [filter, setFilter] = useState('All');
  const { data, isLoading } = useQuery({
    queryKey: ['projects', 'work-list'],
    queryFn: () => api.get('/projects').then((res) => res.data),
  });
  const projects = unwrapList(data).map(mapProject);
  const filteredProjects = projects.filter((p) => {
    if (filter === 'All') return true;
    if (filter === 'Active') return p.status === 'ACTIVE';
    if (filter === 'On Hold') return p.status === 'ON_HOLD';
    if (filter === 'Completed') return p.status === 'COMPLETED';
    return true;
  });
  
  const filters = ['All', 'Active', 'On Hold', 'Completed'];

  return (
    <ScreenBackground>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Projects</Text>
      </View>

      {/* Search Bar */}
      <View style={{ paddingHorizontal: 24 }}>
        <GlassView variant="input" style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color={Colors.text3} style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search projects..."
            placeholderTextColor={Colors.text3}
            style={styles.searchInput}
          />
        </GlassView>
      </View>

      {/* Filter Chips */}
      <View style={{ marginTop: 8, height: 44 }}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {filters.map(f => {
            const isActive = filter === f;
            return (
              <TouchableOpacity
                key={f}
                onPress={() => setFilter(f)}
                style={[
                  styles.filterChip,
                  isActive && styles.filterChipActive
                ]}
              >
                <Text style={[
                  styles.filterChipText,
                  isActive && { color: Colors.amber }
                ]}>{f}</Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      {/* Project Cards */}
      {isLoading ? (
        <View style={{ paddingHorizontal: 24, marginTop: 20 }}>
          <Text style={{ color: Colors.text2, fontFamily: Fonts.body }}>Loading projects...</Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <ProjectList projects={filteredProjects} />
        </View>
      )}

      {/* FAB */}
      <TouchableOpacity 
        style={[styles.fab, AmberGlow.strong]} 
        activeOpacity={0.8}
        // onPress={() => router.push('/work/projects/new')}
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
    marginBottom: 16,
  },
  headerTitle: {
    fontFamily: Fonts.display,
    fontSize: 26,
    color: Colors.text1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 16,
    height: 48,
  },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.text1,
    height: '100%',
  },
  filterScroll: {
    paddingHorizontal: 24,
    gap: 8,
    alignItems: 'center',
  },
  filterChip: {
    height: 28,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: 'rgba(212,146,10,0.1)',
    borderColor: 'rgba(212,146,10,0.4)',
  },
  filterChipText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.text2,
  },
  projectCard: {
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
  progressSection: {
    marginTop: 12,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressTextLeft: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.text2,
  },
  progressTextRight: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.text3,
  },
  cardFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerItemText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.text2,
  },
  fab: {
    position: 'absolute',
    bottom: 84, // above tab bar
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.amber,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
