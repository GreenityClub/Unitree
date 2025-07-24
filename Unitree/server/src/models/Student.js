const mongoose = require('mongoose');

// =================================================================
// ==                       STUDENT SCHEMA                      ==
// =================================================================
// This collection stores pre-loaded student data for verification purposes.

const studentSchema = new mongoose.Schema({
  student_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  full_name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  }
}, {
  timestamps: true,
  collection: 'students'
});

module.exports = mongoose.model('Student', studentSchema); 