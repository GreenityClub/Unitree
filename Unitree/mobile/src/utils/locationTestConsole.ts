import locationTester, { runLocationTest, quickLocationCheck } from './locationTest';
import locationService from '../services/locationService';

/**
 * Console utilities for testing location functionality
 * These can be called from anywhere in your app during development
 */

// Make functions available globally during development
if (__DEV__) {
  // @ts-ignore - Global assignment for development
  global.testLocation = async () => {
    console.log('🚀 Starting location test from console...');
    const result = await runLocationTest();
    console.log('📊 Test completed:', result);
    return result;
  };

  // @ts-ignore - Global assignment for development
  global.quickLocationTest = async () => {
    console.log('⚡ Quick location test from console...');
    await quickLocationCheck();
  };

  // @ts-ignore - Global assignment for development
  global.getCurrentLocation = async () => {
    console.log('📍 Getting current location from console...');
    const location = await locationService.getCurrentLocation();
    console.log('Location result:', location);
    return location;
  };

  // @ts-ignore - Global assignment for development
  global.testCampusValidation = async () => {
    console.log('🏫 Testing campus validation from console...');
    const result = await locationService.isWithinUniversityCampus();
    console.log('Campus validation result:', result);
    return result;
  };

  // @ts-ignore - Global assignment for development
  global.testWiFiValidation = async (ipAddress: string = '192.168.1.100') => {
    console.log(`📡 Testing WiFi validation for ${ipAddress} from console...`);
    const result = await locationService.validateWiFiSession(ipAddress);
    console.log('WiFi validation result:', result);
    return result;
  };

  // @ts-ignore - Global assignment for development
  global.testAllIPScenarios = async () => {
    console.log('🧪 Testing all IP scenarios from console...');
    const testIPs = [
      '192.168.1.100',
      '192.168.254.50', 
      '10.0.0.1',
      '172.16.1.1',
      '8.8.8.8',
      ''
    ];

    for (const ip of testIPs) {
      console.log(`\n--- Testing IP: ${ip || '(empty)'} ---`);
      try {
        const result = await locationService.validateWiFiSession(ip);
        console.log(`IP Valid: ${result.validationMethods.ipAddress}`);
        console.log(`Location Valid: ${result.validationMethods.location}`);
        console.log(`Session Valid: ${result.isValid}`);
      } catch (error) {
        console.log(`Error: ${error}`);
      }
    }
  };

  // @ts-ignore - Global assignment for development
  global.showLocationHelp = () => {
    console.log('🧪 Available Location Test Commands:');
    console.log('');
    console.log('  testLocation()           - Run full location test suite');
    console.log('  quickLocationTest()      - Quick location check');
    console.log('  getCurrentLocation()     - Get current GPS coordinates');
    console.log('  testCampusValidation()   - Test if within campus');
    console.log('  testWiFiValidation(ip)   - Test WiFi validation (default: 192.168.1.100)');
    console.log('  testAllIPScenarios()     - Test different IP addresses');
    console.log('  showLocationHelp()       - Show this help');
    console.log('');
    console.log('Examples:');
    console.log('  testLocation()');
    console.log('  testWiFiValidation("10.0.0.1")');
    console.log('  getCurrentLocation()');
  };

  // Show help message on startup in development
  console.log('🧪 Location test commands loaded! Type showLocationHelp() for available commands.');
}

export {
  runLocationTest,
  quickLocationCheck,
  locationTester
}; 