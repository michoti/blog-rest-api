const jwt = require('jsonwebtoken');
const BlacklistedToken = require('../models/BlacklistedToken');
const User = require('../models/User');
const errorHandler = require('../utils/errorHandling').withScope('AuthMiddleware');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return errorHandler.handleAuthError('No token provided', res);
  }

  try {
    // Check if token is blacklisted in the database
    const blacklistedToken = await BlacklistedToken.findOne({ token });
    if (blacklistedToken) {
      return errorHandler.handleAuthError('Token is invalid', res);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    errorHandler.logInfo('Token verified', { userId: decoded.userId });
    next();
  } catch (err) {
    return errorHandler.handleAuthError(err, res, 'Token verification failed');
  }
};

// Add token to blacklist in the database
const addToBlacklist = async (token) => {
  try {
    // Set expiration to match JWT (30 days)
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await BlacklistedToken.create({ token, expiresAt });
    errorHandler.logSuccess('Token blacklisted', { token: token.substring(0, 10) + '...' });
  } catch (error) {
    throw error; // Let global error handler catch this
  }
};

// Restrict to admin users
const restrictToAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return errorHandler.handleNotFoundError('User not found', res);
    }
    if (user.role !== 'admin') {
      return errorHandler.handleAuthError('Admin access required', res);
    }
    errorHandler.logInfo('Admin access verified', { userId: req.user.userId });
    next();
  } catch (error) {
    return errorHandler.handleDatabaseError(error, res);
  }
};

module.exports = { protect, addToBlacklist, restrictToAdmin };