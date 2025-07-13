import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { wifiService, WifiStats } from '../services/wifiService';
import WifiMonitor from '../services/WifiMonitor';
import BackgroundWifiService from '../services/BackgroundWifiService';
import locationStorageService from '../services/locationStorageService';
import { useAuth } from './AuthContext';
import ENV from '../config/env';
import { logger } from '../utils/logger';

interface WiFiContextType {
  isConnected: boolean;
  ipAddress: string | null;
  isUniversityWifi: boolean;
  isValidLocation: boolean;
  isSessionActive: boolean;
  currentSessionDuration: number;
  sessionCount: number;
  stats: WifiStats | null;
  refreshStats: () => Promise<void>;
  error: string | null;
  wifiMonitor: typeof WifiMonitor;
  isInitialized: boolean;
}

const WiFiContext = createContext<WiFiContextType | undefined>(undefined);

export const useWiFi = () => {
  const context = useContext(WiFiContext);
  if (!context) {
    throw new Error('useWiFi must be used within a WiFiProvider');
  }
  return context;
};

interface WiFiProviderProps {
  children: ReactNode;
}

export const WiFiProvider: React.FC<WiFiProviderProps> = ({ children }) => {
  const { isAuthenticated, logout } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [ipAddress, setIpAddress] = useState<string | null>(null);
  const [isUniversityWifi, setIsUniversityWifi] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [currentSessionDuration, setCurrentSessionDuration] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [stats, setStats] = useState<WifiStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const wifiMonitorListenerRef = useRef<(() => void) | null>(null);
  const realTimeUpdateTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Thêm state mới để theo dõi location
  const [isValidLocation, setIsValidLocation] = useState(false);

  const refreshStats = async () => {
    if (!isAuthenticated) return;
    
    try {
      const wifiStats = await wifiService.getStats();
      setStats(wifiStats);
      
      // Update session state based on stats
      if (wifiStats.currentSession && wifiStats.currentSession.isActive) {
        setIsSessionActive(true);
        setCurrentSessionDuration(wifiStats.currentSession.duration);
      } else {
        setIsSessionActive(false);
        setCurrentSessionDuration(0);
      }

      // Update session count
      setSessionCount(wifiStats.sessionCount || 0);
      
      setError(null);
    } catch (err: any) {
      // Don't log authentication errors as they're handled by the auth system
      if (err.response?.status === 401) {
        logger.auth.debug('Authentication required for WiFi stats');
        return;
      }
      logger.wifi.error('WiFi stats refresh error', { data: err });
      // Silently handle refresh errors without showing error message
      setError(null);
    }
  };

  const refreshSessionCount = async () => {
    if (!isAuthenticated) return;
    
    try {
      const sessionCount = await wifiService.getSessionCount();
      setSessionCount(sessionCount);
    } catch (err: any) {
      // Don't log authentication errors as they're handled by the auth system
      if (err.response?.status === 401) {
        logger.auth.debug('Authentication required for session count');
        return;
      }
      logger.wifi.error('Failed to refresh session count', { data: err });
    }
  };

  // Kiểm tra cả IP và location
  const checkUniversityWifi = async (networkIPAddress: string | null): Promise<boolean> => {
    // Kiểm tra IP
    const isValidIP = networkIPAddress && wifiService.isValidUniversityIP(networkIPAddress);
    
    // Kiểm tra location
    let locationValid = false;
    try {
      // Lấy location đã lưu hoặc lấy location mới
      const locationData = await locationStorageService.getCurrentAndSaveLocation();
      locationValid = locationData?.isValid || false;
      setIsValidLocation(locationValid);
    } catch (error) {
      logger.wifi.error('Failed to check location validity', { data: error });
    }
    
    // Ghi log thông tin kiểm tra
    logger.wifi.debug('University WiFi Check', {
      data: {
        ipAddress: networkIPAddress,
        isValidIP,
        isValidLocation: locationValid,
        isOverallValid: isValidIP && locationValid,
        ipPrefix: wifiService.extractIPPrefix(networkIPAddress),
        expectedPrefix: ENV.UNIVERSITY_IP_PREFIX
      }
    });
    
    // Kết quả chỉ hợp lệ khi cả IP và location đều hợp lệ
    const isValid = isValidIP && locationValid;
    setIsUniversityWifi(isValid);
    
    return isValid;
  };

  // Monitor network state
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      // Log network state changes
      logger.wifi.debug('NetInfo State Update', {
        data: {
          timestamp: new Date().toISOString(),
          isConnected: state.isConnected,
          type: state.type,
          isInternetReachable: state.isInternetReachable,
          details: state.details
        }
      });

      // Additional logging for wifi-specific details
      if (state.type === 'wifi' && state.details) {
        const wifiDetails = state.details as any;
        logger.wifi.debug('WiFi Details', {
          data: {
            ipAddress: wifiDetails.ipAddress,
            strength: wifiDetails.strength,
            subnet: wifiDetails.subnet,
            frequency: wifiDetails.frequency,
            linkSpeed: wifiDetails.linkSpeed
          }
        });
      } else {
        logger.wifi.debug('Not connected to WiFi', {
          data: {
            type: state.type,
            isConnected: state.isConnected
          }
        });
      }

      setIsConnected(state.isConnected === true);
      
      if (state.type === 'wifi' && state.details) {
        const wifiDetails = state.details as any;
        const networkIPAddress = wifiDetails.ipAddress || null;
        
        logger.wifi.debug('Setting WiFi State', {
          data: { ipAddress: networkIPAddress }
        });
        
        setIpAddress(networkIPAddress);
        
        // Kiểm tra cả IP và location
        checkUniversityWifi(networkIPAddress).then(isValid => {
          // End session if not valid and session is active
          if (!isValid && isSessionActive && isAuthenticated) {
            logger.wifi.info('WiFi or location not valid, ending session');
            wifiService.endSession().catch(err => 
              logger.wifi.error('Failed to end session on invalid connection', { data: err })
            );
          }
        });
      } else {
        logger.wifi.debug('Clearing WiFi State - Not connected to WiFi');
        setIpAddress(null);
        setIsUniversityWifi(false);
        setIsValidLocation(false);

        // End session if disconnected from WiFi and session is active
        if (isSessionActive && isAuthenticated) {
          logger.wifi.info('Disconnected from WiFi, ending session');
          wifiService.endSession().catch(err => 
            logger.wifi.error('Failed to end session on disconnect', { data: err })
          );
        }
      }

      // Mark as initialized after first network state update
      setIsInitialized(true);
    });

    return unsubscribe;
  }, [isSessionActive, isAuthenticated]);

  // Reset session state on logout (session is ended in AuthContext before logout)
  useEffect(() => {
    if (!isAuthenticated) {
      setIsSessionActive(false);
      setCurrentSessionDuration(0);
      setSessionCount(0);
      setIsInitialized(false);
    }
  }, [isAuthenticated]);

  // Auto-manage WiFi sessions
  useEffect(() => {
    if (!isAuthenticated) return;

    const manageSession = async () => {
      try {
        // Kiểm tra cả IP và location để quyết định bắt đầu phiên
        if (isUniversityWifi && !isSessionActive) {
          // Cập nhật location trước khi bắt đầu phiên
          const locationData = await locationStorageService.getCurrentAndSaveLocation();
          const locationValid = locationData?.isValid || false;
          
          if (locationValid) {
            // Start session if both IP and location are valid
            try {
              await wifiService.startSession({ 
                ipAddress: ipAddress || '',
                location: locationData 
              });
              await refreshStats();
              await refreshSessionCount();
              logger.wifi.info('WiFi session started', { ipAddress, locationValid: true });
            } catch (error: any) {
              // If we get "Active session already exists" error, try cleanup and retry
              if (error.message.includes('Active session already exists')) {
                console.log('🧹 Active session conflict detected, cleaning up orphaned sessions...');
                try {
                  await wifiService.cleanupOrphanedSessions();
                  // Wait a moment then try starting session again
                  setTimeout(async () => {
                    try {
                      await wifiService.startSession({ 
                        ipAddress: ipAddress || '',
                        location: locationData
                      });
                      await refreshStats();
                      await refreshSessionCount();
                    } catch (retryError) {
                      console.error('Failed to start session after cleanup:', retryError);
                    }
                  }, 1000);
                } catch (cleanupError) {
                  console.error('Failed to cleanup orphaned sessions:', cleanupError);
                }
              } else {
                throw error;
              }
            }
          } else {
            logger.wifi.info('Not starting session - location is not valid');
          }
        } else if (!isUniversityWifi && isSessionActive) {
          // End session IMMEDIATELY if criteria not met
          logger.wifi.info('Not on university WiFi or not on campus, ending session immediately');
          try {
            await wifiService.endSession();
            await refreshStats();
            await refreshSessionCount();
            logger.wifi.info('WiFi session ended successfully');
          } catch (error: any) {
            logger.wifi.error('Failed to end WiFi session', { data: error });
          }
        }
      } catch (err: any) {
        // Don't log validation errors as errors - they're expected during testing
        if (err.message?.includes('must be connected to university WiFi AND be physically on campus')) {
          logger.wifi.info('Session validation: Both university WiFi and campus location required');
        } else {
          logger.wifi.error('Session management error', { data: err });
          setError('Session management error');
        }
      }
    };

    manageSession();
  }, [isAuthenticated, isUniversityWifi, isSessionActive, ipAddress, isValidLocation]);

  // WiFi Monitor integration with enhanced session tracking
  useEffect(() => {
    if (!isAuthenticated) {
      // Stop monitoring and reset state when not authenticated
      if (WifiMonitor.isRunning()) {
        WifiMonitor.stop();
      }
      WifiMonitor.resetSessionState();
      
      // Remove listener if exists
      if (wifiMonitorListenerRef.current) {
        wifiMonitorListenerRef.current();
        wifiMonitorListenerRef.current = null;
      }

      // Clear real-time update timer
      if (realTimeUpdateTimerRef.current) {
        clearInterval(realTimeUpdateTimerRef.current);
        realTimeUpdateTimerRef.current = null;
      }
      
      setIsSessionActive(false);
      setCurrentSessionDuration(0);
      setSessionCount(0);
      return;
    }

    // Start monitoring when authenticated
    const startWifiMonitoring = async () => {
      try {
        // Cleanup any orphaned sessions first
        console.log('🧹 Cleaning up any orphaned sessions on startup...');
        try {
          await wifiService.cleanupOrphanedSessions();
        } catch (cleanupError) {
          console.warn('Non-critical: Failed to cleanup sessions on startup:', cleanupError);
        }

        // Add listener for WiFi Monitor events
        wifiMonitorListenerRef.current = WifiMonitor.addListener('connectionChange', (data) => {
          logger.wifi.debug('WiFi Monitor connection change', { data });
          setIsConnected(data.isConnected);
          
          if (data.sessionInfo) {
            setIsSessionActive(true);
            setCurrentSessionDuration(data.sessionInfo.durationMinutes || 0);
            setIpAddress(data.sessionInfo.ipAddress);
            setSessionCount(data.sessionInfo.sessionCount || 0);
          } else {
            setIsSessionActive(false);
            setCurrentSessionDuration(0);
          }
        });

        // Add listener for stats updates
        WifiMonitor.addListener('statsUpdate', (data) => {
          if (data.type === 'statsUpdate') {
            setSessionCount(data.sessionCount || 0);
            if (data.currentSession) {
              setCurrentSessionDuration(data.currentSession.durationMinutes || 0);
            }
          }
        });

        // Start WiFi monitoring
        await WifiMonitor.start();

        // Set up real-time stats refresh every 30 seconds
        realTimeUpdateTimerRef.current = setInterval(async () => {
          await refreshStats();
          await refreshSessionCount();
        }, 30000);

        // Initial stats refresh
        await refreshStats();
        await refreshSessionCount();
        
      } catch (error) {
        console.error('Error starting WiFi monitoring:', error);
        setError('Failed to start WiFi monitoring');
      }
    };

    startWifiMonitoring();
    
    return () => {
      if (wifiMonitorListenerRef.current) {
        wifiMonitorListenerRef.current();
        wifiMonitorListenerRef.current = null;
      }
      if (realTimeUpdateTimerRef.current) {
        clearInterval(realTimeUpdateTimerRef.current);
        realTimeUpdateTimerRef.current = null;
      }
      if (WifiMonitor.isRunning()) {
        WifiMonitor.stop();
      }
    };
  }, [isAuthenticated]);

  const contextValue: WiFiContextType = {
    isConnected,
    ipAddress,
    isUniversityWifi,
    isSessionActive,
    currentSessionDuration,
    sessionCount,
    stats,
    refreshStats,
    error,
    wifiMonitor: WifiMonitor,
    isInitialized,
    isValidLocation, // Thêm trường mới
  };

  return (
    <WiFiContext.Provider value={contextValue}>
      {children}
    </WiFiContext.Provider>
  );
}; 