require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Achievement = require('../models/Achievement');

const Point = require('../models/Point');
const RedemptionRequest = require('../models/RedemptionRequest');
const Tree = require('../models/Tree');

async function seedData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create a test user
    const user = await User.create({
      name: 'Test User',
      email: 'test@university.edu',
      password: 'password123',
      university: 'Test University',
      points: 150
    });
    console.log('Created test user');

    // Create a test tree
    const tree = await Tree.create({
      owner: user._id,
      type: 'Oak',
      stage: 'sapling',
      health: 100,
      plantedDate: new Date(),
      growthProgress: 10
    });
    console.log('Created test tree');

    // Create test achievement
    const achievement = await Achievement.create({
      user: user._id,
      type: 'FIRST_TREE',
      title: 'First Tree Planted!',
      description: 'You planted your first tree',
      points: 50,
      metadata: {
        treeCount: 1
      }
    });
    console.log('Created test achievement');



    // Create test point transaction
    await Point.create({
      user: user._id,
      amount: 50,
      type: 'ACHIEVEMENT',
      description: 'First Tree Achievement Bonus',
      reference: {
        type: 'achievement',
        id: achievement._id
      }
    });
    console.log('Created test point transaction');

    // Create test redemption request
    await RedemptionRequest.create({
      user: user._id,
      tree: tree._id,
      status: 'pending',
      shippingDetails: {
        name: 'Test User',
        address: '123 University St',
        city: 'College Town',
        state: 'ST',
        zipCode: '12345',
        country: 'United States',
        phone: '123-456-7890'
      },
      notes: 'Please deliver on weekdays'
    });
    console.log('Created test redemption request');

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seedData(); 