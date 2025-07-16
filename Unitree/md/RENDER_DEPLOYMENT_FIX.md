# Render Deployment Fix Guide

## Issues Identified and Fixed

Based on your deployment logs, we identified several critical issues that were causing your server to crash on Render:

### 1. **SIGTERM Signal Crashes**
**Problem**: Server was receiving SIGTERM signals and crashing without graceful shutdown.
**Fix**: Added proper signal handlers and graceful shutdown logic.

### 2. **Health Check Failures**
**Problem**: Basic health check wasn't comprehensive enough.
**Fix**: Enhanced health check endpoint with database connection monitoring and memory usage tracking.

### 3. **Memory Issues**
**Problem**: Node.js running out of memory on Render's free tier.
**Fix**: Added memory limits and optimization.

### 4. **Database Connection Issues**
**Problem**: MongoDB connections timing out without proper retry logic.
**Fix**: Added connection retry mechanism and proper connection event handling.

## Changes Made

### 1. Enhanced `app.js`
```javascript
// Added process event handlers
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Enhanced health check with database monitoring
app.get('/health', async (req, res) => {
  // Checks database connection, memory usage, and server status
});

// MongoDB retry connection logic
const connectWithRetry = async () => {
  // Automatically retries MongoDB connection with exponential backoff
};

// Graceful shutdown handling
const gracefulShutdown = () => {
  // Properly closes server and database connections
};
```

### 2. Updated `package.json`
```json
{
  "scripts": {
    "start": "node --max-old-space-size=512 src/app.js"
  }
}
```

### 3. Enhanced `Dockerfile`
```dockerfile
# Set memory limit
ENV NODE_OPTIONS="--max-old-space-size=512"

# Add health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3

# Security improvements with non-root user
USER nextjs
```

### 4. Updated `render.yaml`
```yaml
# Resource configuration
plan: starter
healthCheckTimeout: 30
healthCheckInterval: 30
numInstances: 1
```

## Deployment Steps

### 1. Commit and Push Changes
```bash
git add .
git commit -m "Fix Render deployment issues - Add graceful shutdown, enhanced health checks, and memory optimization"
git push origin main
```

### 2. Redeploy on Render
1. Go to your Render dashboard
2. Find your `unitree-server` service
3. Click "Manual Deploy" or wait for auto-deploy to trigger
4. Monitor the logs for improvements

### 3. Monitor Health Check
After deployment, check:
- Visit `https://your-app.onrender.com/health`
- Should return:
```json
{
  "status": "healthy",
  "database": "connected",
  "memory": "XXmb",
  "timestamp": "2025-06-23T...",
  "uptime": 123,
  "version": "1.0.0"
}
```

## Expected Log Improvements

### Before Fix:
```
MongoDB Connected successfully
🚀 Your service is live
[... some activity ...]
npm error path /app
npm error command failed
npm error signal SIGTERM
```

### After Fix:
```
MongoDB Connected successfully
🚀 Your service is live
Server is running on port 10000
Environment: production
✅ Cron service initialized successfully
[... stable operation ...]
```

## Troubleshooting

### If Still Getting SIGTERM Errors:
1. Check Render logs for memory usage spikes
2. Consider upgrading to Render's paid plan (more memory)
3. Monitor the `/health` endpoint response times

### If Database Connection Issues:
1. Verify MongoDB Atlas connection string
2. Check Atlas network access (whitelist 0.0.0.0/0 for Render)
3. Monitor connection retry logs

### If Memory Issues Persist:
1. Increase memory limit in start script:
   ```json
   "start": "node --max-old-space-size=1024 src/app.js"
   ```
2. Consider optimizing database queries
3. Upgrade Render plan

## Environment Variables Checklist

Ensure these are set in Render:
- ✅ `MONGODB_URI` - Your Atlas connection string
- ✅ `JWT_SECRET` - Auto-generated or set manually
- ✅ `EMAIL_USER` - Your email service username
- ✅ `EMAIL_PASSWORD` - Your email service password
- ✅ `CLOUDINARY_CLOUD_NAME` - Your Cloudinary cloud name
- ✅ `CLOUDINARY_API_KEY` - Your Cloudinary API key
- ✅ `CLOUDINARY_API_SECRET` - Your Cloudinary API secret

## Monitoring Commands

To check server health after deployment:
```bash
# Check health endpoint
curl https://your-app.onrender.com/health

# Check if server is responding
curl https://your-app.onrender.com/api/auth/health
```

## Performance Optimizations

The fixes include:
1. **Memory Management**: Limited Node.js heap size to prevent OOM crashes
2. **Connection Pooling**: Optimized MongoDB connection settings
3. **Graceful Shutdown**: Proper cleanup of resources on termination
4. **Error Handling**: Comprehensive error catching and logging
5. **Health Monitoring**: Real-time health status reporting

## Next Steps

1. Deploy the changes
2. Monitor logs for 10-15 minutes to ensure stability
3. Test the app functionality (registration, WiFi tracking, etc.)
4. Set up monitoring alerts if using Render's paid features

## Support

If issues persist after these fixes:
1. Check Render's resource usage dashboard
2. Consider upgrading to a paid Render plan for more resources
3. Review application logs for any remaining unhandled errors

---

**Note**: These fixes address the most common Render deployment issues. The server should now be much more stable and resilient to the resource constraints of the free tier. 