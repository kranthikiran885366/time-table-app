const Timetable = require('../models/Timetable');

const createTimetable = async (req, res) => {
  try {
    const timetable = new Timetable(req.body);
    
    // Check for conflicts
    const conflicts = await checkConflicts(req.body);
    if (conflicts.length > 0) {
      return res.status(400).json({ message: 'Conflicts detected', conflicts });
    }
    
    await timetable.save();
    res.status(201).json(timetable);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTimetables = async (req, res) => {
  try {
    const timetables = await Timetable.find()
      .populate('roomId')
      .populate('facultyId')
      .populate('subjectId')
      .populate('sectionIds');
    res.json(timetables);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateTimetable = async (req, res) => {
  try {
    const timetable = await Timetable.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('roomId facultyId subjectId sectionIds');
    
    if (!timetable) {
      return res.status(404).json({ message: 'Timetable not found' });
    }
    
    res.json(timetable);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteTimetable = async (req, res) => {
  try {
    await Timetable.findByIdAndDelete(req.params.id);
    res.json({ message: 'Timetable deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const checkConflicts = async (data) => {
  const { day, startTime, endTime, roomId, facultyId, sectionIds, _id } = data;
  const conflicts = [];
  const Room = require('../models/Room');
  
  // Build query to exclude current timetable if updating
  const excludeQuery = _id ? { _id: { $ne: _id } } : {};
  
  // Advanced time overlap check
  const timeOverlapQuery = {
    day,
    ...excludeQuery,
    $or: [
      { $and: [{ startTime: { $lte: startTime } }, { endTime: { $gt: startTime } }] },
      { $and: [{ startTime: { $lt: endTime } }, { endTime: { $gte: endTime } }] },
      { $and: [{ startTime: { $gte: startTime } }, { endTime: { $lte: endTime } }] }
    ]
  };
  
  // Room conflict with capacity check
  const room = await Room.findById(roomId);
  if (room) {
    const roomConflicts = await Timetable.find({
      ...timeOverlapQuery,
      roomId
    }).populate('sectionIds');
    
    if (roomConflicts.length > 0) {
      const conflictDetails = roomConflicts.map(c => ({
        time: `${c.startTime}-${c.endTime}`,
        subject: c.subjectId
      }));
      conflicts.push({
        type: 'room',
        message: 'Room already booked',
        room: room.number,
        details: conflictDetails
      });
    }
    
    // Check room capacity
    const Section = require('../models/Section');
    const sections = await Section.find({ _id: { $in: sectionIds } });
    const totalStudents = sections.reduce((sum, s) => sum + (s.strength || 0), 0);
    
    if (totalStudents > room.capacity) {
      conflicts.push({
        type: 'capacity',
        message: `Room capacity (${room.capacity}) exceeded`,
        required: totalStudents,
        available: room.capacity
      });
    }
  }
  
  // Faculty conflict with workload check
  const facultyConflicts = await Timetable.find({
    ...timeOverlapQuery,
    facultyId
  }).populate('facultyId subjectId');
  
  if (facultyConflicts.length > 0) {
    conflicts.push({
      type: 'faculty',
      message: 'Faculty already assigned',
      faculty: facultyConflicts[0].facultyId.name,
      conflictingClass: `${facultyConflicts[0].startTime}-${facultyConflicts[0].endTime}`
    });
  }
  
  // Check faculty workload (max 8 hours per day)
  const facultyDaySchedule = await Timetable.find({
    day,
    facultyId,
    ...excludeQuery
  });
  
  const calculateDuration = (start, end) => {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    return (eh * 60 + em) - (sh * 60 + sm);
  };
  
  const totalMinutes = facultyDaySchedule.reduce((sum, t) => 
    sum + calculateDuration(t.startTime, t.endTime), 0
  );
  const newMinutes = calculateDuration(startTime, endTime);
  
  if (totalMinutes + newMinutes > 480) { // 8 hours
    conflicts.push({
      type: 'workload',
      message: 'Faculty workload exceeds 8 hours per day',
      current: Math.floor(totalMinutes / 60),
      proposed: Math.floor((totalMinutes + newMinutes) / 60)
    });
  }
  
  // Section conflict
  for (const sectionId of sectionIds) {
    const sectionConflicts = await Timetable.find({
      ...timeOverlapQuery,
      sectionIds: sectionId
    }).populate('subjectId');
    
    if (sectionConflicts.length > 0) {
      conflicts.push({
        type: 'section',
        message: 'Section already has a class',
        section: sectionId,
        conflictingSubject: sectionConflicts[0].subjectId.name
      });
    }
  }
  
  // Break time validation (lunch break 12:30-13:30)
  const lunchStart = '12:30';
  const lunchEnd = '13:30';
  const hasLunchOverlap = (
    (startTime <= lunchStart && endTime > lunchStart) ||
    (startTime < lunchEnd && endTime >= lunchEnd) ||
    (startTime >= lunchStart && endTime <= lunchEnd)
  );
  
  if (hasLunchOverlap) {
    conflicts.push({
      type: 'break',
      message: 'Class overlaps with lunch break (12:30-13:30)',
      suggestion: 'Schedule before 12:30 or after 13:30'
    });
  }
  
  return conflicts;
};

// Batch create timetables
const batchCreateTimetable = async (req, res) => {
  try {
    const { timetables } = req.body;
    const results = {
      success: [],
      failed: []
    };
    
    for (const timetableData of timetables) {
      try {
        const conflicts = await checkConflicts(timetableData);
        
        if (conflicts.length > 0) {
          results.failed.push({
            data: timetableData,
            reason: conflicts
          });
          continue;
        }
        
        const timetable = new Timetable(timetableData);
        await timetable.save();
        results.success.push(timetable);
      } catch (error) {
        results.failed.push({
          data: timetableData,
          reason: error.message
        });
      }
    }
    
    res.json({
      message: `Created ${results.success.length} out of ${timetables.length} timetables`,
      results
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get analytics and statistics
const getAnalytics = async (req, res) => {
  try {
    const Room = require('../models/Room');
    const Faculty = require('../models/Faculty');
    const Section = require('../models/Section');
    const Subject = require('../models/Subject');
    
    const totalTimetables = await Timetable.countDocuments();
    const totalRooms = await Room.countDocuments();
    const totalFaculties = await Faculty.countDocuments();
    const totalSections = await Section.countDocuments();
    const totalSubjects = await Subject.countDocuments();
    
    // Room utilization
    const rooms = await Room.find();
    const roomUtilization = await Promise.all(rooms.map(async (room) => {
      const classes = await Timetable.find({ roomId: room._id });
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      let totalMinutes = 0;
      classes.forEach(cls => {
        const [sh, sm] = cls.startTime.split(':').map(Number);
        const [eh, em] = cls.endTime.split(':').map(Number);
        totalMinutes += (eh * 60 + em) - (sh * 60 + sm);
      });
      
      return {
        room: room.number,
        block: room.block,
        totalClasses: classes.length,
        weeklyHours: (totalMinutes / 60).toFixed(1),
        utilization: ((totalMinutes / (480 * 6)) * 100).toFixed(1) + '%'
      };
    }));
    
    // Faculty workload
    const faculties = await Faculty.find();
    const facultyWorkload = await Promise.all(faculties.map(async (faculty) => {
      const classes = await Timetable.find({ facultyId: faculty._id })
        .populate('subjectId');
      
      const subjects = {};
      let totalHours = 0;
      
      classes.forEach(cls => {
        const [sh, sm] = cls.startTime.split(':').map(Number);
        const [eh, em] = cls.endTime.split(':').map(Number);
        const hours = ((eh * 60 + em) - (sh * 60 + sm)) / 60;
        totalHours += hours;
        
        const subName = cls.subjectId.name;
        subjects[subName] = (subjects[subName] || 0) + 1;
      });
      
      return {
        faculty: faculty.name,
        department: faculty.department,
        totalClasses: classes.length,
        weeklyHours: totalHours.toFixed(1),
        subjects: Object.keys(subjects).length,
        load: totalHours > 24 ? 'High' : totalHours > 18 ? 'Medium' : 'Low'
      };
    }));
    
    // Peak usage times
    const allTimetables = await Timetable.find();
    const timeSlots = {};
    
    allTimetables.forEach(cls => {
      const slot = cls.startTime;
      timeSlots[slot] = (timeSlots[slot] || 0) + 1;
    });
    
    const peakTimes = Object.entries(timeSlots)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([time, count]) => ({ time, classes: count }));
    
    res.json({
      summary: {
        totalTimetables,
        totalRooms,
        totalFaculties,
        totalSections,
        totalSubjects
      },
      roomUtilization: roomUtilization.sort((a, b) => 
        parseFloat(b.utilization) - parseFloat(a.utilization)
      ),
      facultyWorkload: facultyWorkload.sort((a, b) => 
        b.totalClasses - a.totalClasses
      ),
      peakUsageTimes: peakTimes
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Smart scheduling suggestions
const getSuggestedSlots = async (req, res) => {
  try {
    const { facultyId, sectionIds, duration, classType } = req.body;
    const Room = require('../models/Room');
    
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const timeSlots = [
      { start: '09:00', end: '10:00' },
      { start: '10:00', end: '11:00' },
      { start: '11:00', end: '12:00' },
      { start: '12:00', end: '12:30' },
      { start: '13:30', end: '14:30' },
      { start: '14:30', end: '15:30' },
      { start: '15:30', end: '16:30' },
      { start: '16:30', end: '17:30' }
    ];
    
    const suggestions = [];
    
    // Find suitable rooms
    const rooms = await Room.find({ 
      type: classType === 'lab' ? 'lab' : { $in: ['classroom', 'seminar hall'] }
    });
    
    for (const day of days) {
      for (const slot of timeSlots) {
        for (const room of rooms) {
          const conflicts = await checkConflicts({
            day,
            startTime: slot.start,
            endTime: slot.end,
            roomId: room._id,
            facultyId,
            sectionIds
          });
          
          if (conflicts.length === 0) {
            // Calculate score based on various factors
            let score = 100;
            
            // Prefer morning slots
            const hour = parseInt(slot.start.split(':')[0]);
            if (hour < 12) score += 10;
            
            // Check faculty's existing schedule
            const facultyClasses = await Timetable.find({
              day,
              facultyId
            }).sort({ startTime: 1 });
            
            // Prefer consecutive classes (minimize gaps)
            if (facultyClasses.length > 0) {
              const lastClass = facultyClasses[facultyClasses.length - 1];
              if (lastClass.endTime === slot.start) {
                score += 20; // Consecutive class
              }
            }
            
            // Check room availability pattern
            const roomClasses = await Timetable.find({
              day,
              roomId: room._id
            });
            
            if (roomClasses.length < 4) {
              score += 5; // Room is not heavily used this day
            }
            
            suggestions.push({
              day,
              timeSlot: `${slot.start}-${slot.end}`,
              room: {
                number: room.number,
                block: room.block,
                capacity: room.capacity
              },
              score,
              reason: score > 115 ? 'Optimal' : score > 105 ? 'Good' : 'Available'
            });
          }
        }
      }
    }
    
    // Sort by score and return top 10
    suggestions.sort((a, b) => b.score - a.score);
    
    res.json({
      totalSuggestions: suggestions.length,
      topSuggestions: suggestions.slice(0, 10)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTimetable,
  getTimetables,
  updateTimetable,
  deleteTimetable,
  checkConflicts,
  batchCreateTimetable,
  getAnalytics,
  getSuggestedSlots
};