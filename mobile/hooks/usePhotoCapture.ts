import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as ImageManipulator from 'expo-image-manipulator';
import { database } from '../lib/watermelon';

export function usePhotoCapture(dailyLogId: string | null) {
  const capturePhoto = async () => {
    if (!dailyLogId) {
      alert("Please save draft log before taking photos.");
      return null;
    }
    
    const cameraPerm = await ImagePicker.requestCameraPermissionsAsync();
    if (!cameraPerm.granted) {
      alert("Camera permission is required.");
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      exif: true,
    });
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      let location = null;
      if (status === 'granted') {
        location = await Location.getCurrentPositionAsync({});
      }
      
      const asset = result.assets[0];
      
      const compressed = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 1200 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      
      await database.write(async () => {
        await database.get('log_photos').create((photo: any) => {
          photo.dailyLogId = dailyLogId;
          photo.localPath = compressed.uri;
          if (location) {
            photo.gpsLat = location.coords.latitude;
            photo.gpsLong = location.coords.longitude;
          }
          photo.uploaded = false;
        });
      });
      
      return compressed.uri;
    }
    return null;
  };
  
  return { capturePhoto };
}
