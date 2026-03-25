import localforage from 'localforage';
import CryptoJS from 'crypto-js';

const SECRET_KEY = import.meta.env.VITE_STORAGE_SECRET || 'construction-connect-secure-offline-key';

localforage.config({
  name: 'ConstructionConnect',
  storeName: 'secure_offline_data',
});

export const secureStorage = {
  /**
   * Encrypts and saves data string to localforage
   */
  setItem: async <T>(key: string, value: T): Promise<void> => {
    try {
      const stringified = JSON.stringify(value);
      const encrypted = CryptoJS.AES.encrypt(stringified, SECRET_KEY).toString();
      await localforage.setItem(key, encrypted);
    } catch (e) {
      console.error('Error encrypting data for secure storage:', e);
      throw e;
    }
  },

  /**
   * Retrieves and decrypts data string from localforage
   */
  getItem: async <T>(key: string): Promise<T | null> => {
    try {
      const encrypted = await localforage.getItem<string>(key);
      if (!encrypted) return null;
      
      const decryptedBytes = CryptoJS.AES.decrypt(encrypted, SECRET_KEY);
      const decryptedString = decryptedBytes.toString(CryptoJS.enc.Utf8);
      
      if (!decryptedString) return null;
      
      return JSON.parse(decryptedString) as T;
    } catch (e) {
      console.error('Error decrypting data from secure storage:', e);
      return null;
    }
  },

  /**
   * Removes item from storage
   */
  removeItem: async (key: string): Promise<void> => {
    await localforage.removeItem(key);
  },

  /**
   * Clears the entire secure store
   */
  clear: async (): Promise<void> => {
    await localforage.clear();
  }
};
