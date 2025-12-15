const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['info', 'warning', 'urgent', 'holiday', 'cancellation', 'general'],
    default: 'general'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  targetAudience: {
    type: String,
    enum: ['all', 'students', 'faculty', 'department', 'section'],
    default: 'all'
  },
  targetDepartments: [{
    type: String
  }],
  targetSections: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Section'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileType: String
  }],
  viewCount: {
    type: Number,
    default: 0
  },
  sendEmail: {
    type: Boolean,
    default: false
  },
  sendPush: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
announcementSchema.index({ isActive: 1, startDate: -1 });
announcementSchema.index({ targetAudience: 1, isActive: 1 });

module.exports = mongoose.model('Announcement', announcementSchema);
