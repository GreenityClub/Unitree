import Constants from 'expo-constants';

// Environment Variables Configuration
const ENV = {
  // API Configuration
  API_URL: process.env.EXPO_PUBLIC_API_URL || Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000',
  API_TIMEOUT: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '10000', 10),

  // App Configuration
  APP_NAME: process.env.EXPO_PUBLIC_APP_NAME || 'UniTree',
  APP_VERSION: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
  APP_SCHEME: process.env.EXPO_PUBLIC_APP_SCHEME || 'unitree',

  // WiFi IP Address Configuration (first 2 numbers separated by periods for tracking)
  UNIVERSITY_IP_PREFIX: process.env.EXPO_PUBLIC_UNIVERSITY_IP_PREFIX || '192.168',

  // Points Configuration
  POINTS_PER_HOUR: parseInt(process.env.EXPO_PUBLIC_POINTS_PER_HOUR || '60', 10), // 1 minute = 1 point (60 points per hour)
  POINTS_FOR_TREE: parseInt(process.env.EXPO_PUBLIC_POINTS_FOR_TREE || '100', 10),

  // WiFi Session Configuration
  MIN_SESSION_DURATION: parseInt(process.env.EXPO_PUBLIC_MIN_SESSION_DURATION || '300', 10), // 5 minutes in seconds
  SESSION_UPDATE_INTERVAL: parseInt(process.env.EXPO_PUBLIC_SESSION_UPDATE_INTERVAL || '60', 10), // 1 minute in seconds

  // Feature Flags
  ENABLE_LOCATION_TRACKING: process.env.EXPO_PUBLIC_ENABLE_LOCATION_TRACKING === 'true',
  ENABLE_BACKGROUND_SYNC: process.env.EXPO_PUBLIC_ENABLE_BACKGROUND_SYNC === 'true',
  ENABLE_NOTIFICATIONS: process.env.EXPO_PUBLIC_ENABLE_NOTIFICATIONS === 'true',

  // Development Settings
  DEBUG_MODE: process.env.EXPO_PUBLIC_DEBUG_MODE === 'true',
  LOG_LEVEL: process.env.EXPO_PUBLIC_LOG_LEVEL || 'info',

  // EAS Configuration
  EAS_PROJECT_ID: process.env.EAS_PROJECT_ID || Constants.expoConfig?.extra?.eas?.projectId,

  // Development Environment Detection
  isDevelopment: __DEV__,
  isProduction: !__DEV__,

  // Platform Detection
  isAndroid: require('react-native').Platform.OS === 'android',
  isIOS: require('react-native').Platform.OS === 'ios',
  isWeb: require('react-native').Platform.OS === 'web',
};

// Type definitions for better TypeScript support
export interface EnvironmentConfig {
  API_URL: string;
  API_TIMEOUT: number;
  APP_NAME: string;
  APP_VERSION: string;
  APP_SCHEME: string;
  UNIVERSITY_IP_PREFIX: string;
  POINTS_PER_HOUR: number;
  POINTS_FOR_TREE: number;
  MIN_SESSION_DURATION: number;
  SESSION_UPDATE_INTERVAL: number;
  ENABLE_LOCATION_TRACKING: boolean;
  ENABLE_BACKGROUND_SYNC: boolean;
  ENABLE_NOTIFICATIONS: boolean;
  DEBUG_MODE: boolean;
  LOG_LEVEL: string;
  EAS_PROJECT_ID?: string;
  isDevelopment: boolean;
  isProduction: boolean;
  isAndroid: boolean;
  isIOS: boolean;
  isWeb: boolean;
}

// Validation function to ensure required environment variables are set
export const validateEnvironment = (): void => {
  const requiredVars = [
    'API_URL',
    'APP_NAME',
    'APP_VERSION',
  ];

  const missingVars = requiredVars.filter(varName => {
    const value = ENV[varName as keyof typeof ENV];
    return !value || value === '';
  });

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
      'Please check your .env file and ensure all required variables are set.'
    );
  }

  // Log configuration in development mode
  if (ENV.DEBUG_MODE) {
    console.log('🌍 Environment Configuration:', {
      API_URL: ENV.API_URL,
      APP_NAME: ENV.APP_NAME,
      APP_VERSION: ENV.APP_VERSION,
      UNIVERSITY_IP_PREFIX: ENV.UNIVERSITY_IP_PREFIX,
      POINTS_PER_HOUR: ENV.POINTS_PER_HOUR,
      POINTS_FOR_TREE: ENV.POINTS_FOR_TREE,
      isDevelopment: ENV.isDevelopment,
      platform: ENV.isAndroid ? 'android' : ENV.isIOS ? 'ios' : 'web',
    });
  }
};

export default ENV; 