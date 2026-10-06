import { Stack } from 'expo-router';
import { Colors } from '../../../constants/theme';

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ 
      headerStyle: { backgroundColor: Colors.surface },
      headerTintColor: Colors.text1,
      headerTitleStyle: { fontFamily: 'Geist', fontWeight: '600' },
      contentStyle: { backgroundColor: 'transparent' }
    }}>
      <Stack.Screen name="index" options={{ title: 'Profile & Settings' }} />
    </Stack>
  );
}
