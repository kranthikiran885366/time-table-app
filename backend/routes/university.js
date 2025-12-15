const express = require('express');
const { auth, adminAuth } = require('../middleware/auth');
const { getUniversityConfig, updateUniversityConfig } = require('../controllers/universityController');

const router = express.Router();

router.get('/config', getUniversityConfig);
router.put('/config', auth, adminAuth, updateUniversityConfig);

module.exports = router;