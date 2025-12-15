const Timetable = require('../models/Timetable');
const { getCurrentDay, isCurrentClass, getNextClass } = require('../utils/timeHelper');

const searchByRoom = async (req, res) => {
  try {
    const { roomNo } = req.params;
    const currentDay = getCurrentDay();
    const Room = require('../models/Room');
    
    // Find room details (optional - may not exist for dynamically created rooms)
    const room = await Room.findOne({ number: roomNo });
    
    // Get all timetable for the room (search by roomNo string)
    const allTimetable = await Timetable.find({ roomNo: roomNo })
      .populate('roomId')
      .populate('facultyId')
      .populate('subjectId')
      .populate('sectionId')
      .sort({ day: 1, startTime: 1 });
    
    // If no timetable found, return empty result
    if (allTimetable.length === 0) {
      return res.json({
        room: room ? {
          number: room.number,
          block: room.block,
          capacity: room.capacity,
          type: room.type
        } : {
          number: roomNo,
          block: 'Unknown',
          capacity: 60,
          type: 'classroom'
        },
        currentClass: null,
        nextClass: null,
        todayClasses: [],
        weeklySchedule: [],
        analytics: {
          utilization: {},
          freeSlots: [],
          totalClassesToday: 0,
          peakUsageDay: null
        }
      });
    }
    
    // Today's classes
    const todayClasses = allTimetable.filter(item => item.day === currentDay);
    
    // Find current and next class
    const currentClass = todayClasses.find(item => 
      isCurrentClass(item.startTime, item.endTime)
    );
    
    const nextClass = getNextClass(todayClasses);
    
    // Calculate room utilization
    const calculateDuration = (start, end) => {
      const [sh, sm] = start.split(':').map(Number);
      const [eh, em] = end.split(':').map(Number);
      return (eh * 60 + em) - (sh * 60 + sm);
    };
    
    const weeklyUtilization = {};
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    days.forEach(day => {
      const dayClasses = allTimetable.filter(t => t.day === day);
      const totalMinutes = dayClasses.reduce((sum, t) => 
        sum + calculateDuration(t.startTime, t.endTime), 0
      );
      weeklyUtilization[day] = {
        hours: (totalMinutes / 60).toFixed(1),
        percentage: ((totalMinutes / 480) * 100).toFixed(1), // 8 hours = 480 min
        classCount: dayClasses.length
      };
    });
    
    // Find free slots for today
    const workingHours = [
      { start: '09:00', end: '10:00' },
      { start: '10:00', end: '11:00' },
      { start: '11:00', end: '12:00' },
      { start: '12:00', end: '12:30' },
      { start: '13:30', end: '14:30' },
      { start: '14:30', end: '15:30' },
      { start: '15:30', end: '16:30' },
      { start: '16:30', end: '17:30' }
    ];
    
    const freeSlots = workingHours.filter(slot => {
      return !todayClasses.some(cls => {
        return (slot.start >= cls.startTime && slot.start < cls.endTime) ||
               (slot.end > cls.startTime && slot.end <= cls.endTime) ||
               (slot.start <= cls.startTime && slot.end >= cls.endTime);
      });
    });
    
    res.json({
      room: room ? {
        number: room.number,
        block: room.block,
        capacity: room.capacity,
        type: room.type
      } : {
        number: roomNo,
        block: 'Unknown',
        capacity: 60,
        type: 'classroom'
      },
      currentClass,
      nextClass,
      todayClasses,
      weeklySchedule: allTimetable,
      analytics: {
        utilization: weeklyUtilization,
        freeSlots,
        totalClassesToday: todayClasses.length,
        peakUsageDay: Object.keys(weeklyUtilization).reduce((a, b) => 
          weeklyUtilization[a].classCount > weeklyUtilization[b].classCount ? a : b
        )
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const searchBySection = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const { type } = req.query; // 'today' or 'weekly'
    const Section = require('../models/Section');
    const Subject = require('../models/Subject');
    
    // Get section details - try both by ID and by sectionCode
    let section = await Section.findById(sectionId);
    if (!section) {
      // Try finding by sectionCode if not found by ID
      section = await Section.findOne({ sectionCode: sectionId.toUpperCase() });
    }
    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }
    
    let query = { sectionCode: section.sectionCode };
    
    if (type === 'today') {
      query.day = getCurrentDay();
    }
    
    const timetable = await Timetable.find(query)
      .populate('roomId')
      .populate('facultyId')
      .populate('subjectId')
      .populate('sectionId')
      .sort({ day: 1, startTime: 1 });
    
    const currentClass = timetable.find(item => 
      item.day === getCurrentDay() && isCurrentClass(item.startTime, item.endTime)
    );
    
    // Analytics for section
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dailyAnalytics = {};
    
    days.forEach(day => {
      const dayClasses = timetable.filter(t => t.day === day);
      const subjects = {};
      const faculties = {};
      
      dayClasses.forEach(cls => {
        const subName = cls.subjectId?.name || cls.subjectCode;
        const facName = cls.facultyId?.name || cls.facultyName || 'TBA';
        subjects[subName] = (subjects[subName] || 0) + 1;
        faculties[facName] = (faculties[facName] || 0) + 1;
      });
      
      dailyAnalytics[day] = {
        totalClasses: dayClasses.length,
        subjects: subjects,
        faculties: faculties,
        startTime: dayClasses[0]?.startTime,
        endTime: dayClasses[dayClasses.length - 1]?.endTime
      };
    });
    
    // Subject-wise distribution
    const subjectDistribution = {};
    timetable.forEach(cls => {
      const subName = cls.subjectId?.name || cls.subjectCode;
      const subCode = cls.subjectId?.code || cls.subjectCode;
      if (!subjectDistribution[subName]) {
        subjectDistribution[subName] = {
          code: subCode,
          count: 0,
          hours: 0,
          faculty: cls.facultyId?.name || cls.facultyName || 'TBA',
          type: cls.classType
        };
      }
      subjectDistribution[subName].count++;
      
      const [sh, sm] = cls.startTime.split(':').map(Number);
      const [eh, em] = cls.endTime.split(':').map(Number);
      const duration = (eh * 60 + em) - (sh * 60 + sm);
      subjectDistribution[subName].hours += duration / 60;
    });
    
    // Detect heavy days
    const heavyDays = days.filter(day => {
      const dayClasses = timetable.filter(t => t.day === day);
      return dayClasses.length > 6; // More than 6 classes
    });
    
    // Detect gaps in schedule
    const gapsAnalysis = days.map(day => {
      const dayClasses = timetable.filter(t => t.day === day)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
      
      const gaps = [];
      for (let i = 0; i < dayClasses.length - 1; i++) {
        const currentEnd = dayClasses[i].endTime;
        const nextStart = dayClasses[i + 1].startTime;
        
        const [ch, cm] = currentEnd.split(':').map(Number);
        const [nh, nm] = nextStart.split(':').map(Number);
        const gapMinutes = (nh * 60 + nm) - (ch * 60 + cm);
        
        if (gapMinutes > 60) { // Gap > 1 hour
          gaps.push({
            from: currentEnd,
            to: nextStart,
            duration: `${Math.floor(gapMinutes / 60)}h ${gapMinutes % 60}m`
          });
        }
      }
      
      return { day, gaps };
    }).filter(d => d.gaps.length > 0);
    
    res.json({
      section: {
        name: section.name,
        department: section.department,
        semester: section.semester,
        strength: section.strength
      },
      timetable,
      currentClass,
      analytics: {
        daily: dailyAnalytics,
        subjectDistribution,
        heavyDays,
        gapsInSchedule: gapsAnalysis,
        totalWeeklyHours: Object.values(subjectDistribution)
          .reduce((sum, s) => sum + s.hours, 0).toFixed(1),
        averageClassesPerDay: (timetable.length / 6).toFixed(1)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { searchByRoom, searchBySection };