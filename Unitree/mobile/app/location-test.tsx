import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import locationTester, { 
  runLocationTest, 
  quickLocationCheck, 
  showLocationTestAlert,
  LocationTestResult
} from '../src/utils/locationTest';
import locationService from '../src/services/locationService';
import ENV from '../src/config/env';

export default function LocationTestScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<LocationTestResult | null>(null);
  const [quickResults, setQuickResults] = useState<string>('');

  const handleRunFullTest = async () => {
    setIsLoading(true);
    setTestResults(null);
    
    try {
      console.log('🚀 Starting full location test...');
      const result = await runLocationTest();
      setTestResults(result);
      
      if (result.success) {
        Alert.alert('✅ Test Success', 'Location test completed successfully! Check console for details.');
      } else {
        Alert.alert('❌ Test Failed', result.error || 'Unknown error occurred');
      }
    } catch (error) {
      Alert.alert('❌ Test Error', `Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickCheck = async () => {
    setIsLoading(true);
    setQuickResults('');
    
    try {
      console.log('🚀 Starting quick location check...');
      
      // Capture console output
      const originalLog = console.log;
      let logOutput = '';
      
      console.log = (...args) => {
        const message = args.join(' ');
        logOutput += message + '\n';
        originalLog.apply(console, args);
      };
      
      await quickLocationCheck();
      
      // Restore console.log
      console.log = originalLog;
      
      setQuickResults(logOutput);
      Alert.alert('✅ Quick Check Done', 'Check the results below and console logs');
      
    } catch (error) {
      Alert.alert('❌ Quick Check Failed', `Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetCurrentLocation = async () => {
    setIsLoading(true);
    
    try {
      const location = await locationService.getCurrentLocation();
      
      if (location) {
        const message = `Current Location:\n\nLatitude: ${location.latitude.toFixed(6)}\nLongitude: ${location.longitude.toFixed(6)}\nAccuracy: ${location.accuracy}m\nTimestamp: ${new Date(location.timestamp).toLocaleString()}`;
        Alert.alert('📍 Location Found', message);
        
        console.log('📍 Current location:', location);
      } else {
        Alert.alert('❌ Location Error', 'Could not get current location');
      }
    } catch (error) {
      Alert.alert('❌ Location Error', `Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestCampusValidation = async () => {
    setIsLoading(true);
    
    try {
      const result = await locationService.isWithinUniversityCampus();
      
      let message = `Campus Validation Result:\n\n`;
      message += `Within Campus: ${result.isValid ? '✅ YES' : '❌ NO'}\n`;
      message += `Distance: ${result.distance || 'Unknown'}m\n`;
      message += `Campus: ${result.campus || 'N/A'}\n`;
      
      if (result.location) {
        message += `\nYour Location:\n`;
        message += `Lat: ${result.location.latitude.toFixed(6)}\n`;
        message += `Lng: ${result.location.longitude.toFixed(6)}\n`;
        message += `Accuracy: ${result.location.accuracy}m\n`;
      }
      
      message += `\nCampus Center:\n`;
      message += `Lat: ${ENV.UNIVERSITY_LAT}\n`;
      message += `Lng: ${ENV.UNIVERSITY_LNG}\n`;
      message += `Radius: ${ENV.UNIVERSITY_RADIUS}m`;
      
      Alert.alert('🏫 Campus Validation', message);
      console.log('🏫 Campus validation result:', result);
      
    } catch (error) {
      Alert.alert('❌ Campus Validation Error', `Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestWiFiValidation = async () => {
    setIsLoading(true);
    
    try {
      // Test with different IP addresses
      const testIPs = [
        '192.168.1.100',
        '10.0.0.1',
        '172.16.1.1'
      ];
      
      let message = 'WiFi Validation Results:\n\n';
      
      for (const ip of testIPs) {
        const result = await locationService.validateWiFiSession(ip);
        message += `IP: ${ip}\n`;
        message += `  IP Valid: ${result.validationMethods.ipAddress ? '✅' : '❌'}\n`;
        message += `  Location Valid: ${result.validationMethods.location ? '✅' : '❌'}\n`;
        message += `  Session Valid: ${result.isValid ? '✅' : '❌'}\n\n`;
        
        console.log(`📡 WiFi validation for ${ip}:`, result);
      }
      
      Alert.alert('📡 WiFi Validation', message);
      
    } catch (error) {
      Alert.alert('❌ WiFi Validation Error', `Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const renderTestResults = () => {
    if (!testResults) return null;

    return (
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>📊 Last Test Results</Text>
        
        <View style={styles.resultItem}>
          <Text style={styles.resultLabel}>Success:</Text>
          <Text style={[styles.resultValue, { color: testResults.success ? '#22c55e' : '#ef4444' }]}>
            {testResults.success ? '✅ YES' : '❌ NO'}
          </Text>
        </View>

        {testResults.location && (
          <>
            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>Latitude:</Text>
              <Text style={styles.resultValue}>{testResults.location.latitude.toFixed(6)}</Text>
            </View>
            
            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>Longitude:</Text>
              <Text style={styles.resultValue}>{testResults.location.longitude.toFixed(6)}</Text>
            </View>
            
            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>Accuracy:</Text>
              <Text style={styles.resultValue}>{testResults.location.accuracy}m</Text>
            </View>
          </>
        )}

        {testResults.campusValidation && (
          <>
            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>On Campus:</Text>
              <Text style={[styles.resultValue, { color: testResults.campusValidation.isWithinCampus ? '#22c55e' : '#ef4444' }]}>
                {testResults.campusValidation.isWithinCampus ? '✅ YES' : '❌ NO'}
              </Text>
            </View>
            
            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>Distance:</Text>
              <Text style={styles.resultValue}>{testResults.campusValidation.distance}m</Text>
            </View>
          </>
        )}

        {testResults.wifiValidation && (
          <>
            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>WiFi Valid:</Text>
              <Text style={[styles.resultValue, { color: testResults.wifiValidation.overallValid ? '#22c55e' : '#ef4444' }]}>
                {testResults.wifiValidation.overallValid ? '✅ YES' : '❌ NO'}
              </Text>
            </View>
          </>
        )}

        {testResults.error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>❌ Error: {testResults.error}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Location Test', headerShown: true }} />
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView}>
          <Text style={styles.title}>🧪 Location Test Suite</Text>
          <Text style={styles.subtitle}>Platform: {Platform.OS}</Text>
          <Text style={styles.subtitle}>
            Location Tracking: {ENV.ENABLE_LOCATION_TRACKING ? '✅ Enabled' : '❌ Disabled'}
          </Text>
          <Text style={styles.subtitle}>
            Campus: {ENV.UNIVERSITY_LAT}, {ENV.UNIVERSITY_LNG} ({ENV.UNIVERSITY_RADIUS}m)
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleRunFullTest}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? '⏳ Running...' : '🧪 Run Full Test Suite'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleQuickCheck}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>⚡ Quick Location Check</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleGetCurrentLocation}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>📍 Get Current Location</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleTestCampusValidation}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>🏫 Test Campus Validation</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleTestWiFiValidation}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>📡 Test WiFi Validation</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.tertiaryButton]}
              onPress={showLocationTestAlert}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>🎯 Show Test Alert</Text>
            </TouchableOpacity>
          </View>

          {renderTestResults()}

          {quickResults && (
            <View style={styles.quickResultsContainer}>
              <Text style={styles.resultsTitle}>⚡ Quick Check Results</Text>
              <Text style={styles.quickResultsText}>{quickResults}</Text>
            </View>
          )}

          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>ℹ️ Instructions</Text>
            <Text style={styles.infoText}>
              1. Run "Full Test Suite" for comprehensive testing
              {'\n'}2. Check console logs for detailed output
              {'\n'}3. Individual tests provide specific functionality checks
              {'\n'}4. Make sure location services are enabled on your device
              {'\n'}5. Grant location permissions when prompted
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  buttonContainer: {
    marginTop: 24,
    gap: 12,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
  },
  secondaryButton: {
    backgroundColor: '#10b981',
  },
  tertiaryButton: {
    backgroundColor: '#8b5cf6',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  resultLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  resultValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '600',
  },
  errorContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
  },
  quickResultsContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
  },
  quickResultsText: {
    fontSize: 12,
    color: '#1e40af',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  infoContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
  },
}); 