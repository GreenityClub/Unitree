const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const { validateEnvironment, env } = require('./config/env');
const { globalErrorHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const cronService = require('./services/cronService');

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

// Add process event handlers for graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process, just log the error
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
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
    
    // Check memory usage
    const memUsage = process.memoryUsage();
    const memMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    
    if (dbState !== 1) {
      return res.status(503).json({
        status: 'unhealthy',
        reason: 'Database disconnected',
        timestamp: new Date().toISOString()
      });
    }
    
    res.status(200).json({
      status: 'healthy',
      database: dbStatus,
      memory: `${memMB}MB`,
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      version: process.env.npm_package_version || '1.0.0'
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
  
  // Initialize cron jobs for scheduled notifications
  try {
    cronService.initialize();
  } catch (error) {
    logger.error('Failed to initialize cron service:', error);
  }
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