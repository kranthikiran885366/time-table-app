const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  number: { type: String, required: true, unique: true },
  block: { type: String, required: true },
  capacity: { type: Number, required: true },
  type: { 
    type: String, 
    enum: ['classroom', 'lab', 'seminar hall', 'auditorium', 'conference'], 
    default: 'classroom' 
  },
  floor: { type: String, default: '' },
  building: { type: String, default: '' },
  
  // Equipment & Facilities
  equipment: [{
    name: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    condition: { type: String, enum: ['excellent', 'good', 'fair', 'poor'], default: 'good' },
    lastServiced: { type: Date, default: null }
  }],
  
  facilities: {
    hasProjector: { type: Boolean, default: false },
    hasAC: { type: Boolean, default: false },
    hasSmartBoard: { type: Boolean, default: false },
    hasComputers: { type: Boolean, default: false },
    computerCount: { type: Number, default: 0 },
    hasSpeakers: { type: Boolean, default: false },
    hasWhiteboard: { type: Boolean, default: true },
    hasMicrophone: { type: Boolean, default: false }
  },
  
  // Status & Availability
  isActive: { type: Boolean, default: true },
  isUnderMaintenance: { type: Boolean, default: false },
  maintenanceSchedule: [{
    startDate: Date,
    endDate: Date,
    reason: String,
    status: { type: String, enum: ['scheduled', 'ongoing', 'completed'], default: 'scheduled' }
  }],
  
  // Additional info
  department: { type: String, default: '' },
  incharge: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty', default: null },
  notes: { type: String, default: '' },
  qrCode: { type: String, default: '' }
}, { timestamps: true });

// Indexes
roomSchema.index({ block: 1, number: 1 });
roomSchema.index({ type: 1, isActive: 1 });

module.exports = mongoose.model('Room', roomSchema);