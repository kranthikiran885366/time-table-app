const XLSX = require('xlsx');

/**
 * Parse cell value to extract subject, class type, room, and faculty
 * Flexible format support:
 * - "CN-407", "CN 407", "CN/407" → { subjectCode: "CN", classType: "Theory", roomNo: "407" }
 * - "CD-T-407", "CD(T)-407" → { subjectCode: "CD", classType: "Theory", roomNo: "407" }
 * - "CD-L-512", "CD Lab 512" → { subjectCode: "CD", classType: "Lab", roomNo: "512" }
 * - "CN(Prof.X)-407", "CN [Dr.Y] 407" → { subjectCode: "CN", faculty: "Prof.X", roomNo: "407" }
 * - "Subject Name (Room 407)" → extracts code and room
 * - "BREAK", "—", empty → null
 */
function parseCellValue(cellValue) {
  if (!cellValue || cellValue.trim() === '' || cellValue.trim() === '—' || cellValue.trim() === '-') {
    return null;
  }

  const normalized = cellValue.trim().toUpperCase();
  
  // Skip break periods and common empty indicators
  if (/^(BREAK|LUNCH|RECESS|FREE|HOLIDAY|OFF)$/i.test(normalized)) {
    return null;
  }

  let subjectCode, classType = 'Theory', roomNo, faculty = null;

  // Try Pattern 0: Extract faculty name first (in parentheses or brackets)
  // "CN(Prof.X)-407", "CN[Dr.Y]-407", "CN (Mr.Z) 407"
  const facultyMatch = cellValue.match(/[\(\[]([A-Za-z\.\s]+)[\)\]]/);
  if (facultyMatch) {
    faculty = facultyMatch[1].trim();
    // Remove faculty from string for further parsing
    const withoutFaculty = cellValue.replace(/[\(\[]([A-Za-z\.\s]+)[\)\]]/, '').trim();
    cellValue = withoutFaculty;
  }

  // Re-normalize after faculty extraction
  const cleanValue = cellValue.trim().toUpperCase();

  // Try Pattern 1: "SUBJECT-TYPE-ROOM" or "SUBJECT-ROOM"
  let match = cleanValue.match(/^([A-Z0-9]+)[-\s/]([TL]|THEORY|LAB)?[-\s/]?([A-Z0-9]+)$/i);
  if (match) {
    subjectCode = match[1];
    if (match[2]) {
      const type = match[2].toUpperCase();
      classType = (type === 'L' || type === 'LAB') ? 'Lab' : 'Theory';
    }
    roomNo = match[3];
  }
  // Try Pattern 2: "SUBJECT(TYPE) ROOM" or "SUBJECT ROOM"
  else if (match = cleanValue.match(/^([A-Z0-9]+)\s*(?:\(([TL])\))?\s+([A-Z0-9]+)$/i)) {
    subjectCode = match[1];
    if (match[2]) {
      classType = match[2] === 'L' ? 'Lab' : 'Theory';
    }
    roomNo = match[3];
  }
  // Try Pattern 3: Extract from text like "Subject Name (Room 407)"
  else if (match = cleanValue.match(/([A-Z0-9]{2,}).*?(?:ROOM|R)?[\s\(]*([A-Z0-9]{3,})[\)]*$/i)) {
    subjectCode = match[1];
    roomNo = match[2];
    classType = cleanValue.includes('LAB') ? 'Lab' : 'Theory';
  }
  // Try Pattern 4: Just subject code and room separated by various delimiters
  else if (match = cleanValue.match(/^([A-Z0-9]+)[-\s/,.:]+([A-Z0-9]+)$/)) {
    subjectCode = match[1];
    roomNo = match[2];
  }
  // If still no match, try to extract any alphanumeric codes
  else {
    const codes = cleanValue.match(/[A-Z0-9]{2,}/g);
    if (codes && codes.length >= 2) {
      subjectCode = codes[0];
      roomNo = codes[codes.length - 1];
      // Check if middle part indicates lab
      if (codes.length > 2 && (codes[1] === 'L' || codes[1] === 'LAB')) {
        classType = 'Lab';
      }
    } else if (codes && codes.length === 1) {
      // Single code - treat as subject, use generic room
      subjectCode = codes[0];
      roomNo = 'TBA';
    } else {
      // Cannot parse - return null to skip
      console.warn(`   ⚠️  Could not parse cell: "${cellValue}"`);
      return null;
    }
  }

  return {
    subjectCode: subjectCode?.trim() || 'UNKNOWN',
    classType,
    roomNo: roomNo?.trim() || 'TBA',
    faculty: faculty || null
  };
}

/**
 * Parse time slot to extract start and end times
 * Handles multiple formats:
 * - "8.15-9.05", "08:15-09:05", "8:15-9:05"
 * - "8:15 AM-9:05 AM", "8.15AM-9.05AM"
 * - "8:15", "08:15" (single time - will use 1 hour duration)
 */
function parseTimeSlot(timeSlot) {
  if (!timeSlot || typeof timeSlot !== 'string') {
    return null;
  }

  const normalized = timeSlot.trim().replace(/\s+/g, '');
  
  // Try multiple patterns
  // Pattern 1: "8.15-9.05" or "08:15-09:05" with various separators
  let match = normalized.match(/(\d{1,2})[.:\s]*(\d{2})?\s*(?:AM|PM)?\s*[-–—to]\s*(\d{1,2})[.:\s]*(\d{2})?\s*(?:AM|PM)?/i);
  
  if (match) {
    const [, startHour, startMin = '00', endHour, endMin = '00'] = match;
    const startTime = `${startHour.padStart(2, '0')}:${startMin}`;
    const endTime = `${endHour.padStart(2, '0')}:${endMin}`;
    return { startTime, endTime };
  }
  
  // Pattern 2: Single time "8:15" or "08:15" - assume 1 hour duration
  match = normalized.match(/^(\d{1,2})[.:\s]*(\d{2})/);
  if (match) {
    const [, hour, min] = match;
    const startHour = parseInt(hour);
    const endHour = (startHour + 1) % 24;
    const startTime = `${hour.padStart(2, '0')}:${min}`;
    const endTime = `${endHour.toString().padStart(2, '0')}:${min}`;
    return { startTime, endTime };
  }

  return null;
}

/**
 * Parse day name to standard format - very flexible
 */
function parseDay(dayValue) {
  if (!dayValue) {
    return null;
  }

  const normalized = dayValue.toString().trim().toUpperCase();
  
  // Skip empty or non-day values
  if (normalized === '' || normalized === 'DAY' || normalized === 'DAYS') {
    return null;
  }
  
  const dayMap = {
    'MON': 'Monday', 'MONDAY': 'Monday', 'M': 'Monday',
    'TUE': 'Tuesday', 'TUES': 'Tuesday', 'TUESDAY': 'Tuesday', 'TU': 'Tuesday',
    'WED': 'Wednesday', 'WEDNESDAY': 'Wednesday', 'W': 'Wednesday',
    'THU': 'Thursday', 'THUR': 'Thursday', 'THURS': 'Thursday', 'THURSDAY': 'Thursday', 'TH': 'Thursday',
    'FRI': 'Friday', 'FRIDAY': 'Friday', 'F': 'Friday',
    'SAT': 'Saturday', 'SATURDAY': 'Saturday', 'SA': 'Saturday',
    'SUN': 'Sunday', 'SUNDAY': 'Sunday', 'SU': 'Sunday'
  };

  // Check for exact match
  if (dayMap[normalized]) {
    return dayMap[normalized];
  }
  
  // Check if it starts with a day abbreviation
  for (const [key, value] of Object.entries(dayMap)) {
    if (normalized.startsWith(key)) {
      return value;
    }
  }

  return null;
}

/**
 * Parse entire Excel file and extract timetable data
 * Returns: { sections: [{ sectionName, timetable: [...] }], errors: [...] }
 */
function parseExcelFile(buffer) {
  let workbook;
  
  try {
    workbook = XLSX.read(buffer, { type: 'buffer' });
  } catch (error) {
    throw new Error(`Failed to read Excel file: ${error.message}. Ensure the file is a valid Excel file.`);
  }
  
  if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('Excel file has no sheets. Please provide a valid timetable file.');
  }
  
  const result = {
    sections: [],
    errors: [],
    summary: {
      totalSheets: workbook.SheetNames.length,
      processedSheets: 0,
      totalEntries: 0,
      skippedCells: 0
    }
  };

  // Process each sheet
  for (const sheetName of workbook.SheetNames) {
    try {
      const sectionData = parseSheet(workbook.Sheets[sheetName], sheetName);
      
      if (sectionData.timetable.length > 0) {
        result.sections.push(sectionData);
        result.summary.processedSheets++;
        result.summary.totalEntries += sectionData.timetable.length;
      } else {
        result.errors.push({
          sheet: sheetName,
          error: 'No valid timetable entries found in sheet'
        });
      }
      
      result.summary.skippedCells += sectionData.skippedCells;
      
    } catch (error) {
      result.errors.push({
        sheet: sheetName,
        error: error.message
      });
    }
  }

  return result;
}

/**
 * Parse a single sheet and extract timetable entries
 */
function parseSheet(sheet, sheetName) {
  // Convert sheet to JSON (array of arrays)
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  
  console.log(`\n📋 Parsing sheet: ${sheetName}`);
  console.log(`   Total rows: ${data.length}`);
  
  // Skip empty sheets or sheets with too few rows
  if (data.length === 0) {
    console.log(`   ⏭️  Skipped: Empty sheet`);
    return { sectionName: sheetName, timetable: [], errors: [], skippedCells: 0 };
  }
  
  if (data.length < 3) {
    console.log(`   ⏭️  Skipped: Too few rows (need at least 3 rows)`);
    return { sectionName: sheetName, timetable: [], errors: [], skippedCells: 0 };
  }

  const timetable = [];
  const errors = [];
  let skippedCells = 0;

  // Find the header row with time slots (usually row 2, index 1)
  let headerRowIndex = -1;
  let headerRow = null;
  
  for (let i = 0; i < Math.min(5, data.length); i++) {
    const row = data[i];
    const firstCell = row[0]?.toString().toUpperCase().trim();
    
    console.log(`   Row ${i + 1} first cell: "${firstCell}"`);
    
    // Check if this row has "DAY" or "DAYS" as first column
    if (firstCell === 'DAY' || firstCell === 'DAYS' || firstCell === 'TIME') {
      headerRowIndex = i;
      headerRow = row;
      console.log(`   ✓ Found header at row ${i + 1}`);
      break;
    }
  }
  
  if (headerRowIndex === -1) {
    throw new Error('Could not find header row with "Day" column. Ensure row 2 or 3 has "Day" in first column.');
  }
  
  const timeSlots = [];
  
  // Parse time slots (skip first column which is "Day")
  for (let col = 1; col < headerRow.length; col++) {
    const timeSlot = parseTimeSlot(headerRow[col]);
    timeSlots.push(timeSlot); // Can be null for invalid time slots
    if (timeSlot) {
      console.log(`   Time slot ${col}: ${headerRow[col]} → ${timeSlot.startTime}-${timeSlot.endTime}`);
    }
  }
  
  console.log(`   Parsed ${timeSlots.filter(t => t !== null).length} valid time slots`);

  // Process each day row (starting from row after header)
  let validEntries = 0;
  for (let row = headerRowIndex + 1; row < data.length; row++) {
    const dayValue = data[row][0];
    const day = parseDay(dayValue);
    
    if (!day) {
      if (dayValue && dayValue.toString().trim()) {
        console.log(`   Row ${row + 1}: Skipped (dayValue: "${dayValue}")`);
      }
      continue; // Skip invalid days
    }

    console.log(`   Processing ${day}...`);
    
    // Process each period in this day
    for (let col = 1; col < data[row].length; col++) {
      const cellValue = data[row][col];
      const timeSlot = timeSlots[col - 1];

      if (!timeSlot) {
        continue; // Skip if time slot is invalid
      }

      // Skip if cell is empty or whitespace
      if (!cellValue || !cellValue.toString().trim()) {
        skippedCells++;
        continue;
      }

      try {
        const parsed = parseCellValue(cellValue);
        
        if (parsed) {
          timetable.push({
            section: sheetName,
            day,
            startTime: timeSlot.startTime,
            endTime: timeSlot.endTime,
            subjectCode: parsed.subjectCode,
            classType: parsed.classType,
            roomNo: parsed.roomNo,
            // Metadata for debugging
            _meta: {
              row: row + 1,
              col: col + 1,
              originalValue: cellValue
            }
          });
          validEntries++;
        } else {
          skippedCells++;
        }
      } catch (error) {
        // Don't treat parse failures as critical errors, just log them
        console.warn(`   ⚠️  Row ${row + 1}, Col ${col + 1}: ${error.message}`);
        skippedCells++;
      }
    }
  }
  
  console.log(`   ✓ Parsed ${validEntries} valid entries from ${sheetName}`);

  // Merge consecutive lab periods
  const mergedTimetable = mergeConsecutiveLabPeriods(timetable);
  console.log(`   ✓ Merged consecutive labs: ${timetable.length} → ${mergedTimetable.length} entries`);

  return {
    sectionName: sheetName,
    timetable: mergedTimetable,
    errors,
    skippedCells
  };
}

/**
 * ADVANCED ALGORITHM: Merge consecutive lab periods into single sessions
 * 
 * Algorithm Overview:
 * 1. Group entries by section and day for efficient processing
 * 2. Sort each day's entries chronologically by start time
 * 3. Use sliding window technique to detect consecutive periods
 * 4. Merge criteria (ALL must match):
 *    - Same subject code
 *    - Same room number
 *    - Both are lab sessions
 *    - Time slots are consecutive (current.endTime === next.startTime)
 *    - Optional: Same faculty (if present)
 * 5. Track merge statistics for reporting
 * 
 * Time Complexity: O(n log n) - dominated by sorting
 * Space Complexity: O(n) - for grouped data structure
 * 
 * Example:
 *   Input:  CD-L-512 (9:00-10:00), CD-L-512 (10:00-11:00), CN-407 (11:00-12:00)
 *   Output: CD-L-512 (9:00-11:00, duration=2), CN-407 (11:00-12:00, duration=1)
 */
function mergeConsecutiveLabPeriods(timetable) {
  if (!timetable || timetable.length === 0) {
    return timetable;
  }

  // Phase 1: Group by section and day for O(1) lookup
  const grouped = {};
  for (const entry of timetable) {
    const key = `${entry.section}_${entry.day}`;
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(entry);
  }

  const merged = [];
  let totalMerged = 0;

  // Phase 2: Process each day's timetable independently
  for (const key in grouped) {
    const dayEntries = grouped[key].sort((a, b) => {
      // Lexicographic sort on HH:MM format works correctly
      return a.startTime.localeCompare(b.startTime);
    });

    let i = 0;
    while (i < dayEntries.length) {
      const current = dayEntries[i];
      
      // Phase 3: Lab detection and merging using sliding window
      if (current.classType === 'Lab') {
        let endTime = current.endTime;
        let duration = 1;
        let j = i + 1;
        let mergedIndices = [i];
        
        // Sliding window: check consecutive periods
        while (j < dayEntries.length) {
          const next = dayEntries[j];
          
          // Advanced merge criteria with faculty matching
          const sameSubject = next.subjectCode === current.subjectCode;
          const sameRoom = next.roomNo === current.roomNo;
          const isLab = next.classType === 'Lab';
          const isConsecutive = next.startTime === endTime;
          const sameFaculty = !current.faculty || !next.faculty || current.faculty === next.faculty;
          
          if (sameSubject && sameRoom && isLab && isConsecutive && sameFaculty) {
            endTime = next.endTime;
            duration++;
            mergedIndices.push(j);
            j++;
          } else {
            break; // Break on first non-matching period
          }
        }
        
        // Create merged entry with metadata
        merged.push({
          ...current,
          endTime: endTime,
          duration: duration,
          _merged: duration > 1,
          _mergedFrom: duration > 1 ? mergedIndices.length : 1
        });
        
        if (duration > 1) {
          totalMerged += (duration - 1);
        }
        
        i = j; // Skip all merged entries
      } else {
        // Non-lab entries: preserve as-is
        merged.push({
          ...current,
          duration: 1,
          _merged: false
        });
        i++;
      }
    }
  }

  if (totalMerged > 0) {
    console.log(`   🔗 Merged ${totalMerged} consecutive lab periods`);
  }

  return merged;
}

/**
 * Generate a sample Excel template for download
 */
function generateTemplate() {
  const workbook = XLSX.utils.book_new();
  
  // Create sample sheet for CSE-A
  const sampleData = [
    ['Day', '8.15-9.05', '9.05-9.55', '9.55-10.10', '10.10-11.00', '11.00-11.50', '11.50-12.40', '12.40-1.30', '1.30-2.20', '2.20-3.10', '3.10-4.00'],
    ['MON', 'CN-407', 'CD-T-407', 'BREAK', 'IAI-301', 'MSD-L-512', '—', 'LUNCH', 'OS-405', 'SE-T-403', '—'],
    ['TUE', 'MSD-317', '—', 'BREAK', 'MSD-512', 'CN-407', 'IAI-301', 'LUNCH', 'CD-407', 'OS-L-510', 'OS-L-510'],
    ['WED', 'SE-403', 'OS-405', 'BREAK', 'CD-407', 'CN-407', '—', 'LUNCH', 'IAI-L-515', 'IAI-L-515', '—'],
    ['THU', 'IAI-301', 'CN-407', 'BREAK', 'SE-403', 'CD-T-407', 'MSD-317', 'LUNCH', 'OS-405', '—', '—'],
    ['FRI', 'CD-407', 'SE-L-508', 'BREAK', 'SE-L-508', 'MSD-317', 'CN-407', 'LUNCH', 'IAI-301', 'OS-405', '—'],
    ['SAT', 'OS-405', 'MSD-L-512', 'BREAK', 'MSD-L-512', 'SE-403', 'CD-407', 'LUNCH', 'CN-407', 'IAI-301', '—']
  ];
  
  const sheet1 = XLSX.utils.aoa_to_sheet(sampleData);
  XLSX.utils.book_append_sheet(workbook, sheet1, 'CSE-A');
  
  // Create another sample sheet
  const sampleData2 = [
    ['Day', '8.15-9.05', '9.05-9.55', '9.55-10.10', '10.10-11.00', '11.00-11.50', '11.50-12.40', '12.40-1.30', '1.30-2.20', '2.20-3.10'],
    ['MON', 'DS-201', 'ALGO-T-202', 'BREAK', 'DB-203', 'WEB-L-505', 'WEB-L-505', 'LUNCH', 'ML-204', 'AI-T-205'],
    ['TUE', 'WEB-202', 'ML-204', 'BREAK', 'DB-L-506', 'DB-L-506', 'DS-201', 'LUNCH', 'ALGO-202', 'AI-205'],
    ['WED', 'AI-205', 'DB-203', 'BREAK', 'WEB-202', 'ML-L-507', 'ML-L-507', 'LUNCH', 'DS-201', 'ALGO-202'],
    ['THU', 'ALGO-202', 'DS-201', 'BREAK', 'AI-T-205', 'DB-203', 'WEB-202', 'LUNCH', 'ML-204', '—'],
    ['FRI', 'DB-203', 'AI-L-508', 'BREAK', 'AI-L-508', 'WEB-202', 'ALGO-202', 'LUNCH', 'DS-201', 'ML-204'],
    ['SAT', 'ML-204', 'WEB-202', 'BREAK', 'DS-L-509', 'DS-L-509', 'DB-203', 'LUNCH', 'ALGO-202', 'AI-205']
  ];
  
  const sheet2 = XLSX.utils.aoa_to_sheet(sampleData2);
  XLSX.utils.book_append_sheet(workbook, sheet2, 'CSE-B');
  
  return workbook;
}

module.exports = {
  parseCellValue,
  parseTimeSlot,
  parseDay,
  parseExcelFile,
  parseSheet,
  generateTemplate
};
