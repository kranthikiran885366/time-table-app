const express = require('express');
const { auth, adminAuth } = require('../middleware/auth');
const {
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  togglePin
} = require('../controllers/announcementController');

const router = express.Router();

// Public routes
router.get('/', getAnnouncements);
router.get('/:id', getAnnouncementById);

// Admin/HOD routes
router.post('/', auth, createAnnouncement);
router.put('/:id', auth, adminAuth, updateAnnouncement);
router.delete('/:id', auth, adminAuth, deleteAnnouncement);
router.patch('/:id/pin', auth, adminAuth, togglePin);

module.exports = router;
