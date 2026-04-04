import React from 'react';
import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Colors } from '../../../constants/theme';

export default function ProjectDetails() {
  const { id } = useLocalSearchParams();
  
  return (
    <View style={{ flex: 1, backgroundColor: Colors.ground, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: Colors.text1, fontSize: 18, fontFamily: 'Geist' }}>Project ID: {id}</Text>
    </View>
  );
}
