import { Tabs } from 'expo-router';
import { Colors } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';

export default function AppLayout() {
  const { user } = useAuthStore();
  
  return (
    <Tabs screenOptions={{ 
      tabBarStyle: { backgroundColor: Colors.surface, borderTopColor: Colors.border },
      tabBarActiveTintColor: Colors.amber,
      tabBarInactiveTintColor: Colors.text3,
      headerStyle: { backgroundColor: Colors.surface },
      headerTintColor: Colors.text1,
    }}>
      <Tabs.Screen name="index" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="projects" options={{ title: 'Projects' }} />
      <Tabs.Screen name="daily-logs" options={{ title: 'Logs' }} />
      <Tabs.Screen name="orders" options={{ title: 'Orders' }} />
      <Tabs.Screen name="invoices" options={{ title: 'Invoices' }} />
      <Tabs.Screen name="wallet" options={{ title: 'Wallet' }} />
      <Tabs.Screen name="notifications" options={{ title: 'Alerts' }} />
    </Tabs>
  );
}
