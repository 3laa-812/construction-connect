import { Stack } from 'expo-router';

export default function FinancialsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="invoices" />
      <Stack.Screen name="wallet" />
    </Stack>
  );
}
