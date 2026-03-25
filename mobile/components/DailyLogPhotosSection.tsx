import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system/legacy";
import api from "../services/api";
import { getCachedGpsCoords } from "../services/locationCache";
import { hapticLight } from "../services/haptics";

export type DailyLogPhotoItem = {
  id?: string;
  uri: string;
  lat?: number | null;
  lng?: number | null;
  capturedAt?: number;
};

type Props = {
  items: DailyLogPhotoItem[];
  onChange: (items: DailyLogPhotoItem[]) => void;
  /** When true, skip add/delete UI (e.g. synced read-only log). */
  readOnly?: boolean;
  /** For edit screen: remove persisted Watermelon + server row before updating list. */
  onRemovePersisted?: (row: DailyLogPhotoItem) => Promise<void>;
};

async function compressAndPersist(uri: string): Promise<string> {
  const manipulated = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1200 } }],
    { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG },
  );
  const name = `site-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const dest = `${FileSystem.documentDirectory ?? ""}${name}`;
  if (Platform.OS === "web") {
    return manipulated.uri;
  }
  await FileSystem.copyAsync({ from: manipulated.uri, to: dest });
  return dest;
}

export function DailyLogPhotosSection({
  items,
  onChange,
  readOnly,
  onRemovePersisted,
}: Props) {
  const camRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraOpen, setCameraOpen] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [viewer, setViewer] = useState<DailyLogPhotoItem | null>(null);

  const addFromCamera = async () => {
    if (!permission?.granted) {
      const r = await requestPermission();
      if (!r.granted) {
        Alert.alert("Camera", "Camera permission is required for site photos.");
        return;
      }
    }
    setCameraOpen(true);
  };

  const onCapture = async () => {
    if (!camRef.current) return;
    setCapturing(true);
    try {
      const photo = await camRef.current.takePictureAsync({
        quality: 0.75,
        skipProcessing: Platform.OS === "android",
      });
      if (!photo?.uri) return;
      const coords = await getCachedGpsCoords();
      const localUri = await compressAndPersist(photo.uri);
      hapticLight();
      onChange([
        ...items,
        {
          uri: localUri,
          lat: coords?.lat ?? null,
          lng: coords?.lng ?? null,
          capturedAt: Date.now(),
        },
      ]);
      setCameraOpen(false);
    } catch (e) {
      console.error(e);
      Alert.alert("Camera", "Could not capture photo.");
    } finally {
      setCapturing(false);
    }
  };

  const removeAt = async (index: number) => {
    const row = items[index];
    if (row?.id && onRemovePersisted) {
      try {
        await onRemovePersisted(row);
      } catch (e) {
        console.warn(e);
      }
    } else if (row?.id) {
      api.delete(`/daily-logs/photos/${row.id}`).catch(() => {});
    }
    if (row?.uri && !row.uri.startsWith("http")) {
      FileSystem.deleteAsync(row.uri, { idempotent: true }).catch(() => {});
    }
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <View>
      <Text className="text-xs text-muted-foreground mb-2">
        Site photos (GPS tagged, compressed). Tap a photo to view details.
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-2">
        {!readOnly ? (
          <TouchableOpacity
            onPress={addFromCamera}
            className="w-24 h-24 bg-muted/30 rounded-xl items-center justify-center border border-dashed border-muted-foreground mr-3 min-h-[96px]"
          >
            <Text className="text-2xl">📷</Text>
            <Text className="text-[10px] text-muted-foreground mt-1 text-center px-1">
              Add photo
            </Text>
          </TouchableOpacity>
        ) : null}
        {items.map((p, i) => (
          <TouchableOpacity
            key={p.id ?? `${p.uri}-${i}`}
            onPress={() => setViewer(p)}
            className="mr-3"
          >
            <Image
              source={{ uri: p.uri }}
              className="w-24 h-24 rounded-xl bg-muted"
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal visible={cameraOpen} animationType="slide">
        <View className="flex-1 bg-black">
          <CameraView ref={camRef} style={{ flex: 1 }} facing="back" />
          <View className="absolute bottom-10 left-0 right-0 flex-row justify-center gap-6">
            <TouchableOpacity
              onPress={() => setCameraOpen(false)}
              className="bg-white/20 px-6 py-4 rounded-full"
            >
              <Text className="text-white font-bold">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onCapture}
              disabled={capturing}
              className="bg-primary px-8 py-4 rounded-full"
            >
              {capturing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-primary-foreground font-bold">Capture</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={!!viewer} transparent animationType="fade">
        <TouchableOpacity
          className="flex-1 bg-black/95 justify-center p-4"
          activeOpacity={1}
          onPress={() => setViewer(null)}
        >
          {viewer ? (
            <View>
              <Image
                source={{ uri: viewer.uri }}
                className="w-full aspect-square rounded-xl mb-4"
                resizeMode="contain"
              />
              <Text className="text-white mb-2">
                {viewer.lat != null && viewer.lng != null
                  ? `📍 ${viewer.lat.toFixed(5)}, ${viewer.lng.toFixed(5)}`
                  : "📍 No GPS"}
              </Text>
              {viewer.capturedAt ? (
                <Text className="text-white/70 text-sm mb-4">
                  {new Date(viewer.capturedAt).toLocaleString()}
                </Text>
              ) : null}
              {!readOnly ? (
                <TouchableOpacity
                  className="bg-destructive py-4 rounded-xl items-center"
                  onPress={() => {
                    const v = viewer;
                    setViewer(null);
                    const idx = items.findIndex(
                      (x) => (x.id && x.id === v.id) || x.uri === v.uri,
                    );
                    if (idx >= 0) void removeAt(idx);
                  }}
                >
                  <Text className="text-white font-bold">Delete</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity className="mt-4 py-3" onPress={() => setViewer(null)}>
                <Text className="text-white text-center">Close</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
