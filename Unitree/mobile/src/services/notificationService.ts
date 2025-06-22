import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from './ApiService';
import { formatTime } from '../utils/formatters';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface NotificationSettings {
  pushNotificationsEnabled: boolean;
  appReminderNotifications: boolean;
  statsNotifications: boolean;
  dailyStatsTime: string; // Format: "HH:mm"
  weeklyStatsDay: number; // 0-6 (Sunday to Saturday)
  monthlyStatsDay: number; // 1-31
  // Extended settings for specific notification types
  pointsUpdates: boolean;
  treePlanting: boolean;
  wifiConnection: boolean;
  achievements: boolean;
}

export interface StatsData {
  dailyTime: number;
  weeklyTime: number;
  monthlyTime: number;
  dailyPoints: number;
  weeklyPoints: number;
  monthlyPoints: number;
}

class NotificationService {
  private static instance: NotificationService;
  private expoPushToken: string | null = null;
  private isInitialized: boolean = false;

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Initialize notification service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Request permissions
      const permission = await this.requestPermissions();
      if (!permission.granted) {
        console.warn('⚠️ Notification permissions not granted');
        return;
      }

      // Get push token
      await this.registerForPushNotifications();

      // Set up notification listeners
      this.setupNotificationListeners();

      this.isInitialized = true;
      console.log('✅ Notification service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize notification service:', error);
    }
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<Notifications.NotificationPermissionsStatus> {
    let finalStatus: Notifications.NotificationPermissionsStatus;

    // Check existing permissions
    const existingStatus = await Notifications.getPermissionsAsync();
    finalStatus = existingStatus;

    // If not granted, request permissions
    if (existingStatus.status !== 'granted') {
      const newStatus = await Notifications.requestPermissionsAsync();
      finalStatus = newStatus;
    }

    return finalStatus;
  }

  /**
   * Register for push notifications and get Expo push token
   */
  async registerForPushNotifications(): Promise<string | null> {
    if (!Device.isDevice) {
      console.warn('⚠️ Push notifications only work on physical devices');
      return null;
    }

    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'b53a2dd3-f93c-4eb5-aa1e-3620e8834198', // From app.json
      });

      this.expoPushToken = token.data;
      console.log('📱 Expo push token:', this.expoPushToken);

      // Save token to server
      await this.savePushTokenToServer(this.expoPushToken);

      return this.expoPushToken;
    } catch (error) {
      console.error('❌ Failed to get push token:', error);
      
      // If Firebase isn't configured, still allow the app to function
      if (error.message?.includes('FirebaseApp is not initialized')) {
        console.warn('⚠️ Firebase not configured - push notifications disabled for now');
        console.warn('⚠️ See: https://docs.expo.dev/push-notifications/fcm-credentials/');
      }
      
      return null;
    }
  }

  /**
   * Save push token to server
   */
  private async savePushTokenToServer(token: string): Promise<void> {
    try {
      await ApiService.post('/api/user/push-token', { pushToken: token });
      console.log('✅ Push token saved to server');
    } catch (error) {
      console.error('❌ Failed to save push token to server:', error);
    }
  }

  /**
   * Setup notification listeners
   */
  private setupNotificationListeners(): void {
    // Handle notifications when app is in foreground
    Notifications.addNotificationReceivedListener(notification => {
      console.log('📨 Notification received:', notification);
    });

    // Handle notification responses (when user taps notification)
    Notifications.addNotificationResponseReceivedListener(response => {
      console.log('📱 Notification response:', response);
      this.handleNotificationResponse(response);
    });
  }

  /**
   * Handle notification tap responses
   */
  private handleNotificationResponse(response: Notifications.NotificationResponse): void {
    const data = response.notification.request.content.data;
    
    // Handle different notification types
    switch (data?.type) {
      case 'app_reminder':
        // Navigate to home screen or specific tab
        console.log('🏠 Opening app from reminder notification');
        break;
      case 'stats_daily':
      case 'stats_weekly':
      case 'stats_monthly':
        // Navigate to points/stats screen
        console.log('📊 Opening stats from notification');
        break;
      default:
        console.log('📱 Opening app from notification');
    }
  }

  /**
   * Get notification settings from storage
   */
  async getNotificationSettings(): Promise<NotificationSettings> {
    try {
      const settings = await AsyncStorage.getItem('notificationSettings');
      if (settings) {
        return JSON.parse(settings);
      }
    } catch (error) {
      console.error('Failed to get notification settings:', error);
    }

    // Default settings
    return {
      pushNotificationsEnabled: true,
      appReminderNotifications: true,
      statsNotifications: true,
      dailyStatsTime: "20:00", // 8 PM
      weeklyStatsDay: 0, // Sunday
      monthlyStatsDay: 1, // 1st of month
      // Extended settings - enabled by default
      pointsUpdates: true,
      treePlanting: true,
      wifiConnection: true,
      achievements: true,
    };
  }

  /**
   * Save notification settings
   */
  async saveNotificationSettings(settings: NotificationSettings): Promise<void> {
    try {
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(settings));
      
      // Update scheduled notifications
      await this.scheduleStatsNotifications(settings);
      
      // Update server with push notification preference
      await this.updatePushNotificationPreference(settings.pushNotificationsEnabled);
      
      console.log('✅ Notification settings saved');
    } catch (error) {
      console.error('❌ Failed to save notification settings:', error);
    }
  }

  /**
   * Update push notification preference on server
   */
  private async updatePushNotificationPreference(enabled: boolean): Promise<void> {
    try {
      await ApiService.post('/api/user/notification-preference', { 
        pushNotificationsEnabled: enabled 
      });
    } catch (error) {
      console.error('❌ Failed to update push notification preference:', error);
    }
  }

  /**
   * Schedule local stats notifications
   */
  async scheduleStatsNotifications(settings: NotificationSettings): Promise<void> {
    if (!settings.statsNotifications) {
      await this.cancelAllStatsNotifications();
      return;
    }

    try {
      // Cancel existing stats notifications
      await this.cancelAllStatsNotifications();

      // Schedule daily stats notification
      await this.scheduleDailyStatsNotification(settings.dailyStatsTime);

      // Schedule weekly stats notification
      await this.scheduleWeeklyStatsNotification(settings.weeklyStatsDay, settings.dailyStatsTime);

      // Schedule monthly stats notification
      await this.scheduleMonthlyStatsNotification(settings.monthlyStatsDay, settings.dailyStatsTime);

      console.log('✅ Stats notifications scheduled');
    } catch (error) {
      console.error('❌ Failed to schedule stats notifications:', error);
    }
  }

  /**
   * Schedule daily stats notification
   */
  private async scheduleDailyStatsNotification(time: string): Promise<void> {
    const [hours, minutes] = time.split(':').map(Number);
    
    await Notifications.scheduleNotificationAsync({
      identifier: 'daily_stats',
      content: {
        title: '📊 Daily UniTree Stats',
        body: 'Check out your WiFi time and points earned today!',
        data: { type: 'stats_daily' },
      },
      trigger: {
        hour: hours,
        minute: minutes,
        repeats: true,
      },
    });
  }

  /**
   * Schedule weekly stats notification
   */
  private async scheduleWeeklyStatsNotification(weekday: number, time: string): Promise<void> {
    const [hours, minutes] = time.split(':').map(Number);
    
    await Notifications.scheduleNotificationAsync({
      identifier: 'weekly_stats',
      content: {
        title: '🌟 Weekly UniTree Progress',
        body: 'Your weekly WiFi stats are ready!',
        data: { type: 'stats_weekly' },
      },
      trigger: {
        weekday: weekday + 1, // Expo uses 1-7 (Sunday = 1)
        hour: hours,
        minute: minutes,
        repeats: true,
      },
    });
  }

  /**
   * Schedule monthly stats notification
   */
  private async scheduleMonthlyStatsNotification(day: number, time: string): Promise<void> {
    const [hours, minutes] = time.split(':').map(Number);
    
    await Notifications.scheduleNotificationAsync({
      identifier: 'monthly_stats',
      content: {
        title: '🏆 Monthly UniTree Achievements',
        body: 'See how much you\'ve grown this month!',
        data: { type: 'stats_monthly' },
      },
      trigger: {
        day: day,
        hour: hours,
        minute: minutes,
        repeats: true,
      },
    });
  }

  /**
   * Send immediate stats notification with current data
   */
  async sendStatsNotification(type: 'daily' | 'weekly' | 'monthly', stats: StatsData): Promise<void> {
    let title: string;
    let body: string;
    let timeConnected: number;
    let points: number;

    switch (type) {
      case 'daily':
        title = '📊 Today\'s UniTree Stats';
        timeConnected = stats.dailyTime;
        points = stats.dailyPoints;
        break;
      case 'weekly':
        title = '🌟 This Week\'s Progress';
        timeConnected = stats.weeklyTime;
        points = stats.weeklyPoints;
        break;
      case 'monthly':
        title = '🏆 Monthly Achievements';
        timeConnected = stats.monthlyTime;
        points = stats.monthlyPoints;
        break;
    }

    body = `${formatTime(timeConnected)} connected • ${points} points earned`;

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { type: `stats_${type}` },
      },
      trigger: null, // Send immediately
    });
  }

  /**
   * Cancel all stats notifications
   */
  private async cancelAllStatsNotifications(): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync('daily_stats');
    await Notifications.cancelScheduledNotificationAsync('weekly_stats');
    await Notifications.cancelScheduledNotificationAsync('monthly_stats');
  }

  /**
   * Get all scheduled notifications (for debugging)
   */
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    return await Notifications.getAllScheduledNotificationsAsync();
  }

  /**
   * Get push token
   */
  getPushToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications(): Promise<void> {
    await Notifications.dismissAllNotificationsAsync();
  }

  /**
   * Check if notifications are enabled
   */
  async areNotificationsEnabled(): Promise<boolean> {
    const settings = await Notifications.getPermissionsAsync();
    return settings.granted;
  }
}

export default NotificationService.getInstance(); 