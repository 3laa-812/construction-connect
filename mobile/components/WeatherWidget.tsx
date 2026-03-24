import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
} from "react-native";
import * as Location from "expo-location";
import { fetchWeather, type WeatherData } from "../services/weather";

export type { WeatherData };

const CONDITIONS = ["Clear", "Cloudy", "Rain", "Sandstorm", "Fog"] as const;

function emptyWeather(): WeatherData {
  return {
    temp: 0,
    feels_like: 0,
    humidity: 0,
    wind_speed: 0,
    condition: "Clear",
    icon: "01d",
    fetched_at: new Date().toISOString(),
  };
}

/** Merge API / persisted / legacy log payloads into `WeatherData`. */
export function normalizeWeatherPayload(raw: unknown): WeatherData {
  if (!raw || typeof raw !== "object") {
    return emptyWeather();
  }
  const o = raw as Record<string, unknown>;
  const num = (v: unknown) =>
    typeof v === "number" && !Number.isNaN(v)
      ? v
      : parseFloat(String(v ?? "").replace(",", ".")) || 0;
  const str = (v: unknown) => String(v ?? "");
  return {
    temp: Math.round(num(o.temp)),
    feels_like: Math.round(num(o.feels_like ?? o.temp)),
    humidity: Math.round(num(o.humidity)),
    wind_speed: num(o.wind_speed),
    condition: str(o.condition) || "Clear",
    icon: str(o.icon) || "01d",
    fetched_at: str(o.fetched_at) || new Date().toISOString(),
  };
}

function WeatherDisplay({
  data,
  onRefresh,
  onManualOverride,
}: {
  data: WeatherData;
  onRefresh: () => void;
  onManualOverride: () => void;
}) {
  const fetched = new Date(data.fetched_at);
  const timeLabel = `${fetched.getHours().toString().padStart(2, "0")}:${fetched.getMinutes().toString().padStart(2, "0")}`;

  return (
    <View className="bg-card p-4 rounded-xl border border-border">
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <Text className="text-5xl font-bold text-foreground">{data.temp}°</Text>
          <Text className="text-muted-foreground text-base mt-1">
            Feels like {data.feels_like}° · {data.condition}
          </Text>
        </View>
        <Image
          source={{
            uri: `https://openweathermap.org/img/wn/${data.icon}@2x.png`,
          }}
          style={{ width: 72, height: 72 }}
        />
      </View>
      <Text className="text-sm text-muted-foreground mb-1">
        Humidity {data.humidity}% · Wind {data.wind_speed.toFixed(1)} m/s
      </Text>
      <Text className="text-xs text-muted-foreground mb-3">
        Fetched at {timeLabel}
      </Text>
      <View className="flex-row justify-between items-center">
        <TouchableOpacity
          onPress={onRefresh}
          className="py-2 px-3 rounded-lg bg-primary/15"
        >
          <Text className="text-primary font-bold text-sm">Refresh</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onManualOverride}>
          <Text className="text-primary text-sm font-semibold underline">
            Override
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ManualWeatherForm({
  onSubmit,
}: {
  onSubmit: (w: WeatherData) => void;
}) {
  const [temp, setTemp] = useState("24");
  const [humidity, setHumidity] = useState("45");
  const [wind, setWind] = useState("12");
  const [condition, setCondition] = useState<string>("Clear");

  const submit = () => {
    const t = parseFloat(temp) || 0;
    const h = parseFloat(humidity) || 0;
    const w = parseFloat(wind) || 0;
    onSubmit({
      temp: Math.round(t),
      feels_like: Math.round(t),
      humidity: Math.round(h),
      wind_speed: w,
      condition,
      icon: "01d",
      fetched_at: new Date().toISOString(),
    });
  };

  return (
    <View className="bg-card p-4 rounded-xl border border-border gap-3">
      <Text className="text-sm text-muted-foreground">
        Enter weather manually (offline or when GPS/API fails).
      </Text>
      <View>
        <Text className="text-xs text-muted-foreground mb-1">Temp (°C)</Text>
        <TextInput
          className="bg-background text-foreground p-3 rounded-lg border border-border"
          keyboardType="decimal-pad"
          value={temp}
          onChangeText={setTemp}
        />
      </View>
      <View>
        <Text className="text-xs text-muted-foreground mb-1">Humidity (%)</Text>
        <TextInput
          className="bg-background text-foreground p-3 rounded-lg border border-border"
          keyboardType="decimal-pad"
          value={humidity}
          onChangeText={setHumidity}
        />
      </View>
      <View>
        <Text className="text-xs text-muted-foreground mb-1">
          Wind speed (m/s)
        </Text>
        <TextInput
          className="bg-background text-foreground p-3 rounded-lg border border-border"
          keyboardType="decimal-pad"
          value={wind}
          onChangeText={setWind}
        />
      </View>
      <View>
        <Text className="text-xs text-muted-foreground mb-2">Condition</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row flex-wrap gap-2">
            {CONDITIONS.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setCondition(c)}
                className={`px-3 py-2 rounded-full border ${condition === c ? "border-primary bg-primary/15" : "border-border"}`}
              >
                <Text className="text-foreground text-xs font-medium">{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
      <TouchableOpacity
        onPress={submit}
        className="bg-primary py-3 rounded-xl items-center mt-2"
      >
        <Text className="text-primary-foreground font-bold">
          Use manual values
        </Text>
      </TouchableOpacity>
    </View>
  );
}

type Props = {
  onWeatherChange: (w: WeatherData) => void;
  initialData?: WeatherData | Record<string, unknown>;
  autoFetchOnMount?: boolean;
};

export default function WeatherWidget({
  onWeatherChange,
  initialData,
  autoFetchOnMount = true,
}: Props) {
  const onWeatherChangeRef = useRef(onWeatherChange);
  onWeatherChangeRef.current = onWeatherChange;

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(autoFetchOnMount);
  const [manual, setManual] = useState(false);

  useEffect(() => {
    if (autoFetchOnMount) return;
    const w = normalizeWeatherPayload(initialData);
    setWeather(w);
    onWeatherChangeRef.current(w);
    setLoading(false);
    setManual(false);
  }, [autoFetchOnMount, initialData]);

  useEffect(() => {
    if (!autoFetchOnMount) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          if (!cancelled) setManual(true);
          return;
        }
        const { coords } = await Location.getCurrentPositionAsync({});
        const w = await fetchWeather(coords.latitude, coords.longitude);
        if (!cancelled) {
          setWeather(w);
          onWeatherChangeRef.current(w);
        }
      } catch {
        if (!cancelled) setManual(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [autoFetchOnMount]);

  const runRefresh = async () => {
    setLoading(true);
    setManual(false);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setManual(true);
        return;
      }
      const { coords } = await Location.getCurrentPositionAsync({});
      const w = await fetchWeather(coords.latitude, coords.longitude);
      setWeather(w);
      onWeatherChangeRef.current(w);
    } catch {
      setManual(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !manual) {
    return (
      <View className="py-8 items-center justify-center">
        <ActivityIndicator size="large" color="hsl(var(--primary))" />
        <Text className="text-muted-foreground text-sm mt-2">
          Loading weather…
        </Text>
      </View>
    );
  }

  if (manual || !weather) {
    return (
      <ManualWeatherForm
        onSubmit={(w) => {
          setWeather(w);
          setManual(false);
          onWeatherChangeRef.current(w);
        }}
      />
    );
  }

  return (
    <WeatherDisplay
      data={weather}
      onRefresh={runRefresh}
      onManualOverride={() => setManual(true)}
    />
  );
}
