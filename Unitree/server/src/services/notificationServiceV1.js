const { Expo } = require('expo-server-sdk');
const User = require('../models/User');
const logger = require('../utils/logger');
const { env } = require('../config/env');

class NotificationServiceV1 {
  constructor() {
    this.initializeFirebase();
  }

  /**
   * Initialize Firebase Admin SDK
   */
  initializeFirebase() {
    try {
      // Check if Firebase is already initialized
      if (admin.apps.length === 0) {
        let serviceAccount;
        
        if (env.FIREBASE_SERVICE_ACCOUNT_KEY) {
          // Service account from environment variable (JSON string)
          serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_KEY);
          logger.info('🔑 Using service account from environment variable');
        } else if (env.FIREBASE_SERVICE_ACCOUNT_PATH) {
          // Service account from file path
          serviceAccount = require(env.FIREBASE_SERVICE_ACCOUNT_PATH);
          logger.info('🔑 Using service account from file path');
        } else {
          logger.warn('⚠️ No Firebase service account configured - push notifications disabled');
          return;
        }

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: serviceAccount.project_id
        });

        logger.info('🔥 Firebase Admin SDK initialized successfully');
      }
    } catch (error) {
      logger.error('❌ Failed to initialize Firebase Admin SDK:', error);
    }
  }

  /**
   * Get current time in Hanoi timezone (GMT+7)
   */
  getCurrentHanoiTime() {
    const now = new Date();
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
   * Send a single push notification using Expo Server SDK
   */
  async sendPushNotification(expoPushToken, title, body, data = {}) {
    try {
      if (!Expo.isExpoPushToken(expoPushToken)) {
        logger.warn(`Invalid Expo push token: ${expoPushToken}`);
        return { success: false, error: 'Invalid Expo push token', shouldRemoveToken: true };
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
      const ticketChunk = await expo.sendPushNotificationsAsync([message]);
      logger.info(`✅ Push notification sent: ${JSON.stringify(ticketChunk)}`);
      return { success: true, ticket: ticketChunk[0] };
    } catch (error) {
      logger.error('❌ Failed to send push notification:', error);
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
      // Only send between 7 AM - 5 PM (Hanoi time)
      if (currentHour < 7 || currentHour > 17) {
        logger.info(`Outside app reminder hours (7 AM - 5 PM Hanoi time), skipping notifications. Current hour: ${currentHour}`);
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
      let successCount = 0;
      let tokensToRemove = [];
      for (const user of inactiveUsers) {
        const result = await this.sendPushNotification(
          user.pushToken,
          '🌱 UniTree Reminder',
          'Don\'t forget to connect to university WiFi to grow your tree!',
          { type: 'app_reminder' }
        );
        if (result.success) {
          successCount++;
        } else if (result.shouldRemoveToken) {
          tokensToRemove.push(user._id);
        }
      }
      // Remove invalid tokens
      if (tokensToRemove.length > 0) {
        await User.updateMany(
          { _id: { $in: tokensToRemove } },
          { $unset: { pushToken: 1 } }
        );
        logger.info(`🧹 Removed ${tokensToRemove.length} invalid push tokens`);
      }
      // Update lastReminderSent timestamp for users with valid tokens
      await User.updateMany(
        { 
          _id: { $in: inactiveUsers.map(u => u._id) },
          _id: { $nin: tokensToRemove }
        },
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
   * Send daily water reminder notification to all users at 8:00 AM
   */
  async sendDailyWaterReminderNotifications() {
    try {
      // Lấy tất cả user có pushToken hợp lệ và bật notification
      const users = await User.find({
        pushToken: { $exists: true, $ne: null },
        'notificationSettings.pushNotificationsEnabled': true,
        'notificationSettings.appReminderNotifications': true
      }).select('pushToken username');
      if (users.length === 0) {
        logger.info('No users found for daily water reminder');
        return { success: true, sent: 0 };
      }
      let successCount = 0;
      let tokensToRemove = [];
      for (const user of users) {
        const result = await this.sendPushNotification(
          user.pushToken,
          '💧 Đừng quên tưới cây UniTree hôm nay!',
          'Hãy mở app và tưới nước cho cây của bạn để cây luôn khỏe mạnh nhé!',
          { type: 'water_reminder' }
        );
        if (result.success) {
          successCount++;
        } else if (result.shouldRemoveToken) {
          tokensToRemove.push(user._id);
        }
      }
      // Remove invalid tokens
      if (tokensToRemove.length > 0) {
        await User.updateMany(
          { _id: { $in: tokensToRemove } },
          { $unset: { pushToken: 1 } }
        );
        logger.info(`🧹 Removed ${tokensToRemove.length} invalid push tokens (water reminder)`);
      }
      logger.info(`Daily water reminders sent to ${successCount}/${users.length} users`);
      return { success: true, sent: successCount };
    } catch (error) {
      logger.error('Failed to send daily water reminder notifications:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send daily points summary notification to all users at 21:00
   */
  async sendDailyPointsSummaryNotifications() {
    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const users = await User.find({
        pushToken: { $exists: true, $ne: null },
        'notificationSettings.pushNotificationsEnabled': true
      }).select('pushToken username _id');
      if (users.length === 0) {
        logger.info('No users found for daily points summary');
        return { success: true, sent: 0 };
      }
      const Point = require('../models/Point');
      let successCount = 0;
      let tokensToRemove = [];
      for (const user of users) {
        // Tính tổng điểm trong ngày
        const pointsToday = await Point.aggregate([
          { $match: {
              userId: user._id,
              type: 'WIFI_SESSION',
              createdAt: { $gte: startOfDay, $lte: now }
            }
          },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const totalPoints = pointsToday.length > 0 ? pointsToday[0].total : 0;
        const result = await this.sendPushNotification(
          user.pushToken,
          '📊 Tổng kết điểm UniTree hôm nay',
          `Bạn đã kiếm được ${totalPoints} điểm từ WiFi và hoạt động hôm nay. Tiếp tục duy trì nhé!`,
          { type: 'daily_points_summary', points: totalPoints }
        );
        if (result.success) {
          successCount++;
        } else if (result.shouldRemoveToken) {
          tokensToRemove.push(user._id);
        }
      }
      // Remove invalid tokens
      if (tokensToRemove.length > 0) {
        await User.updateMany(
          { _id: { $in: tokensToRemove } },
          { $unset: { pushToken: 1 } }
        );
        logger.info(`🧹 Removed ${tokensToRemove.length} invalid push tokens (points summary)`);
      }
      logger.info(`Daily points summary sent to ${successCount}/${users.length} users`);
      return { success: true, sent: successCount };
    } catch (error) {
      logger.error('Failed to send daily points summary notifications:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Test push notification
   */
  async sendTestNotification(expoPushToken, type = 'test') {
    const messages = {
      test: {
        title: '🧪 Test Notification V1',
        body: 'This is a test notification using FCM V1 API!',
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
   * Send test notification to a specific token
   */
  async sendTestNotificationToToken(token) {
    try {
      const result = await this.sendPushNotification(
        token,
        '🧪 Test Notification',
        'Đây là thông báo test gửi lúc 8:50 sáng!',
        { type: 'test_notification' }
      );
      return result;
    } catch (error) {
      logger.error('Failed to send test notification to token:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Schedule daily reminder notifications (called by cron job)
   */
  async scheduleDailyReminders() {
    logger.info('Running scheduled daily reminder notifications (V1 API)');
    return await this.sendAppReminderNotifications();
  }
}

module.exports = new NotificationServiceV1(); 