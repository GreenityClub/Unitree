const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');
const logger = require('../utils/logger');

// =================================================================
// ==                  USER AUTHENTICATION                      ==
// =================================================================

/**
 * Middleware to authenticate user tokens.
 * Verifies the JWT from the Authorization header, checks if the user exists,
 * and validates the session against the active session stored in the user's document.
 * This is primarily used for mobile client APIs.
 */
const auth = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        message: 'Not authorized, no token'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      req.user = await User.findById(decoded.id).select('+activeSession.token');
      
      if (!req.user) {
        return res.status(401).json({
          message: 'User not found'
        });
      }

      // Session validation: Ensure the provided token matches the one in the DB
      if (req.user.activeSession && req.user.activeSession.token !== token) {
        return res.status(401).json({
          message: 'Session is invalid. Please log in again.',
          code: 'SESSION_INVALID'
        });
      }
      
      next();
    } catch (err) {
      return res.status(401).json({
        message: 'Token is not valid'
      });
    }
  } catch (err) {
    logger.error('Auth middleware error:', err);
    res.status(500).json({
      message: 'Server error during authentication'
    });
  }
};

// =================================================================
// ==                  ADMIN AUTHENTICATION                     ==
// =================================================================

/**
 * Middleware to authenticate admin tokens.
 * Verifies the JWT from the Authorization header and attaches the admin document to the request.
 * This is used for web admin dashboard APIs.
 */
const authAdmin = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token, authorization denied'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id);

    if (!admin) {
        return res.status(401).json({
            success: false,
            message: 'Admin not found, token is invalid'
        });
    }

    req.admin = admin;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token is not valid'
    });
  }
};

/**
 * Middleware factory to require a specific admin role.
 * This should be used after `authAdmin`.
 * @param {string} role The required role (e.g., 'superadmin').
 */
const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.admin || req.admin.role !== role) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Insufficient permissions for this action'
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