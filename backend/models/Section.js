const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  department: { type: String, required: true },
  year: { type: Number, required: true },
  semester: { type: Number, required: true },
  strength: { type: Number, default: 60 }
}, { timestamps: true });

module.exports = mongoose.model('Section', sectionSchema);