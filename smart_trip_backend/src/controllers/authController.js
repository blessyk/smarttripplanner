const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const generateToken = require('../utils/generateToken');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, aadharNumber, role, phone } = req.body;

    // Check if email already exists
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return next(new ApiError(409, 'Email already registered'));
    }

    // Check if Phone number already exists
    if (phone) {
      const phoneExists = await User.findOne({ phone });
      if (phoneExists) {
        return next(new ApiError(409, 'Phone number already registered'));
      }
    }

    // Check if Aadhar number already exists
    const aadharExists = await User.findOne({ aadharNumber });
    if (aadharExists) {
      return next(new ApiError(409, 'Aadhar number already registered'));
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      aadharNumber,
      role: role || 'user',
      phone,
    });

    // Send success response excluding password
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      aadharNumber: user.aadharNumber,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userResponse,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Auth user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return next(new ApiError(401, 'Invalid email or password'));
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(new ApiError(401, 'Invalid email or password'));
    }

    // Generate JWT token
    const token = generateToken(user._id, user.role);

    // Send success response
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      aadharNumber: user.aadharNumber,
      phone: user.phone,
      role: user.role,
    };

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user profile
 * @route   GET /api/auth/profile
 * @access  Private
 */
const getProfile = async (req, res, next) => {
  try {
    // req.user is already set by authMiddleware protect function
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return next(new ApiError(404, 'User not found'));
    }

    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return next(new ApiError(404, 'User not found'));
    }

    const { name, email, aadharNumber, phone } = req.body;

    // If email is changing, check uniqueness
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return next(new ApiError(409, 'Email already registered'));
      }
      user.email = email;
    }

    // If phone is changing, check uniqueness
    if (phone && phone !== user.phone) {
      const phoneExists = await User.findOne({ phone });
      if (phoneExists) {
        return next(new ApiError(409, 'Phone number already registered'));
      }
      user.phone = phone;
    }

    // If Aadhar number is changing, check uniqueness
    if (aadharNumber && aadharNumber !== user.aadharNumber) {
      const aadharExists = await User.findOne({ aadharNumber });
      if (aadharExists) {
        return next(new ApiError(409, 'Aadhar number already registered'));
      }
      user.aadharNumber = aadharNumber;
    }

    // Update name if provided
    if (name) {
      user.name = name;
    }

    // Save user (this will trigger pre-save, but password won't be rehashed because it hasn't modified)
    const updatedUser = await user.save();

    const userResponse = {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      aadharNumber: updatedUser.aadharNumber,
      phone: updatedUser.phone,
      role: updatedUser.role,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: userResponse,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
};
