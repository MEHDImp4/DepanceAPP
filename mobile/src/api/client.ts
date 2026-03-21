import axios from 'axios';
import { useAppStore } from '../store/useAppStore';

const apiClient = axios.create({
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Dynamic Base URL Interceptor
apiClient.interceptors.request.use((config) => {
  const { serverUrl, token } = useAppStore.getState();
  
  // Set the dynamic server base URL dynamically per-request.
  if (serverUrl) {
    let baseUrl = serverUrl.endsWith('/') ? serverUrl.slice(0, -1) : serverUrl;
    // ensure it ends with /api as all routes in server/src/index.ts are prefixed with /api
    if (!baseUrl.toLowerCase().endsWith('/api')) {
      baseUrl = `${baseUrl}/api`;
    }
    config.baseURL = baseUrl;
  }
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Basic automatic logout if 401
    if (error?.response?.status === 401) {
      useAppStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default apiClient;
