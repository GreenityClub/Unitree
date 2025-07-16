# What Happens When the App is Completely Closed?

This document explains the behavior of background WiFi monitoring when the UniTree app is completely closed or force-closed by the user.

## 🔄 Different Types of App States

### 1. **Background Mode** (App minimized)
- ✅ **Background monitoring works fully**
- ✅ WiFi sessions tracked continuously
- ✅ All data saved locally
- ✅ Minimal battery usage

### 2. **Force Close/Swipe Away** (User manually closes app)
- ⚠️ **Platform-dependent behavior**
- 📱 **iOS**: Limited background execution
- 🤖 **Android**: Varies by manufacturer and settings

### 3. **System Termination** (OS kills app for resources)
- ⚠️ **May stop background monitoring**
- 🔄 **Restarts on next app launch**
- 💾 **Data is preserved locally**

## 📱 iOS Behavior (iPhone/iPad)

### After Force Close:
1. **Background tasks continue for ~30 seconds to 10 minutes**
2. **Then iOS suspends the app completely**
3. **No further WiFi monitoring until app is reopened**

### Limitations:
- iOS prioritizes battery life over background execution
- Background app refresh must be enabled in device settings
- System can terminate background tasks under battery/performance pressure

### What We Do:
```typescript
// Configure for maximum iOS compatibility
await BackgroundTask.registerTaskAsync(WIFI_MONITOR_TASK, {
  minimumInterval: 60, // iOS minimum
  stopOnTerminate: false, // Try to continue after termination
  startOnBoot: true, // Resume on device restart
  enableWakeUp: true, // Wake device if possible
});
```

## 🤖 Android Behavior

### After Force Close:
- **Depends heavily on device manufacturer**
- **Samsung, Xiaomi, Huawei have aggressive power management**
- **Stock Android (Pixel) is more permissive**

### Manufacturer Differences:

#### **Stock Android (Google Pixel)**
- ✅ Background tasks continue for longer periods
- ✅ More lenient background execution policies

#### **Samsung Devices**
- ⚠️ Aggressive battery optimization
- ⚠️ May kill background tasks quickly
- 💡 **Solution**: Add app to "Never sleeping apps" list

#### **Xiaomi (MIUI)**
- ⚠️ Very aggressive power management
- ⚠️ Often kills background tasks immediately
- 💡 **Solution**: Disable MIUI Optimization, enable Autostart

#### **Huawei/Honor**
- ⚠️ PowerGenie kills background tasks
- ⚠️ Protected apps list needed
- 💡 **Solution**: Add to Protected Apps

### Android Settings to Enable:
1. **Battery Optimization**: Exclude UniTree app
2. **Auto-start Management**: Allow auto-start
3. **Background App Refresh**: Enable for UniTree
4. **Protected Apps**: Add UniTree (Huawei)
5. **Never Sleeping Apps**: Add UniTree (Samsung)

## 🎯 What Happens to Your Data

### Session Data Protection:
```typescript
// Data is always saved locally first
interface BackgroundSession {
  id: string;
  startTime: string;
  endTime?: string;
  ipAddress: string;
  duration: number;
  isActive: boolean;
  timestamp: string;
}

// Stored in AsyncStorage - survives app termination
await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(session));
```

### When App Reopens:
1. ✅ **All background sessions are preserved**
2. ✅ **Previous session is properly ended** (if it was still active)
3. ✅ **New session starts automatically** (if on university WiFi)
4. ✅ **Automatic sync uploads everything**
5. ✅ **Points are awarded for all tracked time**
6. ✅ **No data loss occurs**

## 🔧 Technical Implementation

### Background Task Configuration:
```typescript
// BackgroundWifiService handles force-close scenarios
class BackgroundWifiService {
  
  // Check if monitoring was enabled before termination
  async isBackgroundMonitoringEnabled(): Promise<boolean> {
    const enabled = await AsyncStorage.getItem('bg_wifi_enabled');
    return enabled === 'true';
  }

  // Resume monitoring when app restarts
  async initialize(): Promise<void> {
    const wasEnabled = await this.isBackgroundMonitoringEnabled();
    if (wasEnabled) {
      await this.registerBackgroundTask();
      await this.startBackgroundTask();
    }
  }
}
```

### App State Detection:
```typescript
// BackgroundSyncContext handles app state changes
useEffect(() => {
  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      // App came to foreground - sync everything
      await performForegroundSync();
    }
  };

  AppState.addEventListener('change', handleAppStateChange);
}, []);
```

## 📊 Expected Behavior Summary

| Scenario | WiFi Monitoring | Data Safety | User Action Required |
|----------|----------------|-------------|---------------------|
| **App Minimized** | ✅ Full monitoring | ✅ Real-time tracking | None |
| **Recent App Switcher** | ✅ Continues normally | ✅ All data saved | None |
| **Force Close (iOS)** | ⚠️ Stops after ~5-10 min | ✅ Data preserved | Reopen app to sync |
| **Force Close (Android)** | ⚠️ Varies by device | ✅ Data preserved | Check device settings |
| **System Restart** | 🔄 Resumes on boot | ✅ Data preserved | None |
| **App Update** | 🔄 Restarts monitoring | ✅ Data preserved | Reopen updated app |

## 💡 User Guidance

### For Best Results:
1. **Don't force-close the app** - just minimize it
2. **Enable background app refresh** in device settings
3. **Add UniTree to battery optimization exceptions**
4. **Check manufacturer-specific power settings**

### If You Must Force-Close:
1. **Data is safe** - it's saved locally
2. **Reopen the app** to sync your sessions
3. **Points will be awarded** for all tracked time
4. **No manual action needed** - sync is automatic

### Troubleshooting Force-Close Issues:

#### iOS Users:
```
Settings > General > Background App Refresh > UniTree (ON)
Settings > Battery > Background App Refresh > UniTree (ON)
```

#### Android Users:
```
Settings > Apps > UniTree > Battery > Optimize battery usage (OFF)
Settings > Apps > UniTree > Permissions > Allow background activity
```

#### Samsung Specific:
```
Settings > Device Care > Battery > More Battery Settings
> Sleeping Apps > Remove UniTree if listed
> Never Sleeping Apps > Add UniTree
```

#### Xiaomi Specific:
```
Settings > Apps > Manage Apps > UniTree > Autostart (ON)
Settings > Apps > Manage Apps > UniTree > Other Permissions > Display pop-up windows while running in background (ON)
```

## 🚨 Important Notes

### What We Can Control:
- ✅ Local data storage and preservation
- ✅ Automatic sync when app reopens
- ✅ Efficient background task implementation
- ✅ Battery-optimized monitoring

### What We Cannot Control:
- ❌ OS-level power management policies
- ❌ Manufacturer battery optimizations
- ❌ User device settings
- ❌ System resource pressure

### Recommendation:
**For the most reliable WiFi tracking, avoid force-closing the app. Simply press the home button to minimize it instead.**

---

**Bottom Line**: While we've implemented robust background monitoring, force-closing the app may interrupt tracking depending on your device. The good news is that all your data is safe and will sync automatically when you reopen the app! 