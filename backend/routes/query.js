const express = require('express');
const router = express.Router();
const Timetable = require('../models/Timetable');
const Section = require('../models/Section');
const Faculty = require('../models/Faculty');
const Room = require('../models/Room');

/**
 * Get current class happening in a room RIGHT NOW
 * GET /api/query/room-current/:roomNo
 */
router.get('/room-current/:roomNo', async (req, res) => {
  try {
    const { roomNo } = req.params;
    const now = new Date();
    
    // Get current day and time
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = days[now.getDay()];
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Find timetable entry for this room, day, and time
    const entry = await Timetable.findOne({
      roomNo: roomNo.toUpperCase(),
      day: currentDay,
      startTime: { $lte: currentTime },
      endTime: { $gte: currentTime },
      status: 'scheduled'
    })
    .populate('sectionId', 'name sectionCode year semester department')
    .populate('subjectId', 'name code')
    .populate('facultyId', 'name email')
    .lean();

    if (!entry) {
      return res.json({
        success: true,
        inUse: false,
        roomNo,
        currentTime: `${currentDay} ${currentTime}`,
        message: 'Room is currently free'
      });
    }

    return res.json({
      success: true,
      inUse: true,
      roomNo,
      currentTime: `${currentDay} ${currentTime}`,
      class: {
        subject: entry.subjectId?.name || entry.subjectCode,
        subjectCode: entry.subjectCode,
        section: entry.sectionId?.name || entry.sectionCode,
        sectionCode: entry.sectionCode,
        department: entry.sectionId?.department || 'N/A',
        faculty: entry.facultyId?.name || entry.facultyName || 'N/A',
        classType: entry.classType,
        startTime: entry.startTime,
        endTime: entry.endTime,
        duration: entry.duration || 1
      }
    });

  } catch (error) {
    console.error('Error fetching current room class:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch current class',
      error: error.message
    });
  }
});

/**
 * Detect conflicts in timetable
 * POST /api/query/conflicts
 * Body: { sectionCode?, facultyId?, roomNo?, date? }
 */
router.post('/conflicts', async (req, res) => {
  try {
    const { sectionCode, facultyId, roomNo, date } = req.body;
    
    const conflicts = [];

    // Faculty conflicts: same faculty teaching multiple classes at same time
    if (facultyId || !sectionCode && !roomNo) {
      const query = facultyId ? { facultyId, status: 'scheduled' } : { facultyId: { $ne: null }, status: 'scheduled' };
      
      const entries = await Timetable.find(query)
        .populate('sectionId', 'name')
        .populate('subjectId', 'name')
        .populate('facultyId', 'name')
        .lean();

      // Group by faculty, day, and time
      const grouped = {};
      for (const entry of entries) {
        if (!entry.facultyId) continue;
        
        const key = `${entry.facultyId._id}_${entry.day}_${entry.startTime}`;
        if (!grouped[key]) {
          grouped[key] = [];
        }
        grouped[key].push(entry);
      }

      // Find conflicts (more than one class at same time)
      for (const key in grouped) {
        if (grouped[key].length > 1) {
          conflicts.push({
            type: 'FACULTY_CONFLICT',
            faculty: grouped[key][0].facultyId.name,
            day: grouped[key][0].day,
            startTime: grouped[key][0].startTime,
            endTime: grouped[key][0].endTime,
            classes: grouped[key].map(e => ({
              section: e.sectionId?.name || e.sectionCode,
              subject: e.subjectId?.name || e.subjectCode,
              room: e.roomNo
            }))
          });
        }
      }
    }

    // Room conflicts: same room used by multiple sections at same time
    if (roomNo || !sectionCode && !facultyId) {
      const query = roomNo ? { roomNo: roomNo.toUpperCase(), status: 'scheduled' } : { status: 'scheduled' };
      
      const entries = await Timetable.find(query)
        .populate('sectionId', 'name')
        .populate('subjectId', 'name')
        .lean();

      // Group by room, day, and time
      const grouped = {};
      for (const entry of entries) {
        const key = `${entry.roomNo}_${entry.day}_${entry.startTime}`;
        if (!grouped[key]) {
          grouped[key] = [];
        }
        grouped[key].push(entry);
      }

      // Find conflicts
      for (const key in grouped) {
        if (grouped[key].length > 1) {
          conflicts.push({
            type: 'ROOM_CONFLICT',
            room: grouped[key][0].roomNo,
            day: grouped[key][0].day,
            startTime: grouped[key][0].startTime,
            endTime: grouped[key][0].endTime,
            classes: grouped[key].map(e => ({
              section: e.sectionId?.name || e.sectionCode,
              subject: e.subjectId?.name || e.subjectCode
            }))
          });
        }
      }
    }

    // Section conflicts: same section with overlapping time slots
    if (sectionCode || !facultyId && !roomNo) {
      const query = sectionCode ? { sectionCode: sectionCode.toUpperCase(), status: 'scheduled' } : { status: 'scheduled' };
      
      const entries = await Timetable.find(query)
        .populate('subjectId', 'name')
        .lean();

      // Group by section and day
      const grouped = {};
      for (const entry of entries) {
        const key = `${entry.sectionCode}_${entry.day}`;
        if (!grouped[key]) {
          grouped[key] = [];
        }
        grouped[key].push(entry);
      }

      // Find overlapping time slots
      for (const key in grouped) {
        const dayEntries = grouped[key].sort((a, b) => a.startTime.localeCompare(b.startTime));
        
        for (let i = 0; i < dayEntries.length - 1; i++) {
          for (let j = i + 1; j < dayEntries.length; j++) {
            const entry1 = dayEntries[i];
            const entry2 = dayEntries[j];
            
            // Check if time slots overlap
            if (entry1.endTime > entry2.startTime && entry1.startTime < entry2.endTime) {
              conflicts.push({
                type: 'SECTION_OVERLAP',
                section: entry1.sectionCode,
                day: entry1.day,
                class1: {
                  subject: entry1.subjectId?.name || entry1.subjectCode,
                  time: `${entry1.startTime}-${entry1.endTime}`,
                  room: entry1.roomNo
                },
                class2: {
                  subject: entry2.subjectId?.name || entry2.subjectCode,
                  time: `${entry2.startTime}-${entry2.endTime}`,
                  room: entry2.roomNo
                }
              });
            }
          }
        }
      }
    }

    return res.json({
      success: true,
      conflictCount: conflicts.length,
      conflicts,
      summary: {
        facultyConflicts: conflicts.filter(c => c.type === 'FACULTY_CONFLICT').length,
        roomConflicts: conflicts.filter(c => c.type === 'ROOM_CONFLICT').length,
        sectionOverlaps: conflicts.filter(c => c.type === 'SECTION_OVERLAP').length
      }
    });

  } catch (error) {
    console.error('Error detecting conflicts:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to detect conflicts',
      error: error.message
    });
  }
});

/**
 * Get faculty's current class
 * GET /api/query/faculty-current/:facultyId
 */
router.get('/faculty-current/:facultyId', async (req, res) => {
  try {
    const { facultyId } = req.params;
    const now = new Date();
    
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = days[now.getDay()];
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const entry = await Timetable.findOne({
      facultyId,
      day: currentDay,
      startTime: { $lte: currentTime },
      endTime: { $gte: currentTime },
      status: 'scheduled'
    })
    .populate('sectionId', 'name sectionCode')
    .populate('subjectId', 'name code')
    .populate('facultyId', 'name')
    .lean();

    if (!entry) {
      return res.json({
        success: true,
        hasClass: false,
        currentTime: `${currentDay} ${currentTime}`,
        message: 'No class scheduled right now'
      });
    }

    return res.json({
      success: true,
      hasClass: true,
      currentTime: `${currentDay} ${currentTime}`,
      class: {
        subject: entry.subjectId?.name || entry.subjectCode,
        section: entry.sectionId?.name || entry.sectionCode,
        room: entry.roomNo,
        classType: entry.classType,
        startTime: entry.startTime,
        endTime: entry.endTime
      }
    });

  } catch (error) {
    console.error('Error fetching faculty current class:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch current class',
      error: error.message
    });
  }
});

module.exports = router;
