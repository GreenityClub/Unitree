import * as Location from 'expo-location';
import { Platform, Alert } from 'react-native';
import locationService from '../services/locationService';
import ENV from '../config/env';

export interface LocationTestResult {
  success: boolean;
  error?: string;
  permissions?: {
    foreground: string;
    hasServicesEnabled: boolean;
  };
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: number;
  };
  campusValidation?: {
    isWithinCampus: boolean;
    distance: number;
    campus?: string;
  };
  wifiValidation?: {
    ipValid: boolean;
    locationValid: boolean;
    overallValid: boolean;
  };
}

class LocationTester {
  
  /**
   * Run comprehensive location test suite
   */
  async runLocationTest(testIPAddress: string = '192.168.1.100'): Promise<LocationTestResult> {
    console.log('🧪 ===== LOCATION TEST SUITE STARTED =====');
    console.log(`📱 Platform: ${Platform.OS}`);
    console.log(`🔧 Location tracking enabled: ${ENV.ENABLE_LOCATION_TRACKING}`);
    console.log(`🏫 University coordinates: ${ENV.UNIVERSITY_LAT}, ${ENV.UNIVERSITY_LNG}`);
    console.log(`📏 Campus radius: ${ENV.UNIVERSITY_RADIUS}m`);
    console.log(`🌐 Test IP address: ${testIPAddress}`);
    console.log('================================================\n');

    try {
      // Step 1: Test location services availability
      console.log('🔍 Step 1: Testing location services availability...');
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      console.log(`📍 Location services enabled: ${servicesEnabled}`);
      
      if (!servicesEnabled) {
        const error = 'Location services are disabled on this device';
        console.error(`❌ ${error}`);
        return { success: false, error };
      }

      // Step 2: Test location permissions
      console.log('\n🔐 Step 2: Testing location permissions...');
      const foregroundStatus = await Location.getForegroundPermissionsAsync();
      console.log(`🔓 Current foreground permission: ${foregroundStatus.status}`);
      
      let finalPermissionStatus = foregroundStatus.status;
      
      if (foregroundStatus.status !== 'granted') {
        console.log('📋 Requesting location permissions...');
        const permissionRequest = await Location.requestForegroundPermissionsAsync();
        finalPermissionStatus = permissionRequest.status;
        console.log(`🔓 Permission request result: ${finalPermissionStatus}`);
      }

      // Step 3: Initialize location service
      console.log('\n⚡ Step 3: Initializing location service...');
      const serviceInitialized = await locationService.initialize();
      console.log(`🚀 Location service initialized: ${serviceInitialized}`);
      
      const permissionStatus = locationService.getPermissionStatus();
      console.log(`📊 Service permission status:`, permissionStatus);

      // Step 4: Test current location retrieval
      console.log('\n🌍 Step 4: Testing current location retrieval...');
      const currentLocation = await this.getCurrentLocationWithRetry(3);
      
      if (!currentLocation) {
        const error = 'Failed to get current location after retries';
        console.error(`❌ ${error}`);
        return { 
          success: false, 
          error,
          permissions: {
            foreground: finalPermissionStatus,
            hasServicesEnabled: servicesEnabled
          }
        };
      }

      console.log('📍 Current location obtained:');
      console.log(`   Latitude: ${currentLocation.latitude}`);
      console.log(`   Longitude: ${currentLocation.longitude}`);
      console.log(`   Accuracy: ${currentLocation.accuracy}m`);
      console.log(`   Timestamp: ${new Date(currentLocation.timestamp).toISOString()}`);

      // Step 5: Test campus validation
      console.log('\n🏫 Step 5: Testing campus validation...');
      const campusResult = await locationService.isWithinUniversityCampus();
      console.log(`🎯 Campus validation result:`, campusResult);
      
      if (campusResult.location) {
        console.log(`📊 Distance calculation details:`);
        console.log(`   Current: ${campusResult.location.latitude}, ${campusResult.location.longitude}`);
        console.log(`   Campus: ${ENV.UNIVERSITY_LAT}, ${ENV.UNIVERSITY_LNG}`);
        console.log(`   Distance: ${campusResult.distance}m`);
        console.log(`   Within radius (${ENV.UNIVERSITY_RADIUS}m): ${campusResult.isValid}`);
      }

      // Step 6: Test WiFi session validation
      console.log('\n📡 Step 6: Testing WiFi session validation...');
      const wifiResult = await locationService.validateWiFiSession(testIPAddress);
      console.log(`🔗 WiFi validation result:`, wifiResult);
      console.log(`   IP Valid: ${wifiResult.validationMethods.ipAddress}`);
      console.log(`   Location Valid: ${wifiResult.validationMethods.location}`);
      console.log(`   Overall Valid: ${wifiResult.isValid} (requires BOTH)`);

      // Step 7: Test different IP scenarios
      console.log('\n🧪 Step 7: Testing different IP scenarios...');
      await this.testIPScenarios(currentLocation);

      console.log('\n✅ ===== LOCATION TEST SUITE COMPLETED SUCCESSFULLY =====\n');

      return {
        success: true,
        permissions: {
          foreground: finalPermissionStatus,
          hasServicesEnabled: servicesEnabled
        },
        location: currentLocation,
        campusValidation: {
          isWithinCampus: campusResult.isValid,
          distance: campusResult.distance || 0,
          campus: campusResult.campus
        },
        wifiValidation: {
          ipValid: wifiResult.validationMethods.ipAddress,
          locationValid: wifiResult.validationMethods.location,
          overallValid: wifiResult.isValid
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Location test failed:', errorMessage);
      console.error('Stack trace:', error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get current location with retry mechanism
   */
  private async getCurrentLocationWithRetry(maxRetries: number = 3): Promise<any> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`📍 Location attempt ${attempt}/${maxRetries}...`);
      
      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        });

        console.log(`✅ Location obtained on attempt ${attempt}`);
        return {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy || 0,
          timestamp: location.timestamp
        };

      } catch (error) {
        console.warn(`⚠️ Location attempt ${attempt} failed:`, error);
        
        if (attempt < maxRetries) {
          const waitTime = attempt * 2000; // Progressive backoff
          console.log(`⏳ Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    return null;
  }

  /**
   * Test different IP address scenarios
   */
  private async testIPScenarios(currentLocation: any): Promise<void> {
    const testCases = [
      { ip: '192.168.1.100', description: 'Valid university IP' },
      { ip: '192.168.254.50', description: 'Valid university IP (different subnet)' },
      { ip: '10.0.0.1', description: 'Invalid IP (wrong prefix)' },
      { ip: '172.16.1.1', description: 'Invalid IP (private network)' },
      { ip: '8.8.8.8', description: 'Invalid IP (public network)' },
      { ip: '', description: 'Empty IP address' },
    ];

    for (const testCase of testCases) {
      console.log(`\n   🧪 Testing: ${testCase.description} (${testCase.ip})`);
      
      try {
        const result = await locationService.validateWiFiSession(testCase.ip);
        console.log(`      IP Valid: ${result.validationMethods.ipAddress}`);
        console.log(`      Location Valid: ${result.validationMethods.location}`);
        console.log(`      Session Valid: ${result.isValid}`);
      } catch (error) {
        console.log(`      ❌ Error: ${error}`);
      }
    }
  }

  /**
   * Quick location check (for button testing)
   */
  async quickLocationCheck(): Promise<void> {
    console.log('🚀 Quick location check...');
    
    try {
      const location = await locationService.getCurrentLocation();
      if (location) {
        console.log('📍 Current location:', location);
        
        const campusCheck = await locationService.isWithinUniversityCampus();
        console.log('🏫 Campus check:', campusCheck);
      } else {
        console.log('❌ Could not get location');
      }
    } catch (error) {
      console.error('❌ Quick check failed:', error);
    }
  }

  /**
   * Show location test in alert (for UI testing)
   */
  async showLocationTestAlert(): Promise<void> {
    try {
      const result = await this.runLocationTest();
      
      let message = `Location Test Results:\n\n`;
      message += `Success: ${result.success ? '✅' : '❌'}\n`;
      
      if (result.location) {
        message += `\nLocation:\n`;
        message += `Lat: ${result.location.latitude.toFixed(6)}\n`;
        message += `Lng: ${result.location.longitude.toFixed(6)}\n`;
        message += `Accuracy: ${result.location.accuracy}m\n`;
      }
      
      if (result.campusValidation) {
        message += `\nCampus Validation:\n`;
        message += `On Campus: ${result.campusValidation.isWithinCampus ? '✅' : '❌'}\n`;
        message += `Distance: ${result.campusValidation.distance}m\n`;
      }

      if (result.error) {
        message += `\nError: ${result.error}`;
      }

      Alert.alert('Location Test Results', message);
      
    } catch (error) {
      Alert.alert('Location Test Failed', `Error: ${error}`);
    }
  }
}

// Export singleton instance
const locationTester = new LocationTester();
export default locationTester;

// Export test functions for easy access
export const runLocationTest = (testIP?: string) => locationTester.runLocationTest(testIP);
export const quickLocationCheck = () => locationTester.quickLocationCheck();
export const showLocationTestAlert = () => locationTester.showLocationTestAlert(); 