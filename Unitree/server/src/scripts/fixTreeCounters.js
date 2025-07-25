/**
 * Script to fix tree counters in user documents
 * 
 * This script updates the treesPlanted, virtualTreesPlanted, and realTreesPlanted 
 * counters for all users based on their actual tree counts in the database.
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const Tree = require('../models/Tree');
const RealTree = require('../models/RealTree');
const logger = require('../utils/logger');
const connectDB = require('../models/database');
require('dotenv').config();

async function fixTreeCounters() {
  try {
    logger.info('Starting tree counter fix script');
    
    // Connect to the database first
    await connectDB();
    logger.info('Connected to MongoDB');

    // Get all users
    const users = await User.find({});
    logger.info(`Processing ${users.length} users`);

    let updatedCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        // Count virtual trees for this user
        const virtualTrees = await Tree.countDocuments({ userId: user._id });
        
        // Count real trees for this user
        const realTrees = await RealTree.countDocuments({ userId: user._id });
        
        // Total trees is the sum of virtual and real trees
        const totalTrees = virtualTrees + realTrees;
        
        // Only update if counts are different
        if (user.treesPlanted !== totalTrees || 
            user.virtualTreesPlanted !== virtualTrees || 
            user.realTreesPlanted !== realTrees) {
          
          // Update user document with correct counts
          await User.findByIdAndUpdate(user._id, {
            treesPlanted: totalTrees,
            virtualTreesPlanted: virtualTrees,
            realTreesPlanted: realTrees
          });
          
          logger.info(`Fixed counts for user ${user._id}: virtual=${virtualTrees}, real=${realTrees}, total=${totalTrees}`);
          updatedCount++;
        }
      } catch (userError) {
        logger.error(`Error processing user ${user._id}:`, userError);
        errorCount++;
      }
    }

    logger.info(`Tree counter fix completed. Updated ${updatedCount} users. Errors: ${errorCount}`);
    
  } catch (error) {
    logger.error('Error running tree counter fix script:', error);
  } finally {
    try {
      await mongoose.disconnect();
      logger.info('Database disconnected');
    } catch (err) {
      logger.error('Error disconnecting from database:', err);
    }
  }
}

// Run the script
fixTreeCounters().catch(err => {
  logger.error('Unhandled error in script:', err);
  process.exit(1);
}); 