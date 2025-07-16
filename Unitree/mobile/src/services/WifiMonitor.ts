import { Platform } from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import * as Location from 'expo-location';
import { wifiService, WiFiSession } from './wifiService';
import locationService, { WiFiValidationResult } from './locationService';
import locationStorageService from './locationStorageService';
import { logger } from '../utils/logger';
import ENV from '../config/env';

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
    this.unsubscribeNetInfo = NetInfo.addEventListener(this.handleNetInfo.bind(this));

    // Perform an initial check immediately
    const info = await NetInfo.fetch();
    this.handleNetInfo(info);

    // Periodically refresh local session info so UI stays up to date
    this.sessionUpdateTimer = setInterval(() => {
      if (this.monitoring && this.sessionStartTime) {
        this.notifyListeners({ isConnected: true, sessionInfo: this.buildSessionInfo() });
        this.notifyStatsUpdate();
      }
    }, 30 * 1000);

    // Update session statistics every minute
    this.statsUpdateTimer = setInterval(async () => {
      if (this.monitoring) {
        try {
          if (this.sessionStartTime) {
            await wifiService.updateSession();
            this.notifyStatsUpdate();
          } else {
            // Nếu không còn session active, kiểm tra điều kiện để tự động start session mới
            const info = await NetInfo.fetch();
            if (info.type === 'wifi' && info.isConnected && info.details) {
              const details: any = info.details;
              const ipAddress = details.ipAddress || null;
              // Enhanced validation using both IP address and location
              const validationResult = await locationService.validateWiFiSession(ipAddress || '');
              const isValidIP = validationResult.validationMethods.ipAddress;
              const isValidLocation = validationResult.validationMethods.location;
              if (isValidIP && isValidLocation) {
                // Tự động start session mới nếu đủ điều kiện
                logger.wifi.info('No active session, auto-starting new session after timeout end');
                await this.startSession(ipAddress, validationResult);
              }
            }
          }
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
      this.sessionCount = history.filter((session: WiFiSession) => {
        const sessionDate = new Date(session.sessionDate);
        return sessionDate >= todayStart;
      }).length;
    } catch (error) {
      console.error('Failed to refresh session count:', error);
      this.sessionCount = 0;
    }
  }

  private async handleNetInfo(state: NetInfoState): Promise<void> {
    // Safety check - ensure we're still monitoring
    if (!this.monitoring) {
      return;
    }

    // We only care about WiFi connections
    if (state.type === 'wifi' && state.isConnected && state.details) {
      const details: any = state.details;
      const ipAddress = details.ipAddress || null;

      // Enhanced validation using both IP address and location
      const validationResult = await locationService.validateWiFiSession(ipAddress || '');

      // Kiểm tra riêng rẽ IP và location
      const isValidIP = validationResult.validationMethods.ipAddress;
      const isValidLocation = validationResult.validationMethods.location;

      logger.wifi.debug('Enhanced WiFi connection check', {
        data: {
          ipAddress,
          isValidIP,
          isValidLocation,
          isOverallValid: isValidIP && isValidLocation,
          requiresBoth: true,
          distance: validationResult.distance,
          campus: validationResult.campus
        }
      });

      // Chỉ bắt đầu phiên khi CẢ HAI điều kiện đều thỏa mãn
      if (isValidIP && isValidLocation) {
        logger.wifi.info('✅ Valid university WiFi AND on campus, session can start/continue');
        // Connected to university WiFi AND on campus
        if (!this.sessionStartTime) {
          // No active session, start a new one
          await this.startSession(ipAddress, validationResult);
        } else if (this.currentIPAddress !== ipAddress) {
          // IP address changed, end current session and start new one
          logger.wifi.info('📶 IP address changed in foreground, ending previous session and starting new one');
          await this.endSession();
          await this.startSession(ipAddress, validationResult);
        } else {
          // Same session, just update info
          this.currentIPAddress = ipAddress;
          this.notifyListeners({ isConnected: true, sessionInfo: this.buildSessionInfo() });
        }
        return;
      } else {
        // Log detailed reason for validation failure
        logger.wifi.info(`❌ Validation failed: IP=${isValidIP}, Location=${isValidLocation}`);
      }
    }

    // If we reach here, we are NOT connected to the university WiFi or not on campus
    // End session IMMEDIATELY regardless of foreground/background state
    if (this.sessionStartTime) {
      logger.wifi.info('Not connected to university WiFi or not on campus, ending session immediately');
      await this.endSession();
    } else {
      this.notifyListeners({ isConnected: false, sessionInfo: null });
    }
  }

  private async startSession(ipAddress: string | null, validationResult?: WiFiValidationResult): Promise<void> {
    // Chỉ cho phép bắt đầu phiên khi cả hai điều kiện đều thỏa mãn
    if (validationResult && (!validationResult.validationMethods.ipAddress || 
        !validationResult.validationMethods.location)) {
      logger.wifi.info('⚠️ Cannot start session - IP or location validation failed');
      return;
    }

    // Implement minimum gap between sessions (e.g., 10 seconds)
    const minSessionGap = 10 * 1000; // 10 seconds
    const lastSessionEnd = this.lastSessionEndTime;
    const now = Date.now();
    
    if (lastSessionEnd && (now - lastSessionEnd < minSessionGap)) {
      logger.wifi.info(`⚠️ Trying to start new session too soon (${Math.floor((now - lastSessionEnd)/1000)}s), waiting...`);
      return; // Don't start a session too soon after ending one
    }
    
    this.sessionStartTime = new Date();
    this.currentIPAddress = ipAddress;
    this.sessionCount += 1;

    // Lưu location nếu có
    if (validationResult && validationResult.location) {
      try {
        // Sử dụng service mới để lưu location
        const locationData = {
          latitude: validationResult.location.latitude,
          longitude: validationResult.location.longitude,
          accuracy: validationResult.location.accuracy || 0,
          timestamp: new Date().toISOString(),
          campus: validationResult.campus
        };
        
        // Lưu location vào storage
        await locationStorageService.saveLocationToStorage(locationData);
      } catch (error) {
        logger.wifi.error('Failed to save location data', { data: error });
      }
    }

    try {
      await wifiService.startSession({ 
        ipAddress: ipAddress ?? '',
        location: validationResult?.location ? {
          ...validationResult.location,
          accuracy: validationResult.location.accuracy || 0,
          timestamp: typeof validationResult.location.timestamp === 'string' ? 
            new Date(validationResult.location.timestamp).getTime() : validationResult.location.timestamp
        } : undefined,
        validationMethods: validationResult?.validationMethods,
        campus: validationResult?.campus,
        distance: validationResult?.distance ?? undefined
      });
    } catch (err: any) {
      // Don't log validation errors as errors - they're expected during testing
      if (err.message?.includes('must be connected to university WiFi AND be physically on campus')) {
        logger.wifi.info('Session validation: Both university WiFi and campus location required');
      } else {
        logger.wifi.error('Failed to start WiFi session', { data: err });
      }
      // If we fail to register on server, still treat as started locally
    }

    this.notifyListeners({ isConnected: true, sessionInfo: this.buildSessionInfo() });
    this.notifyStatsUpdate();
  }

  // Property to track last session end time
  private lastSessionEndTime: number | null = null;

  private async endSession(): Promise<void> {
    try {
      // End session on server
      await wifiService.endSession();
      logger.wifi.info('Session ended on server');
    } catch (err) {
      logger.wifi.error('Failed to end WiFi session on server', { data: err });
    }

    // Record when this session ended
    this.lastSessionEndTime = Date.now();

    // Clear local session state
    this.sessionStartTime = null;
    this.currentIPAddress = null;

    this.notifyListeners({ isConnected: false, sessionInfo: null });
    this.notifyStatsUpdate();
    
    logger.wifi.info('Local session state cleared');
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