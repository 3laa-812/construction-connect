import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";

interface PhotoCaptureProps {
  onPhotosChange: (uris: string[]) => void;
  initialPhotos?: string[];
}

export default function PhotoCapture({
  onPhotosChange,
  initialPhotos = [],
}: PhotoCaptureProps) {
  const [photos, setPhotos] = useState<string[]>(initialPhotos);

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    // but for camera we might need it.
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Sorry, we need camera permissions to make this work!",
      );
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5, // Compress images
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const newUri = result.assets[0].uri;
      const newPhotos = [...photos, newUri];
      setPhotos(newPhotos);
      onPhotosChange(newPhotos);
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = [...photos];
    newPhotos.splice(index, 1);
    setPhotos(newPhotos);
    onPhotosChange(newPhotos);
  };

  return (
    <View className="bg-card p-4 rounded-xl border border-border mb-4">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-lg font-bold text-foreground">
          Progress Photos
        </Text>
        <TouchableOpacity
          onPress={pickImage}
          className="bg-primary px-3 py-1 rounded-full"
        >
          <Text className="text-primary-foreground text-xs font-bold">
            + Add Photo
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="flex-row"
      >
        {photos.length === 0 ? (
          <View className="h-24 w-full items-center justify-center border-2 border-dashed border-border rounded-lg p-4">
            <Text className="text-muted-foreground text-sm">
              No photos added yet
            </Text>
          </View>
        ) : (
          photos.map((uri, index) => (
            <View key={index} className="mr-3 relative">
              <Image
                source={{ uri }}
                className="w-24 h-24 rounded-lg bg-secondary"
              />
              <TouchableOpacity
                onPress={() => removePhoto(index)}
                className="absolute -top-2 -right-2 bg-destructive w-6 h-6 rounded-full items-center justify-center shadow-sm"
              >
                <Text className="text-white font-bold text-xs">X</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
