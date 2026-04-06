import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Colors, Spacing } from '../../../constants/theme';
import { api } from '../../../lib/api';

export default function NewRFQ() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState('');
  
  // Note: For a production scale we'd map standard Dropdowns for Categories and Items
  // For the immediate phase requirement, we map standard string inputs.
  
  const handleSubmit = async () => {
    if (!title) {
      alert('Title is required');
      return;
    }
    
    setLoading(true);
    try {
      await api.post('/rfqs', {
        title,
        project_id: projectId || undefined,
        status: 'OPEN',
      });
      alert('RFQ Created successfully');
      router.back();
    } catch (e: any) {
      alert('Failed to construct RFQ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Create New RFQ</Text>
      
      <Input 
        placeholder="RFQ Title" 
        value={title}
        onChangeText={setTitle}
      />
      
      <Input 
        placeholder="Project ID (Optional)" 
        value={projectId}
        onChangeText={setProjectId}
      />
      
      <View style={styles.actions}>
        <Button variant="outline" onPress={() => router.back()} style={{ flex: 1 }}>
          Cancel
        </Button>
        <Button variant="primary" onPress={handleSubmit} isLoading={loading} style={{ flex: 1 }}>
          Publish
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.ground,
  },
  content: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  title: {
    fontFamily: 'DMSerifDisplay',
    fontSize: 24,
    color: Colors.text1,
    marginBottom: Spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xl,
  }
});
