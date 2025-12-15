const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userRole: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'CREATE', 'READ', 'UPDATE', 'DELETE',
      'LOGIN', 'LOGOUT', 'UPLOAD', 'DOWNLOAD',
      'APPROVE', 'REJECT', 'PUBLISH', 'ROLLBACK'
    ]
  },
  entity: {
    type: String,
    required: true,
    enum: [
      'Faculty', 'Subject', 'Section', 'Room', 'Timetable',
      'Department', 'Announcement', 'University', 'User'
    ]
  },
  entityId: {
    type: String,
    default: null
  },
  description: {
    type: String,
    required: true
  },
  changes: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    default: ''
  },
  userAgent: {
    type: String,
    default: ''
  },
  device: {
    type: String,
    default: ''
  },
  browser: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['success', 'failure'],
    default: 'success'
  },
  errorMessage: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for faster queries
activityLogSchema.index({ userId: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, entity: 1 });
activityLogSchema.index({ createdAt: -1 });

// Auto-delete logs older than 90 days (optional)
activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
