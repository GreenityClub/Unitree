import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';
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
  forceLogout: () => Promise<void>;
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
  const [lastAuthCheck, setLastAuthCheck] = useState<number>(0);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const [consecutiveFailures, setConsecutiveFailures] = useState<number>(0);

  useEffect(() => {
    // Add a small delay to prevent immediate API calls on app startup
    const initialCheckTimeout = setTimeout(() => {
      checkAuthState(false); // Initial check, not forced
    }, 1000); // 1 second delay
    
    return () => clearTimeout(initialCheckTimeout);
    
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
    
    // Set up AppState listener to pause auth checks when app is in background
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      console.log('📱 App state changed:', appState, '->', nextAppState);
      setAppState(nextAppState);
      
      // Reset consecutive failures when app becomes active
      if (nextAppState === 'active') {
        console.log('📱 App became active, resetting consecutive failures');
        setConsecutiveFailures(0);
      }
    };
    
    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Set up periodic auth check to handle session invalidation
    const authCheckInterval = setInterval(() => {
      // Only check auth when app is active and user is logged in
      // Skip checks if there are too many consecutive failures
      if (user && !isLoggingOut && !isCheckingAuth && appState === 'active' && consecutiveFailures < 3) {
        checkAuthState(false); // Regular check, not forced
      } else if (consecutiveFailures >= 3) {
        console.log('🔍 Skipping auth check due to consecutive failures:', consecutiveFailures);
      }
    }, 300000); // Check every 5 minutes if user is logged in (reduced from 60 seconds)

    return () => {
      clearInterval(authCheckInterval);
      authEvents.off(AUTH_EVENTS.SESSION_INVALID, handleSessionInvalid);
      authEvents.off(AUTH_EVENTS.TOKEN_EXPIRED, handleTokenExpired);
      appStateSubscription?.remove();
    };
  }, []); // Remove dependencies to prevent infinite loop

  // Separate useEffect to handle user state changes without creating infinite loops
  useEffect(() => {
    // This effect only runs when user or isLoggingOut changes, but doesn't trigger auth checks
    // It's used for any side effects that need to happen when user state changes
    if (user) {
      console.log('👤 User state updated:', user.email);
    } else {
      console.log('👤 User logged out');
    }
  }, [user, isLoggingOut]);

  const checkAuthState = async (force = false) => {
    if (isLoggingOut) {
      console.log('🔍 Auth check skipped - user is logging out');
      return;
    }
    if (isCheckingAuth && !force) return; // Prevent concurrent auth checks
    
    // Don't check auth when app is in background (unless forced)
    if (!force && appState !== 'active') {
      console.log('🔍 Auth check skipped - app not active:', appState);
      return;
    }
    
    const now = Date.now();
    const timeSinceLastCheck = now - lastAuthCheck;
    const minInterval = 10000; // Minimum 10 seconds between auth checks (increased from 5 seconds)
    
    if (!force && timeSinceLastCheck < minInterval) {
      console.log('🔍 Auth check skipped - too soon since last check:', timeSinceLastCheck, 'ms');
      return;
    }
    
    console.log('🔍 Starting auth state check...', force ? '(forced)' : '', 'App state:', appState);
    setIsCheckingAuth(true);
    setLastAuthCheck(now);
    
    try {
      const [token, refreshToken, cachedUser] = await AsyncStorage.multiGet(['authToken', 'refreshToken', 'user']);
      console.log('🔍 Tokens found:', { 
        hasToken: !!token[1], 
        hasRefreshToken: !!refreshToken[1], 
        hasCachedUser: !!cachedUser[1] 
      });
      
      // Early return if no tokens (don't waste time on API call)
      if (!token[1] || !refreshToken[1]) {
        console.log('❌ No tokens found, setting user to null');
        setUser(null);
        return;
      }
      
      if (token[1] && refreshToken[1]) {
        console.log('🔍 Tokens found, calling API...');
        
        // Use cached user data if available and not forced
        if (!force && cachedUser[1]) {
          try {
            const parsedUser = JSON.parse(cachedUser[1]);
            console.log('✅ Using cached user data (not forced)');
            setUser(parsedUser);
            setLastAuthCheck(now);
            setConsecutiveFailures(0); // Reset failure counter when using cached data
            return; // Successfully using cached data
          } catch (parseError) {
            console.log('❌ Failed to parse cached user data, calling API');
          }
        }
        
        try {
          // Add timeout to prevent hanging
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('AUTH_CHECK_TIMEOUT')), 15000); // 15 second timeout (increased from 10)
          });
          
          const apiPromise = authAPI.getMe();
          const response = await Promise.race([apiPromise, timeoutPromise]) as any;
          const freshUser = response.data;
          console.log('✅ API call successful, setting user');
          setUser(freshUser);
          
          // Update cached user data
          await AsyncStorage.setItem('user', JSON.stringify(freshUser));
          
          // Reset failed attempts counter on success
          setLastAuthCheck(now);
          setConsecutiveFailures(0); // Reset failure counter on success
        } catch (error: any) {
          console.log('❌ API call failed:', error.message);
          setConsecutiveFailures(prev => prev + 1);
          // Handle timeout specifically
          if (error.message === 'AUTH_CHECK_TIMEOUT' || error.code === 'ECONNABORTED') {
            logger.auth.warn('Auth check timed out, using cached user data');
            
            // Use cached user data if available
            if (cachedUser[1]) {
              try {
                const parsedUser = JSON.parse(cachedUser[1]);
                console.log('✅ Using cached user data due to timeout');
                setUser(parsedUser);
                logger.auth.info('Using cached user data due to network timeout');
                setConsecutiveFailures(0); // Reset failure counter when using cached data
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
                console.log('✅ Using cached user data due to API error');
                setUser(parsedUser);
                logger.auth.info('Using cached user data due to auth check error');
                setConsecutiveFailures(0); // Reset failure counter when using cached data
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
        console.log('❌ No tokens found, setting user to null');
        setUser(null);
      }
    } catch (error) {
      console.error('Auth state check error:', error);
      // On error, ensure user is logged out
      setUser(null);
    } finally {
      console.log('✅ Auth state check completed, setting isLoading to false');
      setIsLoading(false);
      setIsCheckingAuth(false);
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
          await forceAuthCheck();
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
      
      // Refresh user data to ensure we have the latest data
      setTimeout(async () => {
        try {
          await forceAuthCheck();
        } catch (refreshError) {
          console.error('Failed to refresh user data after registration:', refreshError);
        }
      }, 1000);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  };

  const logout = async () => {
    if (isLoggingOut) return; // Prevent multiple logout attempts
    
    console.log('🚪 Starting logout process...');
    
    try {
      setIsLoggingOut(true);
      console.log('🚪 Set isLoggingOut to true');
      
      // End WiFi session first while we still have authentication
      try {
        console.log('🚪 Importing wifiService...');
        const { wifiService } = await import('../services/wifiService');
        console.log('🚪 wifiService imported successfully');
        
        console.log('🚪 Ending WiFi session...');
        // Add timeout for WiFi session end
        const wifiTimeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('WIFI_SESSION_TIMEOUT')), 5000); // 5 second timeout
        });
        
        const wifiEndPromise = wifiService.endSession();
        await Promise.race([wifiEndPromise, wifiTimeoutPromise]);
        logger.wifi.info('WiFi session ended successfully during logout');
        console.log('🚪 WiFi session ended successfully');
      } catch (wifiError: any) {
        console.log('🚪 WiFi session error:', wifiError.message);
        if (wifiError.message?.includes('No active session found') || wifiError.message?.includes('WIFI_SESSION_TIMEOUT')) {
          logger.wifi.info('No active WiFi session to end during logout - this is normal', { data: wifiError.message });
        } else {
          console.error('Failed to import wifiService during logout:', wifiError);
        }
        // Continue with logout even if wifiService fails
      }

      // Call server logout endpoint to clear session
      const token = await AsyncStorage.getItem('authToken');
      console.log('🚪 Token found:', !!token);
      
      if (token) {
        try {
          console.log('🚪 Calling server logout endpoint...');
          // Add timeout for server logout
          const serverTimeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('SERVER_LOGOUT_TIMEOUT')), 5000); // 5 second timeout
          });
          
          const serverLogoutPromise = authAPI.logout();
          await Promise.race([serverLogoutPromise, serverTimeoutPromise]);
          console.log('🚪 Server logout successful');
        } catch (error) {
          console.error('Server logout error:', error);
          // Continue with local logout even if server call fails
        }
      }
      
      console.log('🚪 Clearing local storage...');
      await AsyncStorage.multiRemove(['authToken', 'refreshToken', 'user']);
      console.log('🚪 Local storage cleared');
      
      console.log('🚪 Setting user to null...');
      setUser(null);
      console.log('🚪 User set to null');
      
      console.log('🚪 Emitting logout event...');
      authEvents.emit(AUTH_EVENTS.LOGOUT);
      console.log('🚪 Logout event emitted');
      
      logger.auth.info('User logged out successfully');
      console.log('🚪 Logout completed successfully');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      console.log('🚪 Setting isLoggingOut to false');
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
    // Force auth check bypasses the debounce mechanism
    if (isLoggingOut) return;
    
    console.log('🔍 Force auth check - bypassing debounce');
    await checkAuthState(true);
  };

  const forceLogout = async () => {
    console.log('🚪 Force logout - bypassing all API calls');
    try {
      setIsLoggingOut(true);
      
      // Clear all local storage immediately
      await AsyncStorage.multiRemove(['authToken', 'refreshToken', 'user']);
      setUser(null);
      authEvents.emit(AUTH_EVENTS.LOGOUT);
      logger.auth.info('User force logged out successfully');
      console.log('🚪 Force logout completed');
    } catch (error) {
      console.error('Force logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    forceLogout,
    updateUser,
    forceAuthCheck,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 