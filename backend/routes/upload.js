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
    // Accept all Excel file formats
    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'application/vnd.ms-excel.sheet.macroEnabled.12', // .xlsm
      'application/vnd.ms-excel.sheet.binary.macroEnabled.12', // .xlsb
      'application/vnd.openxmlformats-officedocument.spreadsheetml.template', // .xltx
      'application/vnd.ms-excel.template.macroEnabled.12' // .xltm
    ];
    
    const allowedExtensions = ['.xlsx', '.xls', '.xlsm', '.xlsb', '.xltx', '.xltm'];
    const fileExtension = file.originalname.toLowerCase().match(/\.[^.]*$/)?.[0];
    
    if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only Excel files (.xlsx, .xls, .xlsm, .xlsb, .xltx, .xltm) are allowed'));
    }
  }
});

/**
 * @route   POST /api/upload/timetable
 * @desc    Upload Excel file with timetable data (Legacy parser)
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
 * @route   POST /api/upload/strict-timetable
 * @desc    Upload Excel file with STRICT academic ERP parsing
 * @access  Admin only
 * @body    file: Excel file, dryRun: boolean
 */
router.post(
  '/strict-timetable',
  protect,
  admin,
  upload.single('file'),
  uploadController.uploadStrictTimetable
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
