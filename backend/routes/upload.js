const express = require('express');
const router = express.Router();
const multer = require('multer');
const uploadController = require('../controllers/uploadController');
const { auth: protect, adminAuth: admin } = require('../middleware/auth');

// Configure multer for memory storage
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept only Excel files
    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only .xlsx files are allowed'));
    }
  }
});

/**
 * @route   POST /api/upload/timetable
 * @desc    Upload Excel file with timetable data
 * @access  Admin only
 * @body    file: Excel file, dryRun: boolean, mode: 'replace'|'merge'
 */
router.post(
  '/timetable',
  protect,
  admin,
  upload.single('file'),
  uploadController.uploadTimetable
);

/**
 * @route   GET /api/upload/template
 * @desc    Download Excel template for timetable
 * @access  Admin only
 */
router.get(
  '/template',
  protect,
  admin,
  uploadController.downloadTemplate
);

/**
 * @route   GET /api/upload/history
 * @desc    Get upload history
 * @access  Admin only
 */
router.get(
  '/history',
  protect,
  admin,
  uploadController.getUploadHistory
);

/**
 * @route   POST /api/upload/rollback
 * @desc    Rollback last upload
 * @access  Admin only
 */
router.post(
  '/rollback',
  protect,
  admin,
  uploadController.rollbackUpload
);

// Error handling middleware for multer errors
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds 5MB limit'
      });
    }
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next();
});

module.exports = router;
