import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import ENV from '../config/env';
import ApiService from '../services/ApiService';

interface NotificationTestResult {
  deviceType: string;
  isDevice: boolean;
  hasPermissions: boolean;
  pushToken: string | null;
  projectId: string | undefined;
  firebaseProjectId: string | null;
  tokenSavedToServer: boolean;
  error?: string;
}

export class NotificationTester {
  /**
   * Comprehensive test của push notification system
   */
  static async runFullTest(): Promise<NotificationTestResult> {
    const result: NotificationTestResult = {
      deviceType: Device.isDevice ? 'Physical Device' : 'Simulator/Emulator',
      isDevice: Device.isDevice,
      hasPermissions: false,
      pushToken: null,
      projectId: ENV.EAS_PROJECT_ID,
      firebaseProjectId: this.getFirebaseProjectId(),
      tokenSavedToServer: false,
    };

    try {
      console.log('🧪 Starting Push Notification Test...');
      console.log('📱 Device Info:', {
        isDevice: result.isDevice,
        deviceType: result.deviceType,
        platform: Device.osName,
        easProjectId: result.projectId,
        firebaseProjectId: result.firebaseProjectId,
      });

      // 1. Check permissions
      const permissions = await this.checkPermissions();
      result.hasPermissions = permissions.granted;
      console.log('🔐 Permissions:', permissions);

      if (!permissions.granted) {
        result.error = 'Notification permissions not granted';
        return result;
      }

      // 2. Get push token
      if (Device.isDevice) {
        const tokenResult = await this.getPushToken();
        result.pushToken = tokenResult.token;
        
        console.log('📋 Token Info:', {
          token: tokenResult.token,
          isValid: tokenResult.isValid,
          format: tokenResult.format,
        });

        if (!tokenResult.token) {
          result.error = tokenResult.error || 'Failed to get push token';
          return result;
        }

        // 3. Save token to server
        const serverResult = await this.saveTokenToServer(tokenResult.token);
        result.tokenSavedToServer = serverResult.success;
        
        console.log('💾 Server Save Result:', serverResult);

        if (!serverResult.success) {
          result.error = `Failed to save token to server: ${serverResult.error}`;
        }

      } else {
        result.error = 'Push notifications only work on physical devices';
      }

    } catch (error: any) {
      result.error = error.message;
      console.error('❌ Test failed:', error);
    }

    console.log('🏁 Test completed:', result);
    return result;
  }

  /**
   * Kiểm tra permissions
   */
  private static async checkPermissions(): Promise<Notifications.NotificationPermissionsStatus> {
    const existing = await Notifications.getPermissionsAsync();
    
    if (existing.status !== 'granted') {
      const requested = await Notifications.requestPermissionsAsync();
      return requested;
    }
    
    return existing;
  }

  /**
   * Lấy push token
   */
  private static async getPushToken(): Promise<{
    token: string | null;
    isValid: boolean;
    format: string;
    error?: string;
  }> {
    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: ENV.EAS_PROJECT_ID,
      });

      const token = tokenData.data;
      const isValid = this.validatePushToken(token);
      const format = this.getTokenFormat(token);

      return {
        token,
        isValid,
        format,
      };
    } catch (error: any) {
      return {
        token: null,
        isValid: false,
        format: 'unknown',
        error: error.message,
      };
    }
  }

  /**
   * Validate push token format
   */
  private static validatePushToken(token: string): boolean {
    if (!token) return false;
    
    // Expo push token format: ExponentPushToken[...]
    const expoTokenRegex = /^ExponentPushToken\[.+\]$/;
    return expoTokenRegex.test(token);
  }

  /**
   * Detect token format
   */
  static getTokenFormat(token: string): string {
    if (!token) return 'none';
    
    if (token.startsWith('ExponentPushToken[')) {
      const content = token.slice(18, -1); // Remove "ExponentPushToken[" and "]"
      
      if (content.length < 20) {
        return 'expo-go-development';
      } else if (content.includes('-')) {
        return 'production-build';
      } else {
        return 'standalone-build';
      }
    }
    
    return 'unknown';
  }

  /**
   * Save token to server
   */
  private static async saveTokenToServer(token: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      await ApiService.post('/api/user/push-token', { pushToken: token });
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Unknown server error',
      };
    }
  }

  /**
   * Get Firebase project ID từ Constants
   */
  private static getFirebaseProjectId(): string | null {
    // Try to get from expo config
    const easConfig = Constants.expoConfig;
    
    // For Android
    if (easConfig?.android?.googleServicesFile) {
      return 'unitree-a643c'; // From google-services.json
    }
    
    // For iOS  
    if (easConfig?.ios?.googleServicesFile) {
      return 'unitree-a643c'; // From GoogleService-Info.plist
    }
    
    return null;
  }

  /**
   * Test sending notification to current device
   */
  static async testSendNotification(): Promise<{
    success: boolean;
    message: string;
    error?: string;
  }> {
    try {
      const response = await ApiService.post('/api/notification/test', {
        type: 'test'
      });

      return {
        success: response.data.success,
        message: response.data.message,
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Failed to send test notification',
        error: error.message,
      };
    }
  }

  /**
   * Debug information cho troubleshooting
   */
  static async getDebugInfo(): Promise<Record<string, any>> {
    return {
      // Device info
      device: {
        isDevice: Device.isDevice,
        platform: Device.osName,
        modelName: Device.modelName,
        osVersion: Device.osVersion,
      },
      
      // Configuration
      config: {
        easProjectId: ENV.EAS_PROJECT_ID,
        apiUrl: ENV.API_URL,
        enableNotifications: ENV.ENABLE_NOTIFICATIONS,
        isDevelopment: ENV.isDevelopment,
      },
      
      // Constants
      constants: {
        expoConfig: Constants.expoConfig?.name,
        appOwnership: Constants.appOwnership,
        executionEnvironment: Constants.executionEnvironment,
      },
      
      // Permissions
      permissions: await Notifications.getPermissionsAsync(),
    };
  }
}

export default NotificationTester; 