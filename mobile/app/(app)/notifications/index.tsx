import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { withObservables } from '@nozbe/with-observables';
import { database } from '../../../lib/watermelon';
import Notification from '../../../models/Notification';
import { Colors } from '../../../constants/theme';
import { useRouter } from 'expo-router';

function NotificationsList({ notifications }: { notifications: Notification[] }) {
  const router = useRouter();

  const renderItem = ({ item }: { item: Notification }) => (
    <View 
      style={{ 
        padding: 16, 
        borderBottomWidth: 1, 
        borderBottomColor: Colors.border,
        backgroundColor: item.isRead ? Colors.ground : Colors.surface.DEFAULT 
      }}
      onTouchEnd={() => {
        // Mark as read in db
        database.write(async () => {
          await item.update(notif => {
            notif.isRead = true;
          });
        });
        if (item.referenceId && item.type === 'INVOICE') {
          router.push(`/invoices/${item.referenceId}`);
        }
      }}
    >
      <Text style={{ fontFamily: 'Geist', fontSize: 16, color: Colors.text1 }}>{item.title}</Text>
      <Text style={{ fontFamily: 'Geist', fontSize: 14, color: Colors.text2 }}>{item.message}</Text>
    </View>
  );

  return (
    <FlatList
      data={notifications}
      keyExtractor={item => item.id}
      renderItem={renderItem}
      ListEmptyComponent={() => (
        <View style={{ alignItems: 'center', padding: 24 }}>
          <Text style={{ color: Colors.text2, fontFamily: 'Geist' }}>No notifications.</Text>
        </View>
      )}
    />
  );
}

const EnhancedNotificationsList = withObservables([], () => ({
  notifications: database.get<Notification>('notifications').query().observe(),
}))(NotificationsList);

export default function NotificationsScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.ground }}>
      <EnhancedNotificationsList />
    </View>
  );
}
