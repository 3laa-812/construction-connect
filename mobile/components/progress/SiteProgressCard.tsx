import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GlassView } from '../ui/GlassView';
import { ProgressBar } from '../ui/ProgressBar';
import { Colors, Fonts, Radius } from '../../constants/theme';
import { SiteProgressInput, calculateSiteProgress } from '../../lib/progress';

export function SiteProgressCard({ input }: { input: SiteProgressInput }) {
  const progress = calculateSiteProgress(input);

  return (
    <GlassView variant="card" style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>SITE STATUS</Text>
        {progress.daysIdle > 3 ? (
          <View style={styles.idleChip}>
            <Text style={styles.idleText}>{progress.daysIdle}d idle</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.block}>
        <Text style={styles.label}>Activity</Text>
        <ProgressBar value={progress.activity} size="md" animated />
      </View>

      <View style={styles.block}>
        <Text style={styles.label}>Deliveries</Text>
        <ProgressBar value={progress.deliveries} size="md" animated />
      </View>
    </GlassView>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 24,
    marginTop: 12,
    padding: 16,
    borderRadius: Radius.lg,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text3,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  idleChip: {
    borderWidth: 1,
    borderColor: 'rgba(212,146,10,0.25)',
    backgroundColor: 'rgba(212,146,10,0.1)',
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  idleText: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.amber,
    fontWeight: '600',
  },
  block: {
    gap: 8,
  },
  label: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.text2,
  },
});
