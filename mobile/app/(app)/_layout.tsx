import React from 'react';
import { View } from 'react-native';
import { Tabs, Redirect } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { CustomTabBar } from '../../components/navigation/CustomTabBar';
import { SyncBanner } from '../../components/sync/SyncBanner';
import { useSync } from '../../hooks/useSync';

export default function AppLayout() {
  const { isAuthenticated, user } = useAuthStore();
  useSync();

  // If we had a loading state in the store, we'd check it here
  // For now, if not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <View style={{ flex: 1 }}>
      <SyncBanner />
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: 'transparent',
            elevation: 0,
            borderTopWidth: 0,
          },
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Home' }} />
        <Tabs.Screen name="work" options={{ title: 'Work' }} />
        <Tabs.Screen 
          name="daily-logs" 
          options={{ 
            title: 'Logs',
            href: user?.role === 'CONTRACTOR' ? undefined : null,
          }} 
        />
        <Tabs.Screen name="commerce" options={{ title: 'Commerce' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile' }} />

        {/* Hidden screens - suppress from tab bar */}
        <Tabs.Screen name="notifications" options={{ href: null }} />
      </Tabs>
    </View>
  );
}
