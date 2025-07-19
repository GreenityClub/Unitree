/**
 * Seed Super Admin script
 * 
 * This script creates a super admin account in the database.
 * Run it with: node src/scripts/seedSuperAdmin.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { env } = require('../config/env');
const Admin = require('../models/Admin');

// Create super admin with username and password
const createSuperAdmin = async () => {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb+srv://Greenity:greenityclub2204@cluster0.epzjlse.mongodb.net/unitree?retryWrites=true&w=majority&appName=Cluster0', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected');

    // Check if any admin already exists
    const adminCount = await Admin.countDocuments();
    
    if (adminCount > 0) {
      console.log('Admin accounts already exist. Aborting.');
      return;
    }
    
    // Create super admin
    const superAdmin = new Admin({
      username: 'GreenitySA',
      password: 'Vcnghzkldzfgtd1.',
      role: 'superadmin'
    });
    
    await superAdmin.save();
    
    console.log('Super admin account created successfully!');
    console.log('Username: GreenitySA');
    console.log('Password: Vcnghzkldzfgtd1.');
    console.log('Role: superadmin');
  } catch (error) {
    console.error('Error creating super admin:', error);
  } finally {
    mongoose.disconnect();
    console.log('MongoDB Disconnected');
  }
};

createSuperAdmin(); 