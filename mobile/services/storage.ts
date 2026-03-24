import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export async function setItem(key: string, value: string) {
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.error('Local storage unavailable:', e);
    }
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

export async function getItem(key: string) {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.error('Local storage unavailable:', e);
      return null;
    }
  } else {
    return await SecureStore.getItemAsync(key);
  }
}

/** Prefer `auth_token`; fall back to legacy `user_token`. */
export async function getAuthToken(): Promise<string | null> {
  return (await getItem('auth_token')) || (await getItem('user_token')) || null
}

export async function deleteItem(key: string) {
  if (Platform.OS === 'web') {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error('Local storage unavailable:', e);
    }
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}
