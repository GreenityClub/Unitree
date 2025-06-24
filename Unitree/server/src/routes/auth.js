const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Admin = require('../models/Admin');
const Student = require('../models/Student');
const VerificationCode = require('../models/VerificationCode');
const logger = require('../utils/logger');
const { auth } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const emailService = require('../utils/emailService');

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

    // Generate tokens
    const token = user.getSignedJwtToken();
    const refreshToken = user.getSignedRefreshToken();

    // Get device info from User-Agent header or default
    const deviceInfo = req.headers['user-agent'] || 'Unknown Device';

    // Set active session for registration
    await user.setActiveSession(token, refreshToken, deviceInfo);

    res.status(201).json({
      token,
      refreshToken,
      user: {
        id: user._id,
        fullname: user.fullname,
        nickname: user.nickname,
        email: user.email,
        points: user.points,
        allTimePoints: user.allTimePoints || 0,
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

    // Check for user - include session data to check for active sessions
    const user = await User.findOne({ 
      email: { 
        $regex: new RegExp('^' + email + '$', 'i') 
      }
    }).select('+password +activeSession.token +activeSession.refreshToken +activeSession.deviceInfo +activeSession.loginTime +activeSession.refreshTokenExpiresAt');
    
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

    // Check for active session on another device
    if (user.hasActiveSession()) {
      return res.status(409).json({
        message: 'Account is already logged in on another device. Please logout from the other device first.',
        code: 'ACCOUNT_ALREADY_LOGGED_IN',
        deviceInfo: user.activeSession.deviceInfo,
        loginTime: user.activeSession.loginTime
      });
    }

    // Generate tokens
    const token = user.getSignedJwtToken();
    const refreshToken = user.getSignedRefreshToken();

    // Get device info from User-Agent header or default
    const deviceInfo = req.headers['user-agent'] || 'Unknown Device';

    // Set active session
    await user.setActiveSession(token, refreshToken, deviceInfo);

    res.json({
      token,
      refreshToken,
      user: {
        id: user._id,
        fullname: user.fullname,
        nickname: user.nickname,
        email: user.email,
        points: user.points,
        allTimePoints: user.allTimePoints || 0,
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

// Refresh access token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        message: 'Invalid or expired refresh token'
      });
    }

    // Check if it's actually a refresh token
    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        message: 'Invalid token type'
      });
    }

    // Get user with session data
    const user = await User.findById(decoded.id).select('+activeSession.refreshToken +activeSession.refreshTokenExpiresAt');
    
    if (!user) {
      return res.status(401).json({
        message: 'User no longer exists'
      });
    }

    // Verify refresh token against stored session
    if (!user.hasValidRefreshToken(refreshToken)) {
      return res.status(401).json({
        message: 'Invalid refresh token or session expired'
      });
    }

    // Generate new access token
    const newAccessToken = user.getSignedJwtToken();
    
    // Update stored access token
    await user.updateAccessToken(newAccessToken);

    res.json({
      token: newAccessToken,
      refreshToken: refreshToken, // Return the same refresh token
      user: {
        id: user._id,
        fullname: user.fullname,
        nickname: user.nickname,
        email: user.email,
        points: user.points,
        allTimePoints: user.allTimePoints || 0,
        treesPlanted: user.treesPlanted,
        studentId: user.studentId,
        university: user.university,
        avatar: user.avatar,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      message: 'Error refreshing token'
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
    
    // Send verification code via email
    const emailResult = await emailService.sendVerificationCode(email, verificationCode, 'registration');
    
    if (!emailResult.success) {
      return res.status(500).json({
        message: 'Failed to send verification email. Please try again.'
      });
    }

    // Store the code in database with TTL expiration
    await VerificationCode.createCode(email, verificationCode, 'verification');

    res.json({
      message: 'Verification code sent to your email address'
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

    // Verify code using database model
    const verificationResult = await VerificationCode.verifyCode(email, code, 'verification');
    
    if (!verificationResult.success) {
      return res.status(400).json({
        message: verificationResult.error
      });
    }

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
    
    // Send verification code via email
    const emailResult = await emailService.sendVerificationCode(email, verificationCode, 'registration');
    
    if (!emailResult.success) {
      return res.status(500).json({
        message: 'Failed to resend verification email. Please try again.'
      });
    }

    // Update stored code in database
    await VerificationCode.createCode(email, verificationCode, 'verification');

    res.json({
      message: 'Verification code resent to your email address'
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
    
    // Send reset code via email
    const emailResult = await emailService.sendVerificationCode(email, resetCode, 'password_reset');
    
    if (!emailResult.success) {
      return res.status(500).json({
        message: 'Failed to send password reset email. Please try again.'
      });
    }

    // Store reset code in database
    await VerificationCode.createCode(email, resetCode, 'reset');

    res.json({
      message: 'Password reset code sent to your email address'
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

    // Verify reset code using database model
    const verificationResult = await VerificationCode.verifyCode(email, code, 'reset');
    
    if (!verificationResult.success) {
      return res.status(400).json({
        message: verificationResult.error
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
    const verificationResult = await VerificationCode.verifyCode(email, code, 'reset');
    
    if (!verificationResult.success) {
      return res.status(400).json({
        message: verificationResult.error
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

    // Clear active session for security (user needs to login again)
    await user.clearActiveSession();

    // Reset code is automatically cleaned up by the verification process

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
    
    // Send reset code via email
    const emailResult = await emailService.sendVerificationCode(email, resetCode, 'password_reset');
    
    if (!emailResult.success) {
      return res.status(500).json({
        message: 'Failed to resend password reset email. Please try again.'
      });
    }

    // Store reset code in database
    await VerificationCode.createCode(email, resetCode, 'reset');

    res.json({
      message: 'Password reset code resent to your email address'
    });
  } catch (error) {
    console.error('Resend reset code error:', error);
    res.status(500).json({
      message: 'Error resending reset code'
    });
  }
});

// Logout user
router.post('/logout', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      await user.clearActiveSession();
    }
    
    res.json({
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      message: 'Error during logout'
    });
  }
});

// Force logout - allows user to logout from other device
router.post('/force-logout', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        message: 'Please provide email and password to force logout'
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

    // Clear active session
    await user.clearActiveSession();

    res.json({
      message: 'Successfully logged out from other device'
    });
  } catch (error) {
    console.error('Force logout error:', error);
    res.status(500).json({
      message: 'Error during force logout'
    });
  }
});

// Test email endpoint (for development/testing purposes)
router.post('/test-email', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: 'Email is required'
      });
    }

    // Send test email
    const result = await emailService.sendTestEmail(email);

    if (result.success) {
      res.json({
        message: 'Test email sent successfully',
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        message: 'Failed to send test email',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      message: 'Error sending test email'
    });
  }
});

module.exports = router; 