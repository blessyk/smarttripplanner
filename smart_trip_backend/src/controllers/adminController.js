const User = require('../models/User');
const AiLog = require('../models/AiLog');
const Setting = require('../models/Setting');
const ApiError = require('../utils/ApiError');

/**
 * @desc    Get all users
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const search = req.query.search || '';
    const startIndex = (page - 1) * limit;

    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { aadharNumber: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .skip(startIndex)
      .limit(limit);

    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      data: {
        users,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user by ID
 * @route   GET /api/admin/users/:id
 * @access  Private/Admin
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return next(new ApiError(404, `User not found with ID ${req.params.id}`));
    }

    res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete user by ID
 * @route   DELETE /api/admin/users/:id
 * @access  Private/Admin
 */
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return next(new ApiError(404, `User not found with ID ${req.params.id}`));
    }

    if (user.role === 'admin') {
      return next(new ApiError(400, 'Cannot delete an administrator account'));
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user by ID
 * @route   PUT /api/admin/users/:id
 * @access  Private/Admin
 */
const updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return next(new ApiError(404, `User not found with ID ${req.params.id}`));
    }

    const { name, email, phone, aadharNumber, role } = req.body;

    if (role && user.role === 'admin' && role !== 'admin') {
      return next(new ApiError(400, 'Cannot demote an administrator account'));
    }

    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (phone) updates.phone = phone;
    if (aadharNumber) updates.aadharNumber = aadharNumber;
    if (role) updates.role = role;

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: {
        user: updatedUser
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all AI request/response logs
 * @route   GET /api/admin/ai-logs
 * @access  Private/Admin
 */
const getAiLogs = async (req, res, next) => {
  try {
    const logs = await AiLog.find()
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'AI logs retrieved successfully',
      data: {
        logs
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Gemini Model configuration setting
 * @route   GET /api/admin/settings/gemini-model
 * @access  Private/Admin
 */
const getGeminiModelSetting = async (req, res, next) => {
  try {
    let setting = await Setting.findOne({ key: 'GEMINI_MODEL' });
    if (!setting) {
      setting = { key: 'GEMINI_MODEL', value: 'gemini-flash-latest' };
    }
    res.status(200).json({
      success: true,
      data: setting
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update Gemini Model configuration setting
 * @route   PUT /api/admin/settings/gemini-model
 * @access  Private/Admin
 */
const updateGeminiModelSetting = async (req, res, next) => {
  try {
    const { value } = req.body;
    if (!value) return next(new ApiError(400, 'Model value is required'));

    const setting = await Setting.findOneAndUpdate(
      { key: 'GEMINI_MODEL' },
      { value },
      { returnDocument: 'after', upsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'Gemini model setting updated successfully',
      data: setting
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get AI Provider configuration setting
 * @route   GET /api/admin/settings/ai-provider
 * @access  Private/Admin
 */
const getAiProviderSetting = async (req, res, next) => {
  try {
    let setting = await Setting.findOne({ key: 'AI_PROVIDER' });
    if (!setting) {
      setting = { key: 'AI_PROVIDER', value: 'gemini' };
    }
    res.status(200).json({
      success: true,
      data: setting
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update AI Provider configuration setting
 * @route   PUT /api/admin/settings/ai-provider
 * @access  Private/Admin
 */
const updateAiProviderSetting = async (req, res, next) => {
  try {
    const { value } = req.body;
    if (!value) return next(new ApiError(400, 'Provider value is required'));

    const normalizedValue = value.toLowerCase().trim();
    if (normalizedValue !== 'gemini' && normalizedValue !== 'groq') {
      return next(new ApiError(400, 'Provider value must be either gemini or groq'));
    }

    const setting = await Setting.findOneAndUpdate(
      { key: 'AI_PROVIDER' },
      { value: normalizedValue },
      { returnDocument: 'after', upsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'AI provider setting updated successfully',
      data: setting
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get list of available Gemini models from Google API
 * @route   GET /api/admin/settings/gemini-available-models
 * @access  Private/Admin
 */
const getAvailableGeminiModels = async (req, res, next) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    // Default fallback models
    const fallbackModels = [
      { value: 'gemini-flash-latest', label: 'gemini-flash-latest (Fastest/Default)' },
      { value: 'gemini-2.5-flash', label: 'gemini-2.5-flash' },
      { value: 'gemini-2.5-pro', label: 'gemini-2.5-pro' },
      { value: 'gemini-2.0-flash', label: 'gemini-2.0-flash' },
      { value: 'gemini-3.5-flash', label: 'gemini-3.5-flash' }
    ];

    if (!apiKey) {
      return res.status(200).json({
        success: true,
        data: fallbackModels
      });
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.status}`);
    }

    const result = await response.json();
    if (!result.models || !Array.isArray(result.models)) {
      throw new Error('Invalid response structure from Gemini models API');
    }

    // Filter and map models that support generateContent
    const filteredModels = result.models
      .filter(m => 
        m.supportedGenerationMethods && 
        m.supportedGenerationMethods.includes('generateContent') &&
        m.name &&
        m.name.toLowerCase().includes('gemini') &&
        !m.name.toLowerCase().includes('embedding') &&
        !m.name.toLowerCase().includes('aqa') &&
        !m.name.toLowerCase().includes('robotics')
      )
      .map(m => {
        const rawName = m.name;
        const cleanName = rawName.startsWith('models/') ? rawName.substring(7) : rawName;
        return {
          value: cleanName,
          label: `${cleanName} (${m.displayName || cleanName})`
        };
      });

    // If no text-generation models match, use fallback
    if (filteredModels.length === 0) {
      return res.status(200).json({
        success: true,
        data: fallbackModels
      });
    }

    // Sort to place gemini-flash-latest at the top, then alphabetically
    filteredModels.sort((a, b) => {
      if (a.value === 'gemini-flash-latest') return -1;
      if (b.value === 'gemini-flash-latest') return 1;
      return a.value.localeCompare(b.value);
    });

    res.status(200).json({
      success: true,
      data: filteredModels
    });
  } catch (error) {
    console.error('Error fetching available Gemini models:', error);
    // Return standard fallback models if fetch fails
    res.status(200).json({
      success: true,
      data: [
        { value: 'gemini-flash-latest', label: 'gemini-flash-latest (Fastest/Default)' },
        { value: 'gemini-2.5-flash', label: 'gemini-2.5-flash' },
        { value: 'gemini-2.5-pro', label: 'gemini-2.5-pro' },
        { value: 'gemini-2.0-flash', label: 'gemini-2.0-flash' },
        { value: 'gemini-3.5-flash', label: 'gemini-3.5-flash' }
      ]
    });
  }
};

const getPortalLogoSetting = async (req, res, next) => {
  try {
    let setting = await Setting.findOne({ key: 'PORTAL_LOGO' });
    if (!setting) {
      setting = { key: 'PORTAL_LOGO', value: '/logo.png' };
    }
    res.status(200).json({
      success: true,
      data: setting
    });
  } catch (error) {
    next(error);
  }
};

const updatePortalLogoSetting = async (req, res, next) => {
  try {
    const { value } = req.body;
    if (!value) {
      return next(new ApiError(400, 'Logo value is required'));
    }
    const setting = await Setting.findOneAndUpdate(
      { key: 'PORTAL_LOGO' },
      { value },
      { new: true, upsert: true }
    );
    res.status(200).json({
      success: true,
      message: 'Portal logo setting updated successfully',
      data: setting
    });
  } catch (error) {
    next(error);
  }
};

const getShowAiLogsSetting = async (req, res, next) => {
  try {
    let setting = await Setting.findOne({ key: 'SHOW_AI_LOGS' });
    if (!setting) {
      setting = { key: 'SHOW_AI_LOGS', value: 'true' };
    }
    res.status(200).json({
      success: true,
      data: setting
    });
  } catch (error) {
    next(error);
  }
};

const updateShowAiLogsSetting = async (req, res, next) => {
  try {
    const { value } = req.body;
    const setting = await Setting.findOneAndUpdate(
      { key: 'SHOW_AI_LOGS' },
      { value: String(value) },
      { new: true, upsert: true }
    );
    res.status(200).json({
      success: true,
      message: 'AI logs visibility setting updated successfully',
      data: setting
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getAiLogs,
  getGeminiModelSetting,
  updateGeminiModelSetting,
  getAvailableGeminiModels,
  getAiProviderSetting,
  updateAiProviderSetting,
  getPortalLogoSetting,
  updatePortalLogoSetting,
  getShowAiLogsSetting,
  updateShowAiLogsSetting
};
