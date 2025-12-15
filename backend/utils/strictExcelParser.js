const XLSX = require('xlsx');

/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  ENTERPRISE ACADEMIC ERP TIMETABLE PARSER                    ║
 * ║  Strict, Deterministic, Production-Ready                     ║
 * ║  Zero Tolerance for Ambiguity                                ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

/**
 * Normalize section code from Excel format to database format
 * SECTION-14 → SEC14
 * SECTION 14 → SEC14
 * SEC-14 → SEC14
 * 14 → SEC14
 */
function normalizeSectionCode(rawSection) {
  if (!rawSection) return null;
  
  const str = rawSection.toString().trim().toUpperCase();
  
  // Extract number from various formats
  const match = str.match(/(\d+)/);
  if (!match) return null;
  
  const number = match[1];
  return `SEC${number}`;
}

/**
 * Normalize time to HH:MM format
 * 8.15 → 08:15
 * 9:05 → 09:05
 * 1.40 → 13:40 (afternoon hours)
 */
function normalizeTime(timeStr) {
  if (!timeStr) return null;
  
  const str = timeStr.toString().trim();
  
  // Match patterns like "8.15-9.05" or "8:15-9:05"
  const rangeMatch = str.match(/(\d{1,2})[.:](\d{2})\s*[-–—]\s*(\d{1,2})[.:](\d{2})/);
  
  if (rangeMatch) {
    const [, startHour, startMin, endHour, endMin] = rangeMatch;
    let sh = parseInt(startHour);
    let eh = parseInt(endHour);
    
    // Handle PM times (after 12:40 = 1:40 PM)
    if (sh < 8) sh += 12;
    if (eh < 8) eh += 12;
    if (eh < sh) eh += 12; // Next day edge case
    
    return {
      startTime: `${sh.toString().padStart(2, '0')}:${startMin}`,
      endTime: `${eh.toString().padStart(2, '0')}:${endMin}`
    };
  }
  
  return null;
}

/**
 * Parse strict timetable cell format
 * 
 * FORMATS:
 * - "CN-216" → { subject: "CN", room: "216", type: "THEORY" }
 * - "AI LAB-301" or "CN-L-317" → { subject: "AI LAB", room: "301", type: "LAB" }
 * - "DE-407(T)" → { subject: "DE", room: "407", type: "TUTORIAL" }
 * - "HONORS-308" → { subject: "HONORS", room: "308", type: "HONORS" }
 * - "T5 ASSESSMENT-505" → { subject: "T5 ASSESSMENT", room: "505", type: "ASSESSMENT" }
 * - Empty / "-" / "BREAK" → null
 */
function parseTimetableCell(cellValue) {
  if (!cellValue) return null;
  
  const str = cellValue.toString().trim();
  
  // Empty indicators
  if (str === '' || str === '-' || str === '—' || /^(FREE|BREAK|LUNCH)$/i.test(str)) {
    return null;
  }
  
  // Pattern 1: ASSESSMENT - "T5 ASSESSMENT-505"
  let match = str.match(/^(T\d+\s+ASSESSMENT)\s*[-–]\s*([A-Z0-9]+)$/i);
  if (match) {
    return {
      subject: match[1].toUpperCase(),
      room: match[2].toUpperCase(),
      type: 'ASSESSMENT',
      isLab: false
    };
  }
  
  // Pattern 2: HONORS - "HONORS-308"
  match = str.match(/^(HONORS?)\s*[-–]\s*([A-Z0-9]+)$/i);
  if (match) {
    return {
      subject: 'HONORS',
      room: match[2].toUpperCase(),
      type: 'HONORS',
      isLab: false
    };
  }
  
  // Pattern 3: LAB with -L- format - "CN-L-317" or "DMT-L-404"
  match = str.match(/^([A-Z0-9]+)\s*[-–]\s*L\s*[-–]\s*([A-Z0-9]+)$/i);
  if (match) {
    return {
      subject: `${match[1].toUpperCase()}-LAB`,
      room: match[2].toUpperCase(),
      type: 'LAB',
      isLab: true
    };
  }
  
  // Pattern 4: LAB with "LAB" keyword - "AI LAB-301" or "CN LAB-512"
  match = str.match(/^([A-Z0-9]+)\s+LAB\s*[-–]\s*([A-Z0-9]+)$/i);
  if (match) {
    return {
      subject: `${match[1].toUpperCase()}-LAB`,
      room: match[2].toUpperCase(),
      type: 'LAB',
      isLab: true
    };
  }
  
  // Pattern 5: TUTORIAL - "DE-407(T)" or "DE-308(T)"
  match = str.match(/^([A-Z0-9]+)\s*[-–]\s*([A-Z0-9]+)\s*\(T\)$/i);
  if (match) {
    return {
      subject: match[1].toUpperCase(),
      room: match[2].toUpperCase(),
      type: 'TUTORIAL',
      isLab: false
    };
  }
  
  // Pattern 6: THEORY - "CN-216" (most common)
  match = str.match(/^([A-Z0-9]+)\s*[-–]\s*([A-Z0-9]+)$/i);
  if (match) {
    return {
      subject: match[1].toUpperCase(),
      room: match[2].toUpperCase(),
      type: 'THEORY',
      isLab: false
    };
  }
  
  // Unparseable - return error marker
  return {
    subject: 'PARSE_ERROR',
    room: 'UNKNOWN',
    type: 'UNKNOWN',
    isLab: false,
    originalValue: str,
    error: `Cannot parse cell: "${str}"`
  };
}

/**
 * Parse day name - strict matching only
 */
function parseDay(dayValue) {
  if (!dayValue) return null;
  
  const str = dayValue.toString().trim().toUpperCase();
  
  const dayMap = {
    'MON': 'Monday',
    'TUE': 'Tuesday',
    'WED': 'Wednesday',
    'THUR': 'Thursday',
    'THU': 'Thursday',
    'FRI': 'Friday',
    'SAT': 'Saturday',
    'SUN': 'Sunday'
  };
  
  return dayMap[str] || null;
}

/**
 * Parse faculty mapping table from bottom of sheet
 * Expected format:
 * 
 * CD       → Mr. SIMHADRI CHINNA GOPI
 * DMT      → Dr. M. RAJA RAO
 * CN       → Ms. V. ANUSHA
 * CN-LAB   → Ms. V. ANUSHA, Dr. H. JAMES
 * 
 * Returns: { subjectCode: [facultyNames...] }
 */
function parseFacultyMapping(data, timetableEndRow) {
  const facultyMap = {};
  
  // Search for faculty mapping table after timetable (typically 2-3 rows after last day)
  for (let row = timetableEndRow + 2; row < data.length; row++) {
    const cells = data[row];
    if (!cells || cells.length < 2) continue;
    
    const firstCol = cells[0]?.toString().trim();
    const secondCol = cells[1]?.toString().trim();
    
    // Skip empty rows
    if (!firstCol || !secondCol) continue;
    
    // Check if this looks like a mapping row: "SUBJECT" → "Faculty Name"
    // The arrow can be →, ->, =>, or just whitespace
    if (secondCol.includes('→') || secondCol.includes('->') || secondCol.includes('=>')) {
      // Format: "CD → Mr. Name"
      const parts = secondCol.split(/[→\-=]>?/);
      if (parts.length === 2) {
        const subject = firstCol.toUpperCase();
        const faculty = parts[1].trim();
        facultyMap[subject] = faculty.split(',').map(f => f.trim());
      }
    } else if (firstCol.length <= 10 && /^[A-Z0-9\-\s]+$/.test(firstCol)) {
      // Format: Two columns - "CD" | "Mr. Name"
      const subject = firstCol.toUpperCase();
      const faculty = secondCol;
      facultyMap[subject] = faculty.split(',').map(f => f.trim());
    }
  }
  
  return facultyMap;
}

/**
 * Parse class teacher from sheet
 * Expected format: "Class Teacher → Ms. V. ANUSHA" or "Class Teacher: Ms. V. ANUSHA"
 */
function parseClassTeacher(data, timetableEndRow) {
  // Search in last 10 rows of sheet
  const searchStart = Math.max(timetableEndRow, data.length - 10);
  
  for (let row = searchStart; row < data.length; row++) {
    const cells = data[row];
    if (!cells) continue;
    
    for (let col = 0; col < cells.length; col++) {
      const cell = cells[col]?.toString().trim();
      if (!cell) continue;
      
      // Match "Class Teacher → Name" or "Class Teacher: Name"
      const match = cell.match(/Class\s+Teacher\s*[→:–-]\s*(.+)/i);
      if (match) {
        return match[1].trim();
      }
    }
  }
  
  return null;
}

/**
 * Merge consecutive LAB slots
 * Rule: Consecutive identical LAB cells become one entry with summed duration
 */
function mergeConsecutiveLabs(entries) {
  if (entries.length === 0) return [];
  
  const merged = [];
  let current = null;
  
  for (const entry of entries) {
    if (!current) {
      current = { ...entry };
      continue;
    }
    
    // Check if this entry can be merged with current
    const canMerge = (
      current.type === 'LAB' &&
      entry.type === 'LAB' &&
      current.subjectCode === entry.subjectCode &&
      current.roomNo === entry.roomNo &&
      current.day === entry.day &&
      current.endTime === entry.startTime // Consecutive check
    );
    
    if (canMerge) {
      // Extend current entry's end time
      current.endTime = entry.endTime;
      current.duration = (current.duration || 1) + 1;
      current._merged = true;
      current._mergedFrom = (current._mergedFrom || 1) + 1;
    } else {
      // Push current and start new
      merged.push(current);
      current = { ...entry };
    }
  }
  
  // Push last entry
  if (current) {
    merged.push(current);
  }
  
  return merged;
}

/**
 * Validate parsed entry against strict rules
 * Returns: { valid: boolean, errors: [] }
 */
function validateEntry(entry, facultyMap) {
  const errors = [];
  
  // Rule 1: Subject code must exist
  if (!entry.subjectCode || entry.subjectCode === 'PARSE_ERROR') {
    errors.push({
      type: 'MISSING_SUBJECT',
      message: `Subject code missing or unparseable`,
      entry
    });
  }
  
  // Rule 2: Room number must exist
  if (!entry.roomNo || entry.roomNo === 'UNKNOWN' || entry.roomNo === 'TBA') {
    errors.push({
      type: 'MISSING_ROOM',
      message: `Room number missing for ${entry.subjectCode}`,
      entry
    });
  }
  
  // Rule 3: Faculty mapping must exist
  const lookupKey = entry.type === 'LAB' ? `${entry.subjectCode.replace(' LAB', '')}-LAB` : entry.subjectCode;
  const altKey = entry.subjectCode;
  
  if (!facultyMap[lookupKey] && !facultyMap[altKey]) {
    errors.push({
      type: 'MISSING_FACULTY',
      message: `Faculty mapping not found for ${entry.subjectCode}`,
      entry
    });
  }
  
  // Rule 4: Lab must span at least 1 period (will be 2+ after merging)
  if (entry.type === 'LAB' && !entry._merged) {
    // Single period lab - warning but not error (will be caught after merge)
  }
  
  // Rule 5: Valid time format
  if (!entry.startTime || !entry.endTime) {
    errors.push({
      type: 'INVALID_TIME',
      message: `Invalid time format for ${entry.subjectCode}`,
      entry
    });
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Main parser - Parse entire Excel file with strict validation
 * 
 * Returns:
 * {
 *   success: boolean,
 *   sections: [{ sectionCode, classTeacher, timetable: [...] }],
 *   facultyMap: {},
 *   stats: { totalSlots, validEntries, errors, missingSections },
 *   errors: { grouped by type }
 * }
 */
function parseStrictTimetable(buffer) {
  let workbook;
  
  try {
    workbook = XLSX.read(buffer, { type: 'buffer' });
  } catch (error) {
    throw new Error(`❌ FATAL: Invalid Excel file - ${error.message}`);
  }
  
  if (!workbook?.SheetNames?.length) {
    throw new Error('❌ FATAL: Excel file contains no sheets');
  }
  
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║  ENTERPRISE TIMETABLE PARSER - STRICT MODE  ║');
  console.log('╚═══════════════════════════════════════════╝\n');
  
  const result = {
    success: true,
    sections: [],
    facultyMap: {},
    stats: {
      totalSheets: workbook.SheetNames.length,
      totalSlots: 0,
      validEntries: 0,
      labsMerged: 0,
      skippedBreaks: 0,
      errors: []
    },
    errors: {
      missingSections: [],
      missingFaculty: [],
      missingRooms: [],
      parseErrors: [],
      invalidTimes: []
    }
  };
  
  // Process each sheet
  for (const sheetName of workbook.SheetNames) {
    console.log(`\n📄 Processing sheet: "${sheetName}"`);
    
    try {
      const sheetData = parseStrictSheet(workbook.Sheets[sheetName], sheetName);
      
      if (sheetData.sectionCode) {
        result.sections.push(sheetData);
        result.stats.totalSlots += sheetData.timetable.length;
        result.stats.labsMerged += sheetData.stats.labsMerged;
        result.stats.skippedBreaks += sheetData.stats.skippedBreaks;
        
        // Merge faculty maps
        Object.assign(result.facultyMap, sheetData.facultyMap);
        
        console.log(`   ✅ Parsed ${sheetData.timetable.length} entries for section ${sheetData.sectionCode}`);
      } else {
        console.log(`   ⏭️  Skipped: Empty or invalid sheet`);
      }
      
    } catch (error) {
      console.error(`   ❌ ERROR: ${error.message}`);
      result.errors.parseErrors.push({
        sheet: sheetName,
        error: error.message
      });
      result.success = false;
    }
  }
  
  // Post-processing validation
  console.log('\n🔍 Running post-processing validation...');
  
  for (const section of result.sections) {
    for (const entry of section.timetable) {
      const validation = validateEntry(entry, result.facultyMap);
      
      if (!validation.valid) {
        result.stats.validEntries--;
        
        // Group errors by type
        for (const error of validation.errors) {
          switch (error.type) {
            case 'MISSING_FACULTY':
              result.errors.missingFaculty.push(error);
              break;
            case 'MISSING_ROOM':
              result.errors.missingRooms.push(error);
              break;
            case 'INVALID_TIME':
              result.errors.invalidTimes.push(error);
              break;
            default:
              result.errors.parseErrors.push(error);
          }
        }
      } else {
        result.stats.validEntries++;
      }
    }
  }
  
  // Summary
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║  PARSING COMPLETE                           ║');
  console.log('╚═══════════════════════════════════════════╝');
  console.log(`📊 Total Slots Parsed: ${result.stats.totalSlots}`);
  console.log(`✅ Valid Entries: ${result.stats.validEntries}`);
  console.log(`🔄 Labs Merged: ${result.stats.labsMerged}`);
  console.log(`⏭️  Breaks Skipped: ${result.stats.skippedBreaks}`);
  console.log(`❌ Errors: ${result.stats.errors.length}`);
  
  if (result.errors.missingFaculty.length > 0) {
    console.log(`\n⚠️  Missing Faculty Mappings: ${result.errors.missingFaculty.length}`);
  }
  
  return result;
}

/**
 * Parse a single sheet with strict validation
 */
function parseStrictSheet(sheet, sheetName) {
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  
  if (data.length < 5) {
    throw new Error('Sheet too small - need at least 5 rows (header, time, days)');
  }
  
  // Step 1: Extract section code from first rows
  let sectionCode = null;
  for (let i = 0; i < Math.min(3, data.length); i++) {
    const firstCell = data[i][0]?.toString().trim();
    if (firstCell && /SECTION/i.test(firstCell)) {
      sectionCode = normalizeSectionCode(firstCell);
      console.log(`   📌 Section: ${firstCell} → ${sectionCode}`);
      break;
    }
  }
  
  // Also check sheet name for section code
  if (!sectionCode) {
    sectionCode = normalizeSectionCode(sheetName);
    if (sectionCode) {
      console.log(`   📌 Section from sheet name: ${sheetName} → ${sectionCode}`);
    }
  }
  
  if (!sectionCode) {
    throw new Error('Cannot determine section code from sheet');
  }
  
  // Step 2: Find time header row (contains time ranges like "8.15-9.05")
  let timeHeaderRow = -1;
  let timeSlots = [];
  
  for (let i = 0; i < Math.min(5, data.length); i++) {
    const row = data[i];
    const firstCell = row[0]?.toString().trim().toUpperCase();
    
    // Time header row usually has "DAY" in first column
    if (firstCell === 'DAY' || firstCell === 'DAYS') {
      timeHeaderRow = i;
      
      // Parse time slots (skip first column which is "Day")
      for (let col = 1; col < row.length; col++) {
        const timeStr = row[col]?.toString().trim();
        
        // Check for BREAK indicators
        if (/BREAK|LUNCH|RECESS/i.test(timeStr)) {
          timeSlots.push({ isBreak: true });
          continue;
        }
        
        const timeRange = normalizeTime(timeStr);
        if (timeRange) {
          timeSlots.push(timeRange);
        } else {
          timeSlots.push(null);
        }
      }
      
      console.log(`   ⏰ Found ${timeSlots.filter(t => t && !t.isBreak).length} time slots`);
      break;
    }
  }
  
  if (timeHeaderRow === -1) {
    throw new Error('Cannot find time header row (expected "Day" in first column)');
  }
  
  // Step 3: Parse timetable entries (day rows)
  const rawEntries = [];
  let lastDayRow = timeHeaderRow;
  let skippedBreaks = 0;
  
  for (let row = timeHeaderRow + 1; row < data.length; row++) {
    const dayValue = data[row][0];
    const day = parseDay(dayValue);
    
    if (!day) {
      // Not a day row - might be end of timetable
      lastDayRow = row - 1;
      break;
    }
    
    lastDayRow = row;
    
    // Process each time slot for this day
    for (let col = 1; col < data[row].length && col - 1 < timeSlots.length; col++) {
      const timeSlot = timeSlots[col - 1];
      
      // Skip breaks
      if (!timeSlot || timeSlot.isBreak) {
        skippedBreaks++;
        continue;
      }
      
      const cellValue = data[row][col];
      const parsed = parseTimetableCell(cellValue);
      
      if (!parsed) continue; // Empty cell
      
      rawEntries.push({
        sectionCode,
        day,
        startTime: timeSlot.startTime,
        endTime: timeSlot.endTime,
        subjectCode: parsed.subject,
        roomNo: parsed.room,
        type: parsed.type,
        isLab: parsed.isLab,
        duration: 1,
        originalCell: cellValue?.toString()
      });
    }
  }
  
  console.log(`   📝 Parsed ${rawEntries.length} raw entries`);
  
  // Step 4: Merge consecutive labs
  const entriesBeforeMerge = rawEntries.length;
  const mergedEntries = mergeConsecutiveLabs(rawEntries);
  const labsMerged = entriesBeforeMerge - mergedEntries.length;
  
  if (labsMerged > 0) {
    console.log(`   🔄 Merged ${labsMerged} consecutive lab slots`);
  }
  
  // Step 5: Parse faculty mapping and class teacher
  const facultyMap = parseFacultyMapping(data, lastDayRow);
  const classTeacher = parseClassTeacher(data, lastDayRow);
  
  console.log(`   👨‍🏫 Faculty mappings: ${Object.keys(facultyMap).length}`);
  if (classTeacher) {
    console.log(`   👤 Class Teacher: ${classTeacher}`);
  }
  
  // Step 6: Attach faculty to entries
  for (const entry of mergedEntries) {
    const lookupKey = entry.type === 'LAB' ? `${entry.subjectCode.replace(' LAB', '')}-LAB` : entry.subjectCode;
    const altKey = entry.subjectCode;
    
    entry.facultyName = facultyMap[lookupKey] || facultyMap[altKey] || null;
    
    // Convert array to comma-separated string if needed
    if (Array.isArray(entry.facultyName)) {
      entry.facultyName = entry.facultyName.join(', ');
    }
  }
  
  return {
    sectionCode,
    classTeacher,
    timetable: mergedEntries,
    facultyMap,
    stats: {
      rawEntries: entriesBeforeMerge,
      finalEntries: mergedEntries.length,
      labsMerged,
      skippedBreaks
    }
  };
}

module.exports = {
  parseStrictTimetable,
  normalizeSectionCode,
  normalizeTime,
  parseTimetableCell,
  parseDay
};
