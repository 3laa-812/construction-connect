import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { Colors } from '../../../constants/theme';
import { useAuthStore } from '../../../store/authStore';
import { WalletCard } from '../../../components/wallet/WalletCard';

export default function WalletScreen() {
  const { user } = useAuthStore();
  const isSupplier = user?.role === 'SUPPLIER';

  const { data: wallet, isLoading } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => api.get('/wallet').then(res => res.data),
  });

  return (
    <View style={{ flex: 1, backgroundColor: Colors.ground, padding: 16 }}>
      <WalletCard 
        balance={wallet?.balance || 0} 
        outstanding={wallet?.outstanding || 0} 
        isSupplier={isSupplier} 
      />
      
      <Text style={{ fontFamily: 'Geist', fontSize: 16, color: Colors.text1, marginBottom: 12 }}>
        Recent Transactions
      </Text>

      <FlatList
        data={wallet?.transactions || []}
        keyExtractor={(item: any) => item.id}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', padding: 24 }}>
            <Text style={{ color: Colors.text2, fontFamily: 'Geist' }}>
              {isLoading ? 'Loading wallet data...' : 'No transactions found.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
            <Text style={{ color: Colors.text1 }}>{item.description}</Text>
            <Text style={{ color: Colors.text2 }}>${item.amount} - {new Date(item.date).toLocaleDateString()}</Text>
          </View>
        )}
      />
    </View>
  );
}
