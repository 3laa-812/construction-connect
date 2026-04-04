import React from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../constants/theme';
import { SyncBanner } from '../../components/sync/SyncBanner';
import { useSync } from '../../hooks/useSync';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export default function Dashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
  
  // This hook naturally mounts and handles offline tracking when dashboard opens
  useSync();

  const isContractor = user?.role === 'CONTRACTOR';

  // React Query Parallel Loads for summary info
  const { data: projects, isLoading: projectsLoading, refetch: refetchProjects } = useQuery({
    queryKey: ['projects', 'recent'],
    queryFn: () => api.get('/projects?limit=5').then(res => res.data),
    enabled: isContractor
  });

  const { data: orders, isLoading: ordersLoading, refetch: refetchOrders } = useQuery({
    queryKey: ['purchase-orders', 'recent'],
    queryFn: () => api.get('/purchase-orders?limit=5').then(res => res.data),
  });

  const { data: notifications, isLoading: notificationsLoading, refetch: refetchNotifications } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => api.get('/notifications?unread=true').then(res => res.data),
  });

  const onRefresh = async () => {
    isContractor && refetchProjects();
    refetchOrders();
    refetchNotifications();
  };

  const isLoading = projectsLoading || ordersLoading || notificationsLoading;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.ground }}>
      <SyncBanner />
      
      <ScrollView 
        contentContainerStyle={{ padding: 16, gap: 16 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={Colors.amber} />}
      >
        <View style={{ marginBottom: 8 }}>
          <Text style={{ fontFamily: 'Geist', fontSize: 14, color: Colors.text2 }}>
            Welcome back,
          </Text>
          <Text style={{ fontFamily: 'DMSerifDisplay', fontSize: 24, color: Colors.text1 }}>
            {user?.name || 'User'}
          </Text>
        </View>

        {isContractor && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Projects</CardTitle>
              <CardDescription>You have {projects?.total || 0} active projects</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onPress={() => router.push('/projects')} variant="secondary">
                View All Projects
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>{orders?.total || 0} active this week</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onPress={() => router.push('/orders')} variant="secondary">
              Manage Orders
            </Button>
          </CardContent>
        </Card>

        {isContractor && (
          <Button size="lg" onPress={() => router.push('/daily-logs/new')} style={{ marginTop: 8 }}>
            + Create Daily Log
          </Button>
        )}

      </ScrollView>
    </View>
  );
}
