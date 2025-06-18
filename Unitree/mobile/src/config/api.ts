import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ENV from './env';

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
    
    // Add debug logging in development
    if (ENV.DEBUG_MODE) {
      console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    return config;
  },
  (error) => {
    if (ENV.DEBUG_MODE) {
      console.error('🚫 API Request Error:', error);
    }
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    // Add debug logging in development
    if (ENV.DEBUG_MODE) {
      console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    }
    return response;
  },
  async (error) => {
    if (ENV.DEBUG_MODE) {
      console.error(`❌ API Response Error: ${error.response?.status} ${error.config?.url}`, error.response?.data);
    }
    
    if (error.response?.status === 401) {
      // Token expired, clear storage and redirect to login
      await AsyncStorage.multiRemove(['authToken', 'user']);
      
      // You could add navigation logic here or emit an event
      if (ENV.DEBUG_MODE) {
        console.log('🔑 Token expired, clearing auth data');
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