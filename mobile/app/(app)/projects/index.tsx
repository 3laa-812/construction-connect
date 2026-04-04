import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { withObservables } from '@nozbe/with-observables';
import { database } from '../../../lib/watermelon';
import { Project } from '../../../models/Project';
import { Colors } from '../../../constants/theme';
import { Card, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { useRouter } from 'expo-router';

function ProjectList({ projects }: { projects: Project[] }) {
  const router = useRouter();

  const renderItem = ({ item }: { item: Project }) => (
    <Card 
      style={{ marginBottom: 12 }} 
      onTouchEnd={() => router.push(`/projects/${item.id}`)}
    >
      <CardHeader>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <CardTitle>{item.name}</CardTitle>
            <CardDescription>{item.location || 'Location not specified'}</CardDescription>
          </View>
          <Badge variant={item.status === 'ACTIVE' ? 'success' : 'default'}>
            {item.status}
          </Badge>
        </View>
      </CardHeader>
    </Card>
  );

  return (
    <FlatList
      data={projects}
      keyExtractor={item => item.id}
      contentContainerStyle={{ padding: 16 }}
      renderItem={renderItem}
      ListEmptyComponent={() => (
        <View style={{ alignItems: 'center', padding: 24 }}>
          <Text style={{ color: Colors.text2, fontFamily: 'Geist' }}>No projects locally available. Checking for sync...</Text>
        </View>
      )}
    />
  );
}

// Map the DB query into RxJS Observable props so it auto-re-renders upon sync!
const EnhancedProjectList = withObservables([], () => ({
  projects: database.get<Project>('projects').query().observe(),
}))(ProjectList);


export default function ProjectsScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.ground }}>
      <EnhancedProjectList />
    </View>
  );
}
