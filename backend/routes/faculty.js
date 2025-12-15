const express = require('express');
const Faculty = require('../models/Faculty');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const faculties = await Faculty.find().select('-password');
    res.json(faculties);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', auth, adminAuth, async (req, res) => {
  try {
    const faculty = new Faculty(req.body);
    await faculty.save();
    res.status(201).json(faculty);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', auth, adminAuth, async (req, res) => {
  try {
    const faculty = await Faculty.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(faculty);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    await Faculty.findByIdAndDelete(req.params.id);
    res.json({ message: 'Faculty deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;