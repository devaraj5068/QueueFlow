const Manager = require('../models/Manager');
const Queue = require('../models/Queue');
const { generateAuthToken } = require('../utils/generateToken');

/**
 * @desc    Register a new manager account
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // Check for existing manager
    const existingManager = await Manager.findOne({ email: normalizedEmail });
    if (existingManager) {
      return res.status(400).json({
        success: false,
        message: 'A manager with this email address already exists.',
      });
    }

    // Create manager
    const manager = await Manager.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
    });

    // Optionally create a default queue for convenience (e.g., "General Counter")
    await Queue.create({
      manager: manager._id,
      name: 'General Counter',
      prefix: 'Q',
      nextNumber: 1,
    });

    const token = generateAuthToken(manager._id);

    return res.status(201).json({
      success: true,
      message: 'Manager registered successfully',
      token,
      manager: {
        _id: manager._id,
        name: manager.name,
        email: manager.email,
        createdAt: manager.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate manager & retrieve JWT
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // Query manager with password field
    const manager = await Manager.findOne({ email: normalizedEmail }).select('+password');
    if (!manager) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await manager.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const token = generateAuthToken(manager._id);

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      manager: {
        _id: manager._id,
        name: manager.name,
        email: manager.email,
        createdAt: manager.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current authenticated manager profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      manager: req.manager,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
};
