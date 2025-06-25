import BackgroundWifiService from '../services/BackgroundWifiService';
import WifiMonitor from '../services/WifiMonitor';
import { logger } from './logger';

/**
 * Utility để test các tính năng WiFi session mới
 */
class WiFiSessionTester {
  private testResults: any[] = [];

  /**
   * Test tính năng dừng phiên ngay lập tức khi mất kết nối
   */
  async testImmediateStopOnDisconnection(): Promise<boolean> {
    try {
      logger.wifi.info('🧪 Testing immediate stop on WiFi disconnection...');
      
      // Simulate getting current session
      const currentSession = await BackgroundWifiService.getCurrentSession();
      
      if (currentSession?.isActive) {
        logger.wifi.info('✅ Found active session to test with');
        
        // Test ending session immediately
        const startTime = Date.now();
        await BackgroundWifiService.endCurrentBackgroundSession();
        const endTime = Date.now();
        
        const processingTime = endTime - startTime;
        logger.wifi.info(`⏱️ Session ended in ${processingTime}ms`);
        
        // Check if session was actually ended
        const sessionAfterEnd = await BackgroundWifiService.getCurrentSession();
        const isSessionEnded = !sessionAfterEnd || !sessionAfterEnd.isActive;
        
        this.testResults.push({
          test: 'immediate_stop_on_disconnection',
          passed: isSessionEnded && processingTime < 1000, // Should be fast
          processingTime,
          details: { isSessionEnded, processingTime }
        });
        
        return isSessionEnded;
      } else {
        logger.wifi.warn('⚠️ No active session found for testing');
        return false;
      }
    } catch (error) {
      logger.wifi.error('❌ Test failed: immediate stop on disconnection', { data: error });
      this.testResults.push({
        test: 'immediate_stop_on_disconnection',
        passed: false,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Test app reopen scenario
   */
  async testAppReopenScenario(): Promise<boolean> {
    try {
      logger.wifi.info('🧪 Testing app reopen scenario...');
      
      const startTime = Date.now();
      const result = await BackgroundWifiService.handleAppReopen();
      const endTime = Date.now();
      
      const processingTime = endTime - startTime;
      logger.wifi.info(`📱 App reopen handled in ${processingTime}ms`);
      logger.wifi.info(`📊 Results: sessionEnded=${result.sessionEnded}, sessionStarted=${result.sessionStarted}`);
      
      this.testResults.push({
        test: 'app_reopen_scenario',
        passed: processingTime < 2000, // Should complete quickly
        processingTime,
        sessionEnded: result.sessionEnded,
        sessionStarted: result.sessionStarted
      });
      
      return true;
    } catch (error) {
      logger.wifi.error('❌ Test failed: app reopen scenario', { data: error });
      this.testResults.push({
        test: 'app_reopen_scenario',
        passed: false,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Test background monitoring functionality
   */
  async testBackgroundMonitoring(): Promise<boolean> {
    try {
      logger.wifi.info('🧪 Testing background monitoring...');
      
      // Check if background monitoring is enabled
      const isEnabled = await BackgroundWifiService.isBackgroundMonitoringEnabled();
      logger.wifi.info(`📱 Background monitoring enabled: ${isEnabled}`);
      
      // Get sync stats
      const syncStats = await BackgroundWifiService.getSyncStats();
      logger.wifi.info('📊 Sync stats:', { data: syncStats });
      
      // Test sync functionality
      const syncResult = await BackgroundWifiService.syncPendingSessions();
      logger.wifi.info('🔄 Sync result:', { data: syncResult });
      
      this.testResults.push({
        test: 'background_monitoring',
        passed: true,
        isEnabled,
        syncStats,
        syncResult
      });
      
      return true;
    } catch (error) {
      logger.wifi.error('❌ Test failed: background monitoring', { data: error });
      this.testResults.push({
        test: 'background_monitoring',
        passed: false,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Test WiFi Monitor foreground functionality
   */
  async testWiFiMonitorForeground(): Promise<boolean> {
    try {
      logger.wifi.info('🧪 Testing WiFi Monitor foreground functionality...');
      
      // Check if WiFi Monitor is running
      const isRunning = WifiMonitor.isRunning();
      logger.wifi.info(`📡 WiFi Monitor running: ${isRunning}`);
      
      // Get current session info
      const sessionInfo = WifiMonitor.getSessionInfo();
      logger.wifi.info('📊 Current session info:', { data: sessionInfo });
      
      // Get session count
      const sessionCount = WifiMonitor.getSessionCount();
      logger.wifi.info(`📈 Session count: ${sessionCount}`);
      
      this.testResults.push({
        test: 'wifi_monitor_foreground',
        passed: true,
        isRunning,
        sessionInfo,
        sessionCount
      });
      
      return true;
    } catch (error) {
      logger.wifi.error('❌ Test failed: WiFi Monitor foreground', { data: error });
      this.testResults.push({
        test: 'wifi_monitor_foreground',
        passed: false,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Chạy tất cả tests
   */
  async runAllTests(): Promise<{ passed: number; failed: number; results: any[] }> {
    logger.wifi.info('🚀 Starting comprehensive WiFi session tests...');
    
    this.testResults = [];
    
    const tests = [
      () => this.testBackgroundMonitoring(),
      () => this.testWiFiMonitorForeground(),
      () => this.testAppReopenScenario(),
      () => this.testImmediateStopOnDisconnection(),
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const test of tests) {
      try {
        const result = await test();
        if (result) passed++;
        else failed++;
      } catch (error) {
        failed++;
        logger.wifi.error('Test execution failed', { data: error });
      }
    }
    
    logger.wifi.info(`🏁 Test suite completed: ${passed} passed, ${failed} failed`);
    
    return {
      passed,
      failed,
      results: this.testResults
    };
  }

  /**
   * Export test results as formatted string
   */
  exportResults(): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: {
        total: this.testResults.length,
        passed: this.testResults.filter(r => r.passed).length,
        failed: this.testResults.filter(r => !r.passed).length
      },
      details: this.testResults
    }, null, 2);
  }

  /**
   * Get quick status
   */
  getStatus(): string {
    const passed = this.testResults.filter(r => r.passed).length;
    const total = this.testResults.length;
    
    if (total === 0) return '⏳ No tests run yet';
    if (passed === total) return '✅ All tests passed';
    if (passed === 0) return '❌ All tests failed';
    return `⚠️ ${passed}/${total} tests passed`;
  }
}

// Export singleton instance
export default new WiFiSessionTester(); 