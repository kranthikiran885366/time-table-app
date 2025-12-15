const mongoose = require('mongoose');

const universitySchema = new mongoose.Schema({
  name: { type: String, required: true, default: 'MVK University of Technology' },
  tagline: { type: String, required: true, default: 'Smart Timetable • Smart Campus' },
  logoUrl: { type: String, default: 'https://via.placeholder.com/150x150/0A3D62/FFFFFF?text=MVK' },
  primaryColor: { type: String, default: '#0A3D62' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('University', universitySchema);