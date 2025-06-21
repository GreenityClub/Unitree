const mongoose = require('mongoose');
const User = require('../models/User');
const WifiSession = require('../models/WifiSession');
const Point = require('../models/Point');
const Tree = require('../models/Tree');
const logger = require('../utils/logger');
require('dotenv').config();

async function resetAllUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/unitree');
    console.log('Connected to MongoDB');

    console.log('⚠️  WARNING: This will reset ALL user data to fresh state!');
    console.log('This will clear:');
    console.log('- All points and point transactions');
    console.log('- All WiFi sessions');
    console.log('- All planted trees');
    console.log('- All time tracking data');
    console.log('- But will keep user accounts and authentication data');
    console.log('');

    // Get all users
    const users = await User.find({});
    console.log(`Found ${users.length} users to reset`);

    // Use a transaction to ensure data consistency
    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        // 1. Delete all point transactions
        const pointDeleteResult = await Point.deleteMany({}, { session });
        console.log(`✅ Deleted ${pointDeleteResult.deletedCount} point transactions`);

        // 2. Delete all WiFi sessions
        const wifiDeleteResult = await WifiSession.deleteMany({}, { session });
        console.log(`✅ Deleted ${wifiDeleteResult.deletedCount} WiFi sessions`);

        // 3. Delete all trees
        const treeDeleteResult = await Tree.deleteMany({}, { session });
        console.log(`✅ Deleted ${treeDeleteResult.deletedCount} trees`);

        // 4. Reset all user data while keeping authentication info
        const userResetData = {
          // Reset points
          points: 0,
          allTimePoints: 0,
          treesPlanted: 0,
          
          // Reset WiFi tracking
          dayTimeConnected: 0,
          weekTimeConnected: 0,
          monthTimeConnected: 0,
          totalTimeConnected: 0,
          
          // Reset time period tracking
          lastDayReset: null,
          lastWeekReset: null,
          lastMonthReset: null,
          
          // Reset attendance
          lastAttendance: null,
          attendanceStreak: 0,
          
          // Clear trees array
          trees: [],
          
          // Clear active session (but keep session management structure)
          'activeSession.token': null,
          'activeSession.deviceInfo': null,
          'activeSession.loginTime': null,
          'activeSession.lastActivity': null
        };

        const userUpdateResult = await User.updateMany({}, userResetData, { session });
        console.log(`✅ Reset ${userUpdateResult.modifiedCount} users`);

        console.log('\n📊 Reset Summary:');
        console.log(`- Users reset: ${userUpdateResult.modifiedCount}`);
        console.log(`- Point transactions deleted: ${pointDeleteResult.deletedCount}`);
        console.log(`- WiFi sessions deleted: ${wifiDeleteResult.deletedCount}`);
        console.log(`- Trees deleted: ${treeDeleteResult.deletedCount}`);
      });

      console.log('\n✅ All users have been successfully reset to fresh state!');
      console.log('\nWhat was preserved:');
      console.log('- User accounts (email, password, studentId)');
      console.log('- User profile data (fullname, nickname, university)');
      console.log('- User roles and permissions');
      console.log('- Avatar images');
      
      console.log('\nWhat was reset:');
      console.log('- All points and transactions');
      console.log('- All WiFi connection history');
      console.log('- All planted trees');
      console.log('- All time tracking statistics');
      console.log('- Attendance streaks');
      console.log('- Active sessions');

    } catch (transactionError) {
      console.error('❌ Transaction failed:', transactionError);
      throw transactionError;
    } finally {
      await session.endSession();
    }

  } catch (error) {
    console.error('❌ Reset failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Safety confirmation function
async function confirmReset() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('Are you sure you want to reset ALL users? Type "RESET ALL" to confirm: ', (answer) => {
      rl.close();
      resolve(answer === 'RESET ALL');
    });
  });
}

// Main execution
async function main() {
  console.log('🔄 User Reset Script');
  console.log('===================\n');

  // Safety check - require confirmation
  const confirmed = await confirmReset();
  
  if (!confirmed) {
    console.log('❌ Reset cancelled. No changes were made.');
    process.exit(0);
  }

  console.log('\n🚀 Starting reset process...\n');
  await resetAllUsers();
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { resetAllUsers }; 