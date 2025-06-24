const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');
const logger = require('../utils/logger');

// Middleware to authenticate user tokens
const auth = async (req, res, next) => {
  try {
    let token;

    // Check if auth header exists and has Bearer format
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        message: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from token with session data
      req.user = await User.findById(decoded.id).select('+activeSession.token +activeSession.refreshToken +activeSession.deviceInfo +activeSession.loginTime +activeSession.lastActivity +activeSession.refreshTokenExpiresAt');
      
      if (!req.user) {
        return res.status(401).json({
          message: 'User no longer exists'
        });
      }

      // Check if the session is still valid (token matches stored session)
      // Skip session validation if user doesn't have activeSession set (for backward compatibility)
      if (req.user.activeSession && req.user.activeSession.token) {
        if (req.user.activeSession.token !== token) {
          return res.status(401).json({
            message: 'Session invalid - please login again',
            code: 'SESSION_INVALID'
          });
        }
        
        // Update last activity for users with active sessions
        await req.user.updateLastActivity();
      }

      next();
    } catch (err) {
      return res.status(401).json({
        message: 'Token is invalid or expired'
      });
    }
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({
      message: 'Server error in auth middleware'
    });
  }
};

// Middleware to authenticate admin tokens
const authAdmin = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id);

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin not found'
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid authentication token'
    });
  }
};

// Middleware to check if admin has required role
const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.admin || req.admin.role !== role) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }
    next();
  };
};

module.exports = {
  auth,
  authAdmin,
  requireRole
}; 