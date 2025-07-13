import * as TaskManager from 'expo-task-manager';
import * as BackgroundTask from 'expo-background-task';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ENV from '../config/env';
import locationStorageService, { LocationData } from './locationStorageService';

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
    location?: {
      latitude: number;
      longitude: number;
      accuracy: number;
      timestamp: string;
    };
  };
}

interface PendingSessionData {
  sessions: BackgroundSession[];
  lastUpdate: string;
}

// Thêm hằng số cho thời gian tối thiểu giữa các phiên
const MIN_SESSION_GAP = 60 * 1000; // 1 phút

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
        
        // Kiểm tra cả IP và location
        const isValidIP = this.isUniversityIP(ipAddress);
        let isValidLocation = false;
        let locationData = null;
        
        try {
          // Lấy vị trí đã lưu gần đây nhất
          const locationString = await AsyncStorage.getItem('last_known_location');
          if (locationString) {
            locationData = JSON.parse(locationString);
            // Kiểm tra vị trí có nằm trong bán kính trường học
            isValidLocation = this.isLocationOnCampus(locationData);
          } else {
            console.log('No location data available, cannot validate location');
          }
        } catch (error) {
          console.log('Failed to get location data:', error);
        }
        
        // Chỉ bắt đầu hoặc tiếp tục phiên khi CẢ HAI điều kiện đều thỏa mãn
        if (isValidIP && isValidLocation) {
          console.log('✅ Valid university WiFi and on campus, managing session...');
          if (!currentSession || !currentSession.isActive) {
            // No active session, start a new one
            await this.startBackgroundSession(ipAddress, locationData);
          } else if (currentSession.ipAddress !== ipAddress) {
            // IP address changed, end current session and start new one
            console.log('📶 IP address changed, ending previous session and starting new one');
            await this.endCurrentBackgroundSession();
            await this.startBackgroundSession(ipAddress, locationData);
          } else {
            // Same session, update duration carefully
            await this.updateBackgroundSessionWithStaleCheck();
          }
        } else {
          // Invalid WiFi or location, end any active session IMMEDIATELY
          if (currentSession?.isActive) {
            console.log(`❌ Validation failed: IP=${isValidIP}, Location=${isValidLocation}, ending session`);
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
  private async startBackgroundSession(ipAddress: string, locationData?: any): Promise<void> {
    try {
      // Đầu tiên, kiểm tra và kết thúc TẤT CẢ các phiên đang hoạt động
      // để đảm bảo không có phiên nào đang hoạt động trước khi bắt đầu phiên mới
      const currentSession = await this.getCurrentSession();
      if (currentSession?.isActive) {
        console.log('⚠️ Phát hiện phiên đang hoạt động, kết thúc trước khi bắt đầu phiên mới');
        await this.endCurrentBackgroundSession();
      }
      
      // Kiểm tra thời gian tối thiểu giữa các phiên
      const lastSession = await this.getCurrentSession();
      
      if (lastSession && lastSession.endTime) {
        const lastEndTime = new Date(lastSession.endTime).getTime();
        const now = Date.now();
        
        if (now - lastEndTime < MIN_SESSION_GAP) {
          console.log(`⚠️ Trying to start new session too soon after previous one (${Math.floor((now - lastEndTime)/1000)}s), waiting...`);
          return; // Không bắt đầu phiên mới quá sớm
        }
      }
      
      // Kiểm tra và lưu location
      let validatedLocationData = locationData;
      if (!locationData) {
        try {
          // Lấy location đã lưu hoặc lấy location mới
          validatedLocationData = await locationStorageService.getLocationFromStorage();
        } catch (error) {
          console.log('Could not get location data');
        }
      } else {
        // Lưu location đã cung cấp
        await locationStorageService.saveLocationToStorage(locationData);
      }

      // Tạo ID phiên với timestamp để tránh trùng lặp
      const sessionId = this.generateSessionId();
      
      const session: BackgroundSession = {
        id: sessionId,
        startTime: new Date().toISOString(),
        ipAddress,
        duration: 0,
        isActive: true,
        timestamp: new Date().toISOString(),
        metadata: {
          backgroundModeStartTime: new Date().toISOString(),
          isInBackground: true,
          location: validatedLocationData // Lưu location cùng với phiên
        }
      };

      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(session));
      console.log('🔄 Background session started:', session.id, 'on IP:', ipAddress);
      
      // Cập nhật thời gian hoạt động gần nhất của app
      await this.updateLastAppActivity();
    } catch (error) {
      console.error('❌ Lỗi khi bắt đầu phiên mới:', error);
    }
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
  async handleAppReopen(): Promise<{ 
    sessionEnded: boolean; 
    sessionStarted: boolean;
    endedSessionId?: string;
  }> {
    console.log('📱 App reopened, handling session transition...');
    
    // Update app activity immediately when app reopens
    await this.updateLastAppActivity();
    
    let sessionEnded = false;
    let sessionStarted = false;
    let endedSessionId: string | undefined = undefined;

    try {
      // Kiểm tra TẤT CẢ các phiên đang hoạt động và kết thúc chúng
      // 1. Kiểm tra phiên hiện tại
      const currentSession = await this.getCurrentSession();
      if (currentSession?.isActive) {
        console.log('⏹️ Kết thúc phiên hiện tại khi mở lại ứng dụng:', currentSession.id);
        endedSessionId = currentSession.id;
        await this.endCurrentBackgroundSession();
        sessionEnded = true;
      }
      
      // 2. Đảm bảo không có phiên nào khác đang hoạt động (gọi API để kiểm tra)
      try {
        // Đây là nơi bạn có thể thêm code để gọi API kiểm tra phiên đang hoạt động
        // và kết thúc nó nếu cần
      } catch (apiError) {
        console.warn('Không thể kiểm tra phiên đang hoạt động từ server:', apiError);
      }

      // Đợi một khoảng thời gian ngắn để đảm bảo phiên cũ đã được kết thúc hoàn toàn
      await new Promise(resolve => setTimeout(resolve, 500));

      // Kiểm tra WiFi hiện tại và bắt đầu phiên mới nếu thích hợp
      const netInfo = await NetInfo.fetch();
      
      if (netInfo.type === 'wifi' && netInfo.isConnected && netInfo.details) {
        const wifiDetails = netInfo.details as any;
        const ipAddress = wifiDetails.ipAddress;
        
        // Kiểm tra cả IP và location trước khi bắt đầu phiên mới
        const isValidIP = this.isUniversityIP(ipAddress);
        let locationData = null;
        let isValidLocation = false;
        
        try {
          // Lấy vị trí hiện tại
          locationData = await locationStorageService.getCurrentAndSaveLocation();
          isValidLocation = locationData?.isValid || false;
        } catch (locationError) {
          console.error('Không thể lấy vị trí hiện tại:', locationError);
        }
        
        // Chỉ bắt đầu phiên mới khi CẢ HAI điều kiện đều thỏa mãn
        if (isValidIP && isValidLocation) {
          console.log('🔄 Bắt đầu phiên mới sau khi mở lại ứng dụng trên WiFi trường học');
          await this.startBackgroundSession(ipAddress, locationData);
          sessionStarted = true;
        } else {
          console.log(`📵 Không bắt đầu phiên mới - IP hợp lệ: ${isValidIP}, Vị trí hợp lệ: ${isValidLocation}`);
        }
      } else {
        console.log('📵 Không có kết nối WiFi sau khi mở lại ứng dụng');
      }
    } catch (error) {
      console.error('❌ Lỗi khi xử lý mở lại ứng dụng:', error);
    }

    console.log(`📱 Đã xử lý mở lại ứng dụng - Phiên đã kết thúc: ${sessionEnded}, Phiên đã bắt đầu: ${sessionStarted}`);
    return { sessionEnded, sessionStarted, endedSessionId };
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
   * Filter duplicate sessions based on start time
   */
  private filterDuplicateSessions(sessions: BackgroundSession[]): BackgroundSession[] {
    // Create a Map to group sessions by similar start time
    const uniqueSessionMap = new Map<string, BackgroundSession>();
    
    for (const session of sessions) {
      // Create a key based on rounded start time (to nearest minute) and IP address
      const startTimeMs = new Date(session.startTime).getTime();
      const roundedStartTime = Math.floor(startTimeMs / (60 * 1000)) * 60 * 1000;
      const key = `${roundedStartTime}_${session.ipAddress}`;
      
      // If no session with this key exists, or current session has longer duration
      if (!uniqueSessionMap.has(key) || uniqueSessionMap.get(key)!.duration < session.duration) {
        uniqueSessionMap.set(key, session);
      }
    }
    
    // Convert back to array
    const filteredSessions = Array.from(uniqueSessionMap.values());
    
    // Log filtering results
    if (filteredSessions.length < sessions.length) {
      console.log(`🔍 Filtered ${sessions.length} sessions to ${filteredSessions.length} unique sessions to prevent duplicate sync`);
    }
    
    return filteredSessions;
  }

  /**
   * Sync pending sessions to server (call when app comes to foreground)
   */
  async syncPendingSessions(alreadySyncedIds: string[] = []): Promise<{ synced: number; failed: number }> {
    let pendingSessions = await this.getPendingSessions();
    if (pendingSessions.length === 0) {
      return { synced: 0, failed: 0 };
    }

    console.log(`🔍 Đang xử lý ${pendingSessions.length} phiên đang chờ đồng bộ`);
    
    // Ghi log chi tiết về các phiên đang chờ đồng bộ để debug
    pendingSessions.forEach((session, index) => {
      const startTime = new Date(session.startTime).toLocaleString();
      const endTime = session.endTime ? new Date(session.endTime).toLocaleString() : 'đang hoạt động';
      console.log(`📋 Phiên #${index + 1}: ID=${session.id}, Bắt đầu=${startTime}, Kết thúc=${endTime}, Thời lượng=${session.duration}s`);
    });

    // Filter out any sessions that have already been synced in this app run
    if (alreadySyncedIds.length > 0) {
      console.log(`🔍 Lọc ra ${alreadySyncedIds.length} phiên đã được đồng bộ trong lần chạy này`);
      pendingSessions = pendingSessions.filter(session => !alreadySyncedIds.includes(session.id));
      if (pendingSessions.length === 0) {
        console.log('Tất cả phiên đang chờ đã được đồng bộ trong lần chạy này');
        return { synced: 0, failed: 0 };
      }
    }

    // Sắp xếp phiên theo thời gian bắt đầu để xử lý theo thứ tự thời gian
    pendingSessions.sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    // Filter duplicate sessions by start time, IP and keep the one with highest duration
    const uniqueSessions = this.filterDuplicateSessions(pendingSessions);

    // Kiểm tra phiên trùng lặp dựa trên khoảng thời gian chồng chéo
    const nonOverlappingSessions = this.filterOverlappingSessions(uniqueSessions);
    
    if (nonOverlappingSessions.length < uniqueSessions.length) {
      console.log(`⚠️ Đã phát hiện ${uniqueSessions.length - nonOverlappingSessions.length} phiên chồng chéo và đã lọc`);
    }

    // Check if user is authenticated before attempting sync
    const hasValidToken = await this.hasValidAuthToken();
    if (!hasValidToken) {
      console.warn('⚠️ Không có token xác thực hợp lệ - bỏ qua đồng bộ cho đến khi người dùng đăng nhập');
      return { synced: 0, failed: nonOverlappingSessions.length };
    }

    let synced = 0;
    let failed = 0;
    const successfulSessions: string[] = [];

    // Đồng bộ các phiên đã lọc bất kể đang kết nối WiFi nào
    console.log(`🔄 Đang cố gắng đồng bộ ${nonOverlappingSessions.length} phiên WiFi`);

    for (const session of nonOverlappingSessions) {
      try {
        await this.syncSessionToServer(session);
        synced++;
        successfulSessions.push(session.id);
        console.log(`✅ Đã đồng bộ phiên: ${session.id}, thời lượng: ${session.duration}s`);
      } catch (error: any) {
        console.error('Không thể đồng bộ phiên:', session.id, error);
        failed++;
        
        // Check if it's an auth error
        if (error?.message?.includes('authentication token') || error?.message?.includes('Authentication failed')) {
          console.warn('🔐 Token xác thực không hợp lệ - sẽ thử lại khi token được làm mới');
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
    
    console.log(`📊 Đồng bộ hoàn tất: ${synced} thành công, ${failed} thất bại`);
    return { synced, failed };
  }
  
  /**
   * Filter sessions to remove overlapping time periods
   */
  private filterOverlappingSessions(sessions: BackgroundSession[]): BackgroundSession[] {
    if (sessions.length <= 1) return sessions;
    
    // Sắp xếp phiên theo thời gian bắt đầu
    const sortedSessions = [...sessions].sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
    
    const result: BackgroundSession[] = [sortedSessions[0]];
    
    for (let i = 1; i < sortedSessions.length; i++) {
      const currentSession = sortedSessions[i];
      const lastAcceptedSession = result[result.length - 1];
      
      const currentStart = new Date(currentSession.startTime).getTime();
      const lastEnd = lastAcceptedSession.endTime 
        ? new Date(lastAcceptedSession.endTime).getTime()
        : Date.now(); // Nếu phiên cuối chưa kết thúc, sử dụng thời gian hiện tại
      
      // Nếu phiên hiện tại bắt đầu sau khi phiên trước kết thúc (có thêm khoảng cách tối thiểu)
      if (currentStart >= lastEnd + MIN_SESSION_GAP) {
        result.push(currentSession);
      } else {
        // Nếu phiên hiện tại dài hơn, thay thế phiên trước đó
        if (currentSession.duration > lastAcceptedSession.duration) {
          console.log(`⚠️ Phát hiện phiên chồng chéo, giữ lại phiên dài hơn: ${currentSession.id} (${currentSession.duration}s)`);
          result[result.length - 1] = currentSession;
        } else {
          console.log(`⚠️ Phát hiện phiên chồng chéo, bỏ qua phiên ngắn hơn: ${currentSession.id} (${currentSession.duration}s)`);
        }
      }
    }
    
    return result;
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

      // Ưu tiên sử dụng location đã lưu cùng với phiên
      let location = session.metadata?.location;
      
      // Nếu phiên không có location, thử lấy location đã lưu trước đó
      if (!location) {
        try {
          location = await locationStorageService.getLocationFromStorage();
          if (location) {
            console.log('Using stored location for session sync');
          } else {
            console.log('No stored location available for sync');
          }
        } catch (error) {
          console.log('Error getting stored location:', error);
        }
      }

      // Ghi log chi tiết về phiên đang đồng bộ
      console.log('📡 Syncing session:', {
        id: session.id,
        start: new Date(session.startTime).toLocaleTimeString(),
        duration: session.duration,
        hasLocation: !!location
      });

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
          ipAddress: session.ipAddress,
          location: location
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

  /**
   * Check if a location is on campus
   */
  private isLocationOnCampus(locationData: any): boolean {
    if (!locationData || !locationData.latitude || !locationData.longitude) {
      return false;
    }
    
    // Tính khoảng cách đến tọa độ trung tâm trường học
    const R = 6371e3; // Earth radius in meters
    const φ1 = (locationData.latitude * Math.PI) / 180;
    const φ2 = (ENV.UNIVERSITY_LAT * Math.PI) / 180;
    const Δφ = ((ENV.UNIVERSITY_LAT - locationData.latitude) * Math.PI) / 180;
    const Δλ = ((ENV.UNIVERSITY_LNG - locationData.longitude) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    // Kiểm tra nếu nằm trong bán kính cho phép
    const isWithinRadius = distance <= ENV.UNIVERSITY_RADIUS;
    console.log(`📍 Location distance to campus: ${distance.toFixed(0)}m, within radius: ${isWithinRadius}`);
    return isWithinRadius;
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