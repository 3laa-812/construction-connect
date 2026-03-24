import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { database } from "../../db";
import DailyLog from "../../db/models/DailyLog";
import Project from "../../db/models/Project";
import User from "../../db/models/User";
import { Feather } from "@expo/vector-icons";
import WeatherWidget, {
  type WeatherData,
  normalizeWeatherPayload,
} from "../../components/WeatherWidget";
import AttendanceSheet, {
  type AttendanceEntry,
  attendanceBlocksSubmit,
} from "../../components/AttendanceSheet";
import { recordAttendanceCompanyNames } from "../../services/attendanceCompanies";
import MaterialReceiptForm, {
  type MaterialReceiptData,
} from "../../components/MaterialReceiptForm";
import PhotoCapture from "../../components/PhotoCapture";
import { CollapsibleSection } from "../../components/CollapsibleSection";
import {
  ProgressNotesSection,
  parseProgressNotes,
  type ProgressNote,
} from "../../components/ProgressNotesSection";

export default function NewDailyLog() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [logDate, setLogDate] = useState(() => new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [projectId, setProjectId] = useState("");
  const [logTitle, setLogTitle] = useState("");
  const [weather, setWeather] = useState<WeatherData>(() =>
    normalizeWeatherPayload(null),
  );
  const [attendanceRows, setAttendanceRows] = useState<AttendanceEntry[]>([]);
  const [progressNotes, setProgressNotes] = useState<ProgressNote[]>(() =>
    parseProgressNotes(undefined),
  );
  const [materialData, setMaterialData] = useState<MaterialReceiptData>({
    version: 2,
  });
  const [photos, setPhotos] = useState<string[]>([]);
  const [projectServerId, setProjectServerId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const list = await database.get<Project>("projects").query().fetch();
      setProjects(list);
      const first = list[0];
      if (first) {
        setProjectId(first.id);
        setProjectServerId(first.serverId ?? null);
      }
    })();
  }, []);

  useEffect(() => {
    const p = projects.find((x) => x.id === projectId);
    setProjectServerId(p?.serverId ?? null);
  }, [projectId, projects]);

  const persist = async (status: "DRAFT" | "SUBMITTED") => {
    if (!projectId) {
      Alert.alert("Project", "Select a project.");
      return;
    }

    if (
      status === "SUBMITTED" &&
      attendanceBlocksSubmit(attendanceRows, 16)
    ) {
      Alert.alert(
        "Attendance",
        "Fix validation errors before submitting (company, headcount, hours).",
      );
      return;
    }

    setSubmitting(true);
    try {
      await database.write(async () => {
        const project = await database.get<Project>("projects").find(projectId);
        const users = await database.get<User>("users").query().fetch();
        const user = users[0];
        if (!user) {
          throw new Error("Missing local user — log in and sync.");
        }

        const dayStart = new Date(logDate);
        dayStart.setHours(12, 0, 0, 0);

        const newLog = await database.get<DailyLog>("daily_logs").create(
          (entry) => {
            entry.project.set(project);
            entry.user.set(user);
            entry.logDate = dayStart.getTime();
            entry.status = status;
            entry.logTitle = logTitle.trim() || undefined;
            entry.progressNotes = JSON.stringify(progressNotes);
            entry.weatherData = weather;
            entry.attendanceData = attendanceRows;
            entry.materialReceiptData = materialData;
          },
        );

        for (const uri of photos) {
          await database.get("log_photos").create((media: any) => {
            media.dailyLog.set(newLog);
            media.localPath = uri;
            media.gpsLat = null;
            media.gpsLong = null;
          });
        }
      });

      await recordAttendanceCompanyNames(
        database,
        attendanceRows.map((r) => r.company_name),
      );

      Alert.alert("Saved", `Daily log ${status === "DRAFT" ? "saved as draft" : "submitted"} offline.`);
      router.back();
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to save log.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ title: "New Daily Log" }} />
      <ScrollView className="flex-1 p-4">
        <CollapsibleSection title="Header" defaultOpen>
          <Text className="text-xs text-muted-foreground mb-1">Date</Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            className="bg-card border border-border rounded-xl p-4 mb-3 flex-row justify-between items-center"
          >
            <Text className="text-foreground text-lg">
              {logDate.toLocaleDateString()}
            </Text>
            <Feather name="calendar" size={20} color="#888" />
          </TouchableOpacity>
          {showDatePicker ? (
            <DateTimePicker
              value={logDate}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(_, d) => {
                setShowDatePicker(Platform.OS === "android" ? false : true);
                if (d) setLogDate(d);
              }}
            />
          ) : null}
          {Platform.OS === "ios" && showDatePicker ? (
            <TouchableOpacity
              onPress={() => setShowDatePicker(false)}
              className="py-2"
            >
              <Text className="text-primary text-center font-bold">Done</Text>
            </TouchableOpacity>
          ) : null}

          <Text className="text-xs text-muted-foreground mb-1">Project</Text>
          <View className="flex-row flex-wrap gap-2 mb-3">
            {projects.map((p) => (
              <TouchableOpacity
                key={p.id}
                onPress={() => setProjectId(p.id)}
                className={`px-3 py-2 rounded-lg border ${projectId === p.id ? "border-primary bg-primary/15" : "border-border bg-card"}`}
              >
                <Text className="text-foreground text-sm font-medium" numberOfLines={2}>
                  {p.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="text-xs text-muted-foreground mb-1">
            Log title (optional)
          </Text>
          <TextInput
            className="bg-card border border-border rounded-xl p-3 text-foreground mb-1"
            placeholder="e.g. Concrete pour — Zone B"
            placeholderTextColor="#999"
            value={logTitle}
            onChangeText={setLogTitle}
          />
        </CollapsibleSection>

        <CollapsibleSection title="Weather" defaultOpen>
          <WeatherWidget onWeatherChange={setWeather} />
        </CollapsibleSection>

        <CollapsibleSection title="Attendance">
          <AttendanceSheet
            rows={attendanceRows}
            onChange={setAttendanceRows}
            maxHoursPerPerson={16}
          />
        </CollapsibleSection>

        <CollapsibleSection title="Progress notes">
          <ProgressNotesSection
            notes={progressNotes}
            onChange={setProgressNotes}
          />
        </CollapsibleSection>

        <CollapsibleSection title="Photos">
          <PhotoCapture initialPhotos={photos} onPhotosChange={setPhotos} />
        </CollapsibleSection>

        <CollapsibleSection title="Material receipt (GRN)">
          {projectId ? (
            <MaterialReceiptForm
              projectServerId={projectServerId}
              localProjectId={projectId}
              value={materialData}
              onPatch={(p) =>
                setMaterialData((m) => ({ ...m, ...p, version: 2 }))
              }
            />
          ) : (
            <Text className="text-muted-foreground text-sm">
              Select a project first.
            </Text>
          )}
        </CollapsibleSection>

        <View className="h-28" />
      </ScrollView>

      <View className="p-4 border-t border-border bg-card gap-3 safe-bottom">
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={() => persist("DRAFT")}
            disabled={submitting}
            className="flex-1 bg-secondary p-4 rounded-xl items-center"
          >
            {submitting ? (
              <ActivityIndicator color="hsl(var(--secondary-foreground))" />
            ) : (
              <Text className="text-secondary-foreground font-bold text-base">
                Save draft
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => persist("SUBMITTED")}
            disabled={
              submitting || attendanceBlocksSubmit(attendanceRows, 16)
            }
            className={`flex-1 bg-primary p-4 rounded-xl items-center ${submitting || attendanceBlocksSubmit(attendanceRows, 16) ? "opacity-45" : ""}`}
          >
            {submitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-primary-foreground font-bold text-base">
                Submit
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
