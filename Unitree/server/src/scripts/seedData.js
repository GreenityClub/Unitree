require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Point = require('../models/Point');
const Tree = require('../models/Tree');

async function seedData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create a test user
    const user = await User.create({
      fullname: 'Test User',
      nickname: 'testuser',
      email: 'test@university.edu',
      password: 'password123',
      university: 'Test University',
      points: 150
    });
    console.log('Created test user');

    // Create a test tree
    const tree = await Tree.create({
      userId: user._id,
      species: 'oak-001',
      name: 'Oak Tree',
      plantedDate: new Date(),
      lastWatered: new Date(),
      stage: 'seedling',
      healthScore: 100
    });
    console.log('Created test tree');

    // Create test point transaction
    await Point.create({
      userId: user._id,
      amount: 50,
      type: 'BONUS',
      metadata: {
        description: 'Welcome bonus points'
      }
    });
    console.log('Created test point transaction');

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seedData(); 