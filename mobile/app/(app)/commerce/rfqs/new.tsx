import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { Colors, Fonts, Spacing } from '../../../../constants/theme';
import { api } from '../../../../lib/api';
import { ScreenBackground } from '../../../../components/ui/ScreenBackground';
import { GlassView } from '../../../../components/ui/GlassView';
import { AmberGlow } from '../../../../constants/glass';

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
    <ScreenBackground>
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
      </ScrollView>

      <GlassView variant="nav" style={styles.actionBar}>
        <View style={styles.actions}>
          <Button variant="outline" onPress={() => router.back()} style={{ flex: 1 }}>
            Cancel
          </Button>
          <Button variant="primary" onPress={handleSubmit} isLoading={loading} style={{ flex: 1, ...AmberGlow.soft }}>
            Publish
          </Button>
        </View>
        <Text style={styles.actionHint}>Publishing sends this RFQ to matching suppliers</Text>
      </GlassView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
    gap: Spacing.md,
    paddingBottom: 140,
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
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(42, 46, 43, 0.6)',
    paddingHorizontal: Spacing.md,
    paddingTop: 12,
    paddingBottom: 24,
  },
  actionHint: {
    marginTop: 8,
    fontFamily: Fonts.body,
    fontSize: 10,
    color: Colors.text3,
    textAlign: 'center',
  },
});
