const mongoose = require('mongoose');
const User = require('../models/User');
const WifiSession = require('../models/WifiSession');
const Point = require('../models/Point');
const Tree = require('../models/Tree');
const logger = require('../utils/logger');
require('dotenv').config();

/**
 * Reset specific user(s) to fresh state
 * @param {Array|String} userIdentifiers - Array of user IDs/emails or single identifier
 * @param {Object} options - Reset options
 */
async function resetUsers(userIdentifiers = 'all', options = {}) {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/unitree');
    
    const {
      silent = false,
      keepTrees = false,
      keepSessions = false,
      keepPoints = false
    } = options;

    if (!silent) {
      console.log('Connected to MongoDB');
    }

    let users;
    
    // Determine which users to reset
    if (userIdentifiers === 'all') {
      users = await User.find({});
    } else if (Array.isArray(userIdentifiers)) {
      users = await User.find({
        $or: [
          { _id: { $in: userIdentifiers } },
          { email: { $in: userIdentifiers } },
          { studentId: { $in: userIdentifiers } }
        ]
      });
    } else {
      users = await User.find({
        $or: [
          { _id: userIdentifiers },
          { email: userIdentifiers },
          { studentId: userIdentifiers }
        ]
      });
    }

    if (users.length === 0) {
      console.log('No users found to reset');
      return { success: false, message: 'No users found' };
    }

    if (!silent) {
      console.log(`Found ${users.length} user(s) to reset`);
    }

    const userIds = users.map(u => u._id);
    const session = await mongoose.startSession();
    
    const results = {
      usersReset: 0,
      pointsDeleted: 0,
      sessionsDeleted: 0,
      treesDeleted: 0
    };

    try {
      await session.withTransaction(async () => {
        // Delete data based on options
        if (!keepPoints) {
          const pointDeleteResult = await Point.deleteMany(
            { userId: { $in: userIds } }, 
            { session }
          );
          results.pointsDeleted = pointDeleteResult.deletedCount;
          if (!silent) console.log(`✅ Deleted ${pointDeleteResult.deletedCount} point transactions`);
        }

        if (!keepSessions) {
          const wifiDeleteResult = await WifiSession.deleteMany(
            { user: { $in: userIds } }, 
            { session }
          );
          results.sessionsDeleted = wifiDeleteResult.deletedCount;
          if (!silent) console.log(`✅ Deleted ${wifiDeleteResult.deletedCount} WiFi sessions`);
        }

        if (!keepTrees) {
          const treeDeleteResult = await Tree.deleteMany(
            { userId: { $in: userIds } }, 
            { session }
          );
          results.treesDeleted = treeDeleteResult.deletedCount;
          if (!silent) console.log(`✅ Deleted ${treeDeleteResult.deletedCount} trees`);
        }

        // Reset user data
        const userResetData = {
          // Reset points (unless keeping them)
          ...(keepPoints ? {} : {
            points: 0,
            allTimePoints: 0,
          }),
          
          // Reset tree count (unless keeping trees)
          ...(keepTrees ? {} : {
            treesPlanted: 0,
            trees: [],
          }),
          
          // Reset WiFi tracking (unless keeping sessions)
          ...(keepSessions ? {} : {
            dayTimeConnected: 0,
            weekTimeConnected: 0,
            monthTimeConnected: 0,
            totalTimeConnected: 0,
            lastDayReset: null,
            lastWeekReset: null,
            lastMonthReset: null,
          }),
          
          // Always reset attendance and sessions
          lastAttendance: null,
          attendanceStreak: 0,
          'activeSession.token': null,
          'activeSession.deviceInfo': null,
          'activeSession.loginTime': null,
          'activeSession.lastActivity': null
        };

        const userUpdateResult = await User.updateMany(
          { _id: { $in: userIds } }, 
          userResetData, 
          { session }
        );
        results.usersReset = userUpdateResult.modifiedCount;
        
        if (!silent) console.log(`✅ Reset ${userUpdateResult.modifiedCount} user(s)`);
      });

      if (!silent) {
        console.log('\n📊 Reset Summary:');
        console.log(`- Users reset: ${results.usersReset}`);
        console.log(`- Point transactions deleted: ${results.pointsDeleted}`);
        console.log(`- WiFi sessions deleted: ${results.sessionsDeleted}`);
        console.log(`- Trees deleted: ${results.treesDeleted}`);
      }

      return { success: true, results };

    } catch (transactionError) {
      if (!silent) console.error('❌ Transaction failed:', transactionError);
      throw transactionError;
    } finally {
      await session.endSession();
    }

  } catch (error) {
    if (!silent) console.error('❌ Reset failed:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    if (!silent) console.log('🔌 Database connection closed');
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  
  // Parse command line arguments
  const options = {
    silent: args.includes('--silent'),
    keepTrees: args.includes('--keep-trees'),
    keepSessions: args.includes('--keep-sessions'),
    keepPoints: args.includes('--keep-points')
  };

  let target = 'all';
  
  // Check for specific user targets
  const userArg = args.find(arg => arg.startsWith('--user='));
  if (userArg) {
    target = userArg.split('=')[1];
  }

  const usersArg = args.find(arg => arg.startsWith('--users='));
  if (usersArg) {
    target = usersArg.split('=')[1].split(',');
  }

  if (args.includes('--help')) {
    console.log(`
🔄 User Reset Script
===================

Usage: node resetUsers.js [options]

Options:
  --help              Show this help message
  --silent            Run without console output
  --user=<email>      Reset specific user by email/ID
  --users=<emails>    Reset multiple users (comma-separated)
  --keep-trees        Don't delete planted trees
  --keep-sessions     Don't delete WiFi sessions
  --keep-points       Don't delete points and transactions

Examples:
  node resetUsers.js                              # Reset all users
  node resetUsers.js --silent                     # Reset all users silently
  node resetUsers.js --user=user@example.com      # Reset specific user
  node resetUsers.js --users=user1@ex.com,user2@ex.com  # Reset multiple users
  node resetUsers.js --keep-trees --keep-points   # Reset but keep trees and points
    `);
    return;
  }

  console.log('🔄 User Reset Script');
  console.log('===================\n');

  if (!options.silent) {
    console.log(`Target: ${Array.isArray(target) ? target.join(', ') : target}`);
    console.log(`Options: ${Object.entries(options).filter(([k,v]) => v).map(([k]) => k).join(', ') || 'none'}\n`);
  }

  try {
    const result = await resetUsers(target, options);
    if (result.success && !options.silent) {
      console.log('\n✅ Reset completed successfully!');
    }
  } catch (error) {
    console.error('❌ Reset failed:', error.message);
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  main();
}

module.exports = { resetUsers }; 