const { Expo } = require('expo-server-sdk');
const User = require('../models/User');
const logger = require('../utils/logger');
const { env } = require('../config/env');

// =================================================================
// ==                  NOTIFICATION SERVICE                     ==
// =================================================================

class NotificationService {
  constructor() {
    this.expo = new Expo({ accessToken: env.EXPO_ACCESS_TOKEN });
    if (env.EXPO_ACCESS_TOKEN) {
      logger.info('Expo client initialized with Access Token.');
    } else {
      logger.warn('EXPO_ACCESS_TOKEN not set. Push notifications will likely fail.');
    }
    this.timeZone = env.TIMEZONE || 'Asia/Ho_Chi_Minh';
  }

  /**
   * Sends one or more push notifications using Expo.
   * @param {Array<Object>} messages - An array of Expo message objects.
   * @returns {Promise<{success: boolean, tickets?: Array, error?: string}>}
   */
  async sendNotifications(messages) {
    if (!messages || messages.length === 0) {
      return { success: true, tickets: [] };
    }
    
    // Filter out invalid tokens before sending
    const validMessages = messages.filter(msg => Expo.isExpoPushToken(msg.to));
    const invalidTokens = messages.filter(msg => !Expo.isExpoPushToken(msg.to)).map(msg => msg.to);
    
    if (invalidTokens.length > 0) {
      logger.warn(`Attempted to send notifications to invalid tokens: ${invalidTokens.join(', ')}`);
    }

    if (validMessages.length === 0) {
        return { success: true, tickets: [] };
    }

    try {
      const chunks = this.expo.chunkPushNotifications(validMessages);
      const tickets = [];
      for (const chunk of chunks) {
        const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
        logger.info('Push notification chunk sent.', { tickets: ticketChunk });
      }
      return { success: true, tickets };
    } catch (error) {
      logger.error('Failed to send push notification chunk:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sends a single push notification. A convenience wrapper for sendNotifications.
   * @param {string} expoPushToken - The recipient's Expo push token.
   * @param {string} title - The title of the notification.
   * @param {string} body - The body of the notification.
   * @param {Object} [data={}] - Additional data to send with the notification.
   */
  async sendSingleNotification(expoPushToken, title, body, data = {}) {
    const message = {
      to: expoPushToken,
      sound: 'default',
      title,
      body,
      data,
    };
    return this.sendNotifications([message]);
  }
  
  /**
   * Sends reminder notifications to users who have been inactive.
   * This is intended to be called by a cron job.
   */
  async sendInactiveUserReminders() {
    try {
      const now = new Date();
      const hanoiHour = new Date(now.toLocaleString("en-US", { timeZone: this.timeZone })).getHours();

      // Only send reminders during reasonable hours (e.g., 8 AM - 10 PM)
      if (hanoiHour < 8 || hanoiHour >= 22) {
        logger.info(`Skipping inactive user reminders outside of active hours (current hour: ${hanoiHour} in ${this.timeZone}).`);
        return;
      }

      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      
      const inactiveUsers = await User.find({
        pushToken: { $ne: null },
        'notificationSettings.pushNotificationsEnabled': true,
        'notificationSettings.appReminderNotifications': true,
        lastActive: { $lt: twoHoursAgo }
      }).select('pushToken');

      if (inactiveUsers.length === 0) {
        logger.info('No inactive users to remind at this time.');
        return;
      }

      const messages = inactiveUsers.map(user => ({
        to: user.pushToken,
        sound: 'default',
        title: 'Your UniTree is waiting!',
        body: 'Don\'t forget to connect to university WiFi to help your tree grow.',
        data: { type: 'app_reminder' }
      }));

      await this.sendNotifications(messages);
      logger.info(`Sent ${messages.length} inactivity reminder notifications.`);

    } catch (error) {
      logger.error('Failed to send inactive user reminder notifications:', error);
    }
  }
}

module.exports = new NotificationService(); 