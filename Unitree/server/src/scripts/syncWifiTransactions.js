const mongoose = require('mongoose');
const WifiSession = require('../models/WifiSession');
const Point = require('../models/Point');
const User = require('../models/User');
const logger = require('../utils/logger');
require('dotenv').config();

async function syncWifiTransactions() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/unitree');
    console.log('Connected to MongoDB');

    // Get all completed WiFi sessions that earned points
    const completedSessions = await WifiSession.find({
      endTime: { $ne: null },
      isActive: false,
      pointsEarned: { $gt: 0 }
    }).sort({ startTime: 1 });

    console.log(`Found ${completedSessions.length} completed sessions with points`);

    let createdTransactions = 0;
    let skippedTransactions = 0;

    for (const session of completedSessions) {
      // Check if point transaction already exists
      const existingTransaction = await Point.findOne({
        userId: session.user,
        type: 'WIFI_SESSION',
        'metadata.startTime': session.startTime,
        'metadata.endTime': session.endTime
      });

      if (!existingTransaction) {
        // Create missing transaction
        const pointTransaction = new Point({
          userId: session.user,
          amount: session.pointsEarned,
          type: 'WIFI_SESSION',
          metadata: {
            startTime: session.startTime,
            endTime: session.endTime,
            duration: session.duration,
            description: `WiFi session on ${session.ipAddress} (migration)`,
          },
          createdAt: session.endTime, // Use session end time as transaction date
          updatedAt: session.endTime
        });

        await pointTransaction.save();
        createdTransactions++;
        
        if (createdTransactions % 100 === 0) {
          console.log(`Created ${createdTransactions} transactions...`);
        }
      } else {
        skippedTransactions++;
      }
    }

    console.log(`Migration completed:`);
    console.log(`- Created transactions: ${createdTransactions}`);
    console.log(`- Skipped existing: ${skippedTransactions}`);

    // Now sync user data
    const users = await User.find({});
    console.log(`\nSyncing ${users.length} users...`);

    for (const user of users) {
      // Calculate points from all transactions
      const userTransactions = await Point.find({ userId: user._id });
      const calculatedPoints = userTransactions.reduce((sum, t) => sum + t.amount, 0);
      const calculatedAllTimePoints = userTransactions
        .filter(t => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);

      // Calculate total time from all completed sessions
      const userSessions = await WifiSession.find({
        user: user._id,
        endTime: { $ne: null },
        isActive: false
      });
      const totalTimeConnected = userSessions.reduce((sum, s) => sum + (s.duration || 0), 0);

      // Update user if values don't match
      const updates = {};
      if (user.points !== calculatedPoints) {
        updates.points = calculatedPoints;
      }
      if (user.allTimePoints !== calculatedAllTimePoints) {
        updates.allTimePoints = calculatedAllTimePoints;
      }
      if (user.totalTimeConnected !== totalTimeConnected) {
        updates.totalTimeConnected = totalTimeConnected;
      }

      if (Object.keys(updates).length > 0) {
        await User.findByIdAndUpdate(user._id, updates);
        console.log(`Updated user ${user.email}:`, updates);
      }
    }

    console.log('\nSync completed successfully!');

  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the migration
if (require.main === module) {
  syncWifiTransactions();
}

module.exports = { syncWifiTransactions }; 