const jwt = require('jsonwebtoken');

/**
 * Generate a JSON Web Token for an authenticated manager.
 * @param {string|ObjectId} managerId
 * @returns {string} Signed JWT token
 */
const generateAuthToken = (managerId) => {
  const secret = process.env.JWT_SECRET || 'queueflow_super_secret_jwt_key_2026';
  const expiresIn = process.env.JWT_EXPIRE || '7d';

  return jwt.sign({ id: managerId }, secret, {
    expiresIn,
  });
};

/**
 * Formats a sequential number with a prefix into a standard token code (e.g., T-001)
 * @param {string} prefix
 * @param {number} number
 * @returns {string}
 */
const formatTokenCode = (prefix, number) => {
  const cleanPrefix = (prefix || 'T').toUpperCase().trim();
  const paddedNumber = String(number).padStart(3, '0');
  return `${cleanPrefix}-${paddedNumber}`;
};

module.exports = {
  generateAuthToken,
  formatTokenCode,
};
