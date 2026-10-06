import { Stack } from 'expo-router';
import { Colors } from '../../../../constants/theme';

export default function RFQsLayout() {
  return (
    <Stack screenOptions={{ 
      headerStyle: { backgroundColor: Colors.surface },
      headerTintColor: Colors.text1,
      headerTitleStyle: { fontFamily: 'Geist', fontWeight: '600' },
      contentStyle: { backgroundColor: 'transparent' }
    }}>
      <Stack.Screen name="index" options={{ title: 'RFQs' }} />
      <Stack.Screen name="new" options={{ title: 'Create RFQ', presentation: 'modal' }} />
      <Stack.Screen name="[id]" options={{ title: 'RFQ Details' }} />
    </Stack>
  );
}
