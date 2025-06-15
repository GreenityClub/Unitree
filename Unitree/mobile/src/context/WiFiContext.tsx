import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { wifiAPI } from '../config/api';
import { useAuth } from './AuthContext';
import ENV from '../config/env';

interface WiFiSession {
  _id: string;
  user: string;
  ssid: string;
  bssid?: string;
  startTime: Date;
  endTime?: Date;
  pointsEarned?: number;
}

interface WiFiContextType {
  currentSession: WiFiSession | null;
  isConnected: boolean;
  currentSSID: string | null;
  connectionType: string | null;
  sessionHistory: WiFiSession[];
  startTracking: () => Promise<void>;
  stopTracking: () => Promise<void>;
  checkWiFiStatus: () => Promise<void>;
  refreshHistory: () => Promise<void>;
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
  const [connectionType, setConnectionType] = useState<string | null>(null);
  const [sessionHistory, setSessionHistory] = useState<WiFiSession[]>([]);
  const { isAuthenticated, updateUser } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      checkWiFiStatus();
      loadActiveSession();
      refreshHistory();

      // Subscribe to network state changes
      const unsubscribe = NetInfo.addEventListener(state => {
        handleNetworkStateChange(state);
      });

      return () => {
        unsubscribe();
      };
    }
  }, [isAuthenticated]);

  const handleNetworkStateChange = async (state: any) => {
    const { type, isConnected: netIsConnected, details } = state;
    
    setConnectionType(type);
    
    if (type === 'wifi' && netIsConnected && details?.ssid) {
      const ssid = details.ssid;
      setCurrentSSID(ssid);
      
      // Check if this is a university WiFi network
      const isUniversityWiFi = ENV.UNIVERSITY_SSIDS.some((universitySSID: string) => 
        ssid.toLowerCase().includes(universitySSID.toLowerCase())
      );
      
      if (isUniversityWiFi) {
        setIsConnected(true);
        
        // Auto-start session if not already active
        if (!currentSession) {
          await startTracking();
        }
      } else {
        setIsConnected(false);
        
        // End session if connected to non-university WiFi
        if (currentSession) {
          await stopTracking();
        }
      }
    } else {
      // Not connected to WiFi or no connection
      setIsConnected(false);
      setCurrentSSID(null);
      
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
      const response = await wifiAPI.getActiveSession();
      if (response.data) {
        setCurrentSession(response.data);
      }
    } catch (error) {
      console.error('Load active session error:', error);
    }
  };

  const startTracking = async () => {
    if (!isConnected || !currentSSID || currentSession) {
      return;
    }

    try {
      const response = await wifiAPI.startSession(currentSSID, 'auto-detected');
      setCurrentSession(response.data);
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
      const response = await wifiAPI.endSession();
      
      // Update user points if points were earned
      if (response.data.pointsEarned) {
        updateUser({ points: (response.data.pointsEarned || 0) });
      }
      
      setCurrentSession(null);
      await refreshHistory();
    } catch (error: any) {
      console.error('Stop tracking error:', error);
    }
  };

  const refreshHistory = async () => {
    try {
      const response = await wifiAPI.getHistory();
      setSessionHistory(response.data);
    } catch (error) {
      console.error('Refresh history error:', error);
    }
  };

  const value: WiFiContextType = {
    currentSession,
    isConnected,
    currentSSID,
    connectionType,
    sessionHistory,
    startTracking,
    stopTracking,
    checkWiFiStatus,
    refreshHistory,
  };

  return (
    <WiFiContext.Provider value={value}>
      {children}
    </WiFiContext.Provider>
  );
}; 