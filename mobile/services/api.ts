import axios from 'axios';
import { getAuthToken } from './storage';
import { Platform } from 'react-native';

// REPLACE WITH YOUR ACTUAL LOCAL IP FOR ANDROID EMULATOR (10.0.2.2 usually) OR IOS (localhost)
// If running on physical device, use your machine's LAN IP (e.g. 192.168.1.x)
export const API_URL = Platform.OS === 'web' 
  ? 'http://localhost:3000' 
  : 'http://192.168.1.8:3000'; // Updated for LAN access

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

api.interceptors.request.use(
  async (config) => {
    const token = await getAuthToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
