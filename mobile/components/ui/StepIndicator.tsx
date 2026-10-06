import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '../../constants/theme';
import { AmberGlow } from '../../constants/glass';

interface Step {
  label: string;
  id: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStepIndex: number;
}

export function StepIndicator({ steps, currentStepIndex }: StepIndicatorProps) {
  return (
    <View style={styles.container}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStepIndex;
        const isActive = index === currentStepIndex;
        const isLast = index === steps.length - 1;

        return (
          <React.Fragment key={step.id}>
            <View style={styles.stepWrapper}>
              <View 
                style={[
                  styles.circle,
                  isCompleted && styles.circleCompleted,
                  isActive && [styles.circleActive, AmberGlow.soft],
                ]}
              >
                {isCompleted ? (
                  <Ionicons name="checkmark" size={14} color={Colors.text1} />
                ) : (
                  <Text style={[
                    styles.stepNumber,
                    (isActive || isCompleted) && { color: Colors.text1 }
                  ]}>
                    {index + 1}
                  </Text>
                )}
              </View>
              <Text style={[
                styles.label,
                (isActive || isCompleted) && { color: Colors.text1 }
              ]}>
                {step.label}
              </Text>
            </View>
            {!isLast && (
              <View style={[
                styles.line,
                isCompleted && styles.lineCompleted
              ]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    width: '100%',
  },
  stepWrapper: {
    alignItems: 'center',
    gap: 6,
    zIndex: 2,
  },
  circle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleActive: {
    backgroundColor: Colors.amber,
    borderColor: Colors.amber,
  },
  circleCompleted: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  stepNumber: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.text3,
  },
  label: {
    fontFamily: Fonts.body,
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: Colors.text3,
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.border,
    marginTop: -16, // Align with circles
    zIndex: 1,
    marginHorizontal: -10, // Overlap slightly to stick to circles
  },
  lineCompleted: {
    backgroundColor: Colors.success,
  },
});
