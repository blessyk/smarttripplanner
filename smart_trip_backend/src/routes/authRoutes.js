const express = require('express');
const {
  register,
  login,
  getProfile,
  updateProfile,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const {
  registerValidator,
  loginValidator,
  updateProfileValidator,
} = require('../validators/authValidator');

const Setting = require('../models/Setting');

const router = express.Router();

// Public routes
router.post('/register', registerValidator, validate, register);
router.post('/login', loginValidator, validate, login);
router.get('/portal-logo', async (req, res, next) => {
  try {
    const logoSetting = await Setting.findOne({ key: 'PORTAL_LOGO' });
    res.status(200).json({
      success: true,
      data: logoSetting ? logoSetting.value : '/logo.png'
    });
  } catch (err) {
    next(err);
  }
});

router.get('/ai-provider', async (req, res, next) => {
  try {
    const providerSetting = await Setting.findOne({ key: 'AI_PROVIDER' });
    res.status(200).json({
      success: true,
      data: providerSetting ? providerSetting.value : 'gemini'
    });
  } catch (err) {
    next(err);
  }
});

// Protected routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfileValidator, validate, updateProfile);

module.exports = router;
