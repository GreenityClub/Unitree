# Environment Variables Configuration

This document explains how to set up and use environment variables in the UniTree mobile app.

## Setup

1. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update the values in `.env` to match your environment.

## Environment Variables

### Required Variables

- `EXPO_PUBLIC_API_URL`: The base URL for your backend API (e.g., `http://192.168.1.6:3000`)
- `EXPO_PUBLIC_APP_NAME`: The name of your app (e.g., `UniTree`)
- `EXPO_PUBLIC_APP_VERSION`: The version of your app (e.g., `1.0.0`)

### WiFi and Location Configuration

- `EXPO_PUBLIC_UNIVERSITY_IP_PREFIX`: IP address prefix for university WiFi tracking (default: "10.22" for 10.22.xx.xx networks)
- `EXPO_PUBLIC_UNIVERSITY_LAT`: University campus latitude coordinate (required for location validation)
- `EXPO_PUBLIC_UNIVERSITY_LNG`: University campus longitude coordinate (required for location validation)
- `EXPO_PUBLIC_UNIVERSITY_RADIUS`: Campus validation radius in meters (default: 100)
- `EXPO_PUBLIC_ENABLE_LOCATION_TRACKING`: Enable GPS location validation (default: true)

### Optional Variables

- `EXPO_PUBLIC_API_TIMEOUT`: API request timeout in milliseconds (default: 10000)
- `EXPO_PUBLIC_APP_SCHEME`: Deep linking scheme (default: `unitree`)
- `EXPO_PUBLIC_POINTS_PER_HOUR`: Points earned per hour of WiFi connection (default: 100)
- `EXPO_PUBLIC_POINTS_FOR_TREE`: Points required to redeem a tree (default: 100)
- `EXPO_PUBLIC_MIN_SESSION_DURATION`: Minimum session duration in seconds (default: 300)
- `EXPO_PUBLIC_SESSION_UPDATE_INTERVAL`: Session update interval in seconds (default: 60)
- `EXPO_PUBLIC_ENABLE_BACKGROUND_SYNC`: Enable background synchronization (default: true)
- `EXPO_PUBLIC_ENABLE_NOTIFICATIONS`: Enable notifications (default: false)
- `EXPO_PUBLIC_DEBUG_MODE`: Enable debug mode (default: true)
- `EXPO_PUBLIC_LOG_LEVEL`: Logging level (default: info)

## Usage in Code

Environment variables are centrally managed in `src/config/env.ts`. Import and use them like this:

```typescript
import ENV from '../config/env';

// Use environment variables
const apiUrl = ENV.API_URL;
const pointsPerHour = ENV.POINTS_PER_HOUR;
const universitySSIDs = ENV.UNIVERSITY_SSIDS;
```

## Important Notes

1. **Expo Public Variables**: All client-side environment variables must be prefixed with `EXPO_PUBLIC_` to be accessible in the Expo environment.

2. **Sensitive Data**: Never put sensitive information (API keys, secrets) in environment variables that start with `EXPO_PUBLIC_` as they will be embedded in the bundle and visible to users.

3. **Validation**: The app validates required environment variables on startup. If validation fails, the app will throw an error in development mode.

4. **Git Ignore**: The `.env` file is automatically ignored by Git to prevent accidentally committing sensitive configuration.

## WiFi Tracking Changes

### Enhanced WiFi Validation
The application uses **dual validation** for maximum accuracy:
1. **IP Address Validation**: Uses IP prefix to detect university WiFi (e.g., "10.22" for 10.22.xx.xx networks)
2. **Location Validation**: Uses GPS coordinates to verify physical presence on campus

**Both validations must pass** for a session to be valid - users must be connected to university WiFi AND physically on campus.

### Enhanced Session Management
- **Real-time session counting**: Track the number of WiFi sessions per day
- **Automatic session management**: 
  - Sessions start when connecting to university WiFi (based on IP prefix)
  - Sessions end automatically when:
    - User logs out
    - User connects to wrong WiFi network  
    - User disconnects from WiFi entirely
- **Real-time statistics**: Connection stats update every 30 seconds
- **Real-time points**: Available and all-time points update based on current session

## Development vs Production

- Use `.env` for local development
- For production builds, set environment variables in your CI/CD pipeline or deployment platform
- The configuration automatically detects development vs production mode using `__DEV__`

## Troubleshooting

If you encounter issues:

1. Make sure your `.env` file exists and is properly formatted
2. Restart the development server after changing environment variables
3. Check the console for environment validation errors
4. Ensure all required variables are set

## Example Configuration

```env
# Development Environment
EXPO_PUBLIC_API_URL=http://192.168.1.100:3000
EXPO_PUBLIC_APP_NAME=UniTree Dev
EXPO_PUBLIC_UNIVERSITY_IP_PREFIX=10.22
EXPO_PUBLIC_UNIVERSITY_LAT=21.023883446210807
EXPO_PUBLIC_UNIVERSITY_LNG=105.79044010261333
EXPO_PUBLIC_UNIVERSITY_RADIUS=100
EXPO_PUBLIC_ENABLE_LOCATION_TRACKING=true
EXPO_PUBLIC_MIN_SESSION_DURATION=300
EXPO_PUBLIC_SESSION_UPDATE_INTERVAL=60
EXPO_PUBLIC_DEBUG_MODE=true
```

```env
# Production Environment  
EXPO_PUBLIC_API_URL=https://api.unitree.com
EXPO_PUBLIC_APP_NAME=UniTree
EXPO_PUBLIC_UNIVERSITY_IP_PREFIX=10.22
EXPO_PUBLIC_UNIVERSITY_LAT=21.023883446210807
EXPO_PUBLIC_UNIVERSITY_LNG=105.79044010261333
EXPO_PUBLIC_UNIVERSITY_RADIUS=100
EXPO_PUBLIC_ENABLE_LOCATION_TRACKING=true
EXPO_PUBLIC_MIN_SESSION_DURATION=300
EXPO_PUBLIC_SESSION_UPDATE_INTERVAL=60
EXPO_PUBLIC_DEBUG_MODE=false
``` 