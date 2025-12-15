const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema({
  name: { type: String, required: true },
  department: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { 
    type: String, 
    enum: ['admin', 'hod', 'faculty', 'lab-incharge', 'assistant', 'professor', 'student'], 
    default: 'faculty' 
  },
  password: { type: String, required: true },
  phone: { type: String, default: '' },
  designation: { type: String, default: '' },
  qualification: { type: String, default: '' },
  specialization: { type: String, default: '' },
  experience: { type: Number, default: 0 },
  joiningDate: { type: Date, default: null },
  employeeId: { type: String, default: '', unique: true, sparse: true },
  
  // Workload management
  maxWeeklyHours: { type: Number, default: 24 },
  maxDailyHours: { type: Number, default: 6 },
  currentWeeklyHours: { type: Number, default: 0 },
  preferredTimeSlots: [{ type: String }],
  
  // Availability
  isAvailable: { type: Boolean, default: true },
  availability: [{
    day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] },
    startTime: String,
    endTime: String,
    isAvailable: Boolean
  }],
  
  // Leave management
  onLeave: { type: Boolean, default: false },
  leaveHistory: [{
    startDate: Date,
    endDate: Date,
    reason: String,
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    appliedOn: { type: Date, default: Date.now }
  }],
  
  // Additional info
  photoUrl: { type: String, default: '' },
  address: { type: String, default: '' },
  emergencyContact: { type: String, default: '' },
  bloodGroup: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  
  // Reset password
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null }
}, { timestamps: true });

// Index for faster queries
facultySchema.index({ department: 1, isActive: 1 });
facultySchema.index({ email: 1 });
facultySchema.index({ employeeId: 1 });

module.exports = mongoose.model('Faculty', facultySchema);