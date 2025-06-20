require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function migrateAllTimePoints() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all users who don't have allTimePoints set or have it set to 0
    const users = await User.find({
      $or: [
        { allTimePoints: { $exists: false } },
        { allTimePoints: 0 }
      ]
    });

    console.log(`Found ${users.length} users to migrate`);

    for (const user of users) {
      // Initialize allTimePoints with current points
      // This assumes existing points represent lifetime earned points
      const allTimePoints = user.points || 0;
      
      await User.findByIdAndUpdate(
        user._id,
        { allTimePoints },
        { runValidators: false }
      );
      
      console.log(`Updated user ${user.email}: allTimePoints = ${allTimePoints}`);
    }

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateAllTimePoints(); 