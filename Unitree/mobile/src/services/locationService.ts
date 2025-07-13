import * as Location from 'expo-location';
import { Platform } from 'react-native';
import ENV from '../config/env';
import locationStorageService from './locationStorageService';

export interface WiFiValidationResult {
  isValid: boolean;
  validationMethods: {
    ipAddress: boolean;
    location: boolean;
  };
  campus: string;
  distance: number | null;
}

class LocationService {
  private initialized: boolean = false;

  async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Location permission not granted');
        return false;
      }

      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize location service:', error);
      return false;
    }
  }

  // Validate WiFi session using both IP and location
  async validateWiFiSession(ipAddress: string): Promise<WiFiValidationResult> {
    const result: WiFiValidationResult = {
      isValid: false,
      validationMethods: {
        ipAddress: false,
        location: false
      },
      campus: 'unknown',
      distance: null
    };

    // Validate IP address
    result.validationMethods.ipAddress = ipAddress.toLowerCase().startsWith(
      ENV.UNIVERSITY_IP_PREFIX.toLowerCase()
    );

    try {
      // Validate location
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === 'granted') {
        // Get current location
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced
        });
        
        // Save location for future use
        await locationStorageService.saveLocationToStorage({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          timestamp: new Date().toISOString()
        });
        
        // Calculate distance to university campus
        const distance = this.calculateDistance(
          location.coords.latitude,
          location.coords.longitude,
          ENV.UNIVERSITY_LAT,
          ENV.UNIVERSITY_LNG
        );
        
        result.distance = distance;
        result.validationMethods.location = distance <= ENV.UNIVERSITY_RADIUS;
        result.campus = result.validationMethods.location ? 'main_campus' : 'off_campus';
      }
    } catch (error) {
      console.error('Location validation error:', error);
    }

    // Both methods must be valid for the overall result to be valid
    result.isValid = result.validationMethods.ipAddress && result.validationMethods.location;

    return result;
  }

  // Calculate distance between two points using Haversine formula
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    return locationStorageService.calculateDistance(lat1, lon1, lat2, lon2);
  }
}

const locationService = new LocationService();
export default locationService; 