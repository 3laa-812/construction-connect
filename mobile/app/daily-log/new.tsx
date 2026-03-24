import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { database } from "../../db";
import DailyLog from "../../db/models/DailyLog";
import Project from "../../db/models/Project";
import User from "../../db/models/User";
import { Feather } from "@expo/vector-icons";
import WeatherWidget, {
  type WeatherData,
} from "../../components/WeatherWidget";
import AttendanceSheet, {
  type AttendanceRow,
} from "../../components/AttendanceSheet";
import MaterialReceiptForm, {
  type MaterialReceiptData,
} from "../../components/MaterialReceiptForm";

export default function NewDailyLog() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const [workDescription, setWorkDescription] = useState("");
  const [weather, setWeather] = useState<WeatherData>({
    temp: "",
    condition: "",
  });
  const [attendanceRows, setAttendanceRows] = useState<AttendanceRow[]>([]);
  const [materialData, setMaterialData] = useState<MaterialReceiptData>({
    version: 2,
  });
  const [localProjectId, setLocalProjectId] = useState("");
  const [projectServerId, setProjectServerId] = useState<string | null>(null);

  const [photos, setPhotos] = useState<
    { uri: string; lat?: number; long?: number }[]
  >([]);

  useEffect(() => {
    (async () => {
      const projects = await database
        .get<Project>("projects")
        .query()
        .fetch();
      const p = projects[0];
      setLocalProjectId(p?.id ?? "");
      setProjectServerId(p?.serverId ?? null);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      await ImagePicker.requestCameraPermissionsAsync();
      await Location.requestForegroundPermissionsAsync();
    })();
  }, []);

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });

      if (!result.canceled) {
        let location: Location.LocationObject | null = null;
        try {
          location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
        } catch (e) {
          console.log("Could not get location", e);
        }

        setPhotos((prev) => [
          ...prev,
          {
            uri: result.assets[0].uri,
            lat: location?.coords.latitude,
            long: location?.coords.longitude,
          },
        ]);
      }
    } catch {
      Alert.alert("Error", "Could not take photo");
    }
  };

  const saveLog = async () => {
    if (!workDescription) {
      Alert.alert("Required", "Please add a work description");
      return;
    }

    const invalidHours = attendanceRows.some(
      (r) => r.hours_worked > 16 || r.hours_worked < 0,
    );
    if (invalidHours) {
      Alert.alert("Attendance", "Hours per row must be between 0 and 16.");
      return;
    }

    setSubmitting(true);
    try {
      await database.write(async () => {
        const projects = await database
          .get<Project>("projects")
          .query()
          .fetch();
        const project = projects[0];
        const users = await database.get<User>("users").query().fetch();
        const user = users[0];

        if (!project || !user) {
          throw new Error("Missing local project or user");
        }

        const newLog = await database.get<DailyLog>("daily_logs").create(
          (entry) => {
            entry.project.set(project);
            entry.user.set(user);
            entry.logDate = Date.now();
            entry.status = "DRAFT";
            entry.weatherData = weather;
            entry.attendanceData = attendanceRows;
            entry.materialReceiptData = {
              ...materialData,
              work_notes: workDescription,
            };
          },
        );

        for (const p of photos) {
          await database.get("log_photos").create((media: any) => {
            media.dailyLog.set(newLog);
            media.localPath = p.uri;
            media.gpsLat = p.lat ?? null;
            media.gpsLong = p.long ?? null;
          });
        }
      });

      Alert.alert("Success", "Daily log saved offline.");
      router.back();
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to save log");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ title: "New Daily Log" }} />
      <ScrollView className="flex-1 p-4">
        <WeatherWidget onWeatherChange={setWeather} initialData={weather} />

        <Text className="font-bold text-foreground mb-2">Work Description</Text>
        <TextInput
          className="bg-card border border-border rounded-xl p-4 min-h-[100px] text-foreground mb-4"
          multiline
          placeholder="What happened on site today?"
          placeholderTextColor="#999"
          value={workDescription}
          onChangeText={setWorkDescription}
          textAlignVertical="top"
        />

        <AttendanceSheet
          rows={attendanceRows}
          onChange={setAttendanceRows}
          maxHoursPerPerson={16}
        />

        {localProjectId ? (
          <MaterialReceiptForm
            projectServerId={projectServerId}
            localProjectId={localProjectId}
            value={materialData}
            onPatch={(p) =>
              setMaterialData((m) => ({ ...m, ...p, version: 2 }))
            }
          />
        ) : null}

        <Text className="font-bold text-foreground mb-2">
          Site Photos ({photos.length})
        </Text>
        <ScrollView
          horizontal
          className="mb-4"
          showsHorizontalScrollIndicator={false}
        >
          <TouchableOpacity
            onPress={takePhoto}
            className="w-24 h-24 bg-muted/30 rounded-xl items-center justify-center border border-dashed border-muted-foreground mr-3"
          >
            <Feather name="camera" size={24} color="#666" />
            <Text className="text-xs text-muted-foreground mt-1">
              Add Photo
            </Text>
          </TouchableOpacity>
          {photos.map((p, i) => (
            <Image
              key={i}
              source={{ uri: p.uri }}
              className="w-24 h-24 rounded-xl mr-3 bg-muted"
            />
          ))}
        </ScrollView>

        <View className="h-20" />
      </ScrollView>

      <View className="p-4 border-t border-border bg-card safe-bottom">
        <TouchableOpacity
          onPress={saveLog}
          disabled={submitting}
          className="bg-primary p-4 rounded-xl items-center"
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-primary-foreground font-bold text-lg">
              Save Log
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
