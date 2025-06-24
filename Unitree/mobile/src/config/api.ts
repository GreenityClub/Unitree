import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ENV from './env';
import { authEvents, AUTH_EVENTS } from '../utils/authEvents';
import { logger } from '../utils/logger';

// API Configuration using environment variables
const api = axios.create({
  baseURL: ENV.API_URL,
  timeout: ENV.API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Debug logging removed
    
    return config;
  },
  (error) => {
    logger.api.error('API Request Error', { data: error });
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    // Debug logging removed
    return response;
  },
  async (error) => {
    // Handle different types of API errors with appropriate logging levels
    if (error.response?.status === 409 && error.response?.data?.code === 'ACCOUNT_ALREADY_LOGGED_IN') {
      logger.auth.info(`Multi-device login blocked: ${error.config?.url}`, { data: error.response?.data });
    } else if (error.response?.status === 401 && error.response?.data?.code === 'SESSION_INVALID') {
      logger.auth.info(`Session invalidated: ${error.config?.url}`, { data: error.response?.data });
    } else if (error.response?.status === 401) {
      // Only log auth errors for non-routine endpoints to reduce noise
      const isRoutineEndpoint = error.config?.url?.includes('/stats') || 
                               error.config?.url?.includes('/session-count') ||
                               error.config?.url?.includes('/me');
      if (!isRoutineEndpoint) {
        logger.auth.warn(`Authentication required: ${error.config?.url}`);
      }
    } else if (error.response?.status === 500 && error.config?.url?.includes('/api/trees/real')) {
      // Don't log expected real tree collection errors (collection may not exist yet)
      logger.debug(`Real trees collection not available yet: ${error.config?.url}`);
    } else if (error.response?.status === 400 && error.config?.url?.includes('/api/wifi/start')) {
      // Don't log WiFi validation errors as errors - they're expected during location testing
      logger.wifi.info(`WiFi validation: ${error.response?.data?.message || 'Validation failed'}`);
    } else {
      logger.api.error(`API Response Error: ${error.response?.status} ${error.config?.url}`, { data: error.response?.data });
    }
    
    if (error.response?.status === 401) {
      const errorCode = error.response?.data?.code;
      
      if (errorCode === 'SESSION_INVALID') {
        // Session invalid - user was logged out from another device
        await AsyncStorage.multiRemove(['authToken', 'user']);
        authEvents.emit(AUTH_EVENTS.SESSION_INVALID);
        
        if (ENV.DEBUG_MODE) {
          console.log('🔑 Session invalidated - user logged out from another device');
        }
      } else {
        // Regular token expired, clear storage and redirect to login
        await AsyncStorage.multiRemove(['authToken', 'user']);
        authEvents.emit(AUTH_EVENTS.TOKEN_EXPIRED);
        
        if (ENV.DEBUG_MODE) {
          console.log('🔓 Authentication expired - clearing auth data');
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// API endpoints using environment variables
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/api/auth/login', { email, password }),
  
  register: (userData: any) =>
    api.post('/api/auth/register', userData),
  
  forgotPassword: (email: string) =>
    api.post('/api/auth/forgot-password', { email }),
  
  resetPassword: (token: string, newPassword: string) =>
    api.post('/api/auth/reset-password', { token, newPassword }),
  
  getMe: () =>
    api.get('/api/auth/me'),
  
  logout: () =>
    api.post('/api/auth/logout'),
  
  forceLogout: (email: string, password: string) =>
    api.post('/api/auth/force-logout', { email, password }),
};

export const wifiAPI = {
  startSession: (ssid: string, bssid: string) =>
    api.post('/api/wifi/start', { ssid, bssid }),
  
  endSession: () =>
    api.post('/api/wifi/end'),
  
  updateSession: () =>
    api.post('/api/wifi/update'),
  
  getActiveSession: () =>
    api.get('/api/wifi/active'),
  
  getHistory: () =>
    api.get('/api/wifi/history'),
  
  getStats: () =>
    api.get('/api/wifi/stats'),
};

export const pointsAPI = {
  getPoints: () =>
    api.get('/api/points'),
  
  addAttendancePoints: (duration: number, startTime: Date, endTime: Date) =>
    api.post('/api/points/attendance', { duration, startTime, endTime }),

  syncPoints: (points: number, source: string) =>
    api.post('/api/points/sync', { points, source }),
};

export const treeAPI = {
  getTrees: () =>
    api.get('/api/trees'),
  
  getTree: (id: string) =>
    api.get(`/api/trees/${id}`),
  
  redeemTree: (speciesId: string) =>
    api.post('/api/trees/redeem', { speciesId }),
  
  getTreeTypes: () =>
    api.get('/api/trees/types'),
};

export const userAPI = {
  getProfile: () =>
    api.get('/api/users/profile'),
  
  updateProfile: (userData: any) =>
    api.put('/api/users/profile', userData),

  getLeaderboard: (limit: number = 50) =>
    api.get(`/api/users/leaderboard?limit=${limit}`),
}; 