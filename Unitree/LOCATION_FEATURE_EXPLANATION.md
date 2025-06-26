# App Features Requiring Persistent Location - Response to Apple Review

## App Name: UniTree
## Submission ID: f0b50bb9-c49c-4695-888a-9fb3cb13f4d5

Dear Apple Review Team,

Thank you for your review. This document explains the specific features in our app that require persistent location access as declared in our UIBackgroundModes.

## 🎯 Main Feature: **Enhanced University WiFi Session Monitoring with Location Validation**

### **Core Functionality:**
Our app tracks university WiFi usage sessions and awards points to students for being connected to university WiFi while physically present on campus. This requires **BOTH** IP address validation AND GPS location validation.

### **Why Persistent Location is Required:**

1. **Fraud Prevention**: Students could potentially use VPN or WiFi hotspots to fake university WiFi connections from home. Location validation ensures they are physically present on campus.

2. **Dual Validation System**: Sessions are only valid when BOTH conditions are met:
   - ✅ Connected to university WiFi (IP validation)
   - ✅ Physically present on campus (GPS validation)

3. **Background Monitoring**: Students often have the app in background while studying. We need to continuously validate their campus presence even when app is backgrounded.

## 📍 How to Locate This Feature in the App:

### **Step 1: Enable Location Features**
- Open the app and grant location permissions when prompted
- The app requires "Always" location access for background monitoring

### **Step 2: Main WiFi Monitoring (Home Screen)**
- Navigate to the **Home Screen** (first tab)
- You'll see WiFi status indicator showing:
  - "University WiFi: Connected" ✅
  - "Campus Location: Verified" ✅ 
  - Current session timer
  - Points being earned

### **Step 3: Detailed WiFi Status (WiFi Tab)**
- Navigate to **WiFi tab** (last tab in bottom navigation)
- This screen shows detailed validation status:
  - **IP Address Validation**: Shows if connected to university WiFi
  - **Location Validation**: Shows if physically on campus
  - **Overall Status**: Shows if BOTH validations pass
  - Real-time distance from campus center
  - Current GPS coordinates

### **Step 4: Location Testing Screen**
- Navigate to: **Profile Tab → System Settings → Location Test**
- This screen demonstrates the location features:
  - GPS coordinate extraction
  - Campus distance calculation
  - Dual validation system
  - Shows live location updates

### **Step 5: Background Sync Settings**
- Navigate to: **Profile Tab → System Settings → Background Sync**
- Shows background monitoring configuration
- Explains how persistent location is used

## 🔧 Technical Implementation Details:

### **Location Usage Scenarios:**

1. **Foreground Monitoring** (`WifiMonitor.ts`):
   - Continuously validates campus presence while app is active
   - Uses high-accuracy GPS to verify student is within campus radius (100m)
   - Updates session status in real-time

2. **Background Session Validation** (`BackgroundWifiService.ts`):
   - Monitors WiFi connections when app is backgrounded
   - Validates each session requires both university WiFi AND campus location
   - Prevents fraudulent sessions from off-campus locations

3. **Session Start/End Events** (`locationService.ts`):
   - Every session start requires campus location validation
   - Geographic verification against university coordinates
   - Calculates distance using Haversine formula

### **Location Permission Explanations:**
- **NSLocationWhenInUseUsageDescription**: "This app needs location access to detect WiFi network details for tracking university WiFi usage."
- **NSLocationAlwaysAndWhenInUseUsageDescription**: "This app needs background location access to continuously monitor university WiFi connections."

### **Code References:**
- **Location Service**: `src/services/locationService.ts` (lines 117-206)
- **WiFi Monitor**: `src/services/WifiMonitor.ts` (lines 169-244) 
- **Background Service**: `src/services/BackgroundWifiService.ts` (lines 139-184)
- **Server Validation**: `server/src/routes/wifi.js` (lines 225-412)

## 🧪 Testing the Location Features:

### **Demo Scenario for Reviewers:**
1. Open the app and grant location permissions
2. Navigate to "Location Test" screen in Profile → System Settings
3. Tap "Run Full Test" button
4. Observe:
   - GPS coordinates being extracted
   - Distance calculation from campus center
   - Campus validation (will show "outside campus" if not at actual university)
   - WiFi validation requiring BOTH IP and location

### **Expected Behavior:**
- **On Campus + University WiFi**: Session valid ✅
- **On Campus + Other WiFi**: Session invalid ❌  
- **Off Campus + University WiFi**: Session invalid ❌
- **Off Campus + Other WiFi**: Session invalid ❌

## 📊 Location Data Usage:

### **What We Track:**
- GPS coordinates during active WiFi sessions only
- Distance from campus center for validation
- Location accuracy for reliability assessment
- No movement tracking or history beyond sessions

### **Privacy Protection:**
- Location used only for campus validation
- No location data stored beyond session records
- High accuracy required only during validation
- Automatic location service shutdown when not needed

## 🎓 Educational Value:

This app encourages students to physically attend university and engage with campus facilities by:
- Rewarding actual campus presence (not just WiFi connection)
- Promoting physical attendance over remote/VPN access
- Gamifying the campus experience with points and achievements
- Supporting environmental initiatives through virtual tree planting

## 📱 User Experience Flow:

1. Student arrives on campus and connects to university WiFi
2. App automatically detects university WiFi connection
3. App validates GPS location to confirm campus presence  
4. If BOTH validations pass, session begins and points are earned
5. Session continues in background while student studies on campus
6. When student leaves campus OR disconnects from university WiFi, session ends

The persistent location access is essential for maintaining this validation throughout the entire campus experience, even when students minimize the app to focus on their studies.

---

**Thank you for your consideration. The location features are core to our app's educational mission and fraud prevention system. Please let us know if you need any additional information or demonstration of these features.** 