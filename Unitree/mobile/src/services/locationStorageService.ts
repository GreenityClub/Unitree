import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import ENV from '../config/env';

const LOCATION_STORAGE_KEY = 'last_known_location';

// Interface cho dữ liệu vị trí
export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string;
  campus?: string;
  isValid?: boolean;
}

/**
 * Lưu vị trí hiện tại vào AsyncStorage
 * @param location Dữ liệu vị trí cần lưu
 * @returns true nếu lưu thành công, false nếu có lỗi
 */
export const saveLocationToStorage = async (location: any): Promise<boolean> => {
  try {
    // Chuẩn hóa dữ liệu vị trí
    const locationData: LocationData = {
      latitude: location.latitude || location.coords?.latitude,
      longitude: location.longitude || location.coords?.longitude,
      accuracy: location.accuracy || location.coords?.accuracy || 0,
      timestamp: new Date().toISOString(),
      campus: location.campus
    };

    // Kiểm tra tính hợp lệ của vị trí
    locationData.isValid = isLocationOnCampus(locationData);

    // Lưu vào AsyncStorage
    await AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(locationData));
    console.log('📍 Location saved to storage:', locationData);
    return true;
  } catch (error) {
    console.error('❌ Failed to save location to storage:', error);
    return false;
  }
};

/**
 * Lấy vị trí đã lưu từ AsyncStorage
 * @returns Dữ liệu vị trí đã lưu hoặc null nếu không có
 */
export const getLocationFromStorage = async (): Promise<LocationData | null> => {
  try {
    const locationString = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
    if (locationString) {
      const locationData = JSON.parse(locationString) as LocationData;
      return locationData;
    }
    return null;
  } catch (error) {
    console.error('❌ Failed to get location from storage:', error);
    return null;
  }
};

/**
 * Lấy vị trí hiện tại và lưu vào storage
 * @returns Vị trí hiện tại hoặc null nếu không thể lấy
 */
export const getCurrentAndSaveLocation = async (): Promise<LocationData | null> => {
  try {
    // Kiểm tra quyền truy cập vị trí
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.log('⚠️ Location permission not granted');
      return null;
    }

    // Lấy vị trí hiện tại
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced
    });

    if (location && location.coords) {
      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: new Date().toISOString()
      };

      // Kiểm tra xem vị trí có trong campus không
      locationData.isValid = isLocationOnCampus(locationData);
      locationData.campus = locationData.isValid ? 'main_campus' : 'off_campus';

      // Lưu vị trí vào storage
      await saveLocationToStorage(locationData);
      return locationData;
    }
    return null;
  } catch (error) {
    console.error('❌ Failed to get current location:', error);
    return null;
  }
};

/**
 * Kiểm tra xem vị trí có nằm trong khuôn viên trường hay không
 * @param location Dữ liệu vị trí cần kiểm tra
 * @returns true nếu vị trí nằm trong khuôn viên trường, false nếu không
 */
export const isLocationOnCampus = (location: LocationData): boolean => {
  if (!location || !location.latitude || !location.longitude) {
    return false;
  }

  // Tính khoảng cách đến tọa độ trường
  const distance = calculateDistance(
    location.latitude,
    location.longitude,
    ENV.UNIVERSITY_LAT,
    ENV.UNIVERSITY_LNG
  );

  // Kiểm tra nếu nằm trong bán kính cho phép
  const isWithinRadius = distance <= ENV.UNIVERSITY_RADIUS;
  console.log(`📍 Location distance to campus: ${distance.toFixed(0)}m, within radius: ${isWithinRadius}`);
  
  return isWithinRadius;
};

/**
 * Tính khoảng cách giữa hai điểm trên bản đồ sử dụng công thức Haversine
 * @param lat1 Vĩ độ điểm 1
 * @param lon1 Kinh độ điểm 1
 * @param lat2 Vĩ độ điểm 2
 * @param lon2 Kinh độ điểm 2
 * @returns Khoảng cách tính bằng mét
 */
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Bán kính Trái Đất (mét)
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
};

export default {
  saveLocationToStorage,
  getLocationFromStorage,
  getCurrentAndSaveLocation,
  isLocationOnCampus,
  calculateDistance
}; 