import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackgroundWifiService from '../services/BackgroundWifiService';
import { wifiService } from '../services/wifiService';
import { useAuth } from './AuthContext';

interface BackgroundSyncContextType {
  isBackgroundMonitoringEnabled: boolean;
  enableBackgroundMonitoring: () => Promise<void>;
  disableBackgroundMonitoring: () => Promise<void>;
  syncStats: {
    pendingCount: number;
    lastSync: string | null;
    currentSession: any;
  } | null;
  refreshSyncStats: () => Promise<void>;
  performForegroundSync: () => Promise<{ synced: number; failed: number }>;
  isInitialized: boolean;
  isSyncing: boolean;
}

const BackgroundSyncContext = createContext<BackgroundSyncContextType | undefined>(undefined);

export const useBackgroundSync = () => {
  const context = useContext(BackgroundSyncContext);
  if (!context) {
    throw new Error('useBackgroundSync must be used within a BackgroundSyncProvider');
  }
  return context;
};

interface BackgroundSyncProviderProps {
  children: ReactNode;
}

export const BackgroundSyncProvider: React.FC<BackgroundSyncProviderProps> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [isBackgroundMonitoringEnabled, setIsBackgroundMonitoringEnabled] = useState(false);
  const [syncStats, setSyncStats] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const appState = useRef(AppState.currentState);
  const hasPerformedInitialSync = useRef(false);

  // Initialize background monitoring state
  useEffect(() => {
    const initializeBackgroundSync = async () => {
      if (!isAuthenticated) {
        setIsInitialized(false);
        return;
      }

      try {
        // Check if background monitoring is enabled
        const isEnabled = await BackgroundWifiService.isBackgroundMonitoringEnabled();
        setIsBackgroundMonitoringEnabled(isEnabled);

        // If enabled, initialize the service
        if (isEnabled) {
          await BackgroundWifiService.initialize();
        }

        // Get initial sync stats
        await refreshSyncStats();
        setIsInitialized(true);

        console.log('✅ Background sync context initialized');
      } catch (error) {
        console.error('❌ Failed to initialize background sync:', error);
        setIsInitialized(false);
      }
    };

    initializeBackgroundSync();
  }, [isAuthenticated]);

  // Handle app state changes for foreground sync
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      console.log('📱 App state changed:', appState.current, '->', nextAppState);

      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground
        console.log('🔄 App came to foreground, performing sync...');
        
        if (isAuthenticated && isInitialized) {
          await performForegroundSync();
          
          // Mark that we've performed the initial sync for this session
          hasPerformedInitialSync.current = true;
        }
      } else if (nextAppState === 'background') {
        // App is going to background
        console.log('🌙 App going to background');
        
        // Reset the sync flag so we sync again when coming back
        hasPerformedInitialSync.current = false;
      }

      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Perform initial sync if we haven't done so already and app is active
            if (isAuthenticated && isInitialized && AppState.currentState === 'active' && !hasPerformedInitialSync.current) {
      performForegroundSync().then(() => {
        hasPerformedInitialSync.current = true;
      });
    }

    // Also perform sync when user authenticates (handles failed auth sessions)
    if (isAuthenticated && isInitialized && !hasPerformedInitialSync.current) {
      performForegroundSync().then(() => {
        hasPerformedInitialSync.current = true;
      });
    }

    return () => subscription?.remove();
  }, [isAuthenticated, isInitialized]);

  // Save authentication token for background service
  useEffect(() => {
    const saveAuthToken = async () => {
      if (isAuthenticated && user) {
        try {
          const token = await AsyncStorage.getItem('authToken');
          if (token) {
            // Token is already saved by auth service
            console.log('🔐 Auth token available for background sync');
          } else {
            console.warn('⚠️ No auth token found - background sync may fail');
          }
        } catch (error) {
          console.error('Failed to verify auth token:', error);
        }
      } else {
        // Clear any stale sessions when user logs out
        try {
          await BackgroundWifiService.clearPendingSessions();
          console.log('🧹 Cleared pending sessions on logout');
        } catch (error) {
          console.error('Failed to clear pending sessions:', error);
        }
      }
    };

    saveAuthToken();
  }, [isAuthenticated, user]);

  const enableBackgroundMonitoring = async (): Promise<void> => {
    try {
      await BackgroundWifiService.enableBackgroundMonitoring();
      setIsBackgroundMonitoringEnabled(true);
      await refreshSyncStats();
      console.log('✅ Background monitoring enabled');
    } catch (error) {
      console.error('❌ Failed to enable background monitoring:', error);
      throw error;
    }
  };

  const disableBackgroundMonitoring = async (): Promise<void> => {
    try {
      await BackgroundWifiService.disableBackgroundMonitoring();
      setIsBackgroundMonitoringEnabled(false);
      await refreshSyncStats();
      console.log('❌ Background monitoring disabled');
    } catch (error) {
      console.error('❌ Failed to disable background monitoring:', error);
      throw error;
    }
  };

  const refreshSyncStats = async (): Promise<void> => {
    try {
      const stats = await BackgroundWifiService.getSyncStats();
      setSyncStats(stats);
    } catch (error) {
      console.error('Failed to refresh sync stats:', error);
    }
  };

  const performForegroundSync = async (): Promise<{ synced: number; failed: number }> => {
    if (isSyncing) {
      console.log('🔄 Sync already in progress, skipping...');
      return { synced: 0, failed: 0 };
    }

    setIsSyncing(true);
    
    try {
      console.log('🔄 Starting foreground sync...');
      
      // First, handle app reopen session transition
      if (isBackgroundMonitoringEnabled) {
        const sessionTransition = await BackgroundWifiService.handleAppReopen();
        if (sessionTransition.sessionEnded || sessionTransition.sessionStarted) {
          console.log('📱 Session transition completed during app reopen');
        }
      }
      
      // Then, sync any pending background sessions
      const syncResult = await BackgroundWifiService.syncPendingSessions();
      console.log('📊 Background sessions synced:', syncResult);

      // Then refresh all app data
      await Promise.all([
        refreshSyncStats(),
        // Add other data refresh calls here as needed
      ]);

      console.log('✅ Foreground sync completed');
      return syncResult;
      
    } catch (error) {
      console.error('❌ Foreground sync failed:', error);
      return { synced: 0, failed: 1 };
    } finally {
      setIsSyncing(false);
    }
  };

  const value: BackgroundSyncContextType = {
    isBackgroundMonitoringEnabled,
    enableBackgroundMonitoring,
    disableBackgroundMonitoring,
    syncStats,
    refreshSyncStats,
    performForegroundSync,
    isInitialized,
    isSyncing
  };

  return (
    <BackgroundSyncContext.Provider value={value}>
      {children}
    </BackgroundSyncContext.Provider>
  );
}; 