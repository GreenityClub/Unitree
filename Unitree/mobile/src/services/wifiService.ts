import api from '../config/api';
import ENV from '../config/env';

export interface WiFiSession {
  _id: string;
  user: string;
  ssid: string;
  bssid: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  pointsEarned?: number;
  sessionDate: Date;
  isActive: boolean;
  currentDuration?: number;
  potentialPoints?: number;
}

export interface StartSessionData {
  ssid: string;
  bssid: string;
}

export interface WiFiStats {
  today: {
    duration: number;
    points: number;
    sessions: number;
  };
  week: {
    duration: number;
    points: number;
    sessions: number;
  };
  month: {
    duration: number;
    points: number;
    sessions: number;
  };
  total: {
    duration: number;
    points: number;
    sessions: number;
  };
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

  async updateSession(): Promise<WiFiSession> {
    try {
      const response = await api.post('/api/wifi/update');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update WiFi session');
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

  async getStats(): Promise<WiFiStats> {
    try {
      const response = await api.get('/api/wifi/stats');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get WiFi statistics');
    }
  }

  // Utility methods for WiFi management
  isUniversityWiFi(ssid: string): boolean {
    return ENV.UNIVERSITY_SSIDS.some(universitySSID => 
      ssid.toLowerCase().includes(universitySSID.toLowerCase())
    );
  }

  isValidUniversityBSSID(bssid: string): boolean {
    if (!bssid) return false;
    return bssid.toLowerCase().startsWith(ENV.UNIVERSITY_BSSID_PREFIX.toLowerCase());
  }

  extractBSSIDPrefix(bssid: string): string {
    // Extract first 8 characters (first 4 octets) of BSSID
    if (!bssid || bssid.length < 8) return '';
    return bssid.slice(0, 8).toLowerCase();
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

  formatDurationHuman(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return `${seconds}s`;
    }
  }

  calculatePointsEarned(durationInSeconds: number): number {
    const hours = durationInSeconds / 3600;
    return Math.floor(hours * ENV.POINTS_PER_HOUR);
  }

  calculatePointsPerPeriod(stats: WiFiStats): {
    todayPoints: number;
    weekPoints: number;
    monthPoints: number;
    totalPoints: number;
  } {
    return {
      todayPoints: stats.today.points,
      weekPoints: stats.week.points,
      monthPoints: stats.month.points,
      totalPoints: stats.total.points,
    };
  }

  // Helper methods for time period calculations
  getTimeUntilDayReset(): number {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return Math.floor((tomorrow.getTime() - now.getTime()) / 1000);
  }

  getTimeUntilWeekReset(): number {
    const now = new Date();
    const nextWeek = new Date(now);
    nextWeek.setDate(now.getDate() + (7 - now.getDay()));
    nextWeek.setHours(0, 0, 0, 0);
    return Math.floor((nextWeek.getTime() - now.getTime()) / 1000);
  }

  getTimeUntilMonthReset(): number {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return Math.floor((nextMonth.getTime() - now.getTime()) / 1000);
  }
}

export const wifiService = new WiFiService(); 