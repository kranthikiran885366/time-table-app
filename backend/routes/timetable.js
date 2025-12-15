const express = require('express');
const { auth, adminAuth } = require('../middleware/auth');
const {
  createTimetable,
  getTimetables,
  updateTimetable,
  deleteTimetable,
  batchCreateTimetable,
  getAnalytics,
  getSuggestedSlots
} = require('../controllers/timetableController');

const router = express.Router();

router.post('/', auth, adminAuth, createTimetable);
router.post('/batch', auth, adminAuth, batchCreateTimetable);
router.post('/suggest-slots', auth, adminAuth, getSuggestedSlots);
// Public endpoints - no auth required for reading timetables
router.get('/', getTimetables);
router.get('/analytics', getAnalytics);
router.put('/:id', auth, adminAuth, updateTimetable);
router.delete('/:id', auth, adminAuth, deleteTimetable);

module.exports = router;