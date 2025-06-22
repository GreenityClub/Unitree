# UniTree Notification System

This document explains the comprehensive notification system integrated into the UniTree application, featuring both push notifications from the server and local statistical notifications.

## 🔔 Overview

The notification system includes two main components:

1. **Server Push Notifications**: Remind users to open the app when completely closed (7 AM - 6 PM only)
2. **Local Stats Notifications**: Daily, weekly, and monthly WiFi usage and points statistics

## 📱 Mobile Implementation

### Dependencies Added

```json
{
  "expo-notifications": "~0.30.16",
  "@react-native-community/datetimepicker": "8.2.0"
}
```

### Core Components

#### 1. NotificationService (`src/services/notificationService.ts`)
- Singleton service managing all notification operations
- Handles permission requests and push token registration
- Schedules local notifications for statistics
- Manages notification settings and preferences

#### 2. NotificationContext (`src/context/NotificationContext.tsx`)
- React context providing notification state management
- Integrates with auth context for user-specific settings
- Handles app state changes for push notification timing

#### 3. NotificationSettings Component (`src/components/NotificationSettings.tsx`)
- Complete UI for managing notification preferences
- Time and day selectors for scheduled notifications
- Test notification functionality
- Real-time settings synchronization

### Key Features

#### Push Notification Management
- **Automatic token registration** with Expo's push service
- **Server synchronization** of push tokens and preferences
- **Permission handling** with user-friendly prompts

#### Local Stats Notifications
- **Daily notifications** at user-configured time
- **Weekly notifications** on user-selected day
- **Monthly notifications** on chosen day of month
- **Immediate stats** with current usage data

#### User Controls
- **Toggle push notifications** on/off
- **Configure app reminders** during business hours
- **Customize stats notification timing**
- **Test notifications** with current data

## 🖥️ Server Implementation

### Dependencies Added

```json
{
  "expo-server-sdk": "^3.7.0",
  "cron": "^3.1.6"
}
```

### Core Components

#### 1. NotificationService (`src/services/notificationService.js`)
- Handles Expo push notification sending
- Manages bulk notifications for multiple users
- Validates push tokens and handles errors
- Tracks delivery and manages invalid tokens

#### 2. CronService (`src/services/cronService.js`)
- Schedules automated reminder notifications
- Runs every 2 hours during business hours (7 AM - 6 PM)
- Manages multiple cron jobs with status tracking
- Provides manual trigger for testing

#### 3. Notification Routes (`src/routes/notification.js`)
- API endpoints for push token management
- Notification settings CRUD operations
- Test notification endpoints
- Admin functions for manual triggers

### Database Schema

#### User Model Extensions

```javascript
// Push notification fields
pushToken: String,                    // Expo push token
notificationSettings: {
  pushNotificationsEnabled: Boolean,  // Master toggle
  appReminderNotifications: Boolean,  // App reminders
  statsNotifications: Boolean,        // Local stats
  dailyStatsTime: String,            // "HH:mm" format
  weeklyStatsDay: Number,            // 0-6 (Sun-Sat)
  monthlyStatsDay: Number            // 1-31
},
lastActive: Date,                     // Last app activity
lastReminderSent: Date               // Last reminder timestamp
```

## 🚀 Implementation Flow

### 1. App Initialization
```typescript
// Mobile app startup
await notificationService.initialize();
await notificationService.requestPermissions();
const token = await notificationService.registerForPushNotifications();
```

### 2. Server Registration
```javascript
// Server receives push token
POST /api/user/push-token
{
  "pushToken": "ExponentPushToken[...]"
}
```

### 3. Scheduled Reminders
```javascript
// Cron job runs every 2 hours (7 AM - 6 PM)
const inactiveUsers = await User.find({
  pushToken: { $exists: true },
  'notificationSettings.pushNotificationsEnabled': true,
  lastActive: { $lt: twoHoursAgo }
});
```

### 4. Local Stats Notifications
```typescript
// Scheduled at user-configured times
await Notifications.scheduleNotificationAsync({
  identifier: 'daily_stats',
  content: {
    title: '📊 Daily UniTree Stats',
    body: '2h 30m connected • 150 points earned'
  },
  trigger: { hour: 20, minute: 0, repeats: true }
});
```

## ⚙️ Configuration

### App Configuration (`app.json`)

```json
{
  "plugins": [
    [
      "expo-notifications",
      {
        "icon": "./assets/images/icon.png",
        "color": "#2E7D32",
        "defaultChannel": "default"
      }
    ]
  ],
  "android": {
    "permissions": [
      "RECEIVE_BOOT_COMPLETED",
      "com.android.alarm.permission.SET_ALARM"
    ]
  }
}
```

### Server Environment Variables

```env
# Optional: Configure timezone for cron jobs
TZ=America/New_York

# Expo project ID (from app.json)
EXPO_PROJECT_ID=b53a2dd3-f93c-4eb5-aa1e-3620e8834198
```

## 🎯 Notification Types

### 1. App Reminder Notifications
- **When**: Every 2 hours during 7 AM - 6 PM
- **Condition**: User inactive for 2+ hours
- **Content**: "🌱 Don't forget to connect to university WiFi!"
- **Data**: `{ type: 'app_reminder' }`

### 2. Daily Stats Notifications
- **When**: User-configured time (default 8 PM)
- **Content**: "📊 Today's stats: Xh Ym connected • Y points"
- **Data**: `{ type: 'stats_daily' }`

### 3. Weekly Stats Notifications
- **When**: User-selected day (default Sunday)
- **Content**: "🌟 This week: Xh Ym connected • Y points"
- **Data**: `{ type: 'stats_weekly' }`

### 4. Monthly Stats Notifications
- **When**: User-selected day (default 1st)
- **Content**: "🏆 This month: Xh Ym connected • Y points"
- **Data**: `{ type: 'stats_monthly' }`

## 🛠️ API Endpoints

### Push Token Management
```http
POST /api/user/push-token
POST /api/user/notification-preference
```

### Notification Settings
```http
GET /api/notification/settings
PUT /api/notification/settings
```

### Testing & Admin
```http
POST /api/notification/test
POST /api/notification/reminder/manual
```

## 🔧 User Settings Integration

The notification settings are seamlessly integrated into the User Settings screen:

```typescript
// In UserSettingsScreen.tsx
<NotificationSettings />
```

### Settings Interface
- **Push Notifications**: Master toggle with 7 AM - 6 PM note
- **App Reminders**: Dependent on push notifications being enabled
- **Stats Notifications**: Independent toggle for local notifications
- **Daily Stats Time**: Time picker for daily notification
- **Weekly Stats Day**: Day selector (Sun-Sat)
- **Monthly Stats Day**: Day picker (1-31)
- **Test Buttons**: Send immediate test notifications

## 📊 Monitoring & Debugging

### Server Logs
```javascript
logger.info('🔔 Starting scheduled reminder notifications...');
logger.info(`✅ Scheduled reminders completed: ${result.sent} notifications sent`);
logger.error('❌ Error in scheduled reminder notifications:', error);
```

### Mobile Debugging
```typescript
console.log('📱 Expo push token:', this.expoPushToken);
console.log('✅ Notification settings saved');
console.log('📨 Notification received:', notification);
```

### Cron Job Status
```javascript
// Get status of all scheduled jobs
const status = cronService.getJobsStatus();
// {
//   reminderNotifications: {
//     running: true,
//     lastDate: "2024-01-20T15:00:00Z",
//     nextDate: "2024-01-20T17:00:00Z"
//   }
// }
```

## 🚨 Error Handling

### Invalid Push Tokens
- Automatically detected during notification sending
- Invalid tokens logged for cleanup
- Graceful degradation when tokens expire

### Permission Denied
- Clear user messaging about notification permissions
- Graceful fallback to local notifications only
- Settings screen shows permission status

### Network Issues
- Retry logic for failed notification sends
- Local storage ensures settings persistence
- Background sync when connection restored

## 🎯 Best Practices

### Performance
- **Batch processing**: Group notifications for efficiency
- **Rate limiting**: Respect Expo's sending limits
- **Token validation**: Check validity before sending

### User Experience
- **Non-intrusive**: Respectful timing and frequency
- **Customizable**: Full user control over preferences
- **Informative**: Clear, actionable notification content

### Privacy
- **Opt-in**: Notifications disabled by default for reminders
- **Transparent**: Clear explanation of data usage
- **Controllable**: Easy disable/enable for all types

## 🔄 Future Enhancements

### Potential Additions
- **Geofence notifications**: Alerts when near university
- **Achievement notifications**: Milestone celebrations
- **Social notifications**: Friend activity updates
- **Smart timing**: ML-optimized notification scheduling

### Analytics Integration
- **Notification engagement**: Open rates and interactions
- **Optimal timing**: Data-driven scheduling improvements
- **A/B testing**: Content and timing experimentation

## 📝 Testing Guide

### Manual Testing
1. **Install app** and complete registration
2. **Enable notifications** in settings
3. **Configure timing** for stats notifications
4. **Test notifications** using built-in test buttons
5. **Close app completely** and wait for reminders
6. **Verify stats** notifications at scheduled times

### Server Testing
```bash
# Manual reminder trigger (admin only)
curl -X POST http://localhost:3000/api/notification/reminder/manual \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Test notification
curl -X POST http://localhost:3000/api/notification/test \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type": "reminder"}'
```

This comprehensive notification system provides users with intelligent, customizable alerts while respecting their preferences and privacy, enhancing engagement with the UniTree application through timely, relevant notifications. 