import axios, { AxiosInstance, AxiosResponse } from 'axios';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://unitree.onrender.com';
// const API_BASE_URL = 'http://localhost:3000';

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
    // Check if URL path is for admin routes
    const isAdminRoute = config.url?.includes('/api/admins') || 
                        config.url?.includes('/api/auth/admin') ||
                        config.url?.includes('/api/statistics') ||
                        config.url?.includes('/api/users') ||  // Add /api/users to admin routes
                        config.url?.includes('/api/trees/admin') || // Add tree admin routes
                        config.url?.includes('/api/points/admin') || // Add points admin routes
                        config.url?.includes('/api/wifi/sessions'); // Add WiFi sessions admin routes
    
    // Select the appropriate token based on the route
    const token = isAdminRoute 
      ? localStorage.getItem('adminAuthToken') 
      : localStorage.getItem('authToken');
    
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
    // Check if URL path is for admin routes
    const isAdminRoute = error.config?.url?.includes('/api/admins') || 
                        error.config?.url?.includes('/api/auth/admin') ||
                        error.config?.url?.includes('/api/statistics') ||
                        error.config?.url?.includes('/api/users') ||  // Add /api/users to admin routes
                        error.config?.url?.includes('/api/trees/admin') || // Add tree admin routes
                        error.config?.url?.includes('/api/points/admin') || // Add points admin routes
                        error.config?.url?.includes('/api/wifi/sessions'); // Add WiFi sessions admin routes
                        
    if (error.response?.status === 401) {
      // Handle unauthorized access based on route type
      if (isAdminRoute) {
        localStorage.removeItem('adminAuthToken');
        localStorage.removeItem('admin');
        window.location.href = '/admin/login';
      } else {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
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
    ADMIN_LOGIN: '/api/auth/admin/login',
    ADMIN_ME: '/api/auth/admin/me',
    ADMIN_SEED: '/api/auth/admin/seed',
    CHANGE_PASSWORD: '/api/auth/change-password', // New endpoint for password change
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
    // Admin specific tree endpoints
    ADMIN: {
      GET_ALL: '/api/trees/admin/all',
      GET_REAL_TREES: '/api/trees/admin/realtrees',
      GET_TREE_TYPES: '/api/trees/admin/treetypes',
      CREATE_TREE_TYPE: '/api/trees/admin/treetypes',
      UPDATE_TREE_TYPE: (id: string) => `/api/trees/admin/treetypes/${id}`,
      DELETE_TREE_TYPE: (id: string) => `/api/trees/admin/treetypes/${id}`
    },
    // Real tree specific endpoints
    REAL: {
      GET_ALL: '/api/trees/real',
      REDEEM: '/api/trees/redeem'
    }
  },
  // Points endpoints
  POINTS: {
    GET_BALANCE: '/api/points/balance',
    GET_HISTORY: '/api/points/history',
    GET_LEADERBOARD: '/api/points/leaderboard',
    ADMIN: {
      GET_ALL: '/api/points/admin/all',
      ADJUST: '/api/points/admin/adjust'
    }
  },
  // WiFi endpoints
  WIFI: {
    GET_SESSIONS: '/api/wifi/sessions',
    START_SESSION: '/api/wifi/start',
    STOP_SESSION: '/api/wifi/stop',
    GET_STATUS: '/api/wifi/status',
    GET_SESSION_BY_ID: (id: string) => `/api/wifi/sessions/${id}`
  },
  // Notification endpoints
  NOTIFICATION: {
    GET_ALL: '/api/notification',
    MARK_READ: (id: string) => `/api/notification/${id}/read`,
    MARK_ALL_READ: '/api/notification/mark-all-read',
    SETTINGS: '/api/user/notification-settings',
    ADMIN: '/api/admin/notifications', // New endpoint for admin notifications
  },
  // Admin endpoints
  ADMIN: {
    GET_ALL: '/api/admins',
    GET_BY_ID: (id: string) => `/api/admins/${id}`,
    CREATE: '/api/admins',
    UPDATE: (id: string) => `/api/admins/${id}`,
    DELETE: (id: string) => `/api/admins/${id}`,
    RESET_PASSWORD: (id: string) => `/api/admins/${id}/reset-password`,
  },
  // Statistics endpoints
  STATISTICS: {
    OVERVIEW: '/api/statistics/overview',
    MONTHLY: '/api/statistics/monthly',
    TREE_TYPES: '/api/statistics/tree-types',
    USER_ACTIVITY: '/api/statistics/user-activity',
    POINTS_DISTRIBUTION: '/api/statistics/points-distribution',
    DAILY_SESSIONS: '/api/statistics/daily-sessions',
    WIFI_HOURS: '/api/statistics/wifi-hours',
    POINTS_EARNED: '/api/statistics/points-earned'
  },
  // Settings endpoints
  SETTINGS: {
    GET: '/api/settings',
    UPDATE: '/api/settings',
    RESET: '/api/settings/reset'
  },
};

export default apiClient; 