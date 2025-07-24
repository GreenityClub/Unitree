const { CronJob } = require('cron');
const notificationService = require('./notificationService');
const logger = require('../utils/logger');
const WifiSession = require('../models/WifiSession');
const User = require('../models/User');
const Point = require('../models/Point');
const { env } = require('../config/env');

// =================================================================
// ==                        CRON SERVICE                       ==
// =================================================================

class CronService {
  constructor() {
    this.jobs = new Map();
    this.timeZone = env.TIMEZONE || 'Asia/Ho_Chi_Minh';
  }

  /**
   * Initializes and starts all scheduled jobs.
   */
  initialize() {
    logger.info('Initializing cron service...');
    this.scheduleInactiveUserReminders();
    this.scheduleWifiSessionCleanup();
    logger.info('Cron service initialized successfully.');
  }

  /**
   * Schedules a job to send reminders to inactive users every 2 hours during the day.
   */
  scheduleInactiveUserReminders() {
    // Runs at the top of the hour, every 2 hours, from 8 AM to 10 PM.
    const job = new CronJob(
      '0 8-22/2 * * *',
      async () => {
        logger.info('Cron job: Sending inactive user reminders...');
        await notificationService.sendInactiveUserReminders();
      },
      null,
      true, // Start immediately
      this.timeZone
    );
    this.jobs.set('inactiveUserReminders', job);
    logger.info(`Scheduled job: Inactive User Reminders (every 2 hours, 8am-10pm ${this.timeZone}).`);
  }

  /**
   * Schedules a job to clean up orphaned/timed-out WiFi sessions every 10 minutes.
   */
  scheduleWifiSessionCleanup() {
    const job = new CronJob(
      '*/10 * * * *', // Every 10 minutes
      async () => {
        logger.info('Cron job: Cleaning up timed-out WiFi sessions...');
        await this.cleanupTimedOutSessions();
      },
      null,
      true, // Start immediately
      this.timeZone
    );
    this.jobs.set('wifiSessionCleanup', job);
    logger.info('Scheduled job: WiFi Session Cleanup (every 10 minutes).');
  }

  /**
   * Logic to find and terminate WiFi sessions that have been active for too long.
   */
  async cleanupTimedOutSessions() {
    const TIMEOUT_HOURS = 2;
    const cutoff = new Date(Date.now() - TIMEOUT_HOURS * 60 * 60 * 1000);
    
    try {
      const orphanedSessions = await WifiSession.find({
        isActive: true,
        startTime: { $lt: cutoff }
      });

      if (orphanedSessions.length === 0) {
        logger.info('No timed-out WiFi sessions found.');
        return;
      }

      logger.info(`Found ${orphanedSessions.length} timed-out WiFi sessions to clean up.`);

      for (const session of orphanedSessions) {
        const durationSeconds = Math.floor((new Date() - session.startTime) / 1000);
        const pointsEarned = Math.floor(durationSeconds / 60);

        session.isActive = false;
        session.endTime = new Date();
        session.duration = durationSeconds;
        session.pointsEarned = pointsEarned > 0 ? pointsEarned : 0;
        
        if (pointsEarned > 0) {
          await User.findByIdAndUpdate(session.user, {
            $inc: {
              points: pointsEarned,
              allTimePoints: pointsEarned,
              totalTimeConnected: durationSeconds,
            }
          });
          await Point.create({
              userId: session.user,
              amount: pointsEarned,
              type: 'WIFI_SESSION',
              metadata: { 
                  description: `Session timed out after ${TIMEOUT_HOURS} hours.`,
                  startTime: session.startTime,
                  endTime: session.endTime
              }
          });
        }
        await session.save();
      }
      logger.info(`Successfully cleaned up ${orphanedSessions.length} timed-out sessions.`);
    } catch (error) {
      logger.error('Error during WiFi session cleanup:', error);
    }
  }

  /**
   * Stops all running cron jobs.
   */
  stopAll() {
    this.jobs.forEach((job, name) => {
      job.stop();
      logger.info(`Stopped cron job: '${name}'`);
    });
  }
}

module.exports = new CronService(); 