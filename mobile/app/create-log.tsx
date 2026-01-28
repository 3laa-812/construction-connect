import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { database } from '../db';

export default function CreateLog() {
  const router = useRouter();

  const handleCreate = async () => {
    try {
        await database.write(async () => {
            const logsCollection = database.collections.get('daily_logs');
            await logsCollection.create(log => {
                log.projectId = "default-project"; // TODO: Select project
                log.userId = "current-user"; // TODO: Auth
                log.logDate = Date.now();
                log.status = 'DRAFT';
                log.weatherData = JSON.stringify({ temp: 25, condition: 'Sunny' }); // Mock
            });
        });
        Alert.alert("Success", "Daily Log created locally!");
        router.back();
    } catch (e) {
        console.error(e);
        Alert.alert("Error", "Failed to create log");
    }
  };

  return (
    <View className="flex-1 bg-white p-6 pt-12">
      <Text className="text-2xl font-bold mb-6">New Daily Log</Text>
      
      <View className="mb-4">
        <Text className="text-gray-600 mb-1">Date</Text>
        <TextInput 
            value={new Date().toLocaleDateString()}
            editable={false}
            className="bg-gray-100 p-4 rounded-lg text-gray-500"
        />
      </View>

      <TouchableOpacity 
        onPress={handleCreate}
        className="bg-blue-600 py-4 rounded-xl items-center mt-4"
      >
        <Text className="text-white font-bold text-lg">Create Log</Text>
      </TouchableOpacity>
    </View>
  );
}
