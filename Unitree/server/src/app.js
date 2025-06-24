const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const { validateEnvironment, env } = require('./config/env');
const { globalErrorHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const cronService = require('./services/cronService');
const memoryMonitor = require('./utils/memoryMonitor');

// Validate environment variables before starting
const ENV = validateEnvironment();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const wifiRoutes = require('./routes/wifi');
const treeRoutes = require('./routes/tree');
const pointsRoutes = require('./routes/points');
const notificationRoutes = require('./routes/notification');

const app = express();

// Start memory monitoring
memoryMonitor.startMonitoring(3); // Monitor every 3 minutes

// Add process event handlers for graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  const memStats = memoryMonitor.getMemoryStats();
  logger.info(`Shutdown memory stats: Current: ${memStats.current}MB, Avg: ${memStats.average}MB, Max: ${memStats.maximum}MB, Trend: ${memStats.trend}`);
  gracefulShutdown();
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Log memory state during errors
  const memStats = memoryMonitor.getMemoryStats();
  logger.error(`Memory state during rejection: ${memStats.current}MB (${memStats.status})`);
  // Don't exit the process, just log the error
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  const memStats = memoryMonitor.getMemoryStats();
  logger.error(`Memory state during exception: ${memStats.current}MB (${memStats.status})`);
  process.exit(1);
});

// Add memory pressure handling
process.on('warning', (warning) => {
  if (warning.name === 'MaxListenersExceededWarning') {
    logger.warn('MaxListenersExceededWarning - potential memory leak detected');
    memoryMonitor.cleanup();
  }
});

// Middleware
app.use(cors({
  origin: [
    ENV.CLIENT_URL,
    ENV.CLIENT_DEV_URL,
    ENV.CLIENT_URL_DEV,
    ENV.CLIENT_URL_DEV_2,
    'http://192.168.1.5:3000',  // Add the mobile app's API URL
    'http://localhost:3000'
  ].filter(Boolean), // Remove undefined values
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files for avatar uploads with proper headers
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  setHeaders: (res, path, stat) => {
    res.set('Cache-Control', 'public, max-age=31536000'); // 1 year cache
    res.set('Access-Control-Allow-Origin', '*');
  }
}));

// Add explicit avatar endpoint for debugging
app.get('/uploads/avatars/:filename', (req, res) => {
  const filePath = path.join(__dirname, '../uploads/avatars', req.params.filename);
  const fs = require('fs');
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    logger.warn(`Avatar file not found: ${filePath}`);
    res.status(404).json({ message: 'Avatar not found' });
  }
});

// Enhanced health check endpoint for deployment platforms
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    const dbState = mongoose.connection.readyState;
    const dbStatus = dbState === 1 ? 'connected' : 'disconnected';
    
    // Get detailed memory stats from monitor
    const memStats = memoryMonitor.getMemoryStats();
    
    if (dbState !== 1) {
      return res.status(503).json({
        status: 'unhealthy',
        reason: 'Database disconnected',
        timestamp: new Date().toISOString()
      });
    }
    
    // Return unhealthy if memory is critical
    if (memStats.status === 'critical') {
      logger.warn(`Health check: Critical memory usage ${memStats.current}MB`);
      return res.status(503).json({
        status: 'unhealthy',
        reason: `Critical memory usage: ${memStats.current}MB`,
        timestamp: new Date().toISOString()
      });
    }
    
    res.status(200).json({
      status: 'healthy',
      database: dbStatus,
      memory: `${memStats.current}MB`,
      memoryStatus: memStats.status,
      memoryTrend: memStats.trend,
      averageMemory: `${memStats.average}MB`,
      maxMemory: `${memStats.maximum}MB`,
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      version: process.env.npm_package_version || '1.0.0',
      nodeVersion: process.version,
      platform: process.platform
    });
  } catch (error) {
    logger.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Connect to MongoDB with retry logic
console.log('Connecting to MongoDB...');

const connectWithRetry = async () => {
  try {
    await mongoose.connect(ENV.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log('MongoDB Connected successfully');
    if (ENV.NODE_ENV === 'development') {
      console.log('Database URI:', ENV.MONGODB_URI);
    }
  } catch (err) {
    console.error('MongoDB Connection Error:', err);
    console.log('Retrying MongoDB connection in 5 seconds...');
    setTimeout(connectWithRetry, 5000);
  }
};

// Handle MongoDB connection events
mongoose.connection.on('error', (err) => {
  logger.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB reconnected successfully');
});

connectWithRetry();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/wifi', wifiRoutes);
app.use('/api/trees', treeRoutes);
app.use('/api/points', pointsRoutes);
app.use('/api/user', notificationRoutes); // Some routes are under /api/user
app.use('/api/notification', notificationRoutes);

// Global error handling middleware (should be last)
app.use(globalErrorHandler);

const PORT = ENV.PORT;

const server = app.listen(PORT, () => {
  console.log(`🚀 Your service is live`);
  console.log(`Server is running on port ${PORT}`);
  console.log('Environment:', ENV.NODE_ENV);
  console.log(`Memory limits: 384MB heap, 64MB semi-space`);
  
  // Initialize cron jobs for scheduled notifications
  try {
    cronService.initialize();
  } catch (error) {
    logger.error('Failed to initialize cron service:', error);
  }
  
  // Set up periodic maintenance tasks
  setInterval(() => {
    try {
      logger.info('Running periodic maintenance...');
      memoryMonitor.cleanup();
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      logger.info('Periodic maintenance completed');
    } catch (error) {
      logger.error('Error during periodic maintenance:', error);
    }
  }, 30 * 60 * 1000); // Every 30 minutes
});

// Handle server shutdown gracefully
const gracefulShutdown = () => {
  logger.info('Starting graceful shutdown...');
  
  server.close(() => {
    logger.info('HTTP server closed');
    
    mongoose.connection.close(() => {
      logger.info('MongoDB connection closed');
      process.exit(0);
    });
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

module.exports = app; 