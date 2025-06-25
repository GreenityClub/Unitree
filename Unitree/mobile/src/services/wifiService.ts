import api from '../config/api';
import ENV from '../config/env';

export interface WiFiSession {
  _id: string;
  user: string;
  ipAddress: string;
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
  ipAddress: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: number;
  };
  validationMethods?: {
    ipAddress: boolean;
    location: boolean;
  };
  campus?: string;
  distance?: number;
}

export interface WifiStats {
  periods: {
    today: {
      duration: number;
      points: number;
    };
    thisWeek: {
      duration: number;
      points: number;
    };
    thisMonth: {
      duration: number;
      points: number;
    };
    allTime: {
      duration: number;
      points: number;
    };
  };
  currentSession: {
    duration: number;
    points: number;
    isActive: boolean;
    startTime: string;
    ipAddress: string;
  } | null;
  sessionCount: number;
  lastResets: {
    day: string | null;
    week: string | null;
    month: string | null;
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
      // Handle 404 "No active session found" as a non-error case
      if (error.response?.status === 404 && error.response?.data?.message?.includes('No active session found')) {
        // Return a placeholder response for consistency, but don't throw an error
        return {
          _id: '',
          user: '',
          ipAddress: '',
          startTime: new Date(),
          duration: 0,
          sessionDate: new Date(),
          isActive: false
        };
      }
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

  async getActiveSession(): Promise<WifiStats['currentSession']> {
    try {
      const stats = await this.getStats();
      return stats.currentSession;
    } catch (error) {
      console.error('Failed to get active session:', error);
      return null;
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

  async getStats(): Promise<WifiStats> {
    try {
      const response = await api.get('/api/wifi/stats');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get WiFi statistics');
    }
  }

  async getSessionCount(): Promise<number> {
    try {
      const response = await api.get('/api/wifi/session-count');
      return response.data.sessionCount || 0;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get session count');
    }
  }

  async cleanupOrphanedSessions(): Promise<void> {
    try {
      const response = await api.post('/api/wifi/cleanup');
      console.log('Session cleanup result:', response.data.message);
    } catch (error: any) {
      console.error('Failed to cleanup sessions:', error);
      throw new Error(error.response?.data?.message || 'Failed to cleanup orphaned sessions');
    }
  }

  // Utility methods for WiFi management
  isValidUniversityIP(ipAddress: string): boolean {
    if (!ipAddress || typeof ipAddress !== 'string') return false;
    return this.extractIPPrefix(ipAddress) === ENV.UNIVERSITY_IP_PREFIX.toLowerCase();
  }

  extractIPPrefix(ipAddress: string): string {
    // Extract the first two octets (e.g. "192.168" from "192.168.1.100")
    if (!ipAddress || typeof ipAddress !== 'string') return '';
    const parts = ipAddress.split('.');
    if (parts.length < 2) return '';
    return parts.slice(0, 2).join('.').toLowerCase();
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
    const minutes = Math.floor(durationInSeconds / 60);
    return minutes; // 1 minute = 1 point
  }

  calculatePointsPerPeriod(stats: WifiStats): {
    todayPoints: number;
    weekPoints: number;
    monthPoints: number;
    totalPoints: number;
  } {
    return {
      todayPoints: stats.periods.today.points,
      weekPoints: stats.periods.thisWeek.points,
      monthPoints: stats.periods.thisMonth.points,
      totalPoints: stats.periods.allTime.points,
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

  formatWifiTime(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  }

  getSessionDisplayText(stats: WifiStats): string {
    if (!stats.currentSession || !stats.currentSession.isActive) {
      return 'No active session';
    }

    const points = Math.floor(stats.currentSession.duration / 60);
    return `Session Active - Earning 1 point per minute`;
  }
}

export const wifiService = new WiFiService();