/**
 * Validation Middleware for QueueFlow Pro APIs
 */

const validateRegister = (req, res, next) => {
  const { name, email, password, confirmPassword } = req.body;

  if (!name || !email || !password || !confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'All fields (name, email, password, confirmPassword) are required.',
    });
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email.trim())) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address.',
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 8 characters long.',
    });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'Password and Confirm Password do not match.',
    });
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required.',
    });
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email.trim())) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email format.',
    });
  }

  next();
};

const validateQueue = (req, res, next) => {
  const { name, prefix } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Queue name is required.',
    });
  }

  if (req.method === 'POST') {
    if (!prefix || !prefix.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Token prefix is required (e.g., T, C, B).',
      });
    }

    if (prefix.trim().length > 6) {
      return res.status(400).json({
        success: false,
        message: 'Prefix cannot exceed 6 characters.',
      });
    }
  }

  next();
};

const validateTokenCreate = (req, res, next) => {
  const { personName } = req.body;

  if (!personName || !personName.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Customer name is required.',
    });
  }

  if (personName.trim().length > 100) {
    return res.status(400).json({
      success: false,
      message: 'Customer name cannot exceed 100 characters.',
    });
  }

  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateQueue,
  validateTokenCreate,
};
