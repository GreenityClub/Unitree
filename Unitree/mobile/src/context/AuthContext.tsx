import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../config/api';
import { authEvents, AUTH_EVENTS } from '../utils/authEvents';
import { logger } from '../utils/logger';

interface User {
  id: string;
  fullname: string;
  nickname: string;
  email: string;
  points: number;
  allTimePoints: number;
  treesPlanted: number;
  studentId?: string;
  university?: string;
  avatar?: string;
  role: string;
  notificationSettings: {
    achievements: boolean;
    attendance: boolean;
    treeHealth: boolean;
  };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  forceAuthCheck: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    checkAuthState();
    
    // Listen for auth events from API interceptor
    const handleSessionInvalid = async () => {
      if (isLoggingOut) return; // Prevent multiple logout attempts
      
      console.log('📧 Received SESSION_INVALID event, logging out user');
      setIsLoggingOut(true);
      setUser(null);
      setIsLoading(false); // Ensure loading is false to trigger navigation
      
      // Force navigation to login screen
      setTimeout(() => {
        try {
          const { router } = require('expo-router');
          router.replace('/auth/login');
          console.log('🚪 Forced navigation to login screen');
        } catch (error) {
          console.error('Navigation error:', error);
        }
        setIsLoggingOut(false);
      }, 100);
    };

    const handleTokenExpired = async () => {
      if (isLoggingOut) return; // Prevent multiple logout attempts
      
      console.log('📧 Received TOKEN_EXPIRED event, logging out user');
      setIsLoggingOut(true);
      setUser(null);
      setIsLoading(false); // Ensure loading is false to trigger navigation
      
      // Force navigation to login screen
      setTimeout(() => {
        try {
          const { router } = require('expo-router');
          router.replace('/auth/login');
          console.log('🚪 Forced navigation to login screen');
        } catch (error) {
          console.error('Navigation error:', error);
        }
        setIsLoggingOut(false);
      }, 100);
    };

    authEvents.on(AUTH_EVENTS.SESSION_INVALID, handleSessionInvalid);
    authEvents.on(AUTH_EVENTS.TOKEN_EXPIRED, handleTokenExpired);
    
    // Set up periodic auth check to handle session invalidation
    const authCheckInterval = setInterval(() => {
      if (user && !isLoggingOut) {
        checkAuthState();
      }
    }, 60000); // Check every 60 seconds if user is logged in

    return () => {
      clearInterval(authCheckInterval);
      authEvents.off(AUTH_EVENTS.SESSION_INVALID, handleSessionInvalid);
      authEvents.off(AUTH_EVENTS.TOKEN_EXPIRED, handleTokenExpired);
    };
  }, [user, isLoggingOut]);

  const checkAuthState = async () => {
    if (isLoggingOut) return; // Don't check auth state during logout
    
    try {
      const [token, refreshToken, cachedUser] = await AsyncStorage.multiGet(['authToken', 'refreshToken', 'user']);
      
      if (token[1] && refreshToken[1]) {
        try {
          const response = await authAPI.getMe();
          const freshUser = response.data;
          setUser(freshUser);
          
          // Update cached user data
          await AsyncStorage.setItem('user', JSON.stringify(freshUser));
        } catch (error: any) {
          // Handle timeout specifically
          if (error.message === 'AUTH_CHECK_TIMEOUT' || error.code === 'ECONNABORTED') {
            logger.auth.warn('Auth check timed out, using cached user data');
            
            // Use cached user data if available
            if (cachedUser[1]) {
              try {
                const parsedUser = JSON.parse(cachedUser[1]);
                setUser(parsedUser);
                logger.auth.info('Using cached user data due to network timeout');
                return; // Successfully using cached data
              } catch (parseError) {
                logger.auth.error('Failed to parse cached user data');
              }
            }
            
            // If no cached data available, clear auth state
            logger.auth.warn('No cached user data available, clearing auth state');
            await AsyncStorage.multiRemove(['authToken', 'refreshToken', 'user']);
            setUser(null);
            return;
          }
          
          // Handle auth check failures gracefully
          if (error.response?.status === 401) {
            if (error.response?.data?.code === 'SESSION_INVALID') {
              console.log('🔑 Session invalid - clearing auth data');
            } else {
              console.log('🔓 Authentication required - clearing auth data');
            }
            await AsyncStorage.multiRemove(['authToken', 'refreshToken', 'user']);
            setUser(null); // This will trigger the app to show login screen
          } else {
            console.error('Auth check failed:', error);
            // For other errors, try to use cached user data
            if (cachedUser[1]) {
              try {
                const parsedUser = JSON.parse(cachedUser[1]);
                setUser(parsedUser);
                logger.auth.info('Using cached user data due to auth check error');
              } catch (parseError) {
                logger.auth.error('Failed to parse cached user data');
                // If no cached user and token exists but API fails, logout
                console.log('No cached user data, logging out');
                await AsyncStorage.multiRemove(['authToken', 'refreshToken', 'user']);
                setUser(null);
              }
            } else {
              // If no cached user and token exists but API fails, logout
              console.log('No cached user data, logging out');
              await AsyncStorage.multiRemove(['authToken', 'refreshToken', 'user']);
              setUser(null);
            }
          }
        }
      } else {
        // No token, make sure user is null
        setUser(null);
      }
    } catch (error) {
      console.error('Auth state check error:', error);
      // On error, ensure user is logged out
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login(email, password);
      const { token, refreshToken, user } = response.data;
      
      await AsyncStorage.multiSet([
        ['authToken', token],
        ['refreshToken', refreshToken],
        ['user', JSON.stringify(user)]
      ]);
      setUser(user);
      
      // Refresh user data to ensure we have the latest points
      setTimeout(async () => {
        try {
          const refreshResponse = await authAPI.getMe();
          const refreshedUser = refreshResponse.data;
          setUser(refreshedUser);
          await AsyncStorage.setItem('user', JSON.stringify(refreshedUser));
        } catch (refreshError) {
          console.error('Failed to refresh user data after login:', refreshError);
        }
      }, 1000);
    } catch (error: any) {
      // Preserve the original error structure so LoginScreen can check error.response.data.code
      throw error;
    }
  };

  const register = async (userData: any) => {
    try {
      const response = await authAPI.register(userData);
      const { token, refreshToken, user } = response.data;
      
      await AsyncStorage.multiSet([
        ['authToken', token],
        ['refreshToken', refreshToken],
        ['user', JSON.stringify(user)]
      ]);
      setUser(user);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  };

  const logout = async () => {
    if (isLoggingOut) return; // Prevent multiple logout attempts
    
    try {
      setIsLoggingOut(true);
      
      // End WiFi session first while we still have authentication
      try {
        const { wifiService } = await import('../services/wifiService');
        await wifiService.endSession();
        logger.wifi.info('WiFi session ended successfully during logout');
      } catch (wifiError: any) {
        logger.wifi.info('No active WiFi session to end during logout - this is normal', { data: wifiError.message });
        // This is expected behavior - user might not have an active session when logging out
      }

      // Call server logout endpoint to clear session
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        try {
          await authAPI.logout();
        } catch (error) {
          console.error('Server logout error:', error);
          // Continue with local logout even if server call fails
        }
      }
      
      await AsyncStorage.multiRemove(['authToken', 'refreshToken', 'user']);
      setUser(null);
      authEvents.emit(AUTH_EVENTS.LOGOUT);
      logger.auth.info('User logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      // Even on error, ensure user is logged out
      setUser(null);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const forceAuthCheck = async () => {
          logger.auth.debug('Force auth check requested');
    await checkAuthState();
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateUser,
    forceAuthCheck,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 