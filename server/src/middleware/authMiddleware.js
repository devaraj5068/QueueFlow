const jwt = require('jsonwebtoken');
const Manager = require('../models/Manager');

/**
 * Protect routes by verifying JWT in Authorization header.
 * Derives manager identity solely from the token.
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.',
    });
  }

  try {
    const secret = process.env.JWT_SECRET || 'queueflow_super_secret_jwt_key_2026';
    const decoded = jwt.verify(token, secret);

    const manager = await Manager.findById(decoded.id).select('-password');
    if (!manager) {
      return res.status(401).json({
        success: false,
        message: 'The manager account for this token no longer exists.',
      });
    }

    // Attach verified manager to request object
    req.manager = manager;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Authentication session expired. Please log in again.',
        isExpired: true,
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid authentication token.',
    });
  }
};

module.exports = { protect };
