import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { wifiService, WifiStats } from '../services/wifiService';
import { useAuth } from './AuthContext';
import ENV from '../config/env';

interface WiFiContextType {
  isConnected: boolean;
  ssid: string | null;
  bssid: string | null;
  isUniversityWifi: boolean;
  isSessionActive: boolean;
  currentSessionDuration: number;
  stats: WifiStats | null;
  refreshStats: () => Promise<void>;
  error: string | null;
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
  const { isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [ssid, setSsid] = useState<string | null>(null);
  const [bssid, setBssid] = useState<string | null>(null);
  const [isUniversityWifi, setIsUniversityWifi] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [currentSessionDuration, setCurrentSessionDuration] = useState(0);
  const [stats, setStats] = useState<WifiStats | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      
      setError(null);
    } catch (err) {
      console.error('Failed to refresh WiFi stats:', err);
      setError('Failed to refresh WiFi stats');
    }
  };

  // Monitor network state
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      // 🔥 LOG ALL WIFI INFORMATION FROM NETINFO 🔥
      console.log('📶 NetInfo State Update:', {
        timestamp: new Date().toISOString(),
        isConnected: state.isConnected,
        type: state.type,
        isInternetReachable: state.isInternetReachable,
        details: state.details,
        fullState: state
      });

      // Additional logging for wifi-specific details
      if (state.type === 'wifi' && state.details) {
        const wifiDetails = state.details as any;
        console.log('📡 WiFi Details:', {
          ssid: wifiDetails.ssid,
          bssid: wifiDetails.bssid,
          strength: wifiDetails.strength,
          ipAddress: wifiDetails.ipAddress,
          subnet: wifiDetails.subnet,
          frequency: wifiDetails.frequency,
          linkSpeed: wifiDetails.linkSpeed,
          rxLinkSpeed: wifiDetails.rxLinkSpeed,
          txLinkSpeed: wifiDetails.txLinkSpeed,
          allWifiDetails: wifiDetails
        });
      } else {
        console.log('📵 Not connected to WiFi or no WiFi details available:', {
          type: state.type,
          isConnected: state.isConnected
        });
      }

      setIsConnected(state.isConnected === true);
      
      if (state.type === 'wifi' && state.details) {
        const wifiDetails = state.details as any;
        const networkSSID = wifiDetails.ssid || null;
        const networkBSSID = wifiDetails.bssid || null;
        
        console.log('🔄 Setting WiFi State:', {
          ssid: networkSSID,
          bssid: networkBSSID
        });
        
        setSsid(networkSSID);
        setBssid(networkBSSID);
        
        // Check if connected to university WiFi
        const isUniWifi = wifiService.isUniversityWiFi(networkSSID);
        const isValidBSSID = wifiService.isValidUniversityBSSID(networkBSSID);
        console.log('🏫 University WiFi Check:', {
          ssid: networkSSID,
          bssid: networkBSSID,
          isUniversityWifi: isUniWifi,
          isValidBSSID: isValidBSSID,
          finalCheck: isUniWifi && isValidBSSID,
          universitySSIDs: ENV.UNIVERSITY_SSIDS,
          bssidPrefix: ENV.UNIVERSITY_BSSID_PREFIX
        });
        setIsUniversityWifi(isUniWifi && isValidBSSID);
      } else {
        console.log('❌ Clearing WiFi State - Not connected to WiFi');
        setSsid(null);
        setBssid(null);
        setIsUniversityWifi(false);
      }
    });

    return unsubscribe;
  }, []);

  // Auto-manage WiFi sessions
  useEffect(() => {
    if (!isAuthenticated) return;

    const manageSession = async () => {
      try {
        if (isUniversityWifi && !isSessionActive) {
          // Start session if connected to university WiFi but no active session
          await wifiService.startSession({ ssid: ssid || '', bssid: bssid || '' });
          await refreshStats();
        } else if (!isUniversityWifi && isSessionActive) {
          // End session if not connected to university WiFi but session is active
          await wifiService.endSession();
          await refreshStats();
        }
      } catch (err) {
        console.error('Session management error:', err);
        setError('Session management error');
      }
    };

    manageSession();
  }, [isAuthenticated, isUniversityWifi, isSessionActive]);

  // Periodic stats refresh
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      refreshStats();
    }, 60000); // Update every 60 seconds

    // Initial load
    refreshStats();

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const value: WiFiContextType = {
    isConnected,
    ssid,
    bssid,
    isUniversityWifi,
    isSessionActive,
    currentSessionDuration,
    stats,
    refreshStats,
    error
  };

  return (
    <WiFiContext.Provider value={value}>
      {children}
    </WiFiContext.Provider>
  );
}; 