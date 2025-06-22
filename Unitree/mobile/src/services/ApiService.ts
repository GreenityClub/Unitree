import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../config/api';

interface StartWifiSessionData {
  ssid: string;
  bssid: string;
  startTime: string;
}

class ApiService {
  private static instance: ApiService;
  private token: string | null = null;

  constructor() {
    this.initializeToken();
  }

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private async initializeToken() {
    try {
      this.token = await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Error loading token:', error);
    }
  }

  getToken(): string | null {
    return this.token;
  }

  async setToken(token: string) {
    this.token = token;
    await AsyncStorage.setItem('authToken', token);
  }

  async clearToken() {
    this.token = null;
    await AsyncStorage.removeItem('authToken');
  }

  async request(method: string, endpoint: string, data?: any) {
    try {
      const response = await api.request({
        method: method.toLowerCase(),
        url: endpoint,
        data,
      });
      return response.data;
    } catch (error: any) {
      console.error(`ApiService ${method} ${endpoint} error:`, error);
      throw new Error(error.response?.data?.message || error.message || 'Request failed');
    }
  }

  // HTTP method shortcuts
  async get(endpoint: string, params?: any) {
    return this.request('GET', endpoint, params);
  }

  async post(endpoint: string, data?: any) {
    return this.request('POST', endpoint, data);
  }

  async put(endpoint: string, data?: any) {
    return this.request('PUT', endpoint, data);
  }

  async patch(endpoint: string, data?: any) {
    return this.request('PATCH', endpoint, data);
  }

  async delete(endpoint: string, data?: any) {
    return this.request('DELETE', endpoint, data);
  }

  async startWifiSession(data: StartWifiSessionData) {
    return this.post('/api/wifi/start', data);
  }

  async endWifiSession() {
    return this.post('/api/wifi/end');
  }

  async updateWifiSession() {
    return this.post('/api/wifi/update');
  }

  async getActiveWifiSession() {
    return this.get('/api/wifi/active');
  }

  async getWifiStats() {
    return this.get('/api/wifi/stats');
  }

  async getWifiHistory() {
    return this.get('/api/wifi/history');
  }
}

export default ApiService.getInstance(); 