const cron = require('cron');
const notificationService = require('./notificationService');
const logger = require('../utils/logger');

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

      logger.info('✅ Cron service initialized successfully');
    } catch (error) {
      logger.error('❌ Failed to initialize cron service:', error);
    }
  }

  /**
   * Schedule reminder notifications
   * Runs every 2 hours between 7 AM - 6 PM (server time)
   */
  scheduleReminderNotifications() {
    // Cron pattern: Every 2 hours from 7 AM to 6 PM
    // 0 7,9,11,13,15,17 * * * - at 7AM, 9AM, 11AM, 1PM, 3PM, 5PM
    const cronPattern = '0 7,9,11,13,15,17 * * *';
    
    const reminderJob = new cron.CronJob(
      cronPattern,
      async () => {
        try {
          logger.info('🔔 Starting scheduled reminder notifications...');
          const result = await notificationService.sendAppReminderNotifications();
          
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
      'America/New_York' // timezone (adjust based on your server location)
    );

    // Start the job
    reminderJob.start();
    this.jobs.set('reminderNotifications', reminderJob);
    
    logger.info('📅 Reminder notification cron job scheduled: Every 2 hours from 7 AM to 6 PM');
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
      'America/New_York'
    );

    testJob.start();
    this.jobs.set('testJob', testJob);
    
    logger.info('🧪 Test cron job scheduled: Every 30 minutes');
  }

  /**
   * Schedule daily cleanup job (runs at midnight)
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
      'America/New_York'
    );

    cleanupJob.start();
    this.jobs.set('dailyCleanup', cleanupJob);
    
    logger.info('🧹 Daily cleanup cron job scheduled: Every day at midnight');
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
      logger.info('🔔 Manually triggering reminder notifications...');
      const result = await notificationService.sendAppReminderNotifications();
      logger.info('✅ Manual reminder trigger completed:', result);
      return result;
    } catch (error) {
      logger.error('❌ Error in manual reminder trigger:', error);
      throw error;
    }
  }
}

module.exports = new CronService(); 