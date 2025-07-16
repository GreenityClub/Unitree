# Background WiFi Monitoring Setup Guide

This guide explains how to configure and use the background WiFi monitoring feature in the UniTree mobile app.

## 🚀 Quick Setup

### 1. Install Dependencies

```bash
cd Unitree/mobile
npm install
```

The following packages have been added for background functionality:
- `expo-background-task` - For periodic background tasks (replaces deprecated expo-background-fetch)
- `expo-task-manager` - For managing background tasks

### 2. App Configuration

The app has been configured with the necessary permissions and background modes:

**iOS (`app.json`):**
- `UIBackgroundModes`: `["background-fetch", "background-processing"]`
- Location permissions for WiFi detection

**Android (`app.json`):**
- `FOREGROUND_SERVICE` permission
- `WAKE_LOCK` permission
- WiFi and location permissions

## 📱 How It Works

### Background Monitoring
When enabled, the app:
1. **Tracks WiFi connections** even when closed/minimized
2. **Uses minimal bandwidth** - only stores session data locally
3. **Checks every minute** for university WiFi connections
4. **Saves sessions offline** until the app is reopened

### Foreground Sync
When the app is opened:
1. **Handles session transitions** - Ends previous session, starts new if on university WiFi
2. **Automatically syncs** all background sessions
3. **Awards points** for tracked sessions
4. **Updates statistics** and user progress
5. **Refreshes all data** from the server

## 🎯 Key Features

### Minimal Bandwidth Usage
- **Background**: Only WiFi connection checks (no API calls)
- **Foreground**: Batch sync of all collected data
- **Smart caching**: Offline storage prevents data loss

### Battery Optimization
- **60-second intervals**: Minimum allowed by iOS
- **Lightweight checks**: Only IP address validation
- **Efficient storage**: Minimal data structure

### Data Integrity
- **Duplicate prevention**: Server checks for existing sessions
- **Error handling**: Failed syncs are retried
- **Session validation**: Only valid university WiFi earns points

## 🛠️ Usage Instructions

### For Users

1. **Enable Background Monitoring**:
   - Go to Profile tab → User Settings
   - Under "WiFi Settings" section
   - Toggle "Background WiFi Monitoring" ON
   - Allow permissions when prompted

2. **Monitor Status**:
   - Check "Pending Sessions" count
   - View "Last Sync" timestamp
   - See if background session is active

3. **Manual Sync** (if needed):
   - Tap "Sync X Sessions" button
   - Or pull to refresh on any screen

### For Developers

#### Enabling Background Service
```typescript
import BackgroundWifiService from '../services/BackgroundWifiService';

// Enable background monitoring
await BackgroundWifiService.enableBackgroundMonitoring();

// Check if enabled
const isEnabled = await BackgroundWifiService.isBackgroundMonitoringEnabled();
```

#### Using Background Sync Context
```typescript
import { useBackgroundSync } from '../context/BackgroundSyncContext';

const { 
  isBackgroundMonitoringEnabled,
  syncStats,
  performForegroundSync,
  enableBackgroundMonitoring 
} = useBackgroundSync();
```

#### Manual Sync Operations
```typescript
// Perform foreground sync
const result = await BackgroundWifiService.syncPendingSessions();
console.log(`Synced: ${result.synced}, Failed: ${result.failed}`);

// Get sync statistics
const stats = await BackgroundWifiService.getSyncStats();
console.log('Pending sessions:', stats.pendingCount);
```

## 🔧 Technical Implementation

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Background Service                        │
├─────────────────────────────────────────────────────────────┤
│ • WiFi monitoring (every 60 seconds)                       │
│ • Local session storage                                    │
│ • No server communication                                  │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                   Foreground Sync                          │
├─────────────────────────────────────────────────────────────┤
│ • Batch upload sessions                                     │
│ • Update user points/stats                                 │
│ • Refresh all app data                                     │
└─────────────────────────────────────────────────────────────┘
```

### File Structure

```
src/
├── services/
│   ├── BackgroundWifiService.ts      # Main background service
│   └── wifiService.ts               # Regular WiFi operations
├── context/
│   ├── BackgroundSyncContext.tsx    # Background sync state management
│   └── WiFiContext.tsx             # WiFi connection management
├── components/
│   └── BackgroundSyncSettings.tsx   # Settings UI component
└── screens/main/
    └── WifiStatusScreen.tsx         # Updated with background features
```

### Data Flow

1. **Background Task**: `TaskManager.defineTask(WIFI_MONITOR_TASK)`
2. **Local Storage**: `AsyncStorage` for offline sessions
3. **Session Structure**:
   ```typescript
   interface BackgroundSession {
     id: string;
     startTime: string;
     endTime?: string;
     ipAddress: string;
     duration: number;
     isActive: boolean;
     timestamp: string;
   }
   ```

### Server Endpoint

**POST** `/api/wifi/background-sync`
```json
{
  "sessionId": "bg_1234567890_abc123",
  "startTime": "2024-01-20T10:00:00.000Z",
  "endTime": "2024-01-20T10:30:00.000Z",
  "duration": 1800,
  "ipAddress": "192.168.1.100"
}
```

## 🔒 Privacy & Security

### Data Collection
- **Only tracks**: Connection times and IP addresses
- **No personal data**: No browsing history or content
- **University WiFi only**: Only configured networks are monitored

### Data Storage
- **Local first**: Sessions stored locally until sync
- **Encrypted transit**: HTTPS for all server communication
- **Token-based auth**: Secure API authentication

### User Control
- **Opt-in feature**: Disabled by default
- **Easy toggle**: Can be disabled anytime
- **Transparent**: All data visible to user

## 🐛 Troubleshooting

### Common Issues

**Background monitoring not working:**
1. Check device settings allow background app refresh
2. Ensure location permissions are granted
3. Verify university WiFi IP prefix is configured correctly
4. Note: expo-background-task is the new API (replaces deprecated expo-background-fetch)

**Sessions not syncing:**
1. Check internet connection
2. Verify authentication token is valid
3. Try manual sync from settings

**High battery usage:**
1. Background tasks are optimized for minimal impact
2. Check device battery optimization settings
3. Consider shorter monitoring sessions

### Debug Information

Enable debug logging in development:
```typescript
// In BackgroundWifiService
console.log('🔄 Background WiFi check:', {
  isConnected: netInfo.isConnected,
  ipAddress: wifiDetails.ipAddress,
  isUniversityIP: this.isUniversityIP(ipAddress)
});
```

### Performance Monitoring

Check sync performance:
```typescript
const stats = await BackgroundWifiService.getSyncStats();
console.log('Performance:', {
  pendingCount: stats.pendingCount,
  lastSync: stats.lastSync,
  currentSession: stats.currentSession
});
```

## 📊 Monitoring & Analytics

### Sync Statistics
- **Pending sessions**: Count of unsynced sessions
- **Last sync time**: When data was last uploaded
- **Current session**: Active background session info
- **Sync success rate**: Successful vs failed uploads

### User Metrics
- **Background vs foreground points**: Track earning sources
- **Session continuity**: Compare background vs manual tracking
- **Battery impact**: Monitor device performance

## 🚀 Future Enhancements

### Planned Features
1. **Smart scheduling**: Adaptive sync intervals based on usage
2. **WiFi quality tracking**: Signal strength and connection stability
3. **Offline mode**: Extended offline operation capabilities
4. **Push notifications**: Background session summaries

### Configuration Options
- **Sync frequency**: Customizable background check intervals
- **Data retention**: Configurable local storage duration
- **Network preferences**: Multiple university network support

## 🚨 App Force-Close Behavior

**Important**: What happens when you completely close the app depends on your device and settings. For detailed information about force-close behavior, data safety, and platform-specific limitations, see:

**📖 [APP_FORCE_CLOSE_BEHAVIOR.md](./APP_FORCE_CLOSE_BEHAVIOR.md)**

### Quick Summary:
- **Data is always safe** - stored locally even if app is force-closed
- **Monitoring may stop** after force-close (varies by device)
- **Automatic sync** when you reopen the app
- **Best practice**: Minimize app instead of force-closing

## 📞 Support

For technical support or feature requests:
1. Check the troubleshooting section above
2. Review device permissions and settings
3. Read the force-close behavior documentation
4. Contact the development team with specific error messages

---

## 🔄 Migration Notes

This implementation has been updated to use `expo-background-task` instead of the deprecated `expo-background-fetch`. The new API provides the same functionality with improved stability and future support.

### Changes Made:
- Replaced `expo-background-fetch` with `expo-background-task` in package.json
- Updated API calls to use `BackgroundTask` instead of `BackgroundFetch`
- Updated status enums and result types
- Maintained full backward compatibility for users

---

**Version**: 1.1.0  
**Last Updated**: January 2024  
**Compatibility**: iOS 11+, Android 6+ (API level 23+) 