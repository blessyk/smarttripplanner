const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

/**
 * Middleware to protect routes and verify JWT tokens.
 */
const protect = async (req, res, next) => {
  let token;

  // Check for Bearer token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the database (excluding password)
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return next(new ApiError(401, 'Not authorized, user not found'));
      }

      // Attach user object to request
      req.user = user;
      next();
    } catch (error) {
      next(error); // will be handled by centralized error middleware (JWT verification/expiry errors)
    }
  } else {
    next(new ApiError(401, 'Not authorized, token missing'));
  }
};

module.exports = { protect };
