import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const auth = useAuthStore();
  if (auth.isAuthenticated) {
    config.headers.Authorization = `Bearer ${auth.token}`;
  }
  return config;
});

// Interceptor for 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const auth = useAuthStore();
      auth.logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
