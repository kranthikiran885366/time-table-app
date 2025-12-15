const XLSX = require('xlsx');

/**
 * Parse cell value to extract subject, class type, and room
 * Formats supported:
 * - "CN-407" → { subjectCode: "CN", classType: "Theory", roomNo: "407" }
 * - "CD-T-407" → { subjectCode: "CD", classType: "Theory", roomNo: "407" }
 * - "CD-L-512" → { subjectCode: "CD", classType: "Lab", roomNo: "512" }
 * - "BREAK" / "—" / empty → null
 */
function parseCellValue(cellValue) {
  if (!cellValue || cellValue.trim() === '' || cellValue.trim() === '—') {
    return null;
  }

  const normalized = cellValue.trim().toUpperCase();
  
  // Skip break periods
  if (normalized === 'BREAK' || normalized === 'LUNCH') {
    return null;
  }

  // Parse format: SUBJECT-[TYPE]-ROOM
  const parts = normalized.split('-');
  
  if (parts.length < 2) {
    throw new Error(`Invalid cell format: "${cellValue}". Expected format: SUBJECT-ROOM or SUBJECT-TYPE-ROOM`);
  }

  let subjectCode, classType, roomNo;

  if (parts.length === 2) {
    // Format: SUBJECT-ROOM (default to Theory)
    [subjectCode, roomNo] = parts;
    classType = 'Theory';
  } else if (parts.length === 3) {
    // Format: SUBJECT-TYPE-ROOM
    [subjectCode, classType, roomNo] = parts;
    
    // Normalize class type
    if (classType === 'T' || classType === 'THEORY') {
      classType = 'Theory';
    } else if (classType === 'L' || classType === 'LAB') {
      classType = 'Lab';
    } else {
      throw new Error(`Invalid class type: "${classType}". Expected T/Theory or L/Lab`);
    }
  } else {
    throw new Error(`Invalid cell format: "${cellValue}". Too many parts`);
  }

  return {
    subjectCode: subjectCode.trim(),
    classType,
    roomNo: roomNo.trim()
  };
}

/**
 * Parse time slot to extract start and end times
 * Format: "8.15-9.05" → { startTime: "08:15", endTime: "09:05" }
 */
function parseTimeSlot(timeSlot) {
  if (!timeSlot || typeof timeSlot !== 'string') {
    return null;
  }

  const normalized = timeSlot.trim();
  
  // Match formats: "8.15-9.05", "08:15-09:05", "8:15-9:05"
  const match = normalized.match(/(\d{1,2})[.:](\d{2})\s*-\s*(\d{1,2})[.:](\d{2})/);
  
  if (!match) {
    return null;
  }

  const [, startHour, startMin, endHour, endMin] = match;
  
  // Format to HH:MM
  const startTime = `${startHour.padStart(2, '0')}:${startMin}`;
  const endTime = `${endHour.padStart(2, '0')}:${endMin}`;

  return { startTime, endTime };
}

/**
 * Parse day name to standard format
 */
function parseDay(dayValue) {
  if (!dayValue || typeof dayValue !== 'string') {
    return null;
  }

  const normalized = dayValue.trim().toUpperCase();
  
  const dayMap = {
    'MON': 'Monday',
    'MONDAY': 'Monday',
    'TUE': 'Tuesday',
    'TUES': 'Tuesday',
    'TUESDAY': 'Tuesday',
    'WED': 'Wednesday',
    'WEDNESDAY': 'Wednesday',
    'THU': 'Thursday',
    'THUR': 'Thursday',
    'THURS': 'Thursday',
    'THURSDAY': 'Thursday',
    'FRI': 'Friday',
    'FRIDAY': 'Friday',
    'SAT': 'Saturday',
    'SATURDAY': 'Saturday',
    'SUN': 'Sunday',
    'SUNDAY': 'Sunday'
  };

  return dayMap[normalized] || null;
}

/**
 * Parse entire Excel file and extract timetable data
 * Returns: { sections: [{ sectionName, timetable: [...] }], errors: [...] }
 */
function parseExcelFile(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  
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
  
  if (data.length < 2) {
    throw new Error('Sheet must have at least 2 rows (header + data)');
  }

  const timetable = [];
  const errors = [];
  let skippedCells = 0;

  // First row should contain time slots
  const headerRow = data[0];
  const timeSlots = [];
  
  // Parse time slots (skip first column which is "Day")
  for (let col = 1; col < headerRow.length; col++) {
    const timeSlot = parseTimeSlot(headerRow[col]);
    timeSlots.push(timeSlot); // Can be null for invalid time slots
  }

  // Process each day row (starting from row 1)
  for (let row = 1; row < data.length; row++) {
    const dayValue = data[row][0];
    const day = parseDay(dayValue);
    
    if (!day) {
      continue; // Skip invalid days
    }

    // Process each period in this day
    for (let col = 1; col < data[row].length; col++) {
      const cellValue = data[row][col];
      const timeSlot = timeSlots[col - 1];

      if (!timeSlot) {
        continue; // Skip if time slot is invalid
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
        } else {
          skippedCells++;
        }
      } catch (error) {
        errors.push({
          sheet: sheetName,
          day,
          time: `${timeSlot.startTime}-${timeSlot.endTime}`,
          cell: cellValue,
          error: error.message,
          position: { row: row + 1, col: col + 1 }
        });
        skippedCells++;
      }
    }
  }

  return {
    sectionName: sheetName,
    timetable,
    errors,
    skippedCells
  };
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
