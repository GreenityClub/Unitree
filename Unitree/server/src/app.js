require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const logger = require('./utils/logger');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const wifiRoutes = require('./routes/wifi');
const treeRoutes = require('./routes/tree');
const pointsRoutes = require('./routes/points');

const app = express();

// Middleware
app.use(cors({
  origin: [
    process.env.CLIENT_URL,
    process.env.CLIENT_DEV_URL,
    process.env.CLIENT_URL_DEV,
    process.env.CLIENT_URL_DEV_2,
    'http://192.168.1.5:3000',  // Add the mobile app's API URL
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
console.log('Connecting to MongoDB...');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB Connected successfully');
    console.log('Database URI:', process.env.MONGODB_URI);
  })
  .catch(err => {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/wifi', wifiRoutes);
app.use('/api/trees', treeRoutes);
app.use('/api/points', pointsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ message: 'Something broke!' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('Environment:', process.env.NODE_ENV);
});

module.exports = app; 