import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import * as Location from "expo-location";

// Mock Weather API function (Replace with real API call later)
const fetchWeather = async (lat: number, lon: number) => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return {
    temp: 24,
    condition: "Sunny",
    location: "Construction Site A",
  };
};

interface WeatherData {
  temp: string;
  condition: string;
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

  const handleAutoFetch = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const data = await fetchWeather(
        location.coords.latitude,
        location.coords.longitude,
      );

      const newData = {
        temp: data.temp.toString(),
        condition: data.condition,
      };
      setWeather(newData);
      onWeatherChange(newData);
    } catch (error) {
      setErrorMsg("Failed to fetch weather");
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
            className="bg-secondary text-foreground p-3 rounded-lg border border-border"
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
            className="bg-secondary text-foreground p-3 rounded-lg border border-border"
            placeholder="Sunny"
            placeholderTextColor="hsl(var(--muted-foreground))"
            value={weather.condition}
            onChangeText={(t) => handleChange("condition", t)}
          />
        </View>
      </View>
    </View>
  );
}
