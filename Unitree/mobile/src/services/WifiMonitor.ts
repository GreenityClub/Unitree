import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { wifiService } from './wifiService';
import ENV from '../config/env';
import * as Location from 'expo-location';
import { Platform } from 'react-native';
import locationService, { LocationData } from './locationService';

// ---- Types -----------------------------------------------------------------
interface SessionInfo {
  startTime: Date;
  ipAddress: string | null;
  duration: number;         // seconds
  durationMinutes: number;  // rounded minutes
  sessionCount: number;     // number of sessions today
}

interface ConnectionChangeData {
  isConnected: boolean;
  sessionInfo: SessionInfo | null;
}

type WifiEventType = 'connectionChange' | 'sessionUpdate' | 'statsUpdate';
type WifiEventCallback = (data: ConnectionChangeData | any) => void;

// ---- Implementation --------------------------------------------------------
class WifiMonitor {
  private monitoring = false;
  private sessionStartTime: Date | null = null;
  private currentIPAddress: string | null = null;
  private sessionCount: number = 0;
  private listeners: Map<number, WifiEventCallback> = new Map();
  private unsubscribeNetInfo: (() => void) | null = null;
  private sessionUpdateTimer: ReturnType<typeof setInterval> | null = null;
  private statsUpdateTimer: ReturnType<typeof setInterval> | null = null;

  // Public API ---------------------------------------------------------------
  async start(onPointsEarned?: (points: number) => void): Promise<void> {
    if (this.monitoring) return;
    this.monitoring = true;

    // Initialize location service for enhanced validation
    console.log('[WiFiMonitor] Initializing location service...');
    await locationService.initialize();

    // Android requires location permission and location services enabled to access real BSSID
    if (Platform.OS === 'android') {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('[WiFiMonitor] Location permission denied – WiFi BSSID will be masked by the system.');
      }
    }

    // Get initial session count
    await this.refreshSessionCount();

    // Subscribe to realtime network changes
    this.unsubscribeNetInfo = NetInfo.addEventListener(this.handleNetInfo);

    // Perform an initial check immediately
    const info = await NetInfo.fetch();
    this.handleNetInfo(info);

    // Periodically refresh local session info so UI stays up to date
    this.sessionUpdateTimer = setInterval(() => {
      if (this.sessionStartTime) {
        this.notifyListeners({ isConnected: true, sessionInfo: this.buildSessionInfo() });
        this.notifyStatsUpdate();
      }
    }, 30 * 1000);

    // Update session statistics every minute
    this.statsUpdateTimer = setInterval(async () => {
      if (this.sessionStartTime) {
        try {
          await wifiService.updateSession();
          this.notifyStatsUpdate();
        } catch (error: any) {
          // If server says no active session, sync our local state
          if (error.response?.status === 404 || error.message?.includes('No active session found')) {
            console.log('📡 Server has no active session, syncing local state');
            this.sessionStartTime = null;
            this.currentIPAddress = null;
            this.notifyListeners({ isConnected: false, sessionInfo: null });
            this.notifyStatsUpdate();
          } else {
            console.error('Failed to update session stats:', error);
          }
        }
      }
    }, 60 * 1000); // Every minute
  }

  stop(): void {
    if (!this.monitoring) return;
    this.monitoring = false;
    if (this.unsubscribeNetInfo) this.unsubscribeNetInfo();
    this.unsubscribeNetInfo = null;
    if (this.sessionUpdateTimer) clearInterval(this.sessionUpdateTimer);
    this.sessionUpdateTimer = null;
    if (this.statsUpdateTimer) clearInterval(this.statsUpdateTimer);
    this.statsUpdateTimer = null;
  }

  isRunning(): boolean {
    return this.monitoring;
  }

  resetSessionState(): void {
    this.sessionStartTime = null;
    this.currentIPAddress = null;
    this.sessionCount = 0;
    this.listeners.clear();
  }

  getSessionInfo(): SessionInfo | null {
    return this.buildSessionInfo();
  }

  getSessionCount(): number {
    return this.sessionCount;
  }

  addListener(eventType: WifiEventType, cb: WifiEventCallback): () => void {
    const id = Date.now() + Math.random();
    this.listeners.set(id, cb);
    return () => {
      this.listeners.delete(id);
    };
  }

  // Internal helpers ---------------------------------------------------------
  private notifyListeners(data: ConnectionChangeData) {
    this.listeners.forEach(cb => {
      try { cb(data); } catch (e) { console.error('WiFiMonitor listener error', e); }
    });
  }

  private notifyStatsUpdate() {
    this.listeners.forEach(cb => {
      try { 
        cb({ 
          type: 'statsUpdate', 
          sessionCount: this.sessionCount,
          currentSession: this.buildSessionInfo()
        }); 
      } catch (e) { 
        console.error('WiFiMonitor stats update error', e); 
      }
    });
  }

  private async refreshSessionCount(): Promise<void> {
    try {
      const stats = await wifiService.getStats();
      // Count sessions from today
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      const history = await wifiService.getSessionHistory();
      this.sessionCount = history.filter(session => {
        const sessionDate = new Date(session.sessionDate);
        return sessionDate >= todayStart;
      }).length;
    } catch (error) {
      console.error('Failed to refresh session count:', error);
      this.sessionCount = 0;
    }
  }

  private async handleNetInfo(state: NetInfoState): Promise<void> {
    // We only care about WiFi connections
    if (state.type === 'wifi' && state.isConnected && state.details) {
      const details: any = state.details;
      const ipAddress = details.ipAddress || null;

      // Enhanced validation using both IP address and location
      const validationResult = await locationService.validateWiFiSession(ipAddress || '');

      console.log('Enhanced WiFi connection check:', {
        ipAddress,
        isValidIP: validationResult.validationMethods.ipAddress,
        isValidLocation: validationResult.validationMethods.location,
        isOverallValid: validationResult.isValid,
        requiresBoth: true,
        distance: validationResult.distance,
        campus: validationResult.campus
      });

      if (validationResult.isValid) {
        // Connected to university WiFi AND on campus
        if (!this.sessionStartTime) {
          // No active session, start a new one
          await this.startSession(ipAddress, validationResult);
        } else if (this.currentIPAddress !== ipAddress) {
          // IP address changed, end current session and start new one
          console.log('📶 IP address changed in foreground, ending previous session and starting new one');
          await this.endSession();
          await this.startSession(ipAddress, validationResult);
        } else {
          // Same session, just update info
          this.currentIPAddress = ipAddress;
          this.notifyListeners({ isConnected: true, sessionInfo: this.buildSessionInfo() });
        }
        return;
      }
    }

    // If we reach here, we are NOT connected to the university WiFi
    if (this.sessionStartTime) {
      await this.endSession();
    } else {
      this.notifyListeners({ isConnected: false, sessionInfo: null });
    }
  }

  private async startSession(ipAddress: string | null, validationResult?: any): Promise<void> {
    this.sessionStartTime = new Date();
    this.currentIPAddress = ipAddress;
    this.sessionCount += 1;

    try {
      await wifiService.startSession({ 
        ipAddress: ipAddress ?? '',
        location: validationResult?.location,
        validationMethods: validationResult?.validationMethods,
        campus: validationResult?.campus,
        distance: validationResult?.distance
      });
    } catch (err: any) {
      // Don't log validation errors as errors - they're expected during testing
      if (err.message?.includes('must be connected to university WiFi AND be physically on campus')) {
        console.log('📡 WiFi session validation: Both university WiFi and campus location required');
      } else {
        console.error('Failed to start WiFi session', err);
      }
      // If we fail to register on server, still treat as started locally
    }

    this.notifyListeners({ isConnected: true, sessionInfo: this.buildSessionInfo() });
    this.notifyStatsUpdate();
  }

  private async endSession(): Promise<void> {
    try {
      await wifiService.endSession();
    } catch (err) {
      console.error('Failed to end WiFi session', err);
    }

    this.sessionStartTime = null;
    this.currentIPAddress = null;

    this.notifyListeners({ isConnected: false, sessionInfo: null });
    this.notifyStatsUpdate();
  }

  private buildSessionInfo(): SessionInfo | null {
    if (!this.sessionStartTime) return null;
    const now = new Date();
    const durationSec = Math.floor((now.getTime() - this.sessionStartTime.getTime()) / 1000);
    return {
      startTime: this.sessionStartTime,
      ipAddress: this.currentIPAddress,
      duration: durationSec,
      durationMinutes: Math.floor(durationSec / 60),
      sessionCount: this.sessionCount,
    };
  }

  private extractIPPrefix(ipAddress: string | null): string | null {
    if (!ipAddress) return null;
    const parts = ipAddress.split('.');
    if (parts.length < 2) return null;
    return parts.slice(0, 2).join('.').toLowerCase();
  }

  // Keep the old method for backward compatibility
  private extractPrefix(bssid: string | null): string | null {
    if (!bssid) return null;
    const parts = bssid.split(':');
    if (parts.length < 4) return null;
    return parts.slice(0, 4).join(':').toLowerCase();
  }
}

const wifiMonitorInstance = new WifiMonitor();
export default wifiMonitorInstance; 