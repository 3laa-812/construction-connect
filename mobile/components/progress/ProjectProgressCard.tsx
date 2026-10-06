import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GlassView } from '../ui/GlassView';
import { ProgressBar } from '../ui/ProgressBar';
import { Colors, Fonts, Radius } from '../../constants/theme';
import { ProjectProgressInput, calculateProjectProgress, getProgressAlerts } from '../../lib/progress';
import { ProgressAlertChip } from './ProgressAlertChip';

export function ProjectProgressCard({ input }: { input: ProjectProgressInput }) {
  const progress = calculateProjectProgress(input);
  const alerts = getProgressAlerts(input);

  return (
    <GlassView variant="card" style={styles.card}>
      <Text style={styles.title}>PROGRESS</Text>

      <View style={styles.radialWrap}>
        <ProgressBar value={progress.overall} variant="radial" animated />
      </View>

      <ProgressBar value={progress.overall} variant="segmented" breakdown={progress.breakdown} animated />

      {alerts.length > 0 ? (
        <View style={styles.alerts}>
          {alerts.map((alert, index) => (
            <ProgressAlertChip key={`${alert.type}-${index}`} alert={alert} />
          ))}
        </View>
      ) : null}
    </GlassView>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 24,
    marginTop: 16,
    padding: 16,
    borderRadius: Radius.lg,
  },
  title: {
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: Colors.text2,
  },
  radialWrap: {
    marginTop: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  alerts: {
    marginTop: 16,
    gap: 8,
  },
});
