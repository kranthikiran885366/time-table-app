const express = require('express');
const { auth, adminAuth } = require('../middleware/auth');
const {
  getDashboardStats,
  getRoomAnalytics,
  getFacultyWorkload,
  getDepartmentWiseAnalytics,
  getPeakTimeAnalysis,
  getConflictReport
} = require('../controllers/analyticsController');

const router = express.Router();

// Admin only routes
router.get('/dashboard', auth, adminAuth, getDashboardStats);
router.get('/room-utilization', auth, adminAuth, getRoomAnalytics);
router.get('/faculty-workload', auth, adminAuth, getFacultyWorkload);
router.get('/department-wise', auth, adminAuth, getDepartmentWiseAnalytics);
router.get('/peak-times', auth, adminAuth, getPeakTimeAnalysis);
router.get('/conflicts', auth, adminAuth, getConflictReport);

module.exports = router;
