const mongoose = require('mongoose');

const verificationCodeSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    index: true
  },
  code: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['verification', 'reset']
  },
  attempts: {
    type: Number,
    default: 0,
    max: 3
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
    index: { expireAfterSeconds: 0 } // MongoDB TTL index for automatic cleanup
  }
}, {
  timestamps: true
});

// Static method to create or update verification code
verificationCodeSchema.statics.createCode = async function(email, code, type) {
  return await this.findOneAndUpdate(
    { email: email.toLowerCase(), type },
    { 
      code, 
      attempts: 0, 
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) 
    },
    { 
      upsert: true, 
      new: true 
    }
  );
};

// Static method to verify code
verificationCodeSchema.statics.verifyCode = async function(email, code, type) {
  const record = await this.findOne({ 
    email: email.toLowerCase(), 
    type,
    expiresAt: { $gt: new Date() }
  });

  if (!record) {
    return { success: false, error: 'No verification code found or code expired' };
  }

  if (record.attempts >= 3) {
    await record.deleteOne();
    return { success: false, error: 'Too many failed attempts. Please request a new code.' };
  }

  if (record.code !== code) {
    record.attempts += 1;
    await record.save();
    return { success: false, error: 'Invalid verification code' };
  }

  // Success - remove the code
  await record.deleteOne();
  return { success: true };
};

// Static method to cleanup expired codes (optional, since TTL handles it)
verificationCodeSchema.statics.cleanupExpired = async function() {
  return await this.deleteMany({ expiresAt: { $lt: new Date() } });
};

module.exports = mongoose.model('VerificationCode', verificationCodeSchema); 