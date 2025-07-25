/**
 * Script to remove email fields from admin documents
 * 
 * This script addresses the duplicate key issue with email fields
 * by removing the email field entirely from all admin documents
 */

const mongoose = require('mongoose');
const logger = require('../utils/logger');
const connectDB = require('../models/database');
require('dotenv').config();

async function removeAdminEmails() {
  try {
    logger.info('Starting admin email removal script');
    
    // Connect to the database
    await connectDB();
    logger.info('Connected to MongoDB');

    // Use the native MongoDB driver to update all admin documents
    const db = mongoose.connection.db;
    const adminsCollection = db.collection('admins');
    
    // Remove the email field from all admin documents
    const result = await adminsCollection.updateMany(
      {}, // Match all documents
      { $unset: { email: "" } } // Remove the email field
    );
    
    logger.info(`Updated ${result.modifiedCount} admin documents: removed email field`);
    
    // Drop the email index if it exists
    try {
      await adminsCollection.dropIndex('email_1');
      logger.info('Successfully dropped the email index');
    } catch (indexError) {
      logger.info('No email index found or unable to drop index:', indexError.message);
    }

    logger.info('Admin email removal completed successfully');
    
  } catch (error) {
    logger.error('Error running admin email removal script:', error);
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
removeAdminEmails().catch(err => {
  logger.error('Unhandled error in script:', err);
  process.exit(1);
}); 