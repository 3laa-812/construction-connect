import * as Location from "expo-location";

type Cached = { lat: number; lng: number; at: number };

let cached: Cached | null = null;
const TTL_MS = 60_000;

export async function getCachedGpsCoords(): Promise<{
  lat: number;
  lng: number;
} | null> {
  const now = Date.now();
  if (cached && now - cached.at < TTL_MS) {
    return { lat: cached.lat, lng: cached.lng };
  }
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    return null;
  }
  const pos = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  cached = {
    lat: pos.coords.latitude,
    lng: pos.coords.longitude,
    at: now,
  };
  return { lat: cached.lat, lng: cached.lng };
}
