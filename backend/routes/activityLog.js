const express = require('express');
const { auth, adminAuth } = require('../middleware/auth');
const {
  getActivityLogs,
  getUserActivitySummary,
  exportActivityLogs
} = require('../middleware/activityLogger');

const router = express.Router();

// Admin only routes
router.get('/', auth, adminAuth, getActivityLogs);
router.get('/user/:userId', auth, adminAuth, getUserActivitySummary);
router.get('/export', auth, adminAuth, exportActivityLogs);

module.exports = router;
