import * as TaskManager from 'expo-task-manager';
import * as BackgroundTask from 'expo-background-task';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ENV from '../config/env';

// Background task names
const WIFI_MONITOR_TASK = 'wifi-monitor-background';

// Storage keys for offline session data
const STORAGE_KEYS = {
  CURRENT_SESSION: 'bg_current_session',
  PENDING_SESSIONS: 'bg_pending_sessions',
  LAST_SYNC: 'bg_last_sync',
  USER_TOKEN: 'authToken',
  IS_BACKGROUND_ENABLED: 'bg_wifi_enabled',
  LAST_APP_ACTIVITY: 'bg_last_app_activity', // New key to track app activity
};

// Constants for session management
const SESSION_CONSTANTS = {
  MAX_BACKGROUND_DURATION: 5 * 60 * 60, // 5 hours max in background before ending session
  STALE_SESSION_THRESHOLD: 10 * 60, // 10 minutes without app activity = stale session
  BACKGROUND_CHECK_INTERVAL: 5 * 60 * 1000, // 5 minutes in milliseconds
};

// Minimal session data for background tracking
interface BackgroundSession {
  id: string;
  startTime: string;
  endTime?: string;
  ipAddress: string;
  duration: number; // seconds
  isActive: boolean;
  timestamp: string;
  metadata?: {
    backgroundModeStartTime?: string;
    isInBackground?: boolean;
  };
}

interface PendingSessionData {
  sessions: BackgroundSession[];
  lastUpdate: string;
}

class BackgroundWifiService {
  private static instance: BackgroundWifiService;
  private isRegistered = false;

  static getInstance(): BackgroundWifiService {
    if (!BackgroundWifiService.instance) {
      BackgroundWifiService.instance = new BackgroundWifiService();
    }
    return BackgroundWifiService.instance;
  }

  /**
   * Initialize background WiFi monitoring
   */
  async initialize(): Promise<void> {
    try {
      await this.registerBackgroundTask();
      await this.startBackgroundTask();
      console.log('✅ Background WiFi service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize background WiFi service:', error);
    }
  }

  /**
   * Enable background WiFi monitoring
   */
  async enableBackgroundMonitoring(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.IS_BACKGROUND_ENABLED, 'true');
      await this.initialize();
      console.log('✅ Background WiFi monitoring enabled');
    } catch (error) {
      console.error('❌ Failed to enable background monitoring:', error);
    }
  }

  /**
   * Disable background WiFi monitoring
   */
  async disableBackgroundMonitoring(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.IS_BACKGROUND_ENABLED, 'false');
      await BackgroundTask.unregisterTaskAsync(WIFI_MONITOR_TASK);
      
      // End current session if any
      await this.endCurrentBackgroundSession();
      
      console.log('✅ Background WiFi monitoring disabled');
    } catch (error) {
      console.error('❌ Failed to disable background monitoring:', error);
    }
  }

  /**
   * Check if background monitoring is enabled
   */
  async isBackgroundMonitoringEnabled(): Promise<boolean> {
    try {
      const enabled = await AsyncStorage.getItem(STORAGE_KEYS.IS_BACKGROUND_ENABLED);
      return enabled === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Register the background task
   */
  private async registerBackgroundTask(): Promise<void> {
    if (this.isRegistered) return;

    TaskManager.defineTask(WIFI_MONITOR_TASK, async () => {
      try {
        const isEnabled = await this.isBackgroundMonitoringEnabled();
        if (!isEnabled) {
          return BackgroundTask.BackgroundTaskResult.Success;
        }

        await this.performBackgroundWifiCheck();
        return BackgroundTask.BackgroundTaskResult.Success;
      } catch (error) {
        console.error('Background WiFi check failed:', error);
        return BackgroundTask.BackgroundTaskResult.Failed;
      }
    });

    this.isRegistered = true;
  }

  /**
   * Start background task
   */
  private async startBackgroundTask(): Promise<void> {
    const status = await BackgroundTask.getStatusAsync();
    
    if (status === BackgroundTask.BackgroundTaskStatus.Restricted) {
      console.warn('Background tasks are disabled');
      return;
    }

    await BackgroundTask.registerTaskAsync(WIFI_MONITOR_TASK, {
      minimumInterval: 5, // More frequent checks (5 minutes) to detect disconnections faster
    });
  }

  /**
   * Perform lightweight WiFi check in background
   */
  private async performBackgroundWifiCheck(): Promise<void> {
    try {
      const netInfo = await NetInfo.fetch();
      const currentSession = await this.getCurrentSession();
      
      // First, check if current session is stale (app has been closed)
      if (currentSession?.isActive) {
        const isStale = await this.isSessionStale(currentSession);
        if (isStale) {
          console.log('🕐 Detected stale session - app likely closed, ending session');
          await this.endStaleSession(currentSession);
          return;
        }
      }
      
      if (netInfo.type === 'wifi' && netInfo.isConnected && netInfo.details) {
        const wifiDetails = netInfo.details as any;
        const ipAddress = wifiDetails.ipAddress;
        
        if (this.isUniversityIP(ipAddress)) {
          // Connected to university WiFi
          if (!currentSession || !currentSession.isActive) {
            // No active session, start a new one
            await this.startBackgroundSession(ipAddress);
          } else if (currentSession.ipAddress !== ipAddress) {
            // IP address changed, end current session and start new one
            console.log('📶 IP address changed, ending previous session and starting new one');
            await this.endCurrentBackgroundSession();
            await this.startBackgroundSession(ipAddress);
          } else {
            // Same session, update duration carefully
            await this.updateBackgroundSessionWithStaleCheck();
          }
        } else {
          // Not on university WiFi, end any active session IMMEDIATELY
          if (currentSession?.isActive) {
            console.log('❌ Not on university WiFi, ending session immediately');
            await this.endCurrentBackgroundSession();
          }
        }
      } else {
        // Not connected to WiFi, end any active session IMMEDIATELY
        if (currentSession?.isActive) {
          console.log('📵 WiFi disconnected, ending session immediately');
          await this.endCurrentBackgroundSession();
        }
      }
    } catch (error) {
      console.error('Background WiFi check error:', error);
    }
  }

  /**
   * Start a new background session
   */
  private async startBackgroundSession(ipAddress: string): Promise<void> {
    const session: BackgroundSession = {
      id: this.generateSessionId(),
      startTime: new Date().toISOString(),
      ipAddress,
      duration: 0,
      isActive: true,
      timestamp: new Date().toISOString()
    };

    await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(session));
    console.log('🔄 Background session started:', session.id, 'on IP:', ipAddress);
  }

  /**
   * Force end current session and start a new one
   */
  async forceSessionTransition(newIpAddress: string): Promise<void> {
    console.log('🔄 Forcing session transition to new IP:', newIpAddress);
    
    // End current session if any
    await this.endCurrentBackgroundSession();
    
    // Start new session
    if (this.isUniversityIP(newIpAddress)) {
      await this.startBackgroundSession(newIpAddress);
    }
  }

  /**
   * Handle app going to background - mark session for proper handling
   */
  async handleAppGoingToBackground(): Promise<void> {
    console.log('📱 App going to background...');
    
    const currentSession = await this.getCurrentSession();
    if (currentSession?.isActive) {
      // Mark session as background mode and record the time
      const backgroundStartTime = new Date().toISOString();
      const updatedSession = {
        ...currentSession,
        metadata: {
          ...currentSession.metadata,
          backgroundModeStartTime: backgroundStartTime,
          isInBackground: true
        }
      };
      
      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(updatedSession));
      console.log('📱 Session marked as background mode at:', backgroundStartTime);
    }
    
    // Update last app activity
    await this.updateLastAppActivity();
  }

  /**
   * Handle app being completely closed/terminated
   */
  async handleAppClosed(): Promise<void> {
    console.log('📱 App being closed/terminated...');
    
    const currentSession = await this.getCurrentSession();
    if (currentSession?.isActive) {
      console.log('⏹️ Ending session due to app closure');
      await this.endCurrentBackgroundSession();
    }
  }

  /**
   * Handle app reopen - end any previous session and start new if on university WiFi
   */
  async handleAppReopen(): Promise<{ sessionEnded: boolean; sessionStarted: boolean }> {
    console.log('📱 App reopened, handling session transition...');
    
    // Update app activity immediately when app reopens
    await this.updateLastAppActivity();
    
    let sessionEnded = false;
    let sessionStarted = false;

    // Check if there's an active background session that needs to be ended
    const currentSession = await this.getCurrentSession();
    if (currentSession?.isActive) {
      console.log('⏹️ Ending previous session from before app was closed/backgrounded');
      await this.endCurrentBackgroundSession();
      sessionEnded = true;
    }

    // Check current WiFi status and start new session if appropriate
    try {
      const netInfo = await NetInfo.fetch();
      
      if (netInfo.type === 'wifi' && netInfo.isConnected && netInfo.details) {
        const wifiDetails = netInfo.details as any;
        const ipAddress = wifiDetails.ipAddress;
        
        if (this.isUniversityIP(ipAddress)) {
          console.log('🔄 Starting new session after app reopen on university WiFi');
          await this.startBackgroundSession(ipAddress);
          sessionStarted = true;
        } else {
          console.log('📵 Not on university WiFi after app reopen');
        }
      } else {
        console.log('📵 No WiFi connection after app reopen');
      }
    } catch (error) {
      console.error('❌ Failed to check WiFi status on app reopen:', error);
    }

    console.log(`📱 App reopen handled - Session ended: ${sessionEnded}, Session started: ${sessionStarted}`);
    return { sessionEnded, sessionStarted };
  }

  /**
   * Update current background session with stale check
   */
  private async updateBackgroundSessionWithStaleCheck(): Promise<void> {
    const session = await this.getCurrentSession();
    if (!session || !session.isActive) return;

    // Check if session has been in background too long
    if (session.metadata?.isInBackground && session.metadata?.backgroundModeStartTime) {
      const backgroundStart = new Date(session.metadata.backgroundModeStartTime);
      const now = new Date();
      const backgroundDuration = Math.floor((now.getTime() - backgroundStart.getTime()) / 1000);
      
      if (backgroundDuration > SESSION_CONSTANTS.MAX_BACKGROUND_DURATION) {
        const hours = Math.floor(backgroundDuration / 3600);
        const minutes = Math.floor((backgroundDuration % 3600) / 60);
        console.log(`⏰ Session exceeded max background duration (${hours}h ${minutes}m), ending session`);
        await this.endStaleSession(session);
        return;
      }
    }

    // Only update duration if not stale
    const isStale = await this.isSessionStale(session);
    if (isStale) {
      console.log('🕐 Session detected as stale during update, ending session');
      await this.endStaleSession(session);
      return;
    }

    // Calculate duration based on when app went to background (not current time)
    const now = new Date();
    const startTime = new Date(session.startTime);
    
    let effectiveEndTime = now;
    
    // If in background mode, cap the duration to when it went to background + some grace period
    if (session.metadata?.isInBackground && session.metadata?.backgroundModeStartTime) {
      const backgroundStart = new Date(session.metadata.backgroundModeStartTime);
      const gracePeriod = 5 * 60 * 1000; // 5 minutes grace period
      const maxBackgroundTime = new Date(backgroundStart.getTime() + gracePeriod);
      
      if (now.getTime() > maxBackgroundTime.getTime()) {
        effectiveEndTime = maxBackgroundTime;
        console.log('⏱️ Capping session duration to background start + grace period');
      }
    }
    
    const duration = Math.floor((effectiveEndTime.getTime() - startTime.getTime()) / 1000);

    const updatedSession: BackgroundSession = {
      ...session,
      duration,
      timestamp: now.toISOString()
    };

    await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(updatedSession));
  }

  /**
   * Check if a session is stale (app likely closed)
   */
  private async isSessionStale(session: BackgroundSession): Promise<boolean> {
    try {
      const lastActivity = await AsyncStorage.getItem(STORAGE_KEYS.LAST_APP_ACTIVITY);
      if (!lastActivity) {
        // No activity recorded, assume app was just opened
        await this.updateLastAppActivity();
        return false;
      }

      const lastActivityTime = new Date(lastActivity);
      const now = new Date();
      const timeSinceActivity = Math.floor((now.getTime() - lastActivityTime.getTime()) / 1000);

      // If it's been more than threshold since last activity, session is stale
      return timeSinceActivity > SESSION_CONSTANTS.STALE_SESSION_THRESHOLD;
    } catch (error) {
      console.error('Error checking if session is stale:', error);
      return false;
    }
  }

  /**
   * End a stale session with appropriate duration calculation
   */
  private async endStaleSession(session: BackgroundSession): Promise<void> {
    console.log('🕐 Ending stale session:', session.id);

    try {
      const lastActivity = await AsyncStorage.getItem(STORAGE_KEYS.LAST_APP_ACTIVITY);
      const startTime = new Date(session.startTime);
      
      let endTime: Date;
      let duration: number;

      if (lastActivity) {
        // Use last app activity as end time
        endTime = new Date(lastActivity);
        duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
        console.log('📊 Using last app activity for stale session end time');
      } else if (session.metadata?.backgroundModeStartTime) {
        // Use background start time + grace period as end time
        const backgroundStart = new Date(session.metadata.backgroundModeStartTime);
        endTime = new Date(backgroundStart.getTime() + (5 * 60 * 1000)); // 5 minute grace
        duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
        console.log('📊 Using background start time for stale session end time');
      } else {
        // Fallback to current time
        endTime = new Date();
        duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
        console.log('📊 Using current time for stale session end time (fallback)');
      }

      const endedSession: BackgroundSession = {
        ...session,
        endTime: endTime.toISOString(),
        duration,
        isActive: false,
        timestamp: new Date().toISOString(),
        metadata: {
          ...session.metadata,
          endReason: 'stale_session'
        }
      };

      // Save to pending sessions for later sync
      await this.addToPendingSessions(endedSession);
      
      // Clear current session
      await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
      
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      console.log('⏹️ Stale session ended:', endedSession.id, 
        `Duration: ${minutes}m ${seconds}s`, 
        `IP: ${session.ipAddress}`);
    } catch (error) {
      console.error('Error ending stale session:', error);
      // Fallback to regular session ending
      await this.endCurrentBackgroundSession();
    }
  }

  /**
   * Update last app activity timestamp
   */
  private async updateLastAppActivity(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_APP_ACTIVITY, new Date().toISOString());
    } catch (error) {
      console.error('Error updating last app activity:', error);
    }
  }

  /**
   * End current background session (regular ending)
   */
  private async endCurrentBackgroundSession(): Promise<void> {
    const session = await this.getCurrentSession();
    if (!session || !session.isActive) {
      console.log('⚠️ No active session to end');
      return;
    }

    const now = new Date();
    const startTime = new Date(session.startTime);
    const duration = Math.floor((now.getTime() - startTime.getTime()) / 1000);

    const endedSession: BackgroundSession = {
      ...session,
      endTime: now.toISOString(),
      duration,
      isActive: false,
      timestamp: now.toISOString(),
      metadata: {
        ...session.metadata,
        endReason: 'manual_end'
      }
    };

    // Save to pending sessions for later sync
    await this.addToPendingSessions(endedSession);
    
    // Clear current session
    await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
    
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    console.log('⏹️ Background session ended:', endedSession.id, 
      `Duration: ${minutes}m ${seconds}s`, 
      `IP: ${session.ipAddress}`);
  }

  /**
   * Get current active session
   */
  async getCurrentSession(): Promise<BackgroundSession | null> {
    try {
      const sessionData = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
      return sessionData ? JSON.parse(sessionData) : null;
    } catch {
      return null;
    }
  }

  /**
   * Add session to pending sync queue
   */
  private async addToPendingSessions(session: BackgroundSession): Promise<void> {
    try {
      const pendingData = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_SESSIONS);
      const pending: PendingSessionData = pendingData 
        ? JSON.parse(pendingData) 
        : { sessions: [], lastUpdate: new Date().toISOString() };

      pending.sessions.push(session);
      pending.lastUpdate = new Date().toISOString();

      await AsyncStorage.setItem(STORAGE_KEYS.PENDING_SESSIONS, JSON.stringify(pending));
    } catch (error) {
      console.error('Failed to add to pending sessions:', error);
    }
  }

  /**
   * Get pending sessions for sync
   */
  async getPendingSessions(): Promise<BackgroundSession[]> {
    try {
      const pendingData = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_SESSIONS);
      const pending: PendingSessionData = pendingData 
        ? JSON.parse(pendingData) 
        : { sessions: [], lastUpdate: new Date().toISOString() };
      
      return pending.sessions;
    } catch {
      return [];
    }
  }

  /**
   * Clear pending sessions after successful sync
   */
  async clearPendingSessions(): Promise<void> {
    try {
      const emptyPending: PendingSessionData = {
        sessions: [],
        lastUpdate: new Date().toISOString()
      };
      await AsyncStorage.setItem(STORAGE_KEYS.PENDING_SESSIONS, JSON.stringify(emptyPending));
    } catch (error) {
      console.error('Failed to clear pending sessions:', error);
    }
  }

  /**
   * Remove only successfully synced sessions from pending queue
   */
  private async removeSuccessfulSessions(successfulSessionIds: string[]): Promise<void> {
    try {
      const pendingData = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_SESSIONS);
      const pending: PendingSessionData = pendingData 
        ? JSON.parse(pendingData) 
        : { sessions: [], lastUpdate: new Date().toISOString() };

      // Filter out successful sessions
      const remainingSessions = pending.sessions.filter(
        session => !successfulSessionIds.includes(session.id)
      );

      const updatedPending: PendingSessionData = {
        sessions: remainingSessions,
        lastUpdate: new Date().toISOString()
      };

      await AsyncStorage.setItem(STORAGE_KEYS.PENDING_SESSIONS, JSON.stringify(updatedPending));
      console.log(`🗑️ Removed ${successfulSessionIds.length} synced sessions, ${remainingSessions.length} remaining`);
    } catch (error) {
      console.error('Failed to remove successful sessions:', error);
    }
  }

  /**
   * Sync pending sessions to server (call when app comes to foreground)
   */
  async syncPendingSessions(): Promise<{ synced: number; failed: number }> {
    const pendingSessions = await this.getPendingSessions();
    if (pendingSessions.length === 0) {
      return { synced: 0, failed: 0 };
    }

    // Check if user is authenticated before attempting sync
    const hasValidToken = await this.hasValidAuthToken();
    if (!hasValidToken) {
      console.warn('⚠️ No valid authentication token - skipping sync until user is authenticated');
      return { synced: 0, failed: pendingSessions.length };
    }

    let synced = 0;
    let failed = 0;
    const successfulSessions: string[] = [];

    for (const session of pendingSessions) {
      try {
        await this.syncSessionToServer(session);
        synced++;
        successfulSessions.push(session.id);
        console.log(`✅ Synced session: ${session.id}`);
      } catch (error: any) {
        console.error('Failed to sync session:', session.id, error);
        failed++;
        
        // Check if it's an auth error
        if (error?.message?.includes('authentication token') || error?.message?.includes('Authentication failed')) {
          console.warn('🔐 Authentication token invalid - will retry when token is refreshed');
        }
      }
    }

    // Remove only successfully synced sessions
    if (successfulSessions.length > 0) {
      await this.removeSuccessfulSessions(successfulSessions);
    }

    // Update last sync time only if we had some success
    if (synced > 0) {
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
    }
    
    console.log(`📊 Sync complete: ${synced} synced, ${failed} failed`);
    return { synced, failed };
  }

  /**
   * Sync individual session to server with minimal data
   */
  private async syncSessionToServer(session: BackgroundSession): Promise<void> {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`${ENV.API_URL}/api/wifi/background-sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sessionId: session.id,
          startTime: session.startTime,
          endTime: session.endTime,
          duration: session.duration,
          ipAddress: session.ipAddress
        })
      });

      if (!response.ok) {
        let errorMessage = `Server responded with ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // If we can't parse the error response, use the default message
        }
        
        if (response.status === 401) {
          throw new Error('Authentication failed - invalid token');
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log(`📡 Session ${session.id} synced successfully:`, result.message);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get sync statistics
   */
  async getSyncStats(): Promise<{
    pendingCount: number;
    lastSync: string | null;
    currentSession: BackgroundSession | null;
  }> {
    const pendingSessions = await this.getPendingSessions();
    const lastSync = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    const currentSession = await this.getCurrentSession();

    return {
      pendingCount: pendingSessions.length,
      lastSync,
      currentSession
    };
  }

  /**
   * Utility methods
   */
  private async hasValidAuthToken(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
      return !!token && token.trim().length > 0;
    } catch (error) {
      console.error('Error checking auth token:', error);
      return false;
    }
  }

  private isUniversityIP(ipAddress: string | null): boolean {
    if (!ipAddress) return false;
    const prefix = this.extractIPPrefix(ipAddress);
    return prefix === ENV.UNIVERSITY_IP_PREFIX.toLowerCase();
  }

  private extractIPPrefix(ipAddress: string): string {
    const parts = ipAddress.split('.');
    if (parts.length < 2) return '';
    return parts.slice(0, 2).join('.').toLowerCase();
  }

  private generateSessionId(): string {
    return `bg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default BackgroundWifiService.getInstance(); 