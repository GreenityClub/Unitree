import WifiMonitor from '../services/WifiMonitor';
import ApiService from '../services/ApiService';

// Use proper SessionInfo type that matches WifiMonitor
interface SessionInfo {
  startTime: Date;
  ipAddress: string | null;
  duration: number;
  durationMinutes: number;
  sessionCount: number;
}

interface WifiMonitorTestResult {
  isRunning: boolean;
  sessionInfo: SessionInfo | null;
  hasToken: boolean;
  error?: string;
}

interface TestResult {
  success: boolean;
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        isRunning: false,
        sessionInfo: null,
        hasToken: false,
        error: errorMessage,
      };
    }
  }

  static async startMonitor(): Promise<TestResult> {
    try {
      // WifiMonitor.start expects (points: number) => void
      await WifiMonitor.start((points: number) => {
        console.log('🎉 Points earned in test:', points);
      });
      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start monitor';
      return { success: false, error: errorMessage };
    }
  }

  static stopMonitor(): TestResult {
    try {
      WifiMonitor.stop();
      return { success: true };
    } catch (error: unknown) {
      return { success: false };
    }
  }

  static addTestListener(): () => void {
    return WifiMonitor.addListener('connectionChange', (data: unknown) => {
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