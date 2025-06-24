const https = require('https');

const SERVER_URL = 'https://unitree-server-production.onrender.com/health';
const PING_INTERVAL = 10 * 60 * 1000; // 10 minutes

function pingServer() {
  const startTime = Date.now();
  
  https.get(SERVER_URL, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      const responseTime = Date.now() - startTime;
      console.log(`✅ [${new Date().toISOString()}] Server is alive - Response time: ${responseTime}ms`);
      console.log(`📊 Status: ${res.statusCode}`);
      
      try {
        const healthData = JSON.parse(data);
        console.log(`💾 Memory: ${healthData.memory}`);
        console.log(`⏱️ Uptime: ${healthData.uptime}s`);
        console.log(`🗄️ Database: ${healthData.database}`);
      } catch (e) {
        console.log('Response data:', data.substring(0, 100));
      }
      console.log('---');
    });
  }).on('error', (err) => {
    console.error(`❌ [${new Date().toISOString()}] Error pinging server:`, err.message);
    console.log('🔄 Will retry in next interval...');
    console.log('---');
  });
}

console.log(`🚀 Starting keep-alive service for ${SERVER_URL}`);
console.log(`⏰ Ping interval: ${PING_INTERVAL / 1000 / 60} minutes`);
console.log('---');

// Initial ping
pingServer();

// Set up regular pings
setInterval(pingServer, PING_INTERVAL);

// Keep the process running
process.on('SIGINT', () => {
  console.log('\n🛑 Keep-alive service stopped');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Keep-alive service terminated');
  process.exit(0);
}); 