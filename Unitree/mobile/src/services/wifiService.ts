import api from '../config/api';
import ENV from '../config/env';

export interface WiFiSession {
  _id: string;
  user: string;
  ssid: string;
  bssid?: string;
  startTime: Date;
  endTime?: Date;
  pointsEarned?: number;
}

export interface StartSessionData {
  ssid: string;
  bssid?: string;
}

class WiFiService {
  async startSession(data: StartSessionData): Promise<WiFiSession> {
    try {
      const response = await api.post('/api/wifi/start', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to start WiFi session');
    }
  }

  async endSession(): Promise<WiFiSession> {
    try {
      const response = await api.post('/api/wifi/end');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to end WiFi session');
    }
  }

  async getActiveSession(): Promise<WiFiSession | null> {
    try {
      const response = await api.get('/api/wifi/active');
      return response.data;
    } catch (error: any) {
      // Return null if no active session, don't throw error
      if (error.response?.status === 404) {
        return null;
      }
      throw new Error(error.response?.data?.message || 'Failed to get active session');
    }
  }

  async getSessionHistory(): Promise<WiFiSession[]> {
    try {
      const response = await api.get('/api/wifi/history');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get session history');
    }
  }

  // Utility methods for WiFi management
  isUniversityWiFi(ssid: string): boolean {
    return ENV.UNIVERSITY_SSIDS.includes(ssid);
  }

  calculateSessionDuration(startTime: Date, endTime?: Date): number {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    return Math.floor((end.getTime() - start.getTime()) / 1000); // Duration in seconds
  }

  formatSessionDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  calculatePointsEarned(durationInSeconds: number): number {
    const hours = durationInSeconds / 3600;
    return Math.floor(hours * ENV.POINTS_PER_HOUR);
  }
}

export const wifiService = new WiFiService(); 