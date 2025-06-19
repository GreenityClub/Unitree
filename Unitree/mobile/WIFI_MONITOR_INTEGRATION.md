# WiFi Monitor Integration

This document explains the integration of the advanced WiFi Monitor system into the Unitree mobile application.

## Overview

The new WiFi Monitor system provides:
- Real-time WiFi connection monitoring
- BSSID-based university WiFi detection
- Automatic session management
- Points earning system integration
- Session recovery capabilities
- Location permission management

## Key Components

### 1. WifiMonitor.ts
- Main monitoring service with advanced network detection
- Uses NetInfo, react-native-network-info, and native modules for comprehensive WiFi info
- Implements session lifecycle management
- Handles automatic session recovery
- Provides event listener system

### 2. ApiService.ts
- Abstraction layer for API communication
- Token management
- WiFi session API endpoints
- Error handling

### 3. WiFiContext.tsx (Updated)
- Integrates WifiMonitor with React context
- Manages authentication-based monitoring
- Provides WiFi state to components
- Handles monitor lifecycle with auth changes

### 4. WifiStatusScreen.tsx (Updated)
- Shows real-time WiFi monitoring status
- Debug information in development mode
- Enhanced session information display

## Features

### Advanced WiFi Detection
- Primary: NetInfo for basic WiFi information
- Fallback 1: react-native-network-info for BSSID
- Fallback 2: Native WiFi module (Android)
- Uses first 8 digits of BSSID for university WiFi identification

### Session Management
- Automatic session start/stop based on WiFi connection
- Session recovery after app restart
- Concurrent session operation protection
- Real-time session updates every 30 seconds

### Permission Handling
- Automatic location permission requests (required for BSSID on Android)
- Graceful fallback when permissions denied
- Cross-platform permission management

### Points Integration
- Points awarded based on server-calculated milestones
- Real-time points earning callbacks
- Automatic stats refresh on points earned

## Configuration

### Environment Variables
The system uses the following environment variables:
- `UNIVERSITY_BSSID_PREFIX`: First part of university WiFi BSSID (e.g., "c2:74:ad:1d")
- `POINTS_PER_HOUR`: Points earning rate
- All existing ENV variables from env.ts

### Server Requirements
The system expects these API endpoints:
- `POST /api/wifi/start` - Start WiFi session
- `POST /api/wifi/end` - End WiFi session
- `GET /api/wifi/active` - Get active session info
- `POST /api/wifi/update` - Update session info

## Development and Testing

### Debug Features
- Development mode debug panel in WiFi status screen
- Global `WifiMonitorDebug` object for testing
- Global `WifiMonitorTest` utility class
- Comprehensive logging

### Testing Commands (Development Console)
```javascript
// Check monitor status
WifiMonitorTest.getStatus()

// Start monitor manually
WifiMonitorTest.startMonitor()

// Stop monitor
WifiMonitorTest.stopMonitor()

// Force stop (emergency)
WifiMonitorTest.forceStopMonitor()

// Add test listener
const removeListener = WifiMonitorTest.addTestListener()

// Log detailed status
WifiMonitorTest.logDetailedStatus()

// Access WifiMonitor directly
WifiMonitorDebug.getSessionInfo()
WifiMonitorDebug.isRunning()
```

## Migration from Old System

### What Changed
1. **Automatic Management**: WiFi monitoring now starts/stops automatically with authentication
2. **Enhanced Detection**: Uses multiple methods to detect university WiFi
3. **Session Recovery**: Can recover sessions after app restart
4. **Real-time Updates**: Session info updates every 30 seconds
5. **Better Error Handling**: More robust error handling and fallbacks

### Backward Compatibility
- All existing WiFi-related APIs remain functional
- Old wifiService still available for basic operations
- WiFiContext provides same interface with enhanced features

## Troubleshooting

### Common Issues

1. **BSSID Detection Fails**
   - Ensure location permissions are granted
   - Check if device supports BSSID access
   - Verify university WiFi BSSID prefix configuration

2. **Session Not Starting**
   - Check API token availability
   - Verify server connectivity
   - Check console logs for detailed error messages

3. **Permission Issues**
   - Monitor will request permissions automatically
   - Grant location permissions for full functionality
   - Some features work without permissions

### Debug Steps
1. Check debug panel in WiFi status screen (development mode)
2. Use console commands to test individual components
3. Check network logs for API communication
4. Verify environment configuration

## Performance Considerations

- Monitor uses passive listening - minimal battery impact
- Session updates every 30 seconds (configurable)
- Automatic cleanup on authentication changes
- Optimized for frequent app switching

## Security Notes

- Location permission only used for WiFi BSSID detection
- No GPS tracking or location storage
- All communication with existing API security
- Session data handled securely 