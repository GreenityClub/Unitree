import ENV from './env';

// Logging configuration based on environment
export const LoggingConfig = {
  // In production, these categories are disabled to reduce noise
  productionDisabledCategories: [
    'WiFi',      // Disable WiFi technical logs in production
    'Debug',     // Disable debug logs in production  
    'Background' // Disable background sync details in production
  ],

  // Always show these categories even in production
  productionAllowedCategories: [
    'Auth',      // Authentication messages
    'API',       // API errors
    'Critical',  // Critical errors
    'Location'   // Location permission issues
  ],

  // Show user-friendly messages for these categories in production
  showUserFriendlyMessages: ENV.isProduction && !ENV.DEBUG_MODE,

  // Show alerts for critical errors in production
  showAlertsInProduction: ENV.isProduction,

  // Current environment info
  isDevelopment: ENV.isDevelopment,
  isProduction: ENV.isProduction,
  debugMode: ENV.DEBUG_MODE,
};

export default LoggingConfig; 