/**
 * Stale Session Detection Test Utility
 * 
 * Test các scenarios để đảm bảo WiFi session không đếm thời gian
 * khi app bị đóng hoàn toàn.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { BackgroundWifiService } from '../services/BackgroundWifiService';
import { logger } from './logger';

interface TestResult {
  testName: string;
  success: boolean;
  message: string;
  duration?: number;
  details?: any;
}

class StaleSessionTester {
  private static instance: StaleSessionTester;
  
  static getInstance(): StaleSessionTester {
    if (!StaleSessionTester.instance) {
      StaleSessionTester.instance = new StaleSessionTester();
    }
    return StaleSessionTester.instance;
  }

  /**
   * Test 1: Normal background usage (app minimized)
   */
  async testNormalBackgroundUsage(): Promise<TestResult> {
    try {
      console.log('🧪 Test 1: Normal background usage');
      
      // Simulate app going to background for 5 minutes
      const service = BackgroundWifiService.getInstance();
      await service.handleAppGoingToBackground();
      
      // Simulate time passing (5 minutes)
      const testStartTime = new Date().toISOString();
      await this.simulateTimePass(5 * 60 * 1000); // 5 minutes
      
      // Check if session is still active
      const session = await service.getCurrentSession();
      
      if (session && session.isActive) {
        return {
          testName: 'Normal Background Usage',
          success: true,
          message: 'Session correctly maintained during normal background time',
          duration: session.duration,
          details: {
            sessionId: session.id,
            backgroundTime: session.metadata?.backgroundModeStartTime,
            isInBackground: session.metadata?.isInBackground
          }
        };
      } else {
        return {
          testName: 'Normal Background Usage',
          success: false,
          message: 'Session incorrectly ended during normal background time',
          details: { session }
        };
      }
    } catch (error) {
      return {
        testName: 'Normal Background Usage',
        success: false,
        message: `Test failed with error: ${error.message}`,
        details: { error }
      };
    }
  }

  /**
   * Test 2: App force close simulation
   */
  async testAppForceCloseDetection(): Promise<TestResult> {
    try {
      console.log('🧪 Test 2: App force close detection');
      
      const service = BackgroundWifiService.getInstance();
      
      // Start a session
      await this.simulateUniversityWiFiConnection();
      
      // Simulate app going to background
      await service.handleAppGoingToBackground();
      
      // Simulate app being force closed (no activity for 15 minutes)
      await this.simulateTimePass(15 * 60 * 1000); // 15 minutes
      
      // Clear last app activity to simulate force close
      await AsyncStorage.removeItem('bg_last_app_activity');
      
      // Trigger background check (this should detect stale session)
      // We need to manually trigger the check since we can't wait for the real interval
      await this.triggerBackgroundCheck();
      
      // Check if session was ended due to being stale
      const session = await service.getCurrentSession();
      const pendingSessions = await service.getPendingSessions();
      
      if (!session || !session.isActive) {
        // Check if the ended session is in pending queue
        const endedSession = pendingSessions.find(s => s.metadata?.endReason === 'stale_session');
        
        if (endedSession) {
          return {
            testName: 'App Force Close Detection',
            success: true,
            message: 'Stale session correctly detected and ended',
            duration: endedSession.duration,
            details: {
              endedSessionId: endedSession.id,
              endReason: endedSession.metadata?.endReason,
              finalDuration: endedSession.duration
            }
          };
        } else {
          return {
            testName: 'App Force Close Detection',
            success: false,
            message: 'Session ended but not marked as stale session',
            details: { pendingSessions }
          };
        }
      } else {
        return {
          testName: 'App Force Close Detection',
          success: false,
          message: 'Stale session was NOT detected - session still active',
          details: { session }
        };
      }
    } catch (error) {
      return {
        testName: 'App Force Close Detection',
        success: false,
        message: `Test failed with error: ${error.message}`,
        details: { error }
      };
    }
  }

  /**
   * Test 3: Long background duration (5+ hours)
   */
  async testLongBackgroundDuration(): Promise<TestResult> {
    try {
      console.log('🧪 Test 3: Long background duration');
      
      const service = BackgroundWifiService.getInstance();
      
      // Start a session
      await this.simulateUniversityWiFiConnection();
      
      // Simulate app going to background
      await service.handleAppGoingToBackground();
      
      // Simulate long background time (5.5 hours)
      await this.simulateTimePass(5.5 * 60 * 60 * 1000); // 5.5 hours
      
      // Trigger background check
      await this.triggerBackgroundCheck();
      
      // Check if session was ended due to max background duration
      const session = await service.getCurrentSession();
      const pendingSessions = await service.getPendingSessions();
      
      if (!session || !session.isActive) {
        const endedSession = pendingSessions[pendingSessions.length - 1]; // Get latest ended session
        
        if (endedSession && endedSession.duration <= (5 * 60 * 60 + 5 * 60)) { // Max 5.08 hours (5 hours + 5 min grace)
          return {
            testName: 'Long Background Duration',
            success: true,
            message: 'Session correctly ended after max background duration',
            duration: endedSession.duration,
            details: {
              endedSessionId: endedSession.id,
              finalDuration: endedSession.duration,
              maxAllowed: 5 * 60 * 60 + 5 * 60 // 5.08 hours
            }
          };
        } else {
          return {
            testName: 'Long Background Duration',
            success: false,
            message: 'Session duration exceeded expected maximum',
            details: { endedSession }
          };
        }
      } else {
        return {
          testName: 'Long Background Duration',
          success: false,
          message: 'Session was NOT ended after long background duration',
          details: { session }
        };
      }
    } catch (error) {
      return {
        testName: 'Long Background Duration',
        success: false,
        message: `Test failed with error: ${error.message}`,
        details: { error }
      };
    }
  }

  /**
   * Test 4: App reopen scenario
   */
  async testAppReopenScenario(): Promise<TestResult> {
    try {
      console.log('🧪 Test 4: App reopen scenario');
      
      const service = BackgroundWifiService.getInstance();
      
      // Start a session
      await this.simulateUniversityWiFiConnection();
      const initialSession = await service.getCurrentSession();
      
      // Simulate app going to background
      await service.handleAppGoingToBackground();
      
      // Simulate some time passing
      await this.simulateTimePass(10 * 60 * 1000); // 10 minutes
      
      // Simulate app reopen
      const reopenResult = await service.handleAppReopen();
      
      // Check results
      const newSession = await service.getCurrentSession();
      const pendingSessions = await service.getPendingSessions();
      
      if (reopenResult.sessionEnded && reopenResult.sessionStarted) {
        return {
          testName: 'App Reopen Scenario',
          success: true,
          message: 'App reopen correctly handled - old session ended, new session started',
          details: {
            oldSessionId: initialSession?.id,
            newSessionId: newSession?.id,
            sessionEnded: reopenResult.sessionEnded,
            sessionStarted: reopenResult.sessionStarted,
            pendingSessionsCount: pendingSessions.length
          }
        };
      } else if (reopenResult.sessionEnded && !reopenResult.sessionStarted) {
        return {
          testName: 'App Reopen Scenario',
          success: true,
          message: 'Old session ended but no new session started (might be off university WiFi)',
          details: reopenResult
        };
      } else {
        return {
          testName: 'App Reopen Scenario',
          success: false,
          message: 'App reopen did not handle session transition correctly',
          details: { reopenResult, newSession, pendingSessions }
        };
      }
    } catch (error) {
      return {
        testName: 'App Reopen Scenario',
        success: false,
        message: `Test failed with error: ${error.message}`,
        details: { error }
      };
    }
  }

  /**
   * Test 5: Stale detection accuracy
   */
  async testStaleDetectionAccuracy(): Promise<TestResult> {
    try {
      console.log('🧪 Test 5: Stale detection accuracy');
      
      const service = BackgroundWifiService.getInstance();
      
      // Start a session
      await this.simulateUniversityWiFiConnection();
      
      // Set last app activity to 12 minutes ago (beyond 10-minute threshold)
      const staleTime = new Date(Date.now() - 12 * 60 * 1000).toISOString();
      await AsyncStorage.setItem('bg_last_app_activity', staleTime);
      
      // Trigger background check
      await this.triggerBackgroundCheck();
      
      // Check if session was detected as stale
      const session = await service.getCurrentSession();
      const pendingSessions = await service.getPendingSessions();
      
      if (!session || !session.isActive) {
        const staleSession = pendingSessions.find(s => s.metadata?.endReason === 'stale_session');
        
        if (staleSession) {
          return {
            testName: 'Stale Detection Accuracy',
            success: true,
            message: 'Stale session accurately detected based on app activity threshold',
            details: {
              staleSessionId: staleSession.id,
              lastActivityTime: staleTime,
              endReason: staleSession.metadata?.endReason
            }
          };
        } else {
          return {
            testName: 'Stale Detection Accuracy',
            success: false,
            message: 'Session ended but not marked as stale',
            details: { pendingSessions }
          };
        }
      } else {
        return {
          testName: 'Stale Detection Accuracy',
          success: false,
          message: 'Stale session was NOT detected despite old app activity',
          details: { session, lastActivity: staleTime }
        };
      }
    } catch (error) {
      return {
        testName: 'Stale Detection Accuracy',
        success: false,
        message: `Test failed with error: ${error.message}`,
        details: { error }
      };
    }
  }

  /**
   * Run all stale session tests
   */
  async runAllStaleSessionTests(): Promise<TestResult[]> {
    console.log('🚀 Starting comprehensive stale session tests...');
    
    const results: TestResult[] = [];
    
    // Clear any existing data before tests
    await this.clearTestData();
    
    try {
      // Test 1: Normal background usage
      results.push(await this.testNormalBackgroundUsage());
      await this.clearTestData();
      
      // Test 2: App force close detection
      results.push(await this.testAppForceCloseDetection());
      await this.clearTestData();
      
      // Test 3: Long background duration
      results.push(await this.testLongBackgroundDuration());
      await this.clearTestData();
      
      // Test 4: App reopen scenario
      results.push(await this.testAppReopenScenario());
      await this.clearTestData();
      
      // Test 5: Stale detection accuracy
      results.push(await this.testStaleDetectionAccuracy());
      await this.clearTestData();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      results.push({
        testName: 'Test Suite Execution',
        success: false,
        message: `Test suite failed: ${error.message}`,
        details: { error }
      });
    }
    
    // Print results summary
    this.printTestSummary(results);
    
    return results;
  }

  /**
   * Print test results summary
   */
  private printTestSummary(results: TestResult[]): void {
    console.log('\n📊 === STALE SESSION TEST RESULTS ===');
    
    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📋 Total: ${results.length}`);
    
    console.log('\n📝 Detailed Results:');
    results.forEach((result, index) => {
      const icon = result.success ? '✅' : '❌';
      console.log(`${icon} ${index + 1}. ${result.testName}`);
      console.log(`   Message: ${result.message}`);
      if (result.duration !== undefined) {
        const minutes = Math.floor(result.duration / 60);
        const seconds = result.duration % 60;
        console.log(`   Duration: ${minutes}m ${seconds}s`);
      }
      if (result.details) {
        console.log('   Details:', JSON.stringify(result.details, null, 2));
      }
      console.log('');
    });
    
    if (failed === 0) {
      console.log('🎉 All stale session tests passed! Session counting is accurate.');
    } else {
      console.log('⚠️ Some tests failed. Please check the implementation.');
    }
  }

  /**
   * Helper: Simulate time passing (for testing purposes)
   */
  private async simulateTimePass(milliseconds: number): Promise<void> {
    // In a real test, you might want to actually wait or mock time
    // For now, we'll just simulate by updating timestamps
    console.log(`⏰ Simulating ${milliseconds / 1000}s time passage...`);
    
    // Update last app activity to be older
    const oldTime = new Date(Date.now() - milliseconds).toISOString();
    await AsyncStorage.setItem('bg_last_app_activity', oldTime);
  }

  /**
   * Helper: Simulate university WiFi connection
   */
  private async simulateUniversityWiFiConnection(): Promise<void> {
    const service = BackgroundWifiService.getInstance();
    
    // Simulate university IP (192.168.1.x)
    const universityIP = '192.168.1.100';
    
    // Force start a session on university IP
    await service.forceSessionTransition(universityIP);
    
    console.log('📡 Simulated university WiFi connection');
  }

  /**
   * Helper: Trigger background check manually
   */
  private async triggerBackgroundCheck(): Promise<void> {
    // Since we can't directly call the private method, we'll trigger app reopen
    // which will check for stale sessions
    const service = BackgroundWifiService.getInstance();
    await service.handleAppReopen();
  }

  /**
   * Helper: Clear test data
   */
  private async clearTestData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        'bg_current_session',
        'bg_pending_sessions',
        'bg_last_app_activity'
      ]);
      console.log('🧹 Test data cleared');
    } catch (error) {
      console.warn('⚠️ Failed to clear test data:', error);
    }
  }
}

// Export singleton instance
export const staleSessionTester = StaleSessionTester.getInstance();

// Export types for external use
export type { TestResult }; 