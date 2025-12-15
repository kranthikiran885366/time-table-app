const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
  sectionCode: { type: String, required: true, uppercase: true },
  sectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true },
  day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  subjectCode: { type: String, required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  roomNo: { type: String, default: 'TBA' }, // Excel-driven: no room creation required
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  facultyName: { type: String }, // Direct faculty name from Excel
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
  classType: { type: String, enum: ['Theory', 'Lab', 'Tutorial'], default: 'Theory' },
  duration: { type: Number, default: 1 }, // Number of consecutive periods (for merged labs)
  status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' }
}, { timestamps: true });

// Prevent duplicate entries for same section, day, and time
timetableSchema.index({ sectionCode: 1, day: 1, startTime: 1 }, { unique: true });

module.exports = mongoose.model('Timetable', timetableSchema);