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
import {
  Stack,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { SafeAreaView } from "react-native-safe-area-context";
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
  type ReceivedItem,
} from "../../components/MaterialReceiptForm";
import PhotoCapture from "../../components/PhotoCapture";
import { CollapsibleSection } from "../../components/CollapsibleSection";
import {
  ProgressNotesSection,
  parseProgressNotes,
  type ProgressNote,
} from "../../components/ProgressNotesSection";

const MAX_ATTENDANCE_HOURS = 16;

function normalizeAttendance(raw: unknown): AttendanceEntry[] {
  if (Array.isArray(raw)) {
    return (raw as unknown[])
      .map((r, i) => {
        if (r && typeof r === "object" && !Array.isArray(r)) {
          const o = r as Record<string, unknown>;
          if ("trade" in o || "company" in o || "company_name" in o) {
            const h = Number(o.hours_worked);
            const cn = String(
              o.company_name ?? o.company ?? "",
            );
            return {
              id: String(o.id ?? `row-${i}`),
              company_name: cn,
              trade: String(o.trade ?? "General Labor"),
              headcount: Math.max(0, Number(o.headcount) || 0),
              hours_worked: Number.isFinite(h)
                ? Math.min(MAX_ATTENDANCE_HOURS, Math.max(0.5, h))
                : 8,
            } satisfies AttendanceEntry;
          }
        }
        return null;
      })
      .filter(Boolean) as AttendanceEntry[];
  }
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return Object.entries(raw as Record<string, number>).map(
      ([trade, headcount], i) => ({
        id: `legacy-${i}`,
        company_name: "",
        trade,
        headcount: Number(headcount) || 0,
        hours_worked: 8,
      }),
    );
  }
  return [];
}

function normalizeMaterialReceipt(raw: unknown): MaterialReceiptData {
  if (
    raw &&
    typeof raw === "object" &&
    !Array.isArray(raw) &&
    (raw as MaterialReceiptData).version === 2
  ) {
    return raw as MaterialReceiptData;
  }
  if (Array.isArray(raw)) {
    return { version: 2, legacyItems: raw as ReceivedItem[] };
  }
  return { version: 2 };
}

export default function DailyLogEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [log, setLog] = useState<DailyLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [logDate, setLogDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [projectId, setProjectId] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
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
  const [existingPhotoPaths, setExistingPhotoPaths] = useState<Set<string>>(
    new Set(),
  );
  const [projectServerId, setProjectServerId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const list = await database.get<Project>("projects").query().fetch();
      setProjects(list);
    })();
  }, []);

  useEffect(() => {
    const p = projects.find((x) => x.id === projectId);
    setProjectServerId(p?.serverId ?? null);
  }, [projectId, projects]);

  useEffect(() => {
    const fetchLog = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      try {
        const foundLog = await database.get<DailyLog>("daily_logs").find(id);
        setLog(foundLog);
        setLogDate(new Date(foundLog.logDate));
        setLogTitle(foundLog.logTitle ?? "");
        setWeather(normalizeWeatherPayload(foundLog.weatherData));
        setAttendanceRows(normalizeAttendance(foundLog.attendanceData));
        setMaterialData(normalizeMaterialReceipt(foundLog.materialReceiptData));
        setProgressNotes(parseProgressNotes(foundLog.progressNotes));

        const proj = await foundLog.project.fetch();
        setProjectId(proj.id);

        const logPhotos = await foundLog.photos.fetch();
        const paths = logPhotos
          .map((p) => p.localPath)
          .filter((x): x is string => Boolean(x));
        setExistingPhotoPaths(new Set(paths));
        setPhotos(paths);
      } catch {
        Alert.alert("Error", "Could not find log.");
        router.back();
      }
      setLoading(false);
    };
    fetchLog();
  }, [id, router]);

  const persist = async (status: "DRAFT" | "SUBMITTED") => {
    if (!log) return;
    if (!projectId) {
      Alert.alert("Project", "Select a project.");
      return;
    }

    if (
      status === "SUBMITTED" &&
      attendanceBlocksSubmit(attendanceRows, MAX_ATTENDANCE_HOURS)
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
          throw new Error("Missing local user.");
        }

        const dayStart = new Date(logDate);
        dayStart.setHours(12, 0, 0, 0);

        await log.update((updated) => {
          updated.project.set(project);
          updated.user.set(user);
          updated.logDate = dayStart.getTime();
          updated.status = status;
          updated.logTitle = logTitle.trim() || undefined;
          updated.progressNotes = JSON.stringify(progressNotes);
          updated.weatherData = weather;
          updated.attendanceData = attendanceRows;
          updated.materialReceiptData = materialData;
        });

        for (const uri of photos) {
          if (!existingPhotoPaths.has(uri)) {
            await log.addPhoto(uri);
          }
        }
      });

      await recordAttendanceCompanyNames(
        database,
        attendanceRows.map((r) => r.company_name),
      );

      setExistingPhotoPaths(new Set(photos));
      Alert.alert("Saved", "Daily log updated.");
      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to save log.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="hsl(var(--primary))" />
      </SafeAreaView>
    );
  }

  if (!log) {
    return null;
  }

  const syncedBanner = log.status === "SYNCED";

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ title: "Edit daily log" }} />
      <SafeAreaView className="flex-1">
        <View className="px-4 py-3 border-b border-border flex-row justify-between items-center">
          <TouchableOpacity onPress={() => router.back()} className="py-2">
            <Text className="text-muted-foreground font-semibold">Back</Text>
          </TouchableOpacity>
          <Text className="text-lg font-bold text-foreground">Daily log</Text>
          <View style={{ width: 48 }} />
        </View>

        {syncedBanner ? (
          <View className="mx-4 mt-2 p-3 rounded-lg bg-amber-900/40 border border-amber-700/50">
            <Text className="text-amber-100 text-sm text-center">
              This log has been synced — edits will re-queue for sync.
            </Text>
          </View>
        ) : null}

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
                  <Text
                    className="text-foreground text-sm font-medium"
                    numberOfLines={2}
                  >
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
            <WeatherWidget
              initialData={weather}
              onWeatherChange={setWeather}
              autoFetchOnMount={false}
            />
          </CollapsibleSection>

          <CollapsibleSection title="Attendance">
            <AttendanceSheet
              rows={attendanceRows}
              onChange={setAttendanceRows}
              maxHoursPerPerson={MAX_ATTENDANCE_HOURS}
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
                submitting ||
                attendanceBlocksSubmit(
                  attendanceRows,
                  MAX_ATTENDANCE_HOURS,
                )
              }
              className={`flex-1 bg-primary p-4 rounded-xl items-center ${submitting || attendanceBlocksSubmit(attendanceRows, MAX_ATTENDANCE_HOURS) ? "opacity-45" : ""}`}
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
      </SafeAreaView>
    </View>
  );
}
