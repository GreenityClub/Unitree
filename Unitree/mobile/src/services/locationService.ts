import * as Location from 'expo-location';
import { Platform } from 'react-native';
import ENV from '../config/env';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface UniversityLocation {
  latitude: number;
  longitude: number;
  radius: number; // meters
  name: string;
}

// University campus locations (configurable via environment variables)
const UNIVERSITY_LOCATIONS: UniversityLocation[] = [
  {
    latitude: ENV.UNIVERSITY_LAT,
    longitude: ENV.UNIVERSITY_LNG,
    radius: ENV.UNIVERSITY_RADIUS,
    name: 'Main Campus'
  }
  // Add more campus locations as needed
];

class LocationService {
  private hasLocationPermission = false;
  private isLocationEnabled = false;

  /**
   * Request location permissions and check if location services are enabled
   */
  async requestLocationPermissions(): Promise<boolean> {
    try {
      // Check if location services are enabled
      const locationEnabled = await Location.hasServicesEnabledAsync();
      if (!locationEnabled) {
        console.warn('[LocationService] Location services are disabled');
        this.isLocationEnabled = false;
        return false;
      }

      this.isLocationEnabled = true;

      // Request foreground permissions
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus !== 'granted') {
        console.warn('[LocationService] Foreground location permission denied');
        this.hasLocationPermission = false;
        return false;
      }

      this.hasLocationPermission = true;
      console.log('[LocationService] Location permissions granted');
      return true;
    } catch (error) {
      console.error('[LocationService] Error requesting location permissions:', error);
      this.hasLocationPermission = false;
      return false;
    }
  }

  /**
   * Get current location with high accuracy
   */
  async getCurrentLocation(): Promise<LocationData | null> {
    if (!this.hasLocationPermission || !this.isLocationEnabled) {
      console.warn('[LocationService] Location not available - permissions or services disabled');
      return null;
    }

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 5000, // 5 seconds
        distanceInterval: 10, // 10 meters
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || 0,
        timestamp: location.timestamp,
      };
    } catch (error) {
      console.error('[LocationService] Error getting current location:', error);
      return null;
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Check if current location is within university campus
   */
  async isWithinUniversityCampus(): Promise<{
    isValid: boolean;
    distance?: number;
    campus?: string;
    location?: LocationData;
  }> {
    if (!ENV.ENABLE_LOCATION_TRACKING) {
      return { isValid: false };
    }

    const currentLocation = await this.getCurrentLocation();
    if (!currentLocation) {
      return { isValid: false };
    }

    // Check against all university locations
    for (const campus of UNIVERSITY_LOCATIONS) {
      const distance = this.calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        campus.latitude,
        campus.longitude
      );

      if (distance <= campus.radius) {
        console.log(`[LocationService] Within ${campus.name} campus: ${distance.toFixed(1)}m`);
        return {
          isValid: true,
          distance: Math.round(distance),
          campus: campus.name,
          location: currentLocation,
        };
      }
    }

    console.log('[LocationService] Not within any university campus');
    return {
      isValid: false,
      location: currentLocation,
    };
  }

  /**
   * Validate WiFi session using both IP and location
   */
  async validateWiFiSession(ipAddress: string): Promise<{
    isValid: boolean;
    validationMethods: {
      ipAddress: boolean;
      location: boolean;
    };
    location?: LocationData;
    campus?: string;
    distance?: number;
  }> {
    // IP Address validation (existing method)
    const isValidIP = this.isValidUniversityIP(ipAddress);

    // Location validation (new method)
    const locationResult = await this.isWithinUniversityCampus();

    // Session is valid ONLY if BOTH IP and location validate
    const isValid = isValidIP && locationResult.isValid;

    console.log('[LocationService] WiFi validation result:', {
      ipValid: isValidIP,
      locationValid: locationResult.isValid,
      overallValid: isValid,
      requiresBoth: true,
      ipAddress,
      distance: locationResult.distance,
      campus: locationResult.campus,
    });

    return {
      isValid,
      validationMethods: {
        ipAddress: isValidIP,
        location: locationResult.isValid,
      },
      location: locationResult.location,
      campus: locationResult.campus,
      distance: locationResult.distance,
    };
  }

  /**
   * IP address validation (existing method)
   */
  private isValidUniversityIP(ipAddress: string): boolean {
    if (!ipAddress || typeof ipAddress !== 'string') return false;
    const ipPrefix = this.extractIPPrefix(ipAddress);
    return ipPrefix === ENV.UNIVERSITY_IP_PREFIX.toLowerCase();
  }

  /**
   * Extract IP prefix (existing method)
   */
  private extractIPPrefix(ipAddress: string | null): string | null {
    if (!ipAddress) return null;
    const parts = ipAddress.split('.');
    if (parts.length < 2) return null;
    return parts.slice(0, 2).join('.').toLowerCase();
  }

  /**
   * Get location permissions status
   */
  getPermissionStatus(): {
    hasPermission: boolean;
    isLocationEnabled: boolean;
  } {
    return {
      hasPermission: this.hasLocationPermission,
      isLocationEnabled: this.isLocationEnabled,
    };
  }

  /**
   * Initialize location service
   */
  async initialize(): Promise<boolean> {
    if (!ENV.ENABLE_LOCATION_TRACKING) {
      console.log('[LocationService] Location tracking disabled via environment config');
      return false;
    }

    return await this.requestLocationPermissions();
  }
}

const locationService = new LocationService();
export default locationService; 