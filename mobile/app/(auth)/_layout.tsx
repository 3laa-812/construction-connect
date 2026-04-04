import { Stack, Redirect } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../constants/theme';

export default function AuthLayout() {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Redirect href="/(app)" />;
  }

  return (
    <Stack screenOptions={{ 
      headerShown: false,
      contentStyle: { backgroundColor: Colors.ground }
    }}>
      <Stack.Screen name="login" />
    </Stack>
  );
}
