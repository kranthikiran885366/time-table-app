const express = require('express');
const { auth, adminAuth } = require('../middleware/auth');
const {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  assignHOD,
  getDepartmentAnalytics
} = require('../controllers/departmentController');

const router = express.Router();

// Public routes
router.get('/', getDepartments);
router.get('/analytics', getDepartmentAnalytics);
router.get('/:id', getDepartmentById);

// Admin only routes
router.post('/', auth, adminAuth, createDepartment);
router.put('/:id', auth, adminAuth, updateDepartment);
router.delete('/:id', auth, adminAuth, deleteDepartment);
router.post('/assign-hod', auth, adminAuth, assignHOD);

module.exports = router;
