const cron = require('cron');
const notificationService = require('./notificationService');
const notificationServiceV1 = require('./notificationServiceV1');
const logger = require('../utils/logger');
const WifiSession = require('../models/WifiSession');
const User = require('../models/User');
const Point = require('../models/Point');

class CronService {
  constructor() {
    this.jobs = new Map();
  }

  /**
   * Initialize all cron jobs
   */
  initialize() {
    try {
      // Schedule reminder notifications every 2 hours during business hours (7 AM - 6 PM)
      this.scheduleReminderNotifications();
      // Schedule daily water reminder at 8:00 AM
      this.scheduleDailyWaterReminder();
      // Schedule daily points summary at 21:00
      this.scheduleDailyPointsSummary();
      // Schedule test notification for specific token at 8:50 AM
      this.scheduleTestNotificationForToken();
      // Schedule WiFi session timeout cleanup
      this.scheduleWifiSessionTimeoutCleanup();
      logger.info('✅ Cron service initialized successfully');
    } catch (error) {
      logger.error('❌ Failed to initialize cron service:', error);
    }
  }

  /**
   * Schedule reminder notifications
   * Runs every 2 hours between 7 AM - 6 PM (Hanoi time - GMT+7)
   */
  scheduleReminderNotifications() {
    // Cron pattern: Every 2 hours from 7 AM to 6 PM
    // 0 7,9,11,13,15,17 * * * - at 7AM, 9AM, 11AM, 1PM, 3PM, 5PM (Hanoi time)
    const cronPattern = '0 7,9,11,13,15,17 * * *';
    
    const reminderJob = new cron.CronJob(
      cronPattern,
      async () => {
        try {
          logger.info('🔔 Starting scheduled reminder notifications (V1 API)...');
          const result = await notificationServiceV1.sendAppReminderNotifications();
          
          if (result.success) {
            logger.info(`✅ Scheduled reminders completed: ${result.sent} notifications sent`);
          } else {
            logger.warn(`⚠️ Scheduled reminders completed with issues: ${result.error}`);
          }
        } catch (error) {
          logger.error('❌ Error in scheduled reminder notifications:', error);
        }
      },
      null, // onComplete callback
      false, // start immediately
      'Asia/Ho_Chi_Minh' // Hanoi, Vietnam timezone (GMT+7)
    );

    // Start the job
    reminderJob.start();
    this.jobs.set('reminderNotifications', reminderJob);
    
    logger.info('📅 Reminder notification cron job scheduled: Every 2 hours from 7 AM to 6 PM (Hanoi time - GMT+7)');
  }

  /**
   * Schedule WiFi session timeout cleanup (runs every 10 minutes)
   */
  scheduleWifiSessionTimeoutCleanup() {
    const cleanupPattern = '*/10 * * * *'; // Every 10 minutes
    const TIMEOUT_SECONDS = 2 * 60 * 60; // 2 hours

    const cleanupJob = new cron.CronJob(
      cleanupPattern,
      async () => {
        try {
          logger.info('🕒 Running WiFi session timeout cleanup...');
          const now = new Date();
          const cutoff = new Date(now.getTime() - TIMEOUT_SECONDS * 1000);
          // Find all sessions still active and started before cutoff
          const orphanedSessions = await WifiSession.find({
            isActive: true,
            startTime: { $lt: cutoff }
          });
          let cleanedCount = 0;
          for (const session of orphanedSessions) {
            const endTime = now;
            session.endTime = endTime;
            session.isActive = false;
            const durationSeconds = Math.floor((endTime - session.startTime) / 1000);
            session.duration = durationSeconds;
            // Calculate points for the session
            const minSessionDuration = parseInt(process.env.MIN_SESSION_DURATION || '300', 10);
            if (durationSeconds >= minSessionDuration) {
              const pointsEarned = Math.floor(durationSeconds / 60);
              // Check for existing transaction to prevent double point
              const existingTransaction = await Point.findOne({
                userId: session.user,
                type: 'WIFI_SESSION',
                'metadata.startTime': session.startTime,
                'metadata.endTime': endTime
              });
              if (!existingTransaction) {
                await User.findByIdAndUpdate(
                  session.user,
                  {
                    $inc: {
                      points: pointsEarned,
                      allTimePoints: pointsEarned,
                      dayTimeConnected: durationSeconds,
                      weekTimeConnected: durationSeconds,
                      monthTimeConnected: durationSeconds,
                      totalTimeConnected: durationSeconds
                    }
                  }
                );
                const pointTransaction = new Point({
                  userId: session.user,
                  amount: pointsEarned,
                  type: 'WIFI_SESSION',
                  metadata: {
                    startTime: session.startTime,
                    endTime: endTime,
                    duration: durationSeconds,
                    description: `WiFi session on ${session.ipAddress} (timeout cleanup)`
                  }
                });
                await pointTransaction.save();
                session.pointsEarned = pointsEarned;
              } else {
                logger.info(`Timeout cleanup: Transaction already exists for user ${session.user}, session ${session._id}`);
              }
            }
            await session.save();
            cleanedCount++;
          }
          logger.info(`🕒 WiFi session timeout cleanup done. Cleaned: ${cleanedCount}`);
        } catch (error) {
          logger.error('❌ Error in WiFi session timeout cleanup:', error);
        }
      },
      null,
      false,
      'Asia/Ho_Chi_Minh'
    );
    cleanupJob.start();
    this.jobs.set('wifiSessionTimeoutCleanup', cleanupJob);
    logger.info('🕒 WiFi session timeout cleanup cron job scheduled: Every 10 minutes (sessions >2h)');
  }

  /**
   * Schedule test job (runs every 30 minutes) - for development/testing
   */
  scheduleTestJob() {
    const testPattern = '*/30 * * * *'; // Every 30 minutes
    
    const testJob = new cron.CronJob(
      testPattern,
      async () => {
        try {
          logger.info('🧪 Running test cron job...');
          // Test functionality here
          logger.info('✅ Test cron job completed');
        } catch (error) {
          logger.error('❌ Error in test cron job:', error);
        }
      },
      null,
      false,
      'Asia/Ho_Chi_Minh' // Hanoi, Vietnam timezone (GMT+7)
    );

    testJob.start();
    this.jobs.set('testJob', testJob);
    
    logger.info('🧪 Test cron job scheduled: Every 30 minutes (Hanoi time - GMT+7)');
  }

  /**
   * Schedule daily cleanup job (runs at midnight Hanoi time)
   */
  scheduleDailyCleanup() {
    const cleanupPattern = '0 0 * * *'; // Every day at midnight
    
    const cleanupJob = new cron.CronJob(
      cleanupPattern,
      async () => {
        try {
          logger.info('🧹 Starting daily cleanup job...');
          
          // Add any daily cleanup tasks here
          // For example: clean up old notification logs, expired tokens, etc.
          
          logger.info('✅ Daily cleanup job completed');
        } catch (error) {
          logger.error('❌ Error in daily cleanup job:', error);
        }
      },
      null,
      false,
      'Asia/Ho_Chi_Minh' // Hanoi, Vietnam timezone (GMT+7)
    );

    cleanupJob.start();
    this.jobs.set('dailyCleanup', cleanupJob);
    
    logger.info('🧹 Daily cleanup cron job scheduled: Every day at midnight (Hanoi time - GMT+7)');
  }

  /**
   * Schedule daily water reminder notification at 8:00 AM Hanoi time
   */
  scheduleDailyWaterReminder() {
    // 0 8 * * * - at 8:00 AM every day
    const cronPattern = '0 8 * * *';
    const waterJob = new cron.CronJob(
      cronPattern,
      async () => {
        try {
          logger.info('💧 Starting daily water reminder notifications...');
          const result = await notificationServiceV1.sendDailyWaterReminderNotifications();
          if (result.success) {
            logger.info(`✅ Water reminders sent: ${result.sent} users`);
          } else {
            logger.warn(`⚠️ Water reminders completed with issues: ${result.error}`);
          }
        } catch (error) {
          logger.error('❌ Error in daily water reminder notifications:', error);
        }
      },
      null,
      false,
      'Asia/Ho_Chi_Minh'
    );
    waterJob.start();
    this.jobs.set('dailyWaterReminder', waterJob);
    logger.info('💧 Daily water reminder cron job scheduled: 8:00 AM (Hanoi time - GMT+7)');
  }

  /**
   * Schedule daily points summary notification at 21:00 Hanoi time
   */
  scheduleDailyPointsSummary() {
    // 0 21 * * * - at 21:00 (9 PM) every day
    const cronPattern = '0 21 * * *';
    const pointsJob = new cron.CronJob(
      cronPattern,
      async () => {
        try {
          logger.info('📊 Starting daily points summary notifications...');
          const result = await notificationServiceV1.sendDailyPointsSummaryNotifications();
          if (result.success) {
            logger.info(`✅ Daily points summary sent: ${result.sent} users`);
          } else {
            logger.warn(`⚠️ Daily points summary completed with issues: ${result.error}`);
          }
        } catch (error) {
          logger.error('❌ Error in daily points summary notifications:', error);
        }
      },
      null,
      false,
      'Asia/Ho_Chi_Minh'
    );
    pointsJob.start();
    this.jobs.set('dailyPointsSummary', pointsJob);
    logger.info('📊 Daily points summary cron job scheduled: 21:00 (Hanoi time - GMT+7)');
  }

  /**
   * Schedule test notification at 20:50 (8:50 PM) Hanoi time for a specific token
   */
  scheduleTestNotificationForToken() {
    // 50 20 * * * - at 20:50 (8:50 PM) every day
    const cronPattern = '50 20 * * *';
    const testJob = new cron.CronJob(
      cronPattern,
      async () => {
        try {
          logger.info('🧪 Sending test notification to specific token...');
          const result = await notificationServiceV1.sendTestNotificationToToken('ExponentPushToken[7xc-2JORajto57ccB6w_eS]');
          if (result.success) {
            logger.info('✅ Test notification sent successfully');
          } else {
            logger.warn(`⚠️ Test notification failed: ${result.error}`);
          }
        } catch (error) {
          logger.error('❌ Error in test notification cron job:', error);
        }
      },
      null,
      false,
      'Asia/Ho_Chi_Minh'
    );
    testJob.start();
    this.jobs.set('testNotificationForToken', testJob);
    logger.info('🧪 Test notification cron job scheduled: 20:50 (Hanoi time - GMT+7)');
  }

  /**
   * Stop a specific cron job
   */
  stopJob(jobName) {
    const job = this.jobs.get(jobName);
    if (job) {
      job.stop();
      this.jobs.delete(jobName);
      logger.info(`⏹️ Stopped cron job: ${jobName}`);
      return true;
    }
    logger.warn(`⚠️ Cron job not found: ${jobName}`);
    return false;
  }

  /**
   * Stop all cron jobs
   */
  stopAllJobs() {
    for (const [jobName, job] of this.jobs) {
      job.stop();
      logger.info(`⏹️ Stopped cron job: ${jobName}`);
    }
    this.jobs.clear();
    logger.info('⏹️ All cron jobs stopped');
  }

  /**
   * Get status of all jobs
   */
  getJobsStatus() {
    const status = {};
    for (const [jobName, job] of this.jobs) {
      status[jobName] = {
        running: job.running,
        lastDate: job.lastDate(),
        nextDate: job.nextDate()
      };
    }
    return status;
  }

  /**
   * Manually trigger reminder notifications (for testing)
   */
  async triggerReminderNotifications() {
    try {
      logger.info('🔔 Manually triggering reminder notifications (V1 API)...');
      const result = await notificationServiceV1.sendAppReminderNotifications();
      logger.info('✅ Manual reminder trigger completed:', result);
      return result;
    } catch (error) {
      logger.error('❌ Error in manual reminder trigger:', error);
      throw error;
    }
  }
}

module.exports = new CronService(); 