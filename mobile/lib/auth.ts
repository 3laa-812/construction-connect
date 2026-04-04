import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'cc_auth_token';

export async function getToken(): Promise<string | null> {
  return await SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  return await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  return await SecureStore.deleteItemAsync(TOKEN_KEY);
}
