require('dotenv').config();

const requiredEnvVars = {
  // Database
  MONGODB_URI: process.env.MONGODB_URI,
  
  // JWT Security
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRE: process.env.JWT_EXPIRE || '15m',
  JWT_REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE || '30d',
  
  // Email Service
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
  
  // Application Settings
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3000,
  
  // WiFi & Points Configuration
  UNIVERSITY_IP_PREFIX: process.env.UNIVERSITY_IP_PREFIX || '10.22',
  MIN_SESSION_DURATION: process.env.MIN_SESSION_DURATION || '300',
  POINTS_PER_HOUR: process.env.POINTS_PER_HOUR || '60',
  
  // University Location Configuration
  UNIVERSITY_LAT: process.env.UNIVERSITY_LAT || '21.023883446210807',
  UNIVERSITY_LNG: process.env.UNIVERSITY_LNG || '105.79044010261333',
  UNIVERSITY_RADIUS: process.env.UNIVERSITY_RADIUS || '100',
  
  // Tree Configuration
  TREE_COST: process.env.TREE_COST || '100',
  
  // Cloud Storage Configuration (Cloudinary)
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  
  // Push Notifications Configuration (V1 API)
  FIREBASE_SERVICE_ACCOUNT_KEY: process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
  FIREBASE_SERVICE_ACCOUNT_PATH: process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
  
  // Legacy Push Notifications (deprecated)
  EXPO_ACCESS_TOKEN: process.env.EXPO_ACCESS_TOKEN,
  FCM_SERVER_KEY: process.env.FCM_SERVER_KEY,
  
  // CORS Origins
  CLIENT_URL: process.env.CLIENT_URL,
  CLIENT_DEV_URL: process.env.CLIENT_DEV_URL,
  CLIENT_URL_DEV: process.env.CLIENT_URL_DEV,
  CLIENT_URL_DEV_2: process.env.CLIENT_URL_DEV_2,
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info'
};

const validateEnvironment = () => {
  const missingVars = [];
  const criticalVars = ['MONGODB_URI', 'JWT_SECRET'];
  
  // Check for critical variables
  criticalVars.forEach(varName => {
    if (!requiredEnvVars[varName]) {
      missingVars.push(varName);
    }
  });
  
  if (missingVars.length > 0) {
    console.error('❌ CRITICAL: Missing required environment variables:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\n📋 Please set these variables in your .env file or environment');
    process.exit(1);
  }
  
  // Warn about optional but recommended variables
  const recommendedVars = ['EMAIL_USER', 'EMAIL_PASSWORD'];
  const missingRecommended = [];
  
  recommendedVars.forEach(varName => {
    if (!requiredEnvVars[varName]) {
      missingRecommended.push(varName);
    }
  });
  
  if (missingRecommended.length > 0) {
    console.warn('⚠️  WARNING: Missing recommended environment variables:');
    missingRecommended.forEach(varName => {
      console.warn(`   - ${varName}`);
    });
    console.warn('   Some features (like email notifications) may not work properly\n');
  }
  
  // Log successful validation
  console.log('✅ Environment validation passed');
  console.log(`🚀 Starting server in ${requiredEnvVars.NODE_ENV} mode`);
  
  return requiredEnvVars;
};

module.exports = {
  validateEnvironment,
  env: requiredEnvVars
}; 