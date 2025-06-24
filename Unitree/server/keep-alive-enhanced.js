const https = require('https');
const http = require('http');

const SERVER_URL = 'https://unitree-server-production.onrender.com/health';
const PING_INTERVAL = 5 * 60 * 1000; // 5 minutes (more frequent)
const RETRY_INTERVAL = 30 * 1000; // 30 seconds for retries
const MAX_RETRIES = 3;

let consecutiveFailures = 0;
let totalPings = 0;
let successfulPings = 0;

function pingServer(isRetry = false) {
  const startTime = Date.now();
  totalPings++;
  
  const request = https.get(SERVER_URL, {
    timeout: 30000, // 30 second timeout
  }, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      const responseTime = Date.now() - startTime;
      successfulPings++;
      consecutiveFailures = 0;
      
      console.log(`✅ [${new Date().toISOString()}] Server is alive - Response time: ${responseTime}ms`);
      console.log(`📊 Status: ${res.statusCode} | Success Rate: ${(successfulPings/totalPings*100).toFixed(1)}%`);
      
      try {
        const healthData = JSON.parse(data);
        console.log(`💾 Memory: ${healthData.memory}`);
        console.log(`⏱️ Uptime: ${healthData.uptime}s`);
        console.log(`🗄️ Database: ${healthData.database}`);
        
        // Log memory usage warnings
        if (healthData.memory && healthData.memory.includes('MB')) {
          const memUsage = parseFloat(healthData.memory.replace('MB', ''));
          if (memUsage > 300) {
            console.log(`⚠️ WARNING: High memory usage: ${memUsage}MB`);
          }
        }
      } catch (e) {
        console.log('📄 Response data:', data.substring(0, 100));
      }
      console.log('---');
    });
  });

  request.on('error', (err) => {
    consecutiveFailures++;
    console.error(`❌ [${new Date().toISOString()}] Error pinging server (attempt ${consecutiveFailures}):`, err.message);
    
    if (consecutiveFailures < MAX_RETRIES && !isRetry) {
      console.log(`🔄 Retrying in ${RETRY_INTERVAL/1000} seconds...`);
      setTimeout(() => pingServer(true), RETRY_INTERVAL);
    } else {
      console.log(`🚨 Server appears to be down after ${consecutiveFailures} attempts`);
      console.log(`📈 Overall success rate: ${(successfulPings/totalPings*100).toFixed(1)}%`);
    }
    console.log('---');
  });

  request.on('timeout', () => {
    request.destroy();
    consecutiveFailures++;
    console.error(`⏰ [${new Date().toISOString()}] Request timeout after 30 seconds`);
    console.log('---');
  });

  request.setTimeout(30000);
}

// Function to make additional requests to keep server warm
function warmupRequest() {
  const warmupEndpoints = [
    '/api/auth/me',
    '/api/wifi/stats'
  ];
  
  warmupEndpoints.forEach((endpoint, index) => {
    setTimeout(() => {
      const fullUrl = `https://unitree-server-production.onrender.com${endpoint}`;
      https.get(fullUrl, { timeout: 10000 }, (res) => {
        console.log(`🔥 Warmup ${endpoint}: ${res.statusCode}`);
      }).on('error', () => {
        // Ignore warmup errors
      });
    }, index * 2000); // Stagger requests
  });
}

console.log(`🚀 Starting enhanced keep-alive service for ${SERVER_URL}`);
console.log(`⏰ Ping interval: ${PING_INTERVAL / 1000 / 60} minutes`);
console.log(`🔄 Retry interval: ${RETRY_INTERVAL / 1000} seconds`);
console.log(`🎯 Max retries: ${MAX_RETRIES}`);
console.log('---');

// Initial ping
pingServer();

// Set up regular pings
setInterval(() => {
  pingServer();
  // Also do warmup requests every other ping
  if (totalPings % 2 === 0) {
    setTimeout(warmupRequest, 10000);
  }
}, PING_INTERVAL);

// Log statistics every hour
setInterval(() => {
  console.log(`📊 Hourly Stats - Total: ${totalPings}, Successful: ${successfulPings}, Rate: ${(successfulPings/totalPings*100).toFixed(1)}%`);
}, 60 * 60 * 1000);

// Keep the process running
process.on('SIGINT', () => {
  console.log('\n🛑 Enhanced keep-alive service stopped');
  console.log(`📊 Final Stats - Total: ${totalPings}, Successful: ${successfulPings}, Success Rate: ${(successfulPings/totalPings*100).toFixed(1)}%`);
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Enhanced keep-alive service terminated');
  console.log(`📊 Final Stats - Total: ${totalPings}, Successful: ${successfulPings}, Success Rate: ${(successfulPings/totalPings*100).toFixed(1)}%`);
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  // Don't exit, keep trying
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit, keep trying
}); 