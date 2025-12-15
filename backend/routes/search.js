const express = require('express');
const { searchByRoom, searchBySection } = require('../controllers/searchController');

const router = express.Router();

router.get('/room/:roomNo/current', searchByRoom);
router.get('/section/:sectionId/today', (req, res) => {
  req.query.type = 'today';
  searchBySection(req, res);
});
router.get('/section/:sectionId/weekly', (req, res) => {
  req.query.type = 'weekly';
  searchBySection(req, res);
});

module.exports = router;