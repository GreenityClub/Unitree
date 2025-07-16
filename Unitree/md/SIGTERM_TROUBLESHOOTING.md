# SIGTERM Troubleshooting Guide

The server is still receiving SIGTERM signals despite our optimizations. This guide helps diagnose and resolve the issue.

## Current Optimizations Applied

✅ **Memory Optimization**
- Reduced heap size to 384MB (was 512MB)
- Added semi-space limit of 64MB
- Enabled garbage collection with `--expose-gc`
- Added automatic GC every 5 minutes
- Memory monitoring with warnings at 350MB, critical at 400MB

✅ **Health Check Improvements**
- Extended timeout to 90 seconds
- Reduced frequency to 120 seconds (was 60s)
- Added memory status reporting
- Health check fails if memory is critical

✅ **Keep-Alive Services**
- Enhanced keep-alive pings every 5 minutes
- Warmup requests to prevent cold starts
- Retry logic with detailed logging
- Multiple endpoint monitoring

✅ **Token System Update**
- Short access tokens (15 minutes) 
- Long refresh tokens (30 days)
- Automatic token refresh to reduce auth failures

## Potential Remaining Issues

### 1. Memory Pressure (Most Likely)
**Symptoms:**
- SIGTERM occurs during high activity
- Memory usage approaches 400MB+ before shutdown
- Logs show memory warnings

**Solutions:**
```bash
# Further reduce memory limits
NODE_OPTIONS="--max-old-space-size=300 --max-semi-space-size=48"

# More aggressive GC
NODE_OPTIONS="--gc-interval=100"
```

### 2. MongoDB Connection Leaks
**Symptoms:**
- Database connection timeouts
- Connection pool exhaustion
- Memory usage gradually increases

**Solutions:**
```javascript
// Add to mongoose connection
mongoose.connect(URI, {
  maxPoolSize: 5, // Reduce from 10
  minPoolSize: 1,
  maxIdleTimeMS: 30000,
  serverSelectionTimeoutMS: 5000
});
```

### 3. Express.js Request Handling
**Symptoms:**
- High request concurrency
- Request timeout errors
- Memory spikes during API calls

**Solutions:**
```javascript
// Add request limits
app.use(express.json({ limit: '1mb' })); // Reduce from 10mb
app.use(compression()); // Add gzip compression
```

### 4. Render Platform Limits
**Symptoms:**
- SIGTERM at regular intervals (15-30 minutes)
- No obvious memory/performance issues
- Occurs regardless of activity

**Solutions:**
- Upgrade to paid plan (more resources)
- Move to different platform (Railway, Heroku)
- Implement Redis caching to reduce database load

## Immediate Actions to Take

### 1. Monitor Memory More Closely
Add this to your logs monitoring:
```bash
# Check current memory usage
curl https://unitree-server-production.onrender.com/health | jq '.memory'

# Look for memory trends in logs
grep "Memory Usage" logs/combined.log | tail -20
```

### 2. Enable Detailed Process Monitoring
Add to `render.yaml`:
```yaml
envVars:
  - key: NODE_ENV
    value: production
  - key: DEBUG
    value: "express:*"  # Enable Express debugging
  - key: LOG_LEVEL
    value: debug
```

### 3. Implement Circuit Breaker Pattern
```javascript
// Add to high-traffic endpoints
const circuitBreaker = require('opossum');
const options = {
  timeout: 3000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000
};
```

### 4. Add Request Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}));
```

## Emergency Fallback Options

If SIGTERM continues:

### Option 1: Platform Migration
- **Railway**: Generally more stable for Node.js apps
- **Heroku**: Expensive but reliable
- **DigitalOcean App Platform**: Good middle ground

### Option 2: Architecture Changes
- Split into microservices (auth, wifi, trees separately)
- Add Redis for session storage
- Use serverless functions for auth endpoints

### Option 3: Database Optimization
```javascript
// Reduce MongoDB memory usage
mongoose.connect(URI, {
  bufferMaxEntries: 0,
  bufferCommands: false,
  maxPoolSize: 3,
  maxIdleTimeMS: 10000
});
```

## Monitoring Commands

Run these to diagnose:

```bash
# 1. Check current memory
curl -s https://unitree-server-production.onrender.com/health | jq '{memory: .memory, status: .memoryStatus, trend: .memoryTrend}'

# 2. Monitor keep-alive success rate
node keep-alive-enhanced.js

# 3. Check health check frequency
curl -w "@curl-format.txt" -s https://unitree-server-production.onrender.com/health

# 4. Monitor MongoDB connections
# (Check MongoDB Atlas dashboard for connection count)
```

## Current Status

The enhanced monitoring should provide better insight into:
- Exact memory usage patterns before SIGTERM
- Health check response times
- Database connection stability
- Request handling performance

**Next Steps:**
1. Deploy current changes
2. Monitor for 24 hours
3. Analyze logs for patterns
4. Implement additional optimizations based on findings

If SIGTERM persists after these changes, the issue is likely platform-level resource constraints requiring either plan upgrade or platform migration. 