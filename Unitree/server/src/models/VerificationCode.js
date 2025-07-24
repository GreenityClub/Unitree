const mongoose = require('mongoose');

// =================================================================
// ==                 VERIFICATION CODE SCHEMA                  ==
// =================================================================

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
    enum: ['verification', 'reset'],
    comment: "'verification' for new accounts, 'reset' for password resets."
  },
  attempts: {
    type: Number,
    default: 0
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    index: { expiresAt: 1 }, // Index for querying
  }
}, { timestamps: true });

// MongoDB TTL index for automatic cleanup of expired documents
verificationCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });


// =================================================================
// ==                       STATIC METHODS                      ==
// =================================================================

/**
 * Creates or updates a verification code for a given email and type.
 * Resets attempts and expiration on creation/update.
 */
verificationCodeSchema.statics.createCode = async function(email, code, type) {
  return await this.findOneAndUpdate(
    { email: email.toLowerCase(), type },
    { 
      code, 
      attempts: 0, 
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) 
    },
    { upsert: true, new: true }
  );
};

/**
 * Verifies a code, handling expiration and attempt limits.
 * Deletes the code upon successful verification or too many attempts.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
verificationCodeSchema.statics.verifyCode = async function(email, code, type) {
  const record = await this.findOne({ 
    email: email.toLowerCase(), 
    type,
    expiresAt: { $gt: new Date() }
  });

  if (!record) {
    return { success: false, error: 'Invalid or expired code. Please request a new one.' };
  }

  if (record.attempts >= 3) {
    await record.deleteOne();
    return { success: false, error: 'Too many failed attempts. Please request a new code.' };
  }

  if (record.code !== code) {
    record.attempts += 1;
    await record.save();
    return { success: false, error: 'The code you entered is incorrect.' };
  }

  await record.deleteOne();
  return { success: true };
};


module.exports = mongoose.model('VerificationCode', verificationCodeSchema); 