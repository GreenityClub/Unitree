const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files for avatar uploads
app.use('/uploads', express.static('uploads'));

// Health check endpoint for deployment platforms
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Connect to MongoDB
console.log('Connecting to MongoDB...');
mongoose.connect(ENV.MONGODB_URI)
  .then(() => {
    console.log('MongoDB Connected successfully');
    if (ENV.NODE_ENV === 'development') {
      console.log('Database URI:', ENV.MONGODB_URI);
    }
  })
  .catch(err => {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  });

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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('Environment:', ENV.NODE_ENV);
  
  // Initialize cron jobs for scheduled notifications
  cronService.initialize();
});

module.exports = app; 