import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { wifiService } from './wifiService';
import ENV from '../config/env';
import * as Location from 'expo-location';
import { Platform } from 'react-native';

// ---- Types -----------------------------------------------------------------
interface SessionInfo {
  startTime: Date;
  ssid: string | null;
  bssid: string | null;
  duration: number;         // seconds
  durationMinutes: number;  // rounded minutes
}

interface ConnectionChangeData {
  isConnected: boolean;
  sessionInfo: SessionInfo | null;
}

type WifiEventType = 'connectionChange';
type WifiEventCallback = (data: ConnectionChangeData) => void;

// ---- Implementation --------------------------------------------------------
class WifiMonitor {
  private monitoring = false;
  private sessionStartTime: Date | null = null;
  private currentSSID: string | null = null;
  private currentBSSID: string | null = null;
  private listeners: Map<number, WifiEventCallback> = new Map();
  private unsubscribeNetInfo: (() => void) | null = null;
  private sessionUpdateTimer: ReturnType<typeof setInterval> | null = null;

  // Public API ---------------------------------------------------------------
  async start(onPointsEarned?: (points: number) => void): Promise<void> {
    if (this.monitoring) return;
    this.monitoring = true;

    // Android requires location permission and location services enabled to access real BSSID
    if (Platform.OS === 'android') {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('[WiFiMonitor] Location permission denied – WiFi BSSID will be masked by the system.');
      }
    }

    // Subscribe to realtime network changes
    this.unsubscribeNetInfo = NetInfo.addEventListener(this.handleNetInfo);

    // Perform an initial check immediately
    const info = await NetInfo.fetch();
    this.handleNetInfo(info);

    // Periodically refresh local session info so UI stays up to date
    this.sessionUpdateTimer = setInterval(() => {
      if (this.sessionStartTime) {
        this.notifyListeners({ isConnected: true, sessionInfo: this.buildSessionInfo() });
      }
    }, 30 * 1000);
  }

  stop(): void {
    if (!this.monitoring) return;
    this.monitoring = false;
    if (this.unsubscribeNetInfo) this.unsubscribeNetInfo();
    this.unsubscribeNetInfo = null;
    if (this.sessionUpdateTimer) clearInterval(this.sessionUpdateTimer);
    this.sessionUpdateTimer = null;
  }

  isRunning(): boolean {
    return this.monitoring;
  }

  resetSessionState(): void {
    this.sessionStartTime = null;
    this.currentSSID = null;
    this.currentBSSID = null;
    this.listeners.clear();
  }

  getSessionInfo(): SessionInfo | null {
    return this.buildSessionInfo();
  }

  addListener(_eventType: WifiEventType, cb: WifiEventCallback): () => void {
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

  private async handleNetInfo(state: NetInfoState): Promise<void> {
    // We only care about WiFi connections
    if (state.type === 'wifi' && state.isConnected && state.details) {
      const details: any = state.details;
      const ssid = details.ssid || null;
      const rawBssid: string | null = details.bssid || null;
      const bssid = rawBssid ? rawBssid.toLowerCase() : null;

      const prefix = this.extractPrefix(bssid);
      const expected = ENV.UNIVERSITY_BSSID_PREFIX.toLowerCase();

      if (prefix && prefix === expected) {
        // Connected to university WiFi
        if (!this.sessionStartTime) {
          await this.startSession(ssid, bssid);
        } else {
          // Already in session, just update info
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

  private async startSession(ssid: string | null, bssid: string | null): Promise<void> {
    this.sessionStartTime = new Date();
    this.currentSSID = ssid;
    this.currentBSSID = bssid;

    try {
      await wifiService.startSession({ ssid: ssid ?? '', bssid: bssid ?? '' });
    } catch (err) {
      console.error('Failed to start WiFi session', err);
      // If we fail to register on server, still treat as started locally
    }

    this.notifyListeners({ isConnected: true, sessionInfo: this.buildSessionInfo() });
  }

  private async endSession(): Promise<void> {
    try {
      await wifiService.endSession();
    } catch (err) {
      console.error('Failed to end WiFi session', err);
    }

    this.sessionStartTime = null;
    this.currentSSID = null;
    this.currentBSSID = null;

    this.notifyListeners({ isConnected: false, sessionInfo: null });
  }

  private buildSessionInfo(): SessionInfo | null {
    if (!this.sessionStartTime) return null;
    const now = new Date();
    const durationSec = Math.floor((now.getTime() - this.sessionStartTime.getTime()) / 1000);
    return {
      startTime: this.sessionStartTime,
      ssid: this.currentSSID,
      bssid: this.currentBSSID,
      duration: durationSec,
      durationMinutes: Math.floor(durationSec / 60),
    };
  }

  private extractPrefix(bssid: string | null): string | null {
    if (!bssid) return null;
    const parts = bssid.split(':');
    if (parts.length < 4) return null;
    return parts.slice(0, 4).join(':').toLowerCase();
  }
}

const wifiMonitorInstance = new WifiMonitor();
export default wifiMonitorInstance; 