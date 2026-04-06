import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../../lib/api';
import { Colors, Spacing, Radius } from '../../../../constants/theme';
import { Card, CardTitle, CardDescription } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Feather } from '@expo/vector-icons';

export default function Marketplace() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['materials', search],
    queryFn: () => api.get('/materials', { params: { search } }).then(res => res.data),
  });

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Feather name="search" size={20} color={Colors.text2} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search materials..."
          placeholderTextColor={Colors.text3}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlashList
        estimatedItemSize={150}
        data={data?.data || []}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {isLoading ? 'Searching catalog...' : 'No materials found matching your search.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <CardTitle>{item.name}</CardTitle>
            <CardDescription>{item.description}</CardDescription>
            <Text style={styles.price}>
              Price: {item.price ? `${item.price} / ${item.unit}` : 'Contact for Quote'}
            </Text>
            <View style={styles.actions}>
              <Button 
                variant="outline" 
                size="sm"
                onPress={() => router.push(`/rfqs/new?material=${item.name}` as any)}
              >
                Request Quote
              </Button>
            </View>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.ground,
  },
  list: {
    padding: Spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface2,
    margin: Spacing.md,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: Colors.text1,
    fontFamily: 'Geist',
  },
  card: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  price: {
    fontFamily: 'Geist',
    fontWeight: '600',
    color: Colors.text1,
    marginTop: Spacing.xs,
  },
  actions: {
    marginTop: Spacing.sm,
    alignItems: 'flex-start',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    color: Colors.text2,
    fontFamily: 'Geist',
  }
});
