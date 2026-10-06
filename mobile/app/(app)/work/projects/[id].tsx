import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Radius } from '../../../../constants/theme';
import { Glass, AmberGlow } from '../../../../constants/glass';
import { ScreenBackground } from '../../../../components/ui/ScreenBackground';
import { GlassView } from '../../../../components/ui/GlassView';
import { ProgressBar } from '../../../../components/ui/ProgressBar';
import { Badge } from '../../../../components/ui/Badge';
import { ProjectProgressCard } from '../../../../components/progress/ProjectProgressCard';
import { api } from '../../../../lib/api';

export default function ProjectDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => api.get(`/projects/${id}`).then((res) => res.data),
    enabled: Boolean(id),
  });
  const project = data ?? {};
  const purchaseOrders = Array.isArray(project.purchase_orders) ? project.purchase_orders : [];
  const rfqs = Array.isArray(project.rfqs) ? project.rfqs : [];
  const completedOrders = purchaseOrders.filter((po: any) => ['COMPLETED', 'DELIVERED'].includes(po.status)).length;
  const projectProgressInput = {
    budgetSpent: purchaseOrders.reduce((sum: number, po: any) => sum + Number(po.total_amount ?? 0), 0),
    budgetTotal: Number(project.budget ?? 0),
    totalLogs: 0,
    totalOrders: purchaseOrders.length,
    completedOrders,
    totalRfqs: rfqs.length,
    awardedRfqs: rfqs.filter((r: any) => r.status === 'AWARDED').length,
    startDate: project.start_date ?? Date.now(),
    endDate: project.end_date ?? Date.now(),
  } as const;
  const projectName = project.name ?? 'Project';
  const companyName = project.company?.name ?? 'Company';
  const projectStatus = String(project.status ?? 'ACTIVE');
  const badgeVariant = projectStatus === 'COMPLETED' ? 'default' : projectStatus === 'ACTIVE' ? 'success' : 'warning';

  return (
    <ScreenBackground>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {isLoading ? (
          <View style={{ paddingHorizontal: 24, paddingTop: 64 }}>
            <Text style={{ color: Colors.text2, fontFamily: Fonts.body }}>Loading project...</Text>
          </View>
        ) : (
          <>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back-outline" size={24} color={Colors.text1} />
          </TouchableOpacity>
          <Text style={styles.projectName}>{projectName}</Text>
          <View style={styles.heroSubRow}>
            <Badge variant={badgeVariant as any}>{projectStatus}</Badge>
            <Text style={styles.companyName}>{companyName}</Text>
          </View>
        </View>

        <ProjectProgressCard input={projectProgressInput} />

        {/* Sites Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.sectionTitle}>Sites</Text>
              <View style={styles.countBadge}><Text style={styles.countBadgeText}>{Array.isArray(project.sites) ? project.sites.length : 0}</Text></View>
            </View>
            <TouchableOpacity><Text style={styles.seeAllText}>See all</Text></TouchableOpacity>
          </View>
          {(Array.isArray(project.sites) ? project.sites : []).slice(0, 3).map((site: any) => (
            <GlassView key={site.id} variant="card" style={styles.siteMiniCard}>
              <Text style={styles.siteName}>{site.name}</Text>
              <ProgressBar value={Math.min(100, Math.round((completedOrders / Math.max(purchaseOrders.length, 1)) * 100))} variant="default" size="sm" />
              <Text style={styles.siteSubText}>{site.contact_person || 'No contact assigned'}</Text>
            </GlassView>
          ))}
        </View>

        {/* Daily Logs Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Logs</Text>
            <TouchableOpacity><Text style={styles.seeAllText}>See all</Text></TouchableOpacity>
          </View>
          
          <GlassView variant="card" style={styles.logCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={styles.logDate}>PO activity</Text>
              <Badge variant="success">{completedOrders} delivered</Badge>
            </View>
            <View style={styles.logSubRow}>
              <Ionicons name="cube-outline" size={16} color={Colors.amber} />
              <Text style={styles.logSubText}>{purchaseOrders.length} orders linked to project</Text>
            </View>
          </GlassView>
        </View>
        </>
        )}
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  heroSection: {
    paddingHorizontal: 24,
    paddingTop: 64, // pt-safe approx
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginLeft: -8,
  },
  projectName: {
    fontFamily: Fonts.display,
    fontSize: 24,
    color: Colors.text1,
    marginTop: 8,
  },
  heroSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  companyName: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.text2,
  },
  section: {
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
  countBadge: {
    backgroundColor: Colors.surface2,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  countBadgeText: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    color: Colors.text2,
  },
  seeAllText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.amber,
  },
  siteMiniCard: {
    padding: 16,
    borderRadius: Radius.md,
    gap: 8,
  },
  siteName: {
    fontFamily: Fonts.body,
    fontWeight: '600',
    fontSize: 15,
    color: Colors.text1,
  },
  siteSubText: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.amber,
    marginTop: 4,
  },
  logCard: {
    padding: 16,
    borderRadius: Radius.md,
  },
  logDate: {
    fontFamily: Fonts.body,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text1,
  },
  logSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  logSubText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.text2,
  }
});