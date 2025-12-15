const Section = require('../models/Section');
const Subject = require('../models/Subject');
const Room = require('../models/Room');
const Timetable = require('../models/Timetable');

/**
 * Check if two time slots overlap
 */
function timeSlotsOverlap(start1, end1, start2, end2) {
  return start1 < end2 && start2 < end1;
}

/**
 * Validate that all referenced entities exist in database
 */
async function validateEntities(timetableEntries) {
  const errors = [];
  const warnings = [];
  
  // Collect unique values
  const sectionNames = [...new Set(timetableEntries.map(e => e.section))];
  const subjectCodes = [...new Set(timetableEntries.map(e => e.subjectCode))];
  const roomNumbers = [...new Set(timetableEntries.map(e => e.roomNo))];

  // Validate sections
  const sections = await Section.find({ name: { $in: sectionNames } });
  const foundSections = new Set(sections.map(s => s.name));
  
  for (const sectionName of sectionNames) {
    if (!foundSections.has(sectionName)) {
      errors.push({
        type: 'SECTION_NOT_FOUND',
        message: `Section "${sectionName}" does not exist in database`,
        section: sectionName
      });
    }
  }

  // Validate subjects
  const subjects = await Subject.find({ code: { $in: subjectCodes } });
  const foundSubjects = new Set(subjects.map(s => s.code));
  
  for (const subjectCode of subjectCodes) {
    if (!foundSubjects.has(subjectCode)) {
      errors.push({
        type: 'SUBJECT_NOT_FOUND',
        message: `Subject "${subjectCode}" does not exist in database`,
        subjectCode
      });
    }
  }

  // Validate rooms
  const rooms = await Room.find({ number: { $in: roomNumbers } });
  const foundRooms = new Map(rooms.map(r => [r.number, r]));
  
  for (const roomNo of roomNumbers) {
    if (!foundRooms.has(roomNo)) {
      errors.push({
        type: 'ROOM_NOT_FOUND',
        message: `Room "${roomNo}" does not exist in database`,
        roomNo
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    entities: {
      sections: Object.fromEntries(sections.map(s => [s.name, s])),
      subjects: Object.fromEntries(subjects.map(s => [s.code, s])),
      rooms: Object.fromEntries(rooms.map(r => [r.number, r]))
    }
  };
}

/**
 * Detect conflicts in the timetable data
 */
async function detectConflicts(timetableEntries, entities) {
  const conflicts = [];

  // Group by day for efficient conflict checking
  const byDay = {};
  timetableEntries.forEach(entry => {
    if (!byDay[entry.day]) byDay[entry.day] = [];
    byDay[entry.day].push(entry);
  });

  // Check conflicts within each day
  for (const [day, entries] of Object.entries(byDay)) {
    // Check room conflicts
    const roomConflicts = checkRoomConflicts(entries, day);
    conflicts.push(...roomConflicts);

    // Check section overlaps (same section, overlapping times)
    const sectionConflicts = checkSectionConflicts(entries, day);
    conflicts.push(...sectionConflicts);

    // Check room capacity
    if (entities && entities.sections && entities.rooms) {
      const capacityWarnings = checkRoomCapacity(entries, entities, day);
      conflicts.push(...capacityWarnings);
    }
  }

  // Check faculty conflicts (if we have subject-faculty mapping)
  if (entities && entities.subjects) {
    const facultyConflicts = await checkFacultyConflicts(timetableEntries, entities);
    conflicts.push(...facultyConflicts);
  }

  return conflicts;
}

/**
 * Check for room conflicts (same room, same time, same day)
 */
function checkRoomConflicts(entries, day) {
  const conflicts = [];
  
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const e1 = entries[i];
      const e2 = entries[j];
      
      // Same room, overlapping times
      if (e1.roomNo === e2.roomNo && 
          timeSlotsOverlap(e1.startTime, e1.endTime, e2.startTime, e2.endTime)) {
        conflicts.push({
          type: 'ROOM_CONFLICT',
          severity: 'ERROR',
          message: `Room ${e1.roomNo} is assigned to multiple sections at the same time`,
          day,
          time: `${e1.startTime}-${e1.endTime}`,
          room: e1.roomNo,
          sections: [e1.section, e2.section],
          details: [
            { section: e1.section, subject: e1.subjectCode, time: `${e1.startTime}-${e1.endTime}` },
            { section: e2.section, subject: e2.subjectCode, time: `${e2.startTime}-${e2.endTime}` }
          ]
        });
      }
    }
  }
  
  return conflicts;
}

/**
 * Check for section conflicts (same section scheduled twice at same time)
 */
function checkSectionConflicts(entries, day) {
  const conflicts = [];
  
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const e1 = entries[i];
      const e2 = entries[j];
      
      // Same section, overlapping times
      if (e1.section === e2.section && 
          timeSlotsOverlap(e1.startTime, e1.endTime, e2.startTime, e2.endTime)) {
        conflicts.push({
          type: 'SECTION_OVERLAP',
          severity: 'ERROR',
          message: `Section ${e1.section} has overlapping classes`,
          day,
          section: e1.section,
          time: `${e1.startTime}-${e1.endTime}`,
          details: [
            { subject: e1.subjectCode, room: e1.roomNo, time: `${e1.startTime}-${e1.endTime}` },
            { subject: e2.subjectCode, room: e2.roomNo, time: `${e2.startTime}-${e2.endTime}` }
          ]
        });
      }
    }
  }
  
  return conflicts;
}

/**
 * Check if room capacity is sufficient for section strength
 */
function checkRoomCapacity(entries, entities, day) {
  const warnings = [];
  
  for (const entry of entries) {
    const section = entities.sections[entry.section];
    const room = entities.rooms[entry.roomNo];
    
    if (section && room && section.strength > room.capacity) {
      warnings.push({
        type: 'CAPACITY_WARNING',
        severity: 'WARNING',
        message: `Room ${entry.roomNo} capacity (${room.capacity}) is less than section ${entry.section} strength (${section.strength})`,
        day,
        time: `${entry.startTime}-${entry.endTime}`,
        section: entry.section,
        room: entry.roomNo,
        sectionStrength: section.strength,
        roomCapacity: room.capacity
      });
    }
  }
  
  return warnings;
}

/**
 * Check for faculty conflicts (same faculty teaching multiple classes at same time)
 */
async function checkFacultyConflicts(entries, entities) {
  const conflicts = [];
  
  // Get all existing timetables to check cross-section faculty conflicts
  const allTimetables = await Timetable.find()
    .populate('subject')
    .populate('section');
  
  // Build faculty schedule map
  const facultySchedule = new Map();
  
  // Add existing timetables
  allTimetables.forEach(tt => {
    if (tt.subject && tt.subject.faculty) {
      const key = `${tt.subject.faculty}-${tt.day}-${tt.startTime}`;
      if (!facultySchedule.has(key)) {
        facultySchedule.set(key, []);
      }
      facultySchedule.get(key).push({
        section: tt.section.name,
        subject: tt.subject.code,
        room: tt.room,
        startTime: tt.startTime,
        endTime: tt.endTime,
        day: tt.day
      });
    }
  });
  
  // Check new entries against existing schedule
  for (const entry of entries) {
    const subject = entities.subjects[entry.subjectCode];
    
    if (subject && subject.faculty) {
      const key = `${subject.faculty}-${entry.day}-${entry.startTime}`;
      const existing = facultySchedule.get(key);
      
      if (existing && existing.length > 0) {
        // Check for overlaps
        for (const existingClass of existing) {
          if (timeSlotsOverlap(entry.startTime, entry.endTime, existingClass.startTime, existingClass.endTime)) {
            conflicts.push({
              type: 'FACULTY_CONFLICT',
              severity: 'ERROR',
              message: `Faculty ${subject.faculty} is assigned to multiple classes at the same time`,
              day: entry.day,
              time: `${entry.startTime}-${entry.endTime}`,
              faculty: subject.faculty,
              details: [
                { section: entry.section, subject: entry.subjectCode, room: entry.roomNo },
                { section: existingClass.section, subject: existingClass.subject, room: existingClass.room }
              ]
            });
          }
        }
      }
    }
  }
  
  return conflicts;
}

/**
 * Comprehensive validation of timetable data
 */
async function validateTimetableData(timetableEntries, options = {}) {
  const { 
    checkConflicts: shouldCheckConflicts = true,
    skipEntityValidation = false 
  } = options;
  
  const result = {
    valid: true,
    errors: [],
    warnings: [],
    conflicts: [],
    summary: {
      totalEntries: timetableEntries.length,
      validEntries: timetableEntries.length,
      invalidEntries: 0
    }
  };

  let entities = null;

  // Step 1: Validate entities exist (skip for Excel uploads)
  if (!skipEntityValidation) {
    const entityValidation = await validateEntities(timetableEntries);
    result.errors.push(...entityValidation.errors);
    result.warnings.push(...entityValidation.warnings);
    entities = entityValidation.entities;

    if (!entityValidation.valid) {
      result.valid = false;
      result.summary.validEntries = 0;
      result.summary.invalidEntries = timetableEntries.length;
      return result;
    }
  } else {
    console.log('⏭️  Skipping entity validation (Excel upload mode)');
  }

  // Step 2: Detect conflicts (optional)
  if (shouldCheckConflicts && !skipEntityValidation) {
    const conflicts = await detectConflicts(timetableEntries, entities);
    result.conflicts = conflicts;
    
    // Count errors vs warnings
    const errorConflicts = conflicts.filter(c => c.severity === 'ERROR');
    if (errorConflicts.length > 0) {
      result.valid = false;
      result.errors.push(...errorConflicts);
    }
    
    const warningConflicts = conflicts.filter(c => c.severity === 'WARNING');
    result.warnings.push(...warningConflicts);
  }

  return result;
}

module.exports = {
  validateTimetableData,
  validateEntities,
  detectConflicts,
  timeSlotsOverlap
};
