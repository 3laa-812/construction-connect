const OWM_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_KEY;

export interface WeatherData {
  temp: number;
  feels_like: number;
  humidity: number;
  wind_speed: number;
  condition: string;
  icon: string;
  fetched_at: string;
}

export async function fetchWeather(
  lat: number,
  lon: number,
): Promise<WeatherData> {
  if (!OWM_KEY) {
    throw new Error("Weather fetch failed: missing EXPO_PUBLIC_OPENWEATHER_KEY");
  }
  const url =
    `https://api.openweathermap.org/data/2.5/weather` +
    `?lat=${lat}&lon=${lon}&appid=${encodeURIComponent(OWM_KEY)}&units=metric`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Weather fetch failed");
  const d = (await res.json()) as {
    main: { temp: number; feels_like: number; humidity: number };
    wind: { speed: number };
    weather: Array<{ main: string; icon: string }>;
  };
  return {
    temp: Math.round(d.main.temp),
    feels_like: Math.round(d.main.feels_like),
    humidity: d.main.humidity,
    wind_speed: d.wind.speed,
    condition: d.weather[0].main,
    icon: d.weather[0].icon,
    fetched_at: new Date().toISOString(),
  };
}
