const logger = require('./logger');
const { env } = require('../config/env');

// =================================================================
// ==                      MEMORY MONITOR                       ==
// =================================================================

class MemoryMonitor {
  constructor() {
    this.history = [];
    this.maxHistoryLength = 20;
    this.monitoringInterval = null;

    // Configurable thresholds (in MB)
    this.warningThreshold = parseInt(env.MEMORY_WARNING_THRESHOLD, 10) || 350;
    this.criticalThreshold = parseInt(env.MEMORY_CRITICAL_THRESHOLD, 10) || 450;
    
    logger.info(`Memory thresholds set: Warning > ${this.warningThreshold}MB, Critical > ${this.criticalThreshold}MB`);
  }

  /**
   * Starts the memory monitoring process.
   * @param {number} [intervalMinutes=5] - The interval in minutes to log memory usage.
   */
  start(intervalMinutes = 5) {
    if (this.monitoringInterval) {
      logger.warn('Memory monitoring is already running.');
      return;
    }
    logger.info(`Starting memory monitoring every ${intervalMinutes} minutes.`);
    this.logUsage(); // Initial log
    this.monitoringInterval = setInterval(() => this.logUsage(), intervalMinutes * 60 * 1000);
  }

  /**
   * Stops the memory monitoring process.
   */
  stop() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      logger.info('Memory monitoring stopped.');
    }
  }

  /**
   * Retrieves and formats the current memory usage of the process.
   * @returns {Object} - An object containing memory usage statistics in MB.
   */
  getUsage() {
    const usage = process.memoryUsage();
    return {
      rss: Math.round(usage.rss / 1024 / 1024),
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
    };
  }

  /**
   * Logs the current memory usage and checks against thresholds.
   */
  logUsage() {
    const usage = this.getUsage();
    this.history.push(usage.rss);
    if (this.history.length > this.maxHistoryLength) {
      this.history.shift();
    }

    const logMessage = `Memory Usage: RSS=${usage.rss}MB, Heap=${usage.heapUsed}/${usage.heapTotal}MB`;

    if (usage.rss > this.criticalThreshold) {
      logger.error(`CRITICAL: ${logMessage}. Exceeds threshold of ${this.criticalThreshold}MB.`);
      this.triggerGC();
    } else if (usage.rss > this.warningThreshold) {
      logger.warn(`WARNING: ${logMessage}. Exceeds threshold of ${this.warningThreshold}MB.`);
    } else {
      logger.info(logMessage);
    }
  }

  /**
   * Manually triggers garbage collection if available.
   */
  triggerGC() {
    try {
      if (global.gc) {
        const before = this.getUsage().rss;
        global.gc();
        const after = this.getUsage().rss;
        logger.info(`Garbage Collection triggered. Freed ${before - after}MB.`);
      } else {
        logger.warn('Garbage collection unavailable. Run with --expose-gc flag.');
      }
    } catch (error) {
      logger.error('Error during manual garbage collection:', error);
    }
  }

  /**
   * Provides a summary of the current memory statistics and trend.
   * @returns {Object} - An object with current, average, max RSS, trend, and status.
   */
  getStats() {
    if (this.history.length === 0) return { current: this.getUsage().rss };

    const recentHistory = this.history.slice(-5);
    const average = Math.round(recentHistory.reduce((a, b) => a + b, 0) / recentHistory.length);
    const max = Math.max(...recentHistory);
    const current = this.history[this.history.length - 1];

    let trend = 'stable';
    if (this.history.length >= 3) {
      const first = this.history[this.history.length - 3];
      const diff = current - first;
      if (diff > 20) trend = 'increasing';
      if (diff < -20) trend = 'decreasing';
    }
    
    let status = 'normal';
    if (current > this.criticalThreshold) status = 'critical';
    else if (current > this.warningThreshold) status = 'warning';

    return { current, average, max, trend, status };
  }
}

module.exports = new MemoryMonitor(); 