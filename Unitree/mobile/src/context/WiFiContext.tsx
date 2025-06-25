import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { wifiService, WifiStats } from '../services/wifiService';
import WifiMonitor from '../services/WifiMonitor';
import BackgroundWifiService from '../services/BackgroundWifiService';
import { useAuth } from './AuthContext';
import ENV from '../config/env';
import { logger } from '../utils/logger';

interface WiFiContextType {
  isConnected: boolean;
  ipAddress: string | null;
  isUniversityWifi: boolean;
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
      logger.wifi.error('Failed to refresh WiFi stats', { data: err });
      setError('Failed to refresh WiFi stats');
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
        
        // Check if connected to university WiFi using IP address only
        const isValidIP = wifiService.isValidUniversityIP(networkIPAddress);
        logger.wifi.debug('University WiFi Check', {
          data: {
            ipAddress: networkIPAddress,
            isValidIP: isValidIP,
            ipPrefix: wifiService.extractIPPrefix(networkIPAddress),
            expectedPrefix: ENV.UNIVERSITY_IP_PREFIX
          }
        });
        setIsUniversityWifi(isValidIP);

        // End session if connected to wrong WiFi and session is active
        if (!isValidIP && isSessionActive && isAuthenticated) {
          logger.wifi.info('Connected to wrong WiFi, ending session');
          wifiService.endSession().catch(err => 
            logger.wifi.error('Failed to end session on wrong WiFi', { data: err })
          );
        }
      } else {
        logger.wifi.debug('Clearing WiFi State - Not connected to WiFi');
        setIpAddress(null);
        setIsUniversityWifi(false);

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
        if (isUniversityWifi && !isSessionActive) {
          // Start session if connected to university WiFi but no active session
          try {
            await wifiService.startSession({ 
              ipAddress: ipAddress || '' 
            });
            await refreshStats();
            await refreshSessionCount();
            logger.wifi.info('WiFi session started', { ipAddress });
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
                      ipAddress: ipAddress || '' 
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
        } else if (!isUniversityWifi && isSessionActive) {
          // End session IMMEDIATELY if not connected to university WiFi but session is active
          logger.wifi.info('Not on university WiFi, ending session immediately');
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
  }, [isAuthenticated, isUniversityWifi, isSessionActive, ipAddress]);

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
  };

  return (
    <WiFiContext.Provider value={contextValue}>
      {children}
    </WiFiContext.Provider>
  );
}; 