import axios from 'axios';
import { getToken } from './auth';

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'https://api.your-domain.com',
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Avoid circular dependency with authStore but handle 401 globally later inside app root or via callback
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handling 401s will be wired up near the root to coordinate with Zustand
    return Promise.reject(error);
  }
);
