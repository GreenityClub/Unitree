# Enhanced WiFi Monitoring with Location Tracking

This document explains how to configure and use the enhanced WiFi monitoring system that supports both IP address and GPS location validation.

## Overview

The enhanced system provides dual validation methods:
1. **IP Address Validation** (existing): Validates university WiFi by IP prefix
2. **Location Validation** (new): Validates presence within campus using GPS coordinates

Users can earn points **ONLY** if they meet **BOTH** validation methods - they must be connected to university WiFi AND physically present on campus.

## Configuration

### Mobile App Environment Variables

Add these to your `.env` file or environment configuration:

```bash
# WiFi IP Configuration (configured for 10.22.xx.xx networks)
EXPO_PUBLIC_UNIVERSITY_IP_PREFIX=10.22

# Location Configuration (set to your university coordinates)
EXPO_PUBLIC_UNIVERSITY_LAT=21.023883446210807    # University latitude
EXPO_PUBLIC_UNIVERSITY_LNG=105.79044010261333    # University longitude  
EXPO_PUBLIC_UNIVERSITY_RADIUS=100                # Validation radius in meters
EXPO_PUBLIC_ENABLE_LOCATION_TRACKING=true        # Enable location features
```

### Server Environment Variables

Add these to your server `.env` file:

```bash
# WiFi & Location Configuration
UNIVERSITY_IP_PREFIX=10.22                   # IP prefix for university WiFi
UNIVERSITY_LAT=21.023883446210807            # University latitude
UNIVERSITY_LNG=105.79044010261333            # University longitude
UNIVERSITY_RADIUS=100                        # Validation radius in meters
```

## How It Works

### Validation Logic
1. System checks WiFi IP address against university prefix
2. System checks GPS location against campus coordinates
3. Session is valid **ONLY** if **BOTH** IP and location validate
4. Both validation results are stored in the session record

### Location Tracking
- Uses high-accuracy GPS positioning
- Calculates distance using Haversine formula
- Validates within configurable radius (default: 100m)
- Stores location data with accuracy and timestamp

### Data Storage
Each WiFi session now stores:
- IP address and validation status
- GPS coordinates (if available)
- Validation methods used
- Campus name and distance from center
- Location accuracy and timestamp

## Setup Steps

### 1. Configure University Location
```javascript
// Update coordinates for your university
const UNIVERSITY_LOCATIONS = [
  {
    latitude: 10.8231,        // Your university latitude
    longitude: 106.6297,      // Your university longitude
    radius: 100,              // Validation radius in meters
    name: 'Main Campus'
  }
];
```

### 2. Enable Location Features
```javascript
// In your environment config
EXPO_PUBLIC_ENABLE_LOCATION_TRACKING=true
```

### 3. Test the System
The system will:
- Request location permissions on first use
- Show validation status in WiFi monitoring screens
- Require BOTH university WiFi AND campus location for valid sessions

## User Experience

### Permission Flow
1. App requests location permissions on startup
2. Users MUST grant location access for the system to work
3. System requires BOTH university WiFi AND location validation
4. If location denied, no sessions can be validated until permission granted

### Validation Scenarios
- **University WiFi + On Campus**: Both validations pass ✅ **VALID SESSION**
- **University WiFi + Off Campus**: Only IP passes ❌ **BLOCKED**
- **Other WiFi + On Campus**: Only location passes ❌ **BLOCKED**  
- **Other WiFi + Off Campus**: No validation passes ❌ **BLOCKED**

## Security & Privacy

### Location Privacy
- GPS coordinates used only for campus validation
- No location tracking or movement monitoring
- Location data stored only during active sessions
- High accuracy required for reliable validation

### Data Protection
- Location data encrypted in transit
- GPS coordinates stored with session records only
- No location history or tracking beyond sessions
- Users can disable location features entirely

## Troubleshooting

### Common Issues

1. **Location Permission Denied**
   - System CANNOT validate sessions (requires both IP and location)
   - Users must enable location in device settings
   - App will re-request permissions on next startup

2. **Inaccurate GPS**
   - Check device location settings
   - Ensure location services enabled
   - Move to area with better GPS signal
   - System uses accuracy threshold for validation

3. **False Positives/Negatives**
   - Adjust `UNIVERSITY_RADIUS` for your campus size
   - Consider multiple campus locations if needed
   - Monitor validation logs for debugging

### Debug Information
Enable debug mode to see:
- GPS coordinates and accuracy
- Distance calculations
- Validation results for both methods
- Permission status and errors

## Advanced Configuration

### Multiple Campus Locations
```javascript
const UNIVERSITY_LOCATIONS = [
  {
    latitude: 10.8231,
    longitude: 106.6297,
    radius: 100,
    name: 'Main Campus'
  },
  {
    latitude: 10.8500,
    longitude: 106.6400,
    radius: 150,
    name: 'North Campus'
  }
];
```

### Dynamic Radius Based on Campus
```javascript
// Different validation radius per campus
const getCampusRadius = (campusName) => {
  switch (campusName) {
    case 'Main Campus': return 100;
    case 'North Campus': return 150;
    case 'Downtown Campus': return 75;
    default: return 100;
  }
};
```

## Monitoring & Analytics

### Session Data
Each session now includes:
```javascript
{
  ipAddress: "192.168.1.100",
  location: {
    latitude: 10.8231,
    longitude: 106.6297,
    accuracy: 5.0,
    timestamp: "2024-01-15T10:30:00Z"
  },
  validationMethods: {
    ipAddress: true,
    location: true
  },
  campus: "Main Campus",
  distance: 45  // meters from campus center
}
```

### Analytics Possibilities
- Track campus usage patterns
- Identify popular locations within campus
- Monitor validation method effectiveness
- Analyze GPS accuracy and reliability

## Performance Considerations

### Battery Impact
- Location requests use high accuracy mode
- GPS polling only during active sessions
- Automatic location service shutdown when not needed
- Minimal battery impact with optimized polling

### Network Usage
- Location data adds ~50 bytes per session
- Validation happens locally before API calls
- No continuous location streaming
- Efficient data transmission

## Migration from IP-Only System

### Backward Compatibility
- Existing IP validation continues to work
- New location features are additive
- Old session records remain valid
- Gradual rollout possible

### Migration Steps
1. Deploy server changes first
2. Update mobile app with location features
3. Enable location tracking in environment
4. Monitor validation effectiveness
5. Adjust radius and settings as needed

The enhanced system provides a more robust and flexible approach to WiFi validation while maintaining full backward compatibility with existing IP-based validation. 