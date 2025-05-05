const express = require('express');
const { 
  registerUser, 
  loginUser, 
  signoutUser, 
  requestPasswordReset, 
  resetPassword 
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

// Authentication routes
router.post('/sign-in', loginUser);
router.post('/sign-up', registerUser);
router.post('/sign-out', protect, signoutUser);
router.post('/password-reset/request', requestPasswordReset);
router.post('/password-reset', resetPassword);

module.exports = router;