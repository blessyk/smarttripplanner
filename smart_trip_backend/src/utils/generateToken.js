const jwt = require('jsonwebtoken');

/**
 * Generate a JWT access token containing the user's id and role.
 * @param {string} id - The user ID
 * @param {string} role - The user's role ('admin' or 'user')
 * @returns {string} The signed JWT token
 */
const generateToken = (id, role) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  
  return jwt.sign({ id, role }, secret, {
    expiresIn: '7d',
  });
};

module.exports = generateToken;
