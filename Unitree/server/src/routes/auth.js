const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Admin = require('../models/Admin');
const Student = require('../models/Student');
const logger = require('../utils/logger');
const { auth } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// Register user
router.post('/register', async (req, res) => {
  try {
    const { email, password, fullname, nickname, studentId, university } = req.body;

    // Check if user already exists
    let user = await User.findOne({ 
      email: { 
        $regex: new RegExp('^' + email + '$', 'i') 
      }
    });
    if (user) {
      return res.status(400).json({
        message: 'User already exists'
      });
    }

    // Create user
    user = new User({
      email,
      password,
      fullname,
      nickname,
      studentId,
      university
    });

    await user.save();

    // Generate token
    const token = user.getSignedJwtToken();

    res.status(201).json({
      token,
      user: {
        id: user._id,
        fullname: user.fullname,
        nickname: user.nickname,
        email: user.email,
        points: user.points,
        treesPlanted: user.treesPlanted,
        studentId: user.studentId,
        university: user.university,
        avatar: user.avatar,
        role: user.role,
        notificationSettings: {
          achievements: true,
          attendance: true,
          treeHealth: true
        }
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      message: 'Error in user registration'
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        message: 'Please provide an email and password'
      });
    }

    // Check for user
    const user = await User.findOne({ 
      email: { 
        $regex: new RegExp('^' + email + '$', 'i') 
      }
    }).select('+password');
    if (!user) {
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        message: 'Wrong password'
      });
    }

    // Generate token
    const token = user.getSignedJwtToken();

    res.json({
      token,
      user: {
        id: user._id,
        fullname: user.fullname,
        nickname: user.nickname,
        email: user.email,
        points: user.points,
        treesPlanted: user.treesPlanted,
        studentId: user.studentId,
        university: user.university,
        avatar: user.avatar,
        role: user.role,
        notificationSettings: {
          achievements: true,
          attendance: true,
          treeHealth: true
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Error in user login'
    });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      message: 'Error getting user data'
    });
  }
});

// Admin Login
router.post('/admin/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').exists()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { email, password } = req.body;

      // Check if admin exists
      const admin = await Admin.findOne({ email });
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check password
      const isMatch = await admin.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Generate JWT
      const token = jwt.sign(
        { id: admin._id },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      res.json({
        success: true,
        token,
        admin: {
          id: admin._id,
          email: admin.email,
          role: admin.role
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
);

// Send verification code for email verification
router.post('/send-verification-code', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: 'Email is required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      email: { 
        $regex: new RegExp('^' + email + '$', 'i') 
      }
    });
    if (existingUser) {
      return res.status(400).json({
        message: 'User with this email already exists'
      });
    }

    // Check if email exists in students collection
    const studentRecord = await Student.findOne({ 
      email: { 
        $regex: new RegExp('^' + email + '$', 'i') 
      }
    });
    if (!studentRecord) {
      return res.status(404).json({
        message: 'Email not found in student records. Please contact your institution.'
      });
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // For demo purposes, we'll just log the code
    // In production, you would send this via email service
    console.log(`Verification code for ${email}: ${verificationCode}`);
    logger.info(`Verification code sent to ${email}: ${verificationCode}`);

    // Store the code temporarily (in production, use Redis or database)
    // For now, we'll use a simple in-memory store
    global.verificationCodes = global.verificationCodes || {};
    global.verificationCodes[email] = {
      code: verificationCode,
      timestamp: Date.now(),
      attempts: 0
    };

    res.json({
      message: 'Verification code sent successfully',
      // In production, don't send the code in response
      tempCode: verificationCode // Only for demo purposes
    });
  } catch (error) {
    console.error('Send verification code error:', error);
    res.status(500).json({
      message: 'Error sending verification code'
    });
  }
});

// Verify email code
router.post('/verify-email-code', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        message: 'Email and code are required'
      });
    }

    global.verificationCodes = global.verificationCodes || {};
    const storedData = global.verificationCodes[email];

    if (!storedData) {
      return res.status(400).json({
        message: 'No verification code found for this email'
      });
    }

    // Check if code has expired (10 minutes)
    if (Date.now() - storedData.timestamp > 10 * 60 * 1000) {
      delete global.verificationCodes[email];
      return res.status(400).json({
        message: 'Verification code has expired'
      });
    }

    // Check attempts limit
    if (storedData.attempts >= 3) {
      delete global.verificationCodes[email];
      return res.status(400).json({
        message: 'Too many failed attempts. Please request a new code.'
      });
    }

    // Verify code
    if (storedData.code !== code) {
      storedData.attempts++;
      return res.status(400).json({
        message: 'Invalid verification code'
      });
    }

    // Code is valid, clean up
    delete global.verificationCodes[email];

    // Look up student data in the students collection
    try {
      const studentData = await Student.findOne({ 
        email: { 
          $regex: new RegExp('^' + email + '$', 'i') 
        }
      });

      if (!studentData) {
        // If no student record found, return error
        return res.status(404).json({
          message: 'No student record found for this email address. Please contact your institution.'
        });
      }

      logger.info(`Student data found for ${email}: ${studentData.full_name} (${studentData.student_id})`);

      res.json({
        message: 'Email verified successfully',
        studentData: {
          email: studentData.email,
          full_name: studentData.full_name,
          student_id: studentData.student_id
        }
      });
    } catch (dbError) {
      console.error('Database lookup error:', dbError);
      return res.status(500).json({
        message: 'Error looking up student record'
      });
    }
  } catch (error) {
    console.error('Verify email code error:', error);
    res.status(500).json({
      message: 'Error verifying code'
    });
  }
});

// Resend verification code
router.post('/resend-verification-code', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: 'Email is required'
      });
    }

    // Generate new 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    console.log(`New verification code for ${email}: ${verificationCode}`);
    logger.info(`New verification code sent to ${email}: ${verificationCode}`);

    // Update stored code
    global.verificationCodes = global.verificationCodes || {};
    global.verificationCodes[email] = {
      code: verificationCode,
      timestamp: Date.now(),
      attempts: 0
    };

    res.json({
      message: 'Verification code resent successfully',
      tempCode: verificationCode // Only for demo purposes
    });
  } catch (error) {
    console.error('Resend verification code error:', error);
    res.status(500).json({
      message: 'Error resending verification code'
    });
  }
});

// Forgot password - send reset code
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: 'Email is required'
      });
    }

    console.log('Searching for user with email:', email);
    // Check if user exists
    const user = await User.findOne({ 
      email: { 
        $regex: new RegExp('^' + email + '$', 'i') 
      } 
    });
    console.log('User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      return res.status(404).json({
        message: 'No account found with this email address'
      });
    }

    // Generate 6-digit reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    console.log(`Password reset code for ${email}: ${resetCode}`);
    logger.info(`Password reset code sent to ${email}: ${resetCode}`);

    // Store reset code
    global.resetCodes = global.resetCodes || {};
    global.resetCodes[email] = {
      code: resetCode,
      timestamp: Date.now(),
      attempts: 0
    };

    res.json({
      message: 'Password reset code sent to your email',
      tempCode: resetCode // Only for demo purposes
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      message: 'Error sending password reset code'
    });
  }
});

// Verify reset code
router.post('/verify-reset-code', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        message: 'Email and code are required'
      });
    }

    global.resetCodes = global.resetCodes || {};
    const storedData = global.resetCodes[email];

    if (!storedData) {
      return res.status(400).json({
        message: 'No reset code found for this email'
      });
    }

    // Check if code has expired (10 minutes)
    if (Date.now() - storedData.timestamp > 10 * 60 * 1000) {
      delete global.resetCodes[email];
      return res.status(400).json({
        message: 'Reset code has expired'
      });
    }

    // Check attempts limit
    if (storedData.attempts >= 3) {
      delete global.resetCodes[email];
      return res.status(400).json({
        message: 'Too many failed attempts. Please request a new code.'
      });
    }

    // Verify code
    if (storedData.code !== code) {
      storedData.attempts++;
      return res.status(400).json({
        message: 'Invalid reset code'
      });
    }

    res.json({
      message: 'Reset code verified successfully'
    });
  } catch (error) {
    console.error('Verify reset code error:', error);
    res.status(500).json({
      message: 'Error verifying reset code'
    });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({
        message: 'Email, code, and new password are required'
      });
    }

    // Verify the reset code first
    global.resetCodes = global.resetCodes || {};
    const storedData = global.resetCodes[email];

    if (!storedData || storedData.code !== code) {
      return res.status(400).json({
        message: 'Invalid or expired reset code'
      });
    }

    // Find user and update password
    const user = await User.findOne({ 
      email: { 
        $regex: new RegExp('^' + email + '$', 'i') 
      }
    });
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Update password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    await User.findByIdAndUpdate(user._id, { 
      password: hashedPassword 
    }, { 
      runValidators: false 
    });

    // Clean up reset code
    delete global.resetCodes[email];

    res.json({
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      message: 'Error resetting password'
    });
  }
});

// Resend reset code
router.post('/resend-reset-code', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: 'Email is required'
      });
    }

    // Check if user exists
    const user = await User.findOne({ 
      email: { 
        $regex: new RegExp('^' + email + '$', 'i') 
      }
    });
    if (!user) {
      return res.status(404).json({
        message: 'No account found with this email address'
      });
    }

    // Generate new reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    console.log(`New password reset code for ${email}: ${resetCode}`);
    logger.info(`New password reset code sent to ${email}: ${resetCode}`);

    // Update stored code
    global.resetCodes = global.resetCodes || {};
    global.resetCodes[email] = {
      code: resetCode,
      timestamp: Date.now(),
      attempts: 0
    };

    res.json({
      message: 'Reset code resent successfully',
      tempCode: resetCode // Only for demo purposes
    });
  } catch (error) {
    console.error('Resend reset code error:', error);
    res.status(500).json({
      message: 'Error resending reset code'
    });
  }
});

module.exports = router; 