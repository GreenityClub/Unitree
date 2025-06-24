const logger = require('./logger');

class MemoryMonitor {
  constructor() {
    this.memoryUsageHistory = [];
    this.maxHistoryLength = 20;
    this.warningThreshold = 350; // MB
    this.criticalThreshold = 400; // MB
    this.lastGCTime = Date.now();
    this.gcInterval = 5 * 60 * 1000; // 5 minutes
  }

  getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      rss: Math.round(usage.rss / 1024 / 1024), // MB
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
      external: Math.round(usage.external / 1024 / 1024), // MB
      timestamp: new Date().toISOString()
    };
  }

  logMemoryUsage() {
    const usage = this.getMemoryUsage();
    
    // Add to history
    this.memoryUsageHistory.push(usage);
    if (this.memoryUsageHistory.length > this.maxHistoryLength) {
      this.memoryUsageHistory.shift();
    }

    // Log current usage
    logger.info(`Memory Usage: RSS: ${usage.rss}MB, Heap: ${usage.heapUsed}/${usage.heapTotal}MB, External: ${usage.external}MB`);

    // Check for warnings
    if (usage.rss > this.criticalThreshold) {
      logger.warn(`🚨 CRITICAL: Memory usage very high: ${usage.rss}MB (threshold: ${this.criticalThreshold}MB)`);
      this.forceGarbageCollection();
    } else if (usage.rss > this.warningThreshold) {
      logger.warn(`⚠️ WARNING: Memory usage high: ${usage.rss}MB (threshold: ${this.warningThreshold}MB)`);
    }

    // Auto garbage collection
    if (Date.now() - this.lastGCTime > this.gcInterval) {
      this.forceGarbageCollection();
    }

    return usage;
  }

  forceGarbageCollection() {
    try {
      if (global.gc) {
        const beforeGC = this.getMemoryUsage();
        global.gc();
        const afterGC = this.getMemoryUsage();
        this.lastGCTime = Date.now();
        
        const saved = beforeGC.rss - afterGC.rss;
        if (saved > 5) { // Only log if significant memory was freed
          logger.info(`🗑️ Garbage collection freed ${saved}MB (${beforeGC.rss}MB → ${afterGC.rss}MB)`);
        }
      } else {
        logger.warn('Garbage collection not available (run with --expose-gc flag)');
      }
    } catch (error) {
      logger.error('Error during garbage collection:', error);
    }
  }

  getMemoryStats() {
    if (this.memoryUsageHistory.length === 0) {
      return this.getMemoryUsage();
    }

    const recent = this.memoryUsageHistory.slice(-5);
    const avgRss = Math.round(recent.reduce((sum, usage) => sum + usage.rss, 0) / recent.length);
    const maxRss = Math.max(...recent.map(usage => usage.rss));
    const current = this.getMemoryUsage();

    return {
      current: current.rss,
      average: avgRss,
      maximum: maxRss,
      trend: this.getMemoryTrend(),
      status: this.getMemoryStatus(current.rss)
    };
  }

  getMemoryTrend() {
    if (this.memoryUsageHistory.length < 3) return 'stable';
    
    const recent = this.memoryUsageHistory.slice(-3);
    const first = recent[0].rss;
    const last = recent[recent.length - 1].rss;
    const diff = last - first;
    
    if (diff > 20) return 'increasing';
    if (diff < -20) return 'decreasing';
    return 'stable';
  }

  getMemoryStatus(rss) {
    if (rss > this.criticalThreshold) return 'critical';
    if (rss > this.warningThreshold) return 'warning';
    return 'normal';
  }

  startMonitoring(intervalMinutes = 5) {
    logger.info(`Starting memory monitoring (interval: ${intervalMinutes} minutes)`);
    
    // Initial log
    this.logMemoryUsage();
    
    // Set up regular monitoring
    setInterval(() => {
      this.logMemoryUsage();
    }, intervalMinutes * 60 * 1000);

    // Set up process event handlers
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received - final memory stats:');
      const stats = this.getMemoryStats();
      logger.info(`Final memory usage: ${stats.current}MB (avg: ${stats.average}MB, max: ${stats.maximum}MB, trend: ${stats.trend})`);
    });

    process.on('exit', () => {
      logger.info('Process exiting - memory monitoring stopped');
    });

    // Handle memory warnings
    process.on('warning', (warning) => {
      if (warning.name === 'MaxListenersExceededWarning' || warning.name === 'DeprecationWarning') {
        return; // Ignore these common warnings
      }
      logger.warn(`Process warning: ${warning.name} - ${warning.message}`);
    });
  }

  // Clean up old connections and cached data
  cleanup() {
    try {
      // Force garbage collection
      this.forceGarbageCollection();
      
      // Clear old history
      if (this.memoryUsageHistory.length > this.maxHistoryLength) {
        this.memoryUsageHistory = this.memoryUsageHistory.slice(-this.maxHistoryLength);
      }
      
      logger.info('Memory cleanup completed');
    } catch (error) {
      logger.error('Error during memory cleanup:', error);
    }
  }
}

// Create singleton instance
const memoryMonitor = new MemoryMonitor();

module.exports = memoryMonitor; 