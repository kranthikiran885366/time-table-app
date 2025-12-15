const Faculty = require('../models/Faculty');
const Timetable = require('../models/Timetable');
const Department = require('../models/Department');
const Room = require('../models/Room');
const Section = require('../models/Section');
const Subject = require('../models/Subject');
const ActivityLog = require('../models/ActivityLog');
const Announcement = require('../models/Announcement');

// Dashboard overview
const getDashboardStats = async (req, res) => {
  try {
    const stats = {
      overview: {
        totalFaculty: await Faculty.countDocuments({ isActive: true }),
        totalDepartments: await Department.countDocuments({ isActive: true }),
        totalRooms: await Room.countDocuments({ isActive: true }),
        totalSections: await Section.countDocuments(),
        totalSubjects: await Subject.countDocuments(),
        totalClasses: await Timetable.countDocuments(),
        activeAnnouncements: await Announcement.countDocuments({ isActive: true })
      },
      
      recentActivity: await ActivityLog.find()
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .limit(10),
      
      systemHealth: {
        databaseStatus: 'connected',
        lastBackup: null,
        storageUsed: '0 MB',
        apiStatus: 'operational'
      }
    };
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Room utilization analytics
const getRoomAnalytics = async (req, res) => {
  try {
    const rooms = await Room.find({ isActive: true });
    
    const analytics = await Promise.all(rooms.map(async (room) => {
      const classes = await Timetable.find({ roomId: room._id });
      
      let totalMinutes = 0;
      classes.forEach(cls => {
        const [sh, sm] = cls.startTime.split(':').map(Number);
        const [eh, em] = cls.endTime.split(':').map(Number);
        totalMinutes += (eh * 60 + em) - (sh * 60 + sm);
      });
      
      const totalAvailableMinutes = 480 * 6; // 8 hours per day * 6 days
      const utilization = (totalMinutes / totalAvailableMinutes) * 100;
      
      return {
        room: `${room.block}-${room.number}`,
        type: room.type,
        capacity: room.capacity,
        totalClasses: classes.length,
        weeklyHours: (totalMinutes / 60).toFixed(1),
        utilizationPercent: utilization.toFixed(1),
        status: utilization > 70 ? 'high' : utilization > 40 ? 'medium' : 'low'
      };
    }));
    
    // Sort by utilization
    analytics.sort((a, b) => parseFloat(b.utilizationPercent) - parseFloat(a.utilizationPercent));
    
    res.json({
      rooms: analytics,
      summary: {
        averageUtilization: (analytics.reduce((sum, r) => sum + parseFloat(r.utilizationPercent), 0) / analytics.length).toFixed(1),
        highlyUtilized: analytics.filter(r => r.status === 'high').length,
        underutilized: analytics.filter(r => r.status === 'low').length
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Faculty workload analytics
const getFacultyWorkload = async (req, res) => {
  try {
    const faculties = await Faculty.find({ isActive: true, role: { $in: ['faculty', 'professor', 'assistant', 'hod'] } });
    
    const workload = await Promise.all(faculties.map(async (faculty) => {
      const classes = await Timetable.find({ facultyId: faculty._id })
        .populate('subjectId')
        .populate('sectionIds');
      
      let totalHours = 0;
      const subjects = new Set();
      const sections = new Set();
      
      classes.forEach(cls => {
        const [sh, sm] = cls.startTime.split(':').map(Number);
        const [eh, em] = cls.endTime.split(':').map(Number);
        totalHours += ((eh * 60 + em) - (sh * 60 + sm)) / 60;
        
        if (cls.subjectId) subjects.add(cls.subjectId.name);
        cls.sectionIds.forEach(s => sections.add(s.name));
      });
      
      const loadStatus = totalHours > faculty.maxWeeklyHours ? 'overloaded' :
                        totalHours > (faculty.maxWeeklyHours * 0.8) ? 'optimal' :
                        totalHours > (faculty.maxWeeklyHours * 0.5) ? 'moderate' : 'light';
      
      return {
        id: faculty._id,
        name: faculty.name,
        department: faculty.department,
        email: faculty.email,
        totalClasses: classes.length,
        weeklyHours: totalHours.toFixed(1),
        maxWeeklyHours: faculty.maxWeeklyHours,
        utilizationPercent: ((totalHours / faculty.maxWeeklyHours) * 100).toFixed(1),
        subjectCount: subjects.size,
        sectionCount: sections.size,
        loadStatus,
        onLeave: faculty.onLeave
      };
    }));
    
    // Sort by hours
    workload.sort((a, b) => parseFloat(b.weeklyHours) - parseFloat(a.weeklyHours));
    
    res.json({
      faculty: workload,
      summary: {
        averageHours: (workload.reduce((sum, f) => sum + parseFloat(f.weeklyHours), 0) / workload.length).toFixed(1),
        overloaded: workload.filter(f => f.loadStatus === 'overloaded').length,
        optimal: workload.filter(f => f.loadStatus === 'optimal').length,
        underutilized: workload.filter(f => f.loadStatus === 'light').length,
        onLeave: workload.filter(f => f.onLeave).length
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Department-wise analytics
const getDepartmentWiseAnalytics = async (req, res) => {
  try {
    const departments = await Department.find({ isActive: true });
    
    const analytics = await Promise.all(departments.map(async (dept) => {
      const faculty = await Faculty.find({ department: dept.name, isActive: true });
      const sections = await Section.find({ department: dept.name });
      const subjects = await Subject.find({ department: dept.name });
      
      const studentCount = sections.reduce((sum, s) => sum + (s.strength || 0), 0);
      
      // Get timetable completion
      const totalSlots = sections.length * 6 * 6; // sections * days * approx slots per day
      const filledSlots = await Timetable.countDocuments({
        sectionIds: { $in: sections.map(s => s._id) }
      });
      
      return {
        id: dept._id,
        name: dept.name,
        code: dept.code,
        facultyCount: faculty.length,
        sectionCount: sections.length,
        subjectCount: subjects.length,
        studentCount,
        timetableCompletion: ((filledSlots / totalSlots) * 100).toFixed(1),
        hod: dept.hodId ? (await Faculty.findById(dept.hodId))?.name : 'Not assigned'
      };
    }));
    
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Peak time analysis
const getPeakTimeAnalysis = async (req, res) => {
  try {
    const allClasses = await Timetable.find();
    
    const timeSlots = {};
    const daySlots = {
      Monday: {},
      Tuesday: {},
      Wednesday: {},
      Thursday: {},
      Friday: {},
      Saturday: {}
    };
    
    allClasses.forEach(cls => {
      // Overall time slots
      const slot = cls.startTime;
      timeSlots[slot] = (timeSlots[slot] || 0) + 1;
      
      // Day-wise slots
      if (daySlots[cls.day]) {
        daySlots[cls.day][slot] = (daySlots[cls.day][slot] || 0) + 1;
      }
    });
    
    const peakTimes = Object.entries(timeSlots)
      .map(([time, count]) => ({ time, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    res.json({
      peakTimes,
      dayWise: daySlots,
      totalClasses: allClasses.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Conflict detection report
const getConflictReport = async (req, res) => {
  try {
    const allClasses = await Timetable.find()
      .populate('roomId')
      .populate('facultyId')
      .populate('sectionIds');
    
    const conflicts = {
      roomConflicts: [],
      facultyConflicts: [],
      sectionConflicts: []
    };
    
    // Check for conflicts
    for (let i = 0; i < allClasses.length; i++) {
      for (let j = i + 1; j < allClasses.length; j++) {
        const cls1 = allClasses[i];
        const cls2 = allClasses[j];
        
        if (cls1.day !== cls2.day) continue;
        
        const overlap = timeSlotsOverlap(cls1.startTime, cls1.endTime, cls2.startTime, cls2.endTime);
        if (!overlap) continue;
        
        // Room conflict
        if (cls1.roomId && cls2.roomId && cls1.roomId._id.toString() === cls2.roomId._id.toString()) {
          conflicts.roomConflicts.push({
            room: cls1.roomId.number,
            day: cls1.day,
            time: `${cls1.startTime}-${cls1.endTime}`,
            classes: [cls1._id, cls2._id]
          });
        }
        
        // Faculty conflict
        if (cls1.facultyId && cls2.facultyId && cls1.facultyId._id.toString() === cls2.facultyId._id.toString()) {
          conflicts.facultyConflicts.push({
            faculty: cls1.facultyId.name,
            day: cls1.day,
            time: `${cls1.startTime}-${cls1.endTime}`,
            classes: [cls1._id, cls2._id]
          });
        }
      }
    }
    
    res.json({
      conflicts,
      summary: {
        totalConflicts: conflicts.roomConflicts.length + conflicts.facultyConflicts.length + conflicts.sectionConflicts.length,
        roomConflicts: conflicts.roomConflicts.length,
        facultyConflicts: conflicts.facultyConflicts.length,
        sectionConflicts: conflicts.sectionConflicts.length
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper function
const timeSlotsOverlap = (start1, end1, start2, end2) => {
  const [h1, m1] = start1.split(':').map(Number);
  const [h2, m2] = end1.split(':').map(Number);
  const [h3, m3] = start2.split(':').map(Number);
  const [h4, m4] = end2.split(':').map(Number);
  
  const time1Start = h1 * 60 + m1;
  const time1End = h2 * 60 + m2;
  const time2Start = h3 * 60 + m3;
  const time2End = h4 * 60 + m4;
  
  return (time1Start < time2End) && (time2Start < time1End);
};

module.exports = {
  getDashboardStats,
  getRoomAnalytics,
  getFacultyWorkload,
  getDepartmentWiseAnalytics,
  getPeakTimeAnalysis,
  getConflictReport
};
