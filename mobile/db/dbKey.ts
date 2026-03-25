import * as SecureStore from 'expo-secure-store'
import * as Crypto from 'expo-crypto'

const STORE_KEY = 'db_encryption_key'

/** 32-byte key as 64-char hex; stored in SecureStore for future SQLCipher / adapter use. */
export async function getOrCreateHexDbKey(): Promise<string> {
  let key = await SecureStore.getItemAsync(STORE_KEY)
  if (!key) {
    const bytes = await Crypto.getRandomBytesAsync(32)
    key = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
    await SecureStore.setItemAsync(STORE_KEY, key)
  }
  return key
}
