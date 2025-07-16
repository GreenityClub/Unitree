# Location Testing Guide

This guide explains how to test the location extraction functionality in the Unitree app.

## 🧪 Test Scripts Available

I've created comprehensive test scripts to verify that the app can extract current location and show detailed logs.

### Files Created:

1. **`locationTest.ts`** - Core testing logic with detailed logging
2. **`LocationTestScreen.tsx`** - UI screen for interactive testing  
3. **`locationTestConsole.ts`** - Console commands for easy testing

## 🚀 How to Test Location Extraction

### Method 1: Console Commands (Easiest)

The app automatically loads location test commands in development mode. Open your Metro bundler console or React Native debugger and use these commands:

```javascript
// Show all available commands
showLocationHelp()

// Get current GPS location with detailed logs
getCurrentLocation()

// Quick location check 
quickLocationTest()

// Full comprehensive test suite
testLocation()

// Test campus validation
testCampusValidation()

// Test WiFi validation with different IPs
testWiFiValidation("192.168.1.100")
testWiFiValidation("10.0.0.1")
testAllIPScenarios()
```

### Method 2: Add Test Screen to Navigation

Add the `LocationTestScreen` to your app navigation:

```javascript
import LocationTestScreen from '../screens/debug/LocationTestScreen';

// Add to your navigator
<Stack.Screen 
  name="LocationTest" 
  component={LocationTestScreen} 
  options={{ title: "Location Test" }}
/>
```

### Method 3: Programmatic Testing

Import and use the test functions in your code:

```javascript
import { runLocationTest, quickLocationCheck } from '../utils/locationTest';

// In your component or function
const testLocation = async () => {
  const result = await runLocationTest();
  console.log('Location test result:', result);
};
```

## 📊 What the Tests Will Show in Logs

### Expected Console Output:

```
🧪 ===== LOCATION TEST SUITE STARTED =====
📱 Platform: ios
🔧 Location tracking enabled: true
🏫 University coordinates: 10.8231, 106.6297
📏 Campus radius: 100m
🌐 Test IP address: 192.168.1.100
================================================

🔍 Step 1: Testing location services availability...
📍 Location services enabled: true

🔐 Step 2: Testing location permissions...
🔓 Current foreground permission: granted

⚡ Step 3: Initializing location service...
🚀 Location service initialized: true
📊 Service permission status: {hasPermission: true, isLocationEnabled: true}

🌍 Step 4: Testing current location retrieval...
📍 Location attempt 1/3...
✅ Location obtained on attempt 1
📍 Current location obtained:
   Latitude: 10.823456
   Longitude: 106.629789
   Accuracy: 5m
   Timestamp: 2024-01-15T10:30:00.000Z

🏫 Step 5: Testing campus validation...
🎯 Campus validation result: {isValid: true, distance: 45, campus: "Main Campus", location: {...}}
📊 Distance calculation details:
   Current: 10.823456, 106.629789
   Campus: 10.8231, 106.6297
   Distance: 45m
   Within radius (100m): true

📡 Step 6: Testing WiFi session validation...
🔗 WiFi validation result: {isValid: true, validationMethods: {ipAddress: true, location: true}}
   IP Valid: true
   Location Valid: true
   Overall Valid: true (requires BOTH)

🧪 Step 7: Testing different IP scenarios...
   🧪 Testing: Valid university IP (192.168.1.100)
      IP Valid: true
      Location Valid: true
      Session Valid: true
   
   🧪 Testing: Invalid IP (10.0.0.1)
      IP Valid: false
      Location Valid: true
      Session Valid: false

✅ ===== LOCATION TEST SUITE COMPLETED SUCCESSFULLY =====
```

## 🔧 Configuration for Testing

### 1. Enable Location Tracking

In your `.env` file or environment:

```bash
EXPO_PUBLIC_ENABLE_LOCATION_TRACKING=true
EXPO_PUBLIC_UNIVERSITY_LAT=10.8231          # Your test coordinates
EXPO_PUBLIC_UNIVERSITY_LNG=106.6297         # Your test coordinates  
EXPO_PUBLIC_UNIVERSITY_RADIUS=100           # Test radius in meters
```

### 2. Test Device Setup

**For Simulators:**
- iOS Simulator: Features > Location > Custom Location (enter test coordinates)
- Android Emulator: Extended Controls (...) > Location > Enter coordinates

**For Physical Devices:**
- Enable Location Services in device settings
- Grant location permissions when prompted
- Test both indoors and outdoors for accuracy comparison

## 🐛 Troubleshooting

### Common Issues:

1. **"Location services disabled"**
   ```
   Enable location services in device settings
   Restart the app after enabling
   ```

2. **"Permission denied"**
   ```
   Check app permissions in device settings
   Clear app data and restart if needed
   ```

3. **"Location timeout"**
   ```
   Move to an area with better GPS signal
   Wait longer for GPS lock (especially indoors)
   Try on physical device instead of simulator
   ```

4. **"Inaccurate coordinates"**
   ```
   Wait for GPS accuracy to improve (< 10m is good)
   Test outdoors for better signal
   Check if mock locations are enabled (Android)
   ```

### Debug Logging:

The test scripts provide extensive logging to help identify issues:
- Permission status and errors
- GPS accuracy and coordinates  
- Distance calculations step-by-step
- Validation results for each method
- Network connectivity status

## 📱 Testing Scenarios

### Test these scenarios to verify functionality:

1. **Valid Session (Both pass)**
   - Connect to university WiFi (192.168.x.x)
   - Be within campus radius
   - Expected: Session valid ✅

2. **Invalid - Wrong WiFi (Location only)**
   - Connect to non-university WiFi  
   - Be within campus radius
   - Expected: Session invalid ❌

3. **Invalid - Off Campus (IP only)**
   - Connect to university WiFi
   - Be outside campus radius
   - Expected: Session invalid ❌

4. **Invalid - Both fail**
   - Connect to non-university WiFi
   - Be outside campus radius  
   - Expected: Session invalid ❌

## 🎯 Success Criteria

✅ **Location extraction works if:**
- Console shows actual GPS coordinates
- Latitude/longitude values are reasonable for your location
- Accuracy is < 20 meters (preferably < 10m)
- Distance calculation shows correct meters from campus center
- Campus validation returns correct true/false based on distance
- No permission or service errors in logs

❌ **Fix needed if:**
- Location always returns null
- Coordinates are 0,0 or obviously wrong
- Accuracy is > 50 meters consistently
- Permission errors persist
- Campus validation fails with correct coordinates

## 💡 Tips for Best Results

1. **Test outdoors first** - GPS works better with clear sky view
2. **Wait for accuracy** - Initial GPS lock may be inaccurate
3. **Test on real device** - Simulators have limitations
4. **Check console logs** - They show detailed troubleshooting info
5. **Test different times** - GPS performance can vary

The test scripts will help you verify that your app can successfully extract location data and validate it against your campus coordinates! 