const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  student_id: {
    type: String,
    required: true,
    unique: true
  },
  full_name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  }
}, {
  timestamps: true,
  collection: 'students' // Explicitly specify the collection name
});

// Create case-insensitive index for email
studentSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model('Student', studentSchema); 