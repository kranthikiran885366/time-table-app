const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
  sectionCode: { type: String, required: true, unique: true, uppercase: true },
  name: { type: String, required: true },
  department: { type: String, required: true },
  year: { type: Number, required: true },
  semester: { type: Number, required: true },
  strength: { type: Number, default: 60 },
  academicYear: { type: String },
  classTeacher: { type: String }, // Faculty assigned as class teacher
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Section', sectionSchema);