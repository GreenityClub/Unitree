import { Alert } from 'react-native';
import ENV from '../config/env';
import LoggingConfig from '../config/logging';

/**
 * Smart logging utility that:
 * - Shows detailed logs in development
 * - Shows user-friendly messages in production
 * - Can display message boxes for critical errors
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4
}

interface LogOptions {
  showAlert?: boolean;
  alertTitle?: string;
  data?: any;
  category?: string;
}

class Logger {
  private shouldLog(level: LogLevel, category?: string): boolean {
    if (LoggingConfig.isDevelopment || LoggingConfig.debugMode) return true;
    
    // In production, check if this category is allowed
    if (LoggingConfig.isProduction && category) {
      // Never show disabled categories in production
      if (LoggingConfig.productionDisabledCategories.includes(category)) {
        return false;
      }
      
      // Always show allowed categories
      if (LoggingConfig.productionAllowedCategories.includes(category)) {
        return true;
      }
    }
    
    // In production, only show warnings, errors, and critical for uncategorized logs
    return level >= LogLevel.WARN;
  }

  private getLogPrefix(level: LogLevel, category?: string): string {
    const categoryText = category ? `[${category}] ` : '';
    
    switch (level) {
      case LogLevel.DEBUG: return `🔍 DEBUG ${categoryText}`;
      case LogLevel.INFO: return `ℹ️ INFO ${categoryText}`;
      case LogLevel.WARN: return `⚠️ WARN ${categoryText}`;
      case LogLevel.ERROR: return `❌ ERROR ${categoryText}`;
      case LogLevel.CRITICAL: return `🚨 CRITICAL ${categoryText}`;
      default: return `📝 LOG ${categoryText}`;
    }
  }

  private getUserFriendlyMessage(category: string, originalMessage: string): string {
    // Convert technical messages to user-friendly ones
    const userMessages: Record<string, Record<string, string>> = {
      'WiFi': {
        'NetInfo State Update': 'WiFi connection status updated',
        'WiFi Details': 'Checking network information',
        'University WiFi Check': 'Verifying university network',
        'Session validation': 'Validating WiFi session',
        'Session ended': 'WiFi session ended',
        'Session started': 'WiFi session started',
      },
      'Auth': {
        'Auth token available': 'Authentication verified',
        'Authentication required': 'Please log in to continue',
        'Authentication failed': 'Login failed, please try again',
        'Session invalid': 'Your session has expired',
      },
      'Background': {
        'Background sync': 'Syncing data in background',
        'Foreground sync': 'Updating app data',
        'Sync complete': 'Data synchronized successfully',
        'Sync failed': 'Unable to sync data, will retry later',
      },
      'Location': {
        'Location services': 'Checking location services',
        'Campus validation': 'Verifying campus location',
        'Permission denied': 'Location permission required for WiFi tracking',
      },
      'API': {
        'API Request Error': 'Network request failed',
        'API Response Error': 'Server communication error',
        'Connection failed': 'Unable to connect to server',
      }
    };

    // Find matching user-friendly message
    for (const [cat, messages] of Object.entries(userMessages)) {
      if (category.includes(cat)) {
        for (const [key, friendlyMsg] of Object.entries(messages)) {
          if (originalMessage.includes(key)) {
            return friendlyMsg;
          }
        }
      }
    }

    // Default user-friendly message
    return originalMessage.replace(/[🔐📶📡🏫🔄⚡🌍📍🧪]/g, '').trim();
  }

  debug(message: string, options: LogOptions = {}) {
    if (!this.shouldLog(LogLevel.DEBUG, options.category)) return;

    const prefix = this.getLogPrefix(LogLevel.DEBUG, options.category);
    console.log(`${prefix}${message}`, options.data || '');
  }

  info(message: string, options: LogOptions = {}) {
    if (!this.shouldLog(LogLevel.INFO, options.category)) return;

    const prefix = this.getLogPrefix(LogLevel.INFO, options.category);
    const displayMessage = LoggingConfig.showUserFriendlyMessages
      ? this.getUserFriendlyMessage(options.category || '', message)
      : message;

    console.log(`${prefix}${displayMessage}`, options.data || '');
  }

  warn(message: string, options: LogOptions = {}) {
    if (!this.shouldLog(LogLevel.WARN, options.category)) return;

    const prefix = this.getLogPrefix(LogLevel.WARN, options.category);
    const displayMessage = LoggingConfig.showUserFriendlyMessages
      ? this.getUserFriendlyMessage(options.category || '', message)
      : message;

    console.warn(`${prefix}${displayMessage}`, options.data || '');

    if (options.showAlert && LoggingConfig.showAlertsInProduction) {
      Alert.alert(
        options.alertTitle || 'Notice',
        displayMessage,
        [{ text: 'OK' }]
      );
    }
  }

  error(message: string, options: LogOptions = {}) {
    if (!this.shouldLog(LogLevel.ERROR, options.category)) return;

    const prefix = this.getLogPrefix(LogLevel.ERROR, options.category);
    const displayMessage = LoggingConfig.showUserFriendlyMessages
      ? this.getUserFriendlyMessage(options.category || '', message)
      : message;

    console.error(`${prefix}${displayMessage}`, options.data || '');

    if (options.showAlert) {
      Alert.alert(
        options.alertTitle || 'Error',
        displayMessage,
        [{ text: 'OK' }]
      );
    }
  }

  critical(message: string, options: LogOptions = {}) {
    const prefix = this.getLogPrefix(LogLevel.CRITICAL, options.category);
    const displayMessage = LoggingConfig.showUserFriendlyMessages
      ? this.getUserFriendlyMessage(options.category || '', message)
      : message;

    console.error(`${prefix}${displayMessage}`, options.data || '');

    // Always show alerts for critical errors
    Alert.alert(
      options.alertTitle || 'Critical Error',
      displayMessage,
      [{ text: 'OK' }]
    );
  }

  // Convenience methods for common categories
  wifi = {
    debug: (message: string, data?: any) => this.debug(message, { category: 'WiFi', data }),
    info: (message: string, data?: any) => this.info(message, { category: 'WiFi', data }),
    warn: (message: string, data?: any) => this.warn(message, { category: 'WiFi', data }),
    error: (message: string, data?: any) => this.error(message, { category: 'WiFi', data })
  };

  auth = {
    debug: (message: string, data?: any) => this.debug(message, { category: 'Auth', data }),
    info: (message: string, data?: any) => this.info(message, { category: 'Auth', data }),
    warn: (message: string, data?: any) => this.warn(message, { category: 'Auth', data }),
    error: (message: string, data?: any) => this.error(message, { category: 'Auth', data })
  };

  background = {
    debug: (message: string, data?: any) => this.debug(message, { category: 'Background', data }),
    info: (message: string, data?: any) => this.info(message, { category: 'Background', data }),
    warn: (message: string, data?: any) => this.warn(message, { category: 'Background', data }),
    error: (message: string, data?: any) => this.error(message, { category: 'Background', data })
  };

  location = {
    debug: (message: string, data?: any) => this.debug(message, { category: 'Location', data }),
    info: (message: string, data?: any) => this.info(message, { category: 'Location', data }),
    warn: (message: string, data?: any) => this.warn(message, { category: 'Location', data }),
    error: (message: string, data?: any) => this.error(message, { category: 'Location', data })
  };

  api = {
    debug: (message: string, data?: any) => this.debug(message, { category: 'API', data }),
    info: (message: string, data?: any) => this.info(message, { category: 'API', data }),
    warn: (message: string, data?: any) => this.warn(message, { category: 'API', data }),
    error: (message: string, data?: any) => this.error(message, { category: 'API', data })
  };
}

// Export singleton instance
export const logger = new Logger();

// Export convenience function for backward compatibility
export const log = logger; 