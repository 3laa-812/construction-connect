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
import Project from "../../db/models/Project";
import WeatherWidget, {
  type WeatherData,
} from "../../components/WeatherWidget";
import PhotoCapture from "../../components/PhotoCapture";
import AttendanceSheet, {
  type AttendanceRow,
} from "../../components/AttendanceSheet";
import MaterialReceiptForm, {
  type MaterialReceiptData,
  type ReceivedItem,
} from "../../components/MaterialReceiptForm";

const MAX_ATTENDANCE_HOURS = 16;

function normalizeWeather(raw: unknown): WeatherData {
  if (!raw || typeof raw !== "object") return { temp: "", condition: "" };
  const o = raw as Record<string, unknown>;
  return {
    temp: o.temp != null ? String(o.temp) : "",
    condition: o.condition != null ? String(o.condition) : "",
    ...(o.humidity != null ? { humidity: String(o.humidity) } : {}),
  };
}

function normalizeAttendance(raw: unknown): AttendanceRow[] {
  if (Array.isArray(raw)) {
    return (raw as unknown[])
      .map((r, i) => {
        if (r && typeof r === "object" && !Array.isArray(r)) {
          const o = r as Record<string, unknown>;
          if ("trade" in o || "company" in o) {
            const h = Number(o.hours_worked);
            return {
              id: String(o.id ?? `row-${i}`),
              company: String(o.company ?? ""),
              trade: String(o.trade ?? ""),
              headcount: Math.max(0, Number(o.headcount) || 0),
              hours_worked: Number.isFinite(h)
                ? Math.min(MAX_ATTENDANCE_HOURS, Math.max(0, h))
                : 8,
            } satisfies AttendanceRow;
          }
        }
        return null;
      })
      .filter(Boolean) as AttendanceRow[];
  }
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return Object.entries(raw as Record<string, number>).map(
      ([trade, headcount], i) => ({
        id: `legacy-${i}`,
        company: "",
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

export default function DailyLogDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [log, setLog] = useState<DailyLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [weatherData, setWeatherData] = useState<WeatherData>({
    temp: "",
    condition: "",
  });
  const [photos, setPhotos] = useState<string[]>([]);
  const [existingPhotoPaths, setExistingPhotoPaths] = useState<Set<string>>(
    new Set(),
  );
  const [attendanceRows, setAttendanceRows] = useState<AttendanceRow[]>([]);
  const [materialData, setMaterialData] = useState<MaterialReceiptData>({
    version: 2,
  });

  const [localProjectId, setLocalProjectId] = useState("");
  const [projectServerId, setProjectServerId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!log) {
        const projects = await database
          .get<Project>("projects")
          .query()
          .fetch();
        const p = projects[0];
        if (cancelled) return;
        setLocalProjectId(p?.id ?? "");
        setProjectServerId(p?.serverId ?? null);
        return;
      }
      const proj = await log.project.fetch();
      if (cancelled) return;
      setLocalProjectId(proj.id);
      setProjectServerId(proj.serverId ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [log]);

  useEffect(() => {
    const fetchLog = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      try {
        const foundLog = await database.get<DailyLog>("daily_logs").find(id);
        setLog(foundLog);
        setWeatherData(normalizeWeather(foundLog.weatherData));
        setAttendanceRows(normalizeAttendance(foundLog.attendanceData));
        setMaterialData(normalizeMaterialReceipt(foundLog.materialReceiptData));
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

  const handleSave = async () => {
    const invalidHours = attendanceRows.some(
      (r) =>
        r.hours_worked > MAX_ATTENDANCE_HOURS || r.hours_worked < 0,
    );
    if (invalidHours) {
      Alert.alert(
        "Attendance",
        `Hours per row must be between 0 and ${MAX_ATTENDANCE_HOURS}.`,
      );
      return;
    }

    setSaving(true);
    try {
      await database.write(async () => {
        let currentLog = log;

        if (!currentLog) {
          throw new Error("Log not loaded");
        }

        await currentLog.update((updatedLog) => {
          updatedLog.weatherData = weatherData;
          updatedLog.attendanceData = attendanceRows;
          updatedLog.materialReceiptData = materialData;
          updatedLog.status = "SUBMITTED";
        });

        for (const uri of photos) {
          if (!existingPhotoPaths.has(uri)) {
            await currentLog.addPhoto(uri);
          }
        }
      });
      setExistingPhotoPaths(new Set(photos));
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
        <Text className="text-lg font-bold text-foreground">Edit Log</Text>
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

        {materialData.work_notes ? (
          <View className="mb-4">
            <Text className="text-sm text-muted-foreground mb-1">Work notes</Text>
            <Text className="text-foreground">{materialData.work_notes}</Text>
          </View>
        ) : null}

        <WeatherWidget
          initialData={weatherData}
          onWeatherChange={setWeatherData}
        />

        <AttendanceSheet
          rows={attendanceRows}
          onChange={setAttendanceRows}
          maxHoursPerPerson={MAX_ATTENDANCE_HOURS}
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
        ) : (
          <Text className="text-muted-foreground text-sm mb-4">
            Add a project in the local database to use GRN.
          </Text>
        )}

        <PhotoCapture initialPhotos={photos} onPhotosChange={setPhotos} />
      </ScrollView>
    </SafeAreaView>
  );
}
