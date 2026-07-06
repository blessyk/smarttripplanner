const ApiError = require('../utils/ApiError');

/**
 * Middleware to restrict access based on user roles.
 * @param {...string} roles - The allowed roles (e.g. 'admin', 'user')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Not authorized, user credentials missing'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          `User role '${req.user.role}' is not authorized to access this route`
        )
      );
    }

    next();
  };
};

module.exports = { authorize };
