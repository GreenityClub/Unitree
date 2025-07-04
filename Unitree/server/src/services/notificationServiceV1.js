const admin = require('firebase-admin');
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
   * Send a single push notification using FCM V1 API
   */
  async sendPushNotification(expoPushToken, title, body, data = {}) {
    try {
      if (admin.apps.length === 0) {
        logger.warn('⚠️ Firebase not initialized - cannot send push notification');
        return { success: false, error: 'Firebase not initialized' };
      }

      // Validate push token format
      if (!expoPushToken || !expoPushToken.startsWith('ExponentPushToken[')) {
        logger.warn(`Invalid push token format: ${expoPushToken}`);
        return { success: false, error: 'Invalid push token format' };
      }

      // Extract FCM token from Expo push token
      // ExponentPushToken[fcmTokenHere] -> fcmTokenHere
      const fcmToken = expoPushToken.replace('ExponentPushToken[', '').replace(']', '');

      const message = {
        notification: {
          title,
          body
        },
        data: {
          ...data,
          // Convert all data values to strings (FCM requirement)
          type: data.type || 'default'
        },
        android: {
          notification: {
            sound: 'default',
            priority: 'high',
            channelId: 'default'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1
            }
          }
        },
        token: fcmToken
      };

      const response = await admin.messaging().send(message);
      logger.info(`✅ Push notification sent successfully: ${response}`);
      
      return { success: true, messageId: response };
    } catch (error) {
      logger.error('❌ Failed to send push notification:', error);
      
      // Handle specific FCM errors
      if (error.code === 'messaging/registration-token-not-registered') {
        logger.warn('📱 Push token is no longer valid, should remove from database');
        return { success: false, error: 'Invalid token', shouldRemoveToken: true };
      }
      
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
   * Schedule daily reminder notifications (called by cron job)
   */
  async scheduleDailyReminders() {
    logger.info('Running scheduled daily reminder notifications (V1 API)');
    return await this.sendAppReminderNotifications();
  }
}

module.exports = new NotificationServiceV1(); 