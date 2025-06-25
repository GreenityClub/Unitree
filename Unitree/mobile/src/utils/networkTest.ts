import ENV from '../config/env';
import { logger } from './logger';

/**
 * Utility để test network connection và API availability
 */
class NetworkTester {
  /**
   * Test basic connectivity to API server
   */
  async testServerConnectivity(): Promise<{
    available: boolean;
    responseTime: number;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${ENV.API_URL}/api/health`, {
        method: 'GET',
        timeout: 5000, // 5 second timeout
      });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      if (response.ok) {
        logger.network.info(`Server connectivity test passed (${responseTime}ms)`);
        return { available: true, responseTime };
      } else {
        logger.network.warn(`Server returned ${response.status}`);
        return { 
          available: false, 
          responseTime, 
          error: `HTTP ${response.status}` 
        };
      }
    } catch (error: any) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      logger.network.error('Server connectivity test failed', { data: error });
      return { 
        available: false, 
        responseTime, 
        error: error.message || 'Network error' 
      };
    }
  }

  /**
   * Test authentication endpoint specifically
   */
  async testAuthEndpoint(): Promise<{
    available: boolean;
    responseTime: number;
    requiresAuth: boolean;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${ENV.API_URL}/api/auth/me`, {
        method: 'GET',
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      if (response.status === 401) {
        // Expected response for unauthenticated request
        logger.network.info(`Auth endpoint test passed - requires auth (${responseTime}ms)`);
        return { available: true, responseTime, requiresAuth: true };
      } else if (response.ok) {
        logger.network.info(`Auth endpoint test passed - authenticated (${responseTime}ms)`);
        return { available: true, responseTime, requiresAuth: false };
      } else {
        logger.network.warn(`Auth endpoint returned ${response.status}`);
        return { 
          available: false, 
          responseTime, 
          requiresAuth: true,
          error: `HTTP ${response.status}` 
        };
      }
    } catch (error: any) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      logger.network.error('Auth endpoint test failed', { data: error });
      return { 
        available: false, 
        responseTime, 
        requiresAuth: true,
        error: error.message || 'Network error' 
      };
    }
  }

  /**
   * Test multiple endpoints to get overall API health
   */
  async testAPIHealth(): Promise<{
    overallHealth: 'good' | 'poor' | 'down';
    serverConnectivity: any;
    authEndpoint: any;
    averageResponseTime: number;
    recommendations: string[];
  }> {
    logger.network.info('🚀 Starting comprehensive API health test...');
    
    const [serverTest, authTest] = await Promise.all([
      this.testServerConnectivity(),
      this.testAuthEndpoint(),
    ]);
    
    const responses = [serverTest.responseTime, authTest.responseTime];
    const averageResponseTime = responses.reduce((a, b) => a + b, 0) / responses.length;
    
    const recommendations: string[] = [];
    let overallHealth: 'good' | 'poor' | 'down' = 'good';
    
    // Analyze results
    if (!serverTest.available) {
      overallHealth = 'down';
      recommendations.push('❌ Server is not responding - check network connection');
      recommendations.push('🔍 Verify API_URL in .env file');
    } else if (!authTest.available) {
      overallHealth = 'poor';
      recommendations.push('⚠️ Auth endpoint issues - may affect login/logout');
    }
    
    if (averageResponseTime > 3000) {
      overallHealth = 'poor';
      recommendations.push('🐌 High response times detected - consider optimizing network');
      recommendations.push('📡 Check WiFi/cellular connection quality');
    }
    
    if (averageResponseTime > 1000 && averageResponseTime <= 3000) {
      recommendations.push('⏱️ Moderate response times - API working but slower than optimal');
    }
    
    if (overallHealth === 'good') {
      recommendations.push('✅ All systems operational');
    }
    
    const result = {
      overallHealth,
      serverConnectivity: serverTest,
      authEndpoint: authTest,
      averageResponseTime,
      recommendations,
    };
    
    logger.network.info('🏁 API health test completed', { data: result });
    return result;
  }

  /**
   * Quick connectivity test for debugging
   */
  async quickConnectivityTest(): Promise<boolean> {
    try {
      const response = await fetch(`${ENV.API_URL}/api/health`, {
        method: 'GET',
        timeout: 3000,
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get network status information
   */
  getNetworkInfo(): {
    apiUrl: string;
    timeout: number;
    currentTime: string;
    userAgent: string;
  } {
    return {
      apiUrl: ENV.API_URL,
      timeout: ENV.API_TIMEOUT,
      currentTime: new Date().toISOString(),
      userAgent: navigator.userAgent || 'React Native',
    };
  }
}

// Export singleton instance
export default new NetworkTester(); 