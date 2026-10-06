import React from 'react';
import { View, Text } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../../../lib/api';
import { Colors } from '../../../../../constants/theme';
import { useAuthStore } from '../../../../../store/authStore';
import { WalletCard } from '../../../../../components/wallet/WalletCard';
import { ScreenBackground } from '../../../../../components/ui/ScreenBackground';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
}

export default function WalletScreen() {
  const { user } = useAuthStore();
  const isSupplier = user?.role === 'SUPPLIER';
  const companyId = user?.company?.id;

  const { data: walletSummary } = useQuery({
    queryKey: ['wallet-summary', companyId],
    queryFn: () => api.get(`/wallets/company/${companyId}/summary`).then(res => res.data),
    enabled: Boolean(companyId),
  });

  const { data: walletTransactions, isLoading } = useQuery({
    queryKey: ['wallet-transactions', companyId],
    queryFn: () => api.get(`/wallets/company/${companyId}/transactions`).then(res => res.data),
    enabled: Boolean(companyId),
  });

  const transactions = (walletTransactions?.data || walletTransactions || []) as Transaction[];

  const TypedFlashList = FlashList as any;

  return (
    <ScreenBackground style={{ padding: 16 }}>
      <WalletCard 
        balance={walletSummary?.balance || 0} 
        outstanding={walletSummary?.outstanding || 0} 
        isSupplier={isSupplier} 
      />

      <View style={{ height: 24 }} />

      <Text style={{ fontSize: 18, fontFamily: 'DMSerifDisplay', color: Colors.text1, marginBottom: 16 }}>
        Recent Transactions
      </Text>

      <TypedFlashList
        estimatedItemSize={60}
        data={transactions}
        keyExtractor={(item: Transaction) => item.id}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', padding: 24 }}>
            <Text style={{ color: Colors.text2, fontFamily: 'Geist' }}>
              {isLoading ? 'Loading wallet data...' : 'No transactions found.'}
            </Text>
          </View>
        }
        renderItem={({ item }: { item: Transaction }) => (
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: Colors.border
          }}>
            <View>
              <Text style={{ color: Colors.text1, fontFamily: 'Geist', fontSize: 16 }}>{item.description}</Text>
              <Text style={{ color: Colors.text2, fontFamily: 'Geist', fontSize: 12 }}>{item.date}</Text>
            </View>
            <Text style={{ 
              color: item.amount > 0 ? Colors.successText : Colors.errorText,
              fontFamily: 'DMSerifDisplay',
              fontSize: 18
            }}>
              {item.amount > 0 ? '+' : ''}{item.amount}
            </Text>
          </View>
        )}
      />
    </ScreenBackground>
  );
}
