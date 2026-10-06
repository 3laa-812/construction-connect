import { Stack } from 'expo-router';

export default function CommerceLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="rfqs" />
      <Stack.Screen name="orders" />
      <Stack.Screen name="marketplace" />
      <Stack.Screen name="financials" />
    </Stack>
  );
}
