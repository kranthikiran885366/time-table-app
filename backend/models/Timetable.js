const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
  day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty', required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  sectionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true }],
  classType: { type: String, enum: ['theory', 'lab'], default: 'theory' },
  status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' }
}, { timestamps: true });

module.exports = mongoose.model('Timetable', timetableSchema);