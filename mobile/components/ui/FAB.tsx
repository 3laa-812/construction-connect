import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from '../../constants/theme';
import * as Haptics from 'expo-haptics';

interface FABProps {
  icon: keyof typeof Feather.glyphMap;
  onPress: () => void;
  style?: ViewStyle;
}

export const FAB: React.FC<FABProps> = ({ icon, onPress, style }) => {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress();
  };

  return (
    <TouchableOpacity 
      style={[styles.fab, style]} 
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <Feather name={icon} size={24} color={Colors.ground} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.amber,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  }
});
