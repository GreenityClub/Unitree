import axios, { AxiosInstance, AxiosResponse } from 'axios';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
    VERIFY_EMAIL: '/api/auth/verify-email',
    REFRESH_TOKEN: '/api/auth/refresh-token',
  },
  // User endpoints
  USER: {
    PROFILE: '/api/users/profile',
    UPDATE_PROFILE: '/api/users/profile',
    UPLOAD_AVATAR: '/api/users/avatar',
    GET_AVATAR: '/uploads/avatars',
  },
  // Tree endpoints
  TREE: {
    GET_ALL: '/api/trees',
    GET_BY_ID: (id: string) => `/api/trees/${id}`,
    CREATE: '/api/trees',
    UPDATE: (id: string) => `/api/trees/${id}`,
    DELETE: (id: string) => `/api/trees/${id}`,
    TYPES: '/api/trees/types',
  },
  // Points endpoints
  POINTS: {
    GET_BALANCE: '/api/points/balance',
    GET_HISTORY: '/api/points/history',
    GET_LEADERBOARD: '/api/points/leaderboard',
  },
  // WiFi endpoints
  WIFI: {
    GET_SESSIONS: '/api/wifi/sessions',
    START_SESSION: '/api/wifi/start',
    STOP_SESSION: '/api/wifi/stop',
    GET_STATUS: '/api/wifi/status',
  },
  // Notification endpoints
  NOTIFICATION: {
    GET_ALL: '/api/notification',
    MARK_READ: (id: string) => `/api/notification/${id}/read`,
    MARK_ALL_READ: '/api/notification/mark-all-read',
    SETTINGS: '/api/user/notification-settings',
  },
};

export default apiClient; 