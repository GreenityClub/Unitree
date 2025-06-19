import WifiMonitor from '../services/WifiMonitor';
import ApiService from '../services/ApiService';

interface WifiMonitorTestResult {
  isRunning: boolean;
  sessionInfo: any;
  hasToken: boolean;
  error?: string;
}

export class WifiMonitorTest {
  static async getStatus(): Promise<WifiMonitorTestResult> {
    try {
      const result: WifiMonitorTestResult = {
        isRunning: WifiMonitor.isRunning(),
        sessionInfo: WifiMonitor.getSessionInfo(),
        hasToken: !!ApiService.getToken(),
      };

      return result;
    } catch (error: any) {
      return {
        isRunning: false,
        sessionInfo: null,
        hasToken: false,
        error: error.message || 'Unknown error',
      };
    }
  }

  static async startMonitor(): Promise<{ success: boolean; error?: string }> {
    try {
      await WifiMonitor.start((points, data) => {
        console.log('🎉 Points earned in test:', points, data);
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to start monitor' };
    }
  }

  static stopMonitor(): { success: boolean } {
    try {
      WifiMonitor.stop();
      return { success: true };
    } catch (error) {
      return { success: false };
    }
  }

  static forceStopMonitor(): { success: boolean } {
    try {
      WifiMonitor.forceStop();
      return { success: true };
    } catch (error) {
      return { success: false };
    }
  }

  static addTestListener(): () => void {
    return WifiMonitor.addListener('connectionChange', (data) => {
      console.log('🔗 Connection change in test:', data);
    });
  }

  static logDetailedStatus(): void {
    console.log('📊 WiFi Monitor Detailed Status:', {
      isRunning: WifiMonitor.isRunning(),
      sessionInfo: WifiMonitor.getSessionInfo(),
      hasToken: !!ApiService.getToken(),
      timestamp: new Date().toISOString(),
    });
  }
}

// Add to global scope for easy testing in development
if (__DEV__) {
  (global as any).WifiMonitorTest = WifiMonitorTest;
  console.log('🧪 WifiMonitorTest available globally in development mode');
} 