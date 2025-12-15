const express = require('express');
const { auth } = require('../middleware/auth');
const { 
  register, 
  login, 
  changePassword, 
  requestPasswordReset, 
  resetPassword 
} = require('../controllers/authController');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/change-password', auth, changePassword);
router.post('/request-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);

module.exports = router;