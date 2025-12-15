const express = require('express');
const Section = require('../models/Section');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Public endpoint - no auth required for reading sections
router.get('/', async (req, res) => {
  try {
    const sections = await Section.find();
    res.json(sections);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', auth, adminAuth, async (req, res) => {
  try {
    const section = new Section(req.body);
    await section.save();
    res.status(201).json(section);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', auth, adminAuth, async (req, res) => {
  try {
    const section = await Section.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(section);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    await Section.findByIdAndDelete(req.params.id);
    res.json({ message: 'Section deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;