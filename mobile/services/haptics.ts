import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

const canVibrate = Platform.OS !== "web";

export function hapticSuccess() {
  if (!canVibrate) return;
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

export function hapticError() {
  if (!canVibrate) return;
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}

export function hapticLight() {
  if (!canVibrate) return;
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export function hapticMedium() {
  if (!canVibrate) return;
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}
