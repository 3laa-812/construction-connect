import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { database } from "../../db";
import DailyLog from "../../db/models/DailyLog";
import WeatherWidget from "../../components/WeatherWidget";
import PhotoCapture from "../../components/PhotoCapture";
import AttendanceSheet from "../../components/AttendanceSheet";
import MaterialReceiptForm, {
  ReceivedItem,
} from "../../components/MaterialReceiptForm";

export default function DailyLogDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [log, setLog] = useState<DailyLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [weatherData, setWeatherData] = useState<any>({});
  const [photos, setPhotos] = useState<string[]>([]);
  const [attendanceData, setAttendanceData] = useState<any>({});
  const [materialItems, setMaterialItems] = useState<ReceivedItem[]>([]);

  // Fetch Log if editing
  useEffect(() => {
    const fetchLog = async () => {
      if (id && id !== "new") {
        try {
          const foundLog = await database.get<DailyLog>("daily_logs").find(id);
          setLog(foundLog);
          setWeatherData(foundLog.weatherData || {});
          setAttendanceData(foundLog.attendanceData || {});
          setMaterialItems(foundLog.materialReceiptData || []);
          // Load photos (Need to fetch relations)
          const logPhotos = await foundLog.photos.fetch();
          setPhotos(logPhotos.map((p) => p.localPath!).filter(Boolean));
        } catch (e) {
          Alert.alert("Error", "Could not find log.");
          router.back();
        }
      } else {
        // Initialize defaults for new log
        setWeatherData({ temp: "", condition: "" });
        setPhotos([]);
        setAttendanceData({});
        setMaterialItems([]);
      }
      setLoading(false);
    };
    fetchLog();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await database.write(async () => {
        let currentLog = log;

        if (!currentLog) {
          // Create new
          currentLog = await database.collections
            .get<DailyLog>("daily_logs")
            .create((newLog) => {
              newLog.logDate = Date.now();
              newLog.status = "DRAFT";
              newLog.weatherData = weatherData;
              newLog.attendanceData = attendanceData;
              newLog.materialReceiptData = materialItems;
              newLog.project.id = "1"; // HARDCODED for MVP
              newLog.user.id = "current-user-id";
            });
        } else {
          // Update existing
          await currentLog.update((updatedLog) => {
            updatedLog.weatherData = weatherData;
            updatedLog.attendanceData = attendanceData;
            updatedLog.materialReceiptData = materialItems;
            updatedLog.status = "SUBMITTED";
          });
        }

        // Handle Photos
        for (const photoUri of photos) {
          await currentLog.addPhoto(photoUri);
        }
      });
      Alert.alert("Success", "Daily Log Saved!");
      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to save log.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="hsl(var(--primary))" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-4 py-4 border-b border-border flex-row justify-between items-center">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-secondary-foreground">Cancel</Text>
        </TouchableOpacity>
        <Text className="text-lg font-bold text-foreground">
          {id === "new" ? "New Log" : "Edit Log"}
        </Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          <Text className="text-primary font-bold">
            {saving ? "Saving..." : "Save"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 p-4">
        <View className="mb-6">
          <Text className="text-sm text-muted-foreground mb-2">DATE</Text>
          <Text className="text-xl font-bold text-foreground">
            {log
              ? new Date(log.logDate).toLocaleDateString()
              : new Date().toLocaleDateString()}
          </Text>
        </View>

        {/* Weather Section */}
        <WeatherWidget
          initialData={weatherData}
          onWeatherChange={setWeatherData}
        />

        {/* Attendance Section */}
        <AttendanceSheet data={attendanceData} onChange={setAttendanceData} />

        {/* Material Receipt Section */}
        <MaterialReceiptForm
          items={materialItems}
          onChange={setMaterialItems}
        />

        {/* Photos Section */}
        <PhotoCapture initialPhotos={photos} onPhotosChange={setPhotos} />
      </ScrollView>
    </SafeAreaView>
  );
}
