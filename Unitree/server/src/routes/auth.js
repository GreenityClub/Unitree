const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Admin = require('../models/Admin');
const Student = require('../models/Student');
const VerificationCode = require('../models/VerificationCode');
const logger = require('../utils/logger');
const { auth, authAdmin } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const emailService = require('../utils/emailService');

// =================================================================
// ==                        SHARED APIS                        ==
// =================================================================

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
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

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
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

// @route   POST /api/auth/logout
// @desc    Logout user (invalidate current token)
// @access  Private
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

// @route   POST /api/auth/refresh
// @desc    Refresh access token
// @access  Public (requires valid refresh token)
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

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
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

// @route   POST /api/auth/forgot-password
// @desc    Request password reset
// @access  Public
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

// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
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

// =================================================================
// ==                      MOBILE-ONLY APIS                     ==
// =================================================================

// @route   POST /api/auth/force-logout
// @desc    Force logout user from all devices
// @access  Private (requires password)
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

// =================================================================
// ==                     ADMIN-ONLY APIS                       ==
// =================================================================

// @route   POST /api/auth/admin/login
// @desc    Login admin
// @access  Public
router.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate username & password
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username and password'
      });
    }

    // Find admin by username
    const admin = await Admin.findOne({ username }).select('+password');
    
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login time
    admin.lastLogin = Date.now();
    await admin.save();

    // Generate token
    const token = admin.getSignedJwtToken();

    res.json({
      success: true,
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        role: admin.role,
        permissions: admin.permissions
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in admin'
    });
  }
});

// @route   POST /api/auth/admin/logout
// @desc    Logout admin
// @access  Private (Admin)
router.post('/admin/logout', authAdmin, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id);
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }
    
    // Clear active session
    await admin.clearActiveSession();

    res.json({
      success: true,
      message: 'Admin logged out successfully'
    });
  } catch (error) {
    console.error('Admin logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging out admin'
    });
  }
});

// @route   GET /api/auth/admin/me
// @desc    Get current admin user
// @access  Private (Admin)
router.get('/admin/me', authAdmin, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id);
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }
    
    res.json({
      success: true,
      admin: {
        id: admin._id,
        username: admin.username,
        role: admin.role,
        permissions: admin.permissions,
        createdAt: admin.createdAt,
        lastLogin: admin.lastLogin
      }
    });
  } catch (error) {
    console.error('Get admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting admin data'
    });
  }
});

// @route   POST /api/auth/admin/seed
// @desc    Seed initial admin account
// @access  Public (for initial setup)
router.post('/admin/seed', async (req, res) => {
  try {
    // Check if any admin already exists
    const adminCount = await Admin.countDocuments();
    
    if (adminCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Admin accounts already exist'
      });
    }
    
    // Create super admin
    const superAdmin = new Admin({
      username: 'GreenitySA',
      password: 'Vcnghzkldzfgtd1.',
      role: 'superadmin'
    });
    
    await superAdmin.save();
    
    res.status(201).json({
      success: true,
      message: 'Super admin account created successfully'
    });
  } catch (error) {
    console.error('Super admin creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating super admin'
    });
  }
});

// @route   POST /api/auth/admin/change-password
// @desc    Change admin password
// @access  Private (Admin)
router.post('/admin/change-password', authAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate current and new password
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    // Find admin by ID
    const admin = await Admin.findById(req.admin._id).select('+password');
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Check if current password matches
    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid current password'
      });
    }

    // Update password
    admin.password = newPassword;
    await admin.save();

    res.json({
      success: true,
      message: 'Admin password changed successfully'
    });
  } catch (error) {
    console.error('Admin change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing admin password'
    });
  }
});

// =================================================================
// ==                  DEPRECATED/UNUSED APIS                   ==
// =================================================================

// Note: The following APIs do not appear to be used by the current mobile or web clients.
// They are kept for potential future use or backward compatibility but can be considered for removal.

// @route   GET /api/auth/user
// @desc    (DEPRECATED) Get current user
// @access  Private
router.get('/user', auth, async (req, res) => {
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

// @route   GET /api/auth/status
// @desc    (DEPRECATED) Check auth status
// @access  Private
router.get('/status', auth, (req, res) => {
  res.json({
    authenticated: true
  });
});

// @route   POST /api/auth/verify-email
// @desc    (DEPRECATED) Verify user email
// @access  Public
router.post('/verify-email', [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('code').notEmpty().withMessage('Code is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array()
    });
  }

  try {
    const { email, code } = req.body;

    // Verify email code using database model
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

// @route   POST /api/auth/resend-verification
// @desc    (DEPRECATED) Resend verification email
// @access  Public
router.post('/resend-verification', [
  body('email').isEmail().withMessage('Please enter a valid email')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
      return res.status(400).json({
      errors: errors.array()
    });
  }

  try {
    const { email } = req.body;

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

// =================================================================
// ==                MANUAL DELETION CHECKLIST                ==
// =================================================================
// The following routes were identified as potentially deprecated or unused.
// Please verify they are no longer needed before deleting them manually.
// 1. GET /api/auth/user
// 2. GET /api/auth/status
// 3. POST /api/auth/verify-email
// 4. POST /api/auth/resend-verification
// =================================================================

module.exports = router; 