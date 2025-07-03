import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ENV from './env';
import { authEvents, AUTH_EVENTS } from '../utils/authEvents';
import { logger } from '../utils/logger';

// API Configuration using environment variables with improved timeout handling
const api = axios.create({
  baseURL: ENV.API_URL,
  timeout: ENV.API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create a separate API instance for critical auth operations with shorter timeout
const authApi = axios.create({
  baseURL: ENV.API_URL,
  timeout: 5000, // 5 second timeout for auth operations
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
const addAuthToken = async (config: any) => {
  // Don't add auth token for refresh endpoint as it uses refreshToken in body
  if (config.url?.includes('/api/auth/refresh')) {
    return config;
  }
  
  const token = await AsyncStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

// Apply auth token interceptor to both API instances
api.interceptors.request.use(addAuthToken, (error) => {
  logger.api.error('API Request Error', { data: error });
  return Promise.reject(error);
});

authApi.interceptors.request.use(addAuthToken, (error) => {
  logger.api.error('Auth API Request Error', { data: error });
  return Promise.reject(error);
});

// Function to refresh access token with retry logic
const refreshAccessToken = async () => {
  try {
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    // Use shorter timeout for auth operations
    const response = await authApi.post('/api/auth/refresh', {
      refreshToken
    });

    const { token, refreshToken: newRefreshToken } = response.data;
    
    // Store new tokens
    await AsyncStorage.multiSet([
      ['authToken', token],
      ['refreshToken', newRefreshToken || refreshToken]
    ]);

    return token;
  } catch (error) {
    // If refresh fails, clear all auth data
    await AsyncStorage.multiRemove(['authToken', 'refreshToken', 'user']);
    throw error;
  }
};

// Enhanced response interceptor with better timeout handling
const handleApiResponse = async (error: any) => {
  // Handle network timeouts specifically
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    logger.api.warn(`API Timeout: ${error.config?.url} (${error.config?.timeout}ms)`);
    
    // For auth endpoints, provide specific timeout handling
    if (error.config?.url?.includes('/api/auth/me')) {
      logger.auth.warn('Auth check timeout - will retry with cached data if available');
      // Don't emit auth events for timeout - let the app handle gracefully
      return Promise.reject(new Error('AUTH_CHECK_TIMEOUT'));
    }
    
    return Promise.reject(new Error('NETWORK_TIMEOUT'));
  }

  // Handle different types of API errors with appropriate logging levels
  if (error.response?.status === 409 && error.response?.data?.code === 'ACCOUNT_ALREADY_LOGGED_IN') {
    logger.auth.info(`Multi-device login blocked: ${error.config?.url}`, { data: error.response?.data });
  } else if (error.response?.status === 401 && error.response?.data?.code === 'SESSION_INVALID') {
    logger.auth.info(`Session invalidated: ${error.config?.url}`, { data: error.response?.data });
  } else if (error.response?.status === 401) {
    // Only log auth errors for non-routine endpoints to reduce noise
    const isRoutineEndpoint = error.config?.url?.includes('/stats') || 
                             error.config?.url?.includes('/session-count') ||
                             error.config?.url?.includes('/me') ||
                             error.config?.url?.includes('/api/auth/refresh');
    if (!isRoutineEndpoint) {
      logger.auth.warn(`Authentication required: ${error.config?.url}`);
    }
  } else if (error.response?.status === 500 && error.config?.url?.includes('/api/trees/real')) {
    // Don't log expected real tree collection errors (collection may not exist yet)
    logger.debug(`Real trees collection not available yet: ${error.config?.url}`);
  } else if (error.response?.status === 400 && error.config?.url?.includes('/api/wifi/start')) {
    // Don't log WiFi validation errors as errors - they're expected during location testing
    logger.wifi.info(`WiFi validation: ${error.response?.data?.message || 'Validation failed'}`);
  } else if (error.response?.status === 404 && error.config?.url?.includes('/api/wifi/end')) {
    // Don't log 404 for WiFi end session as error - user might not have an active session (e.g., during logout)
    logger.wifi.info(`No active WiFi session to end: ${error.response?.data?.message || 'No active session'}`);
  } else if (error.response) {
    logger.api.error(`API Response Error: ${error.response?.status} ${error.config?.url}`, { data: error.response?.data });
  }
  
  if (error.response?.status === 401) {
    const errorCode = error.response?.data?.code;
    const originalRequest = error.config;
    
    if (errorCode === 'SESSION_INVALID') {
      // Session invalid - user was logged out from another device
      await AsyncStorage.multiRemove(['authToken', 'refreshToken', 'user']);
      authEvents.emit(AUTH_EVENTS.SESSION_INVALID);
      
      if (ENV.DEBUG_MODE) {
        console.log('🔑 Session invalidated - user logged out from another device');
      }
    } else if (!originalRequest._retry) {
      // Try to refresh token before giving up
      originalRequest._retry = true;
      
      try {
        const newToken = await refreshAccessToken();
        
        // Update the failed request with new token and retry
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        
        if (ENV.DEBUG_MODE) {
          console.log('🔄 Token refreshed successfully, retrying request');
        }
        
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear storage and redirect to login
        await AsyncStorage.multiRemove(['authToken', 'refreshToken', 'user']);
        authEvents.emit(AUTH_EVENTS.TOKEN_EXPIRED);
        
        if (ENV.DEBUG_MODE) {
          console.log('🔓 Token refresh failed - clearing auth data');
        }
      }
    } else {
      // Already tried to refresh, clear storage and redirect to login
      await AsyncStorage.multiRemove(['authToken', 'refreshToken', 'user']);
      authEvents.emit(AUTH_EVENTS.TOKEN_EXPIRED);
      
      if (ENV.DEBUG_MODE) {
        console.log('🔓 Authentication expired after refresh attempt - clearing auth data');
      }
    }
  }
  return Promise.reject(error);
};

// Apply response interceptor to both API instances
api.interceptors.response.use(
  (response) => response,
  handleApiResponse
);

authApi.interceptors.response.use(
  (response) => response,
  handleApiResponse
);

export default api;

// API endpoints using environment variables
export const authAPI = {
  login: (email: string, password: string) =>
    authApi.post('/api/auth/login', { email, password }),
  
  register: (userData: any) =>
    authApi.post('/api/auth/register', userData),
  
  forgotPassword: (email: string) =>
    authApi.post('/api/auth/forgot-password', { email }),
  
  resetPassword: (token: string, newPassword: string) =>
    authApi.post('/api/auth/reset-password', { token, newPassword }),
  
  getMe: () =>
    authApi.get('/api/auth/me'),
  
  logout: () =>
    authApi.post('/api/auth/logout'),
  
  forceLogout: (email: string, password: string) =>
    authApi.post('/api/auth/force-logout', { email, password }),
  
  refreshToken: (refreshToken: string) =>
    authApi.post('/api/auth/refresh', { refreshToken }),
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