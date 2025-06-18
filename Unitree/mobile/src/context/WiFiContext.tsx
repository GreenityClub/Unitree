import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { wifiService, WiFiSession, WiFiStats } from '../services/wifiService';
import { useAuth } from './AuthContext';
import ENV from '../config/env';

interface WiFiContextType {
  currentSession: WiFiSession | null;
  isConnected: boolean;
  currentSSID: string | null;
  currentBSSID: string | null;
  connectionType: string | null;
  sessionHistory: WiFiSession[];
  wifiStats: WiFiStats | null;
  sessionDuration: number;
  potentialPoints: number;
  startTracking: () => Promise<void>;
  stopTracking: () => Promise<void>;
  checkWiFiStatus: () => Promise<void>;
  refreshHistory: () => Promise<void>;
  refreshStats: () => Promise<void>;
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
  const [currentSession, setCurrentSession] = useState<WiFiSession | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentSSID, setCurrentSSID] = useState<string | null>(null);
  const [currentBSSID, setCurrentBSSID] = useState<string | null>(null);
  const [connectionType, setConnectionType] = useState<string | null>(null);
  const [sessionHistory, setSessionHistory] = useState<WiFiSession[]>([]);
  const [wifiStats, setWifiStats] = useState<WiFiStats | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [potentialPoints, setPotentialPoints] = useState(0);
  
  const { isAuthenticated, updateUser, logout } = useAuth();
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      initializeWiFiTracking();
      
      return () => {
        if (updateIntervalRef.current) {
          clearInterval(updateIntervalRef.current);
        }
      };
    } else {
      // Clean up when user logs out
      stopTracking();
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    }
  }, [isAuthenticated]);

  const initializeWiFiTracking = async () => {
    await checkWiFiStatus();
    await loadActiveSession();
    await refreshHistory();
    await refreshStats();

    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener(state => {
      handleNetworkStateChange(state);
    });

    // Start real-time updates if there's an active session
    startRealTimeUpdates();

    // Cleanup function
    return () => {
      unsubscribe();
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  };

  const startRealTimeUpdates = () => {
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
    }

    updateIntervalRef.current = setInterval(async () => {
      if (currentSession && isAuthenticated) {
        try {
          const updatedSession = await wifiService.updateSession();
          setCurrentSession(updatedSession);
          setSessionDuration(updatedSession.currentDuration || 0);
          setPotentialPoints(updatedSession.potentialPoints || 0);
          
          // Refresh stats periodically
          await refreshStats();
        } catch (error) {
          console.error('Real-time update error:', error);
        }
      }
    }, ENV.SESSION_UPDATE_INTERVAL * 1000); // Convert to milliseconds
  };

  const handleNetworkStateChange = async (state: any) => {
    const { type, isConnected: netIsConnected, details } = state;
    
    setConnectionType(type);
    
    if (type === 'wifi' && netIsConnected && details) {
      const ssid = details.ssid;
      const bssid = details.bssid;
      
      setCurrentSSID(ssid);
      setCurrentBSSID(bssid);
      
      // Check if this is a valid university WiFi network
      const isValidSSID = wifiService.isUniversityWiFi(ssid);
      const isValidBSSID = wifiService.isValidUniversityBSSID(bssid);
      
      if (ENV.DEBUG_MODE) {
        console.log('WiFi Network Details:', {
          ssid,
          bssid,
          isValidSSID,
          isValidBSSID,
          universityBSSIDPrefix: ENV.UNIVERSITY_BSSID_PREFIX,
        });
      }
      
      if (isValidSSID && isValidBSSID) {
        setIsConnected(true);
        
        // Auto-start session if not already active
        if (!currentSession && isAuthenticated) {
          await startTracking();
        }
      } else {
        setIsConnected(false);
        
        // End session if connected to invalid WiFi
        if (currentSession) {
          await stopTracking();
        }
      }
    } else {
      // Not connected to WiFi or no connection
      setIsConnected(false);
      setCurrentSSID(null);
      setCurrentBSSID(null);
      
      // End session if disconnected
      if (currentSession) {
        await stopTracking();
      }
    }
  };

  const checkWiFiStatus = async () => {
    try {
      const state = await NetInfo.fetch();
      await handleNetworkStateChange(state);
    } catch (error) {
      console.error('WiFi check error:', error);
    }
  };

  const loadActiveSession = async () => {
    try {
      const session = await wifiService.getActiveSession();
      if (session) {
        setCurrentSession(session);
        setSessionDuration(session.currentDuration || 0);
        setPotentialPoints(session.potentialPoints || 0);
        startRealTimeUpdates();
      }
    } catch (error) {
      console.error('Load active session error:', error);
    }
  };

  const startTracking = async () => {
    if (!isConnected || !currentSSID || !currentBSSID || currentSession || !isAuthenticated) {
      return;
    }

    try {
      const session = await wifiService.startSession({
        ssid: currentSSID,
        bssid: currentBSSID,
      });
      
      setCurrentSession(session);
      setSessionDuration(0);
      setPotentialPoints(0);
      
      // Start real-time updates
      startRealTimeUpdates();
      
      if (ENV.DEBUG_MODE) {
        console.log('WiFi session started:', session);
      }
    } catch (error: any) {
      console.error('Start tracking error:', error);
      // Don't throw error to avoid disrupting user experience
    }
  };

  const stopTracking = async () => {
    if (!currentSession) {
      return;
    }

    try {
      const endedSession = await wifiService.endSession();
      
      // Update user points if points were earned
      if (endedSession.pointsEarned && endedSession.pointsEarned > 0) {
        updateUser({ points: endedSession.pointsEarned });
      }
      
      setCurrentSession(null);
      setSessionDuration(0);
      setPotentialPoints(0);
      
      // Stop real-time updates
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
      
      await refreshHistory();
      await refreshStats();
      
      if (ENV.DEBUG_MODE) {
        console.log('WiFi session ended:', endedSession);
      }
    } catch (error: any) {
      console.error('Stop tracking error:', error);
    }
  };

  const refreshHistory = async () => {
    if (!isAuthenticated) return;
    
    try {
      const history = await wifiService.getSessionHistory();
      setSessionHistory(history);
    } catch (error) {
      console.error('Refresh history error:', error);
    }
  };

  const refreshStats = async () => {
    if (!isAuthenticated) return;
    
    try {
      const stats = await wifiService.getStats();
      setWifiStats(stats);
    } catch (error) {
      console.error('Refresh stats error:', error);
    }
  };

  const value: WiFiContextType = {
    currentSession,
    isConnected,
    currentSSID,
    currentBSSID,
    connectionType,
    sessionHistory,
    wifiStats,
    sessionDuration,
    potentialPoints,
    startTracking,
    stopTracking,
    checkWiFiStatus,
    refreshHistory,
    refreshStats,
  };

  return (
    <WiFiContext.Provider value={value}>
      {children}
    </WiFiContext.Provider>
  );
}; 