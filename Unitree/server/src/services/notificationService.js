const { Expo } = require('expo-server-sdk');
const User = require('../models/User');
const logger = require('../utils/logger');
const { env } = require('../config/env');

class NotificationService {
  constructor() {
    // Initialize Expo client with access token if available
    const options = {};
    if (env.EXPO_ACCESS_TOKEN) {
      options.accessToken = env.EXPO_ACCESS_TOKEN;
      logger.info('🔑 Expo client initialized with access token for production');
    } else {
      logger.warn('⚠️ No Expo access token provided - using default configuration');
    }
    
    this.expo = new Expo(options);
    
    // Log FCM configuration status
    if (env.FCM_SERVER_KEY) {
      logger.info('🔥 FCM Server Key configured for push notifications');
    } else {
      logger.warn('⚠️ No FCM Server Key provided - some push notification features may be limited');
    }
  }

  /**
   * Get current time in Hanoi timezone (GMT+7)
   */
  getCurrentHanoiTime() {
    const now = new Date();
    // Convert to Hanoi time (GMT+7)
    const hanoiTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Ho_Chi_Minh"}));
    return hanoiTime;
  }

  /**
   * Get current hour in Hanoi timezone
   */
  getCurrentHanoiHour() {
    return this.getCurrentHanoiTime().getHours();
  }

  /**
   * Send a single push notification
   */
  async sendPushNotification(expoPushToken, title, body, data = {}) {
    try {
      // Check if the push token is valid
      if (!Expo.isExpoPushToken(expoPushToken)) {
        logger.warn(`Invalid push token: ${expoPushToken}`);
        return { success: false, error: 'Invalid push token' };
      }

      const message = {
        to: expoPushToken,
        sound: 'default',
        title,
        body,
        data,
        priority: 'high',
        channelId: 'default',
      };

      const ticket = await this.expo.sendPushNotificationsAsync([message]);
      logger.info(`Push notification sent: ${JSON.stringify(ticket)}`);
      
      return { success: true, ticket: ticket[0] };
    } catch (error) {
      logger.error('Failed to send push notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send app reminder notification to inactive users
   */
  async sendAppReminderNotifications() {
    try {
      const currentHour = this.getCurrentHanoiHour();
      const hanoiTime = this.getCurrentHanoiTime();
      
      logger.info(`Checking reminder notifications - Current Hanoi time: ${hanoiTime.toLocaleString('vi-VN', {timeZone: 'Asia/Ho_Chi_Minh'})} (Hour: ${currentHour})`);
      
      // Only send between 7 AM - 6 PM (Hanoi time)
      if (currentHour < 7 || currentHour >= 18) {
        logger.info(`Outside app reminder hours (7 AM - 6 PM Hanoi time), skipping notifications. Current hour: ${currentHour}`);
        return { success: false, error: 'Outside notification hours' };
      }

      // Find users who haven't been active for more than 2 hours and have push notifications enabled
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      
      const inactiveUsers = await User.find({
        pushToken: { $exists: true, $ne: null },
        'notificationSettings.pushNotificationsEnabled': true,
        'notificationSettings.appReminderNotifications': true,
        $or: [
          { lastActive: { $lt: twoHoursAgo } },
          { lastActive: { $exists: false } }
        ]
      }).select('pushToken username');

      if (inactiveUsers.length === 0) {
        logger.info('No inactive users found for app reminder notifications');
        return { success: true, sent: 0 };
      }

      const notifications = inactiveUsers.map(user => ({
        expoPushToken: user.pushToken,
        title: '🌱 UniTree Reminder',
        body: 'Don\'t forget to connect to university WiFi to grow your tree!',
        data: { type: 'app_reminder' }
      }));

      let successCount = 0;
      for (const notif of notifications) {
        const result = await this.sendPushNotification(
          notif.expoPushToken, 
          notif.title, 
          notif.body, 
          notif.data
        );
        if (result.success) successCount++;
      }

      // Update lastReminderSent timestamp for these users
      await User.updateMany(
        { _id: { $in: inactiveUsers.map(u => u._id) } },
        { lastReminderSent: new Date() }
      );
      
      logger.info(`App reminder notifications sent to ${successCount}/${inactiveUsers.length} users (Hanoi time: ${hanoiTime.toLocaleString('vi-VN', {timeZone: 'Asia/Ho_Chi_Minh'})})`);
      return { success: true, sent: successCount };
      
    } catch (error) {
      logger.error('Failed to send app reminder notifications:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Test push notification
   */
  async sendTestNotification(expoPushToken, type = 'test') {
    const messages = {
      test: {
        title: '🧪 Test Notification',
        body: 'This is a test notification from UniTree!',
        data: { type: 'test' }
      },
      reminder: {
        title: '🌱 UniTree Reminder',
        body: 'Don\'t forget to connect to university WiFi!',
        data: { type: 'app_reminder' }
      }
    };

    const message = messages[type] || messages.test;
    return await this.sendPushNotification(expoPushToken, message.title, message.body, message.data);
  }

  /**
   * Schedule daily reminder notifications (called by cron job)
   */
  async scheduleDailyReminders() {
    logger.info('Running scheduled daily reminder notifications');
    return await this.sendAppReminderNotifications();
  }
}

module.exports = new NotificationService(); 