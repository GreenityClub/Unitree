require('dotenv').config();
const mongoose = require('mongoose');

// Import all models to ensure they are registered
const User = require('../models/User');
const Student = require('../models/Student');
const Tree = require('../models/Tree');
const RealTree = require('../models/RealTree');
const TreeType = require('../models/TreeType');
const Point = require('../models/Point');
const WifiSession = require('../models/WifiSession');
const Admin = require('../models/Admin');

async function migrateModels() {
  try {
    console.log('🚀 Starting model migration...');
    
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected successfully');

    // List all models to be migrated
    const models = [
      { name: 'User', model: User },
      { name: 'Student', model: Student },
      { name: 'Tree', model: Tree },
      { name: 'RealTree', model: RealTree },
      { name: 'TreeType', model: TreeType },
      { name: 'Point', model: Point },
      { name: 'WifiSession', model: WifiSession },
      { name: 'Admin', model: Admin }
    ];

    console.log('📋 Migrating models and ensuring indexes...');

    for (const { name, model } of models) {
      try {
        console.log(`🔧 Processing ${name} model...`);
        
        // Ensure collection exists and indexes are created
        await model.init();
        
        // Get collection stats
        const stats = await model.collection.stats().catch(() => ({ count: 0 }));
        console.log(`   ✅ ${name}: Collection ready (${stats.count || 0} documents)`);
        
        // List indexes for this collection
        const indexes = await model.collection.listIndexes().toArray();
        console.log(`   📊 ${name}: ${indexes.length} indexes created`);
        
      } catch (error) {
        console.log(`   ⚠️  ${name}: ${error.message}`);
      }
    }

    // Specific migrations for data consistency
    console.log('🔄 Running data consistency checks...');
    
    // Ensure case-insensitive email searches work properly
    console.log('📧 Checking email case-insensitivity...');
    const emailIndexes = await Student.collection.listIndexes().toArray();
    const hasEmailIndex = emailIndexes.some(index => index.key && index.key.email);
    if (hasEmailIndex) {
      console.log('   ✅ Student email index exists');
    } else {
      console.log('   ⚠️  Student email index missing');
    }

    // Check for any users missing allTimePoints (migration from older schema)
    console.log('🔢 Checking for users missing allTimePoints...');
    const usersWithoutAllTimePoints = await User.countDocuments({
      $or: [
        { allTimePoints: { $exists: false } },
        { allTimePoints: null }
      ]
    });
    
    if (usersWithoutAllTimePoints > 0) {
      console.log(`   🔧 Found ${usersWithoutAllTimePoints} users missing allTimePoints, updating...`);
      await User.updateMany(
        {
          $or: [
            { allTimePoints: { $exists: false } },
            { allTimePoints: null }
          ]
        },
        {
          $set: { allTimePoints: 0 }
        }
      );
      console.log('   ✅ Updated users with missing allTimePoints');
    } else {
      console.log('   ✅ All users have allTimePoints field');
    }

    // Check for users missing WiFi tracking fields
    console.log('📶 Checking WiFi tracking fields...');
    const usersWithoutWifiFields = await User.countDocuments({
      $or: [
        { totalTimeConnected: { $exists: false } },
        { dayTimeConnected: { $exists: false } },
        { weekTimeConnected: { $exists: false } },
        { monthTimeConnected: { $exists: false } }
      ]
    });

    if (usersWithoutWifiFields > 0) {
      console.log(`   🔧 Found ${usersWithoutWifiFields} users missing WiFi fields, updating...`);
      await User.updateMany(
        {
          $or: [
            { totalTimeConnected: { $exists: false } },
            { dayTimeConnected: { $exists: false } },
            { weekTimeConnected: { $exists: false } },
            { monthTimeConnected: { $exists: false } }
          ]
        },
        {
          $set: {
            totalTimeConnected: 0,
            dayTimeConnected: 0,
            weekTimeConnected: 0,
            monthTimeConnected: 0
          }
        }
      );
      console.log('   ✅ Updated users with missing WiFi tracking fields');
    } else {
      console.log('   ✅ All users have WiFi tracking fields');
    }

    // Check notification settings
    console.log('🔔 Checking notification settings...');
    const usersWithoutNotificationSettings = await User.countDocuments({
      'notificationSettings': { $exists: false }
    });

    if (usersWithoutNotificationSettings > 0) {
      console.log(`   🔧 Found ${usersWithoutNotificationSettings} users missing notification settings, updating...`);
      await User.updateMany(
        { 'notificationSettings': { $exists: false } },
        {
          $set: {
            'notificationSettings': {
              pushNotificationsEnabled: true,
              appReminderNotifications: true,
              statsNotifications: true,
              dailyStatsTime: "20:00",
              weeklyStatsDay: 0,
              monthlyStatsDay: 1
            }
          }
        }
      );
      console.log('   ✅ Updated users with missing notification settings');
    } else {
      console.log('   ✅ All users have notification settings');
    }

    // Summary
    console.log('\n📊 Migration Summary:');
    for (const { name, model } of models) {
      try {
        const count = await model.countDocuments();
        console.log(`   ${name}: ${count} documents`);
      } catch (error) {
        console.log(`   ${name}: Error getting count`);
      }
    }

    console.log('\n✅ Model migration completed successfully!');
    console.log('🎉 All models are now properly synchronized with the database.');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the migration
if (require.main === module) {
  migrateModels();
}

module.exports = migrateModels; 