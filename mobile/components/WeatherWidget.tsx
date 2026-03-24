import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import * as Location from "expo-location";
import * as Network from "expo-network";
import Constants from "expo-constants";

export interface WeatherData {
  temp: string;
  condition: string;
  humidity?: string;
}

function readOpenWeatherKey(): string {
  const env =
    typeof process !== "undefined"
      ? process.env.EXPO_PUBLIC_OPENWEATHER_KEY
      : undefined;
  const extra = (
    Constants.expoConfig?.extra as { openWeatherKey?: string } | undefined
  )?.openWeatherKey;
  return String(env ?? extra ?? "").trim();
}

async function fetchOpenWeather(
  lat: number,
  lon: number,
): Promise<{ temp: number; condition: string; humidity?: number }> {
  const key = readOpenWeatherKey();
  if (!key) {
    throw new Error("NO_API_KEY");
  }
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${encodeURIComponent(key)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("FETCH_FAILED");
  }
  const json = (await res.json()) as {
    main?: { temp?: number; humidity?: number };
    weather?: Array<{ description?: string }>;
  };
  const condition = json.weather?.[0]?.description ?? "";
  return {
    temp: Number(json.main?.temp ?? 0),
    condition: String(condition),
    humidity: json.main?.humidity,
  };
}

interface WeatherWidgetProps {
  onWeatherChange: (data: WeatherData) => void;
  initialData?: WeatherData;
}

export default function WeatherWidget({
  onWeatherChange,
  initialData,
}: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData>(
    initialData || { temp: "", condition: "" },
  );
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setWeather((w) => ({ ...w, ...initialData }));
    }
  }, [initialData?.temp, initialData?.condition, initialData?.humidity]);

  const handleAutoFetch = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const key = readOpenWeatherKey();
      if (!key) {
        setErrorMsg("No API key — add EXPO_PUBLIC_OPENWEATHER_KEY or enter manually.");
        return;
      }

      const net = await Network.getNetworkStateAsync();
      if (!net.isConnected || net.isInternetReachable === false) {
        setErrorMsg("Offline — enter weather manually.");
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const data = await fetchOpenWeather(
        location.coords.latitude,
        location.coords.longitude,
      );

      const newData: WeatherData = {
        temp: data.temp.toString(),
        condition: data.condition,
        ...(data.humidity != null
          ? { humidity: String(data.humidity) }
          : {}),
      };
      setWeather(newData);
      onWeatherChange(newData);
    } catch (error) {
      if (error instanceof Error && error.message === "NO_API_KEY") {
        setErrorMsg("No API key — enter weather manually.");
      } else {
        setErrorMsg("Could not load weather — enter manually.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: keyof WeatherData, value: string) => {
    const newData = { ...weather, [key]: value };
    setWeather(newData);
    onWeatherChange(newData);
  };

  return (
    <View className="bg-card p-4 rounded-xl border border-border mb-4">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-lg font-bold text-foreground">Weather Log</Text>
        <TouchableOpacity
          onPress={handleAutoFetch}
          disabled={loading}
          className="bg-primary/10 px-3 py-1 rounded-full"
        >
          {loading ? (
            <ActivityIndicator size="small" color="hsl(var(--primary))" />
          ) : (
            <Text className="text-primary text-xs font-bold">
              Auto-Fetch 📍
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {errorMsg && (
        <Text className="text-destructive text-sm mb-2">{errorMsg}</Text>
      )}

      <View className="flex-row gap-4">
        <View className="flex-1">
          <Text className="text-muted-foreground text-xs mb-1">
            Temperature (°C)
          </Text>
          <TextInput
            className="bg-background text-foreground p-3 rounded-lg border border-border"
            placeholder="24"
            placeholderTextColor="hsl(var(--muted-foreground))"
            keyboardType="numeric"
            value={weather.temp}
            onChangeText={(t) => handleChange("temp", t)}
          />
        </View>
        <View className="flex-1">
          <Text className="text-muted-foreground text-xs mb-1">Condition</Text>
          <TextInput
            className="bg-background text-foreground p-3 rounded-lg border border-border"
            placeholder="Sunny"
            placeholderTextColor="hsl(var(--muted-foreground))"
            value={weather.condition}
            onChangeText={(t) => handleChange("condition", t)}
          />
        </View>
      </View>

      <View className="mt-3">
        <Text className="text-muted-foreground text-xs mb-1">
          Humidity % (optional)
        </Text>
        <TextInput
          className="bg-background text-foreground p-3 rounded-lg border border-border"
          placeholder="from API or manual"
          placeholderTextColor="hsl(var(--muted-foreground))"
          keyboardType="numeric"
          value={weather.humidity ?? ""}
          onChangeText={(t) => handleChange("humidity", t)}
        />
      </View>
    </View>
  );
}
