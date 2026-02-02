import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// REPLACE WITH YOUR ACTUAL LOCAL IP FOR ANDROID EMULATOR (10.0.2.2 usually) OR IOS (localhost)
// const API_URL = 'http://10.0.2.2:3000'; 
const API_URL = 'http://localhost:3000'; // For iOS Simulator

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('user_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
