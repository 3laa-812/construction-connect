import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { withObservables } from '@nozbe/with-observables';
import { database } from '../../../lib/watermelon';
import { DailyLog } from '../../../models/DailyLog';
import { Colors } from '../../../constants/theme';
import { Card, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { useRouter } from 'expo-router';
import { Button } from '../../../components/ui/Button';

function LogList({ logs }: { logs: DailyLog[] }) {
  const router = useRouter();

  const renderItem = ({ item }: { item: DailyLog }) => (
    <Card style={{ marginBottom: 12 }}>
      <CardHeader>
        <CardTitle>{new Date(item.logDate).toLocaleDateString()}</CardTitle>
        <CardDescription>Status: {item.status}</CardDescription>
      </CardHeader>
    </Card>
  );

  return (
    <FlatList
      data={logs}
      keyExtractor={item => item.id}
      contentContainerStyle={{ padding: 16 }}
      renderItem={renderItem}
      ListEmptyComponent={() => (
        <View style={{ alignItems: 'center', padding: 24 }}>
          <Text style={{ color: Colors.text2, fontFamily: 'Geist' }}>No daily logs drafted or synced.</Text>
        </View>
      )}
    />
  );
}

const EnhancedLogList = withObservables([], () => ({
  logs: database.get<DailyLog>('daily_logs').query().observe(),
}))(LogList);

export default function DailyLogsScreen() {
  const router = useRouter();
  
  return (
    <View style={{ flex: 1, backgroundColor: Colors.ground }}>
      <EnhancedLogList />
      <View style={{ padding: 16 }}>
        <Button onPress={() => router.push('/daily-logs/new')}>Create New Log</Button>
      </View>
    </View>
  );
}
