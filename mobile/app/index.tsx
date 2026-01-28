import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { withDatabase } from '@nozbe/watermelondb/DatabaseProvider';
import withObservables from '@nozbe/with-observables';
import { database } from '../db';

const Dashboard = ({ dailyLogs }: { dailyLogs: any[] }) => {
  const sync = async () => {
      // Placeholder for Sync Logic
      console.log("Sync triggered");
  };

  return (
    <View className="flex-1 bg-gray-50 p-4">
      <View className="flex-row justify-between items-center mb-6 mt-12">
        <Text className="text-2xl font-bold text-gray-900">Site Dashboard</Text>
        <TouchableOpacity onPress={sync} className="bg-blue-600 px-4 py-2 rounded-lg">
           <Text className="text-white font-medium">Sync</Text>
        </TouchableOpacity>
      </View>

      <View className="mb-6">
        <Text className="text-lg font-semibold mb-2">My Daily Logs</Text>
        <ScrollView>
            {dailyLogs.length === 0 ? (
                <Text className="text-gray-500 italic">No logs found. Create one to get started.</Text>
            ) : (
                dailyLogs.map(log => (
                    <View key={log.id} className="bg-white p-4 rounded-xl shadow-sm mb-3">
                        <Text className="font-medium text-gray-800">Date: {new Date(log.logDate).toLocaleDateString()}</Text>
                        <Text className="text-gray-600">Status: {log.status}</Text>
                    </View>
                ))
            )}
        </ScrollView>
      </View>

      <Link href="/create-log" asChild>
        <TouchableOpacity className="bg-black py-4 rounded-xl items-center">
            <Text className="text-white font-bold text-lg">+ New Daily Log</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
};

const enhance = withObservables([], () => ({
  dailyLogs: database.collections.get('daily_logs').query(),
}));

export default enhance(Dashboard);
