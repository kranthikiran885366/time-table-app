const { parseExcelFile, generateTemplate } = require('../utils/excelParser');
const { validateTimetableData } = require('../utils/timetableValidator');
const Timetable = require('../models/Timetable');
const Section = require('../models/Section');
const Subject = require('../models/Subject');
const Room = require('../models/Room');
const XLSX = require('xlsx');

/**
 * Upload and process Excel timetable file
 * POST /api/admin/upload-section-timetable
 */
exports.uploadTimetable = async (req, res) => {
  try {
    // Check if file exists
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please upload an Excel file (.xlsx)',
        errorCode: 'NO_FILE'
      });
    }

    // Validate file size (already handled by multer, but double-check)
    if (req.file.size === 0) {
      return res.status(400).json({
        success: false,
        message: 'Uploaded file is empty',
        errorCode: 'EMPTY_FILE'
      });
    }

    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds 5MB limit',
        errorCode: 'FILE_TOO_LARGE'
      });
    }

    // Validate file type
    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Only .xlsx files are allowed',
        errorCode: 'INVALID_FILE_TYPE',
        receivedType: req.file.mimetype
      });
    }

    // Get options from request
    const {
      dryRun = false,
      mode = 'replace', // 'replace' or 'merge'
      skipConflictCheck = false
    } = req.body;

    console.log('📊 Processing Excel file:', req.file.originalname);
    console.log('📋 Mode:', mode, '| Dry Run:', dryRun);

    // Step 1: Parse Excel file
    console.log('📊 Parsing Excel file...');
    const parseResult = parseExcelFile(req.file.buffer);
    
    if (parseResult.errors.length > 0) {
      console.error('❌ Parsing errors:', parseResult.errors);
      return res.status(400).json({
        success: false,
        message: 'Excel parsing failed. Please check your file format.',
        errorCode: 'PARSE_ERROR',
        parseErrors: parseResult.errors,
        summary: parseResult.summary,
        hint: 'Download the template file and compare the format'
      });
    }

    if (parseResult.sections.length === 0) {
      console.error('❌ No sections found');
      return res.status(400).json({
        success: false,
        message: 'No valid sections found in Excel file',
        errorCode: 'NO_SECTIONS',
        hint: 'Ensure each sheet has a valid timetable structure with time slots and days'
      });
    }

    console.log('✅ Parsed', parseResult.summary.totalEntries, 'entries from', parseResult.summary.processedSheets, 'sheets');

    // Step 2: Flatten all timetable entries
    const allEntries = [];
    const sectionResults = [];

    for (const sectionData of parseResult.sections) {
      allEntries.push(...sectionData.timetable);
      
      sectionResults.push({
        section: sectionData.sectionName,
        entries: sectionData.timetable.length,
        parseErrors: sectionData.errors
      });
    }

    // Step 3: Validate timetable data
    console.log('🔍 Validating timetable data...');
    const validation = await validateTimetableData(allEntries, {
      checkConflicts: !skipConflictCheck
    });

    // Prepare response data
    const responseData = {
      success: validation.valid,
      message: validation.valid ? 'Timetable validated successfully' : 'Validation failed',
      summary: {
        totalSheets: parseResult.summary.processedSheets,
        totalEntries: parseResult.summary.totalEntries,
        validEntries: validation.summary.validEntries,
        invalidEntries: validation.summary.invalidEntries,
        errors: validation.errors.length,
        warnings: validation.warnings.length,
        conflicts: validation.conflicts.length
      },
      sections: sectionResults,
      errors: validation.errors,
      warnings: validation.warnings,
      conflicts: validation.conflicts
    };

    // If validation failed, return errors
    if (!validation.valid) {
      console.error('❌ Validation failed:', validation.errors.length, 'errors');
      return res.status(400).json({
        ...responseData,
        message: 'Timetable validation failed. Please fix the errors and try again.',
        errorCode: 'VALIDATION_FAILED',
        errorSummary: {
          entityErrors: validation.errors.filter(e => e.type?.includes('NOT_FOUND')).length,
          conflictErrors: validation.conflicts.filter(c => c.severity === 'ERROR').length,
          totalErrors: validation.errors.length
        },
        hint: 'Check that all sections, subjects, and rooms exist in the database'
      });
    }

    // Step 4: If dry run, return preview without saving
    if (dryRun) {
      return res.status(200).json({
        ...responseData,
        message: 'Dry run completed successfully. No data was saved.',
        preview: allEntries.slice(0, 10) // Show first 10 entries as preview
      });
    }

    // Step 5: Save to database
    console.log('💾 Saving timetable to database...');
    const saveResult = await saveTimetableToDatabase(allEntries, mode);

    return res.status(200).json({
      ...responseData,
      message: 'Timetable uploaded and saved successfully',
      saved: saveResult
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    
    // Handle specific error types
    if (error.message.includes('Invalid cell format')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid cell format in Excel file',
        errorCode: 'INVALID_CELL_FORMAT',
        error: error.message,
        hint: 'Use format: SUBJECT-ROOM or SUBJECT-TYPE-ROOM (e.g., CN-407 or CD-L-512)'
      });
    }
    
    if (error.message.includes('sheet')) {
      return res.status(400).json({
        success: false,
        message: 'Error processing Excel sheets',
        errorCode: 'SHEET_ERROR',
        error: error.message
      });
    }
    
    // Database errors
    if (error.name === 'MongoError' || error.name === 'MongooseError') {
      return res.status(503).json({
        success: false,
        message: 'Database error. Please try again later.',
        errorCode: 'DATABASE_ERROR',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Database connection failed'
      });
    }
    
    // Generic error
    return res.status(500).json({
      success: false,
      message: 'Internal server error during upload',
      errorCode: 'INTERNAL_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred',
      hint: 'Please try again or contact support if the issue persists'
    });
  }
};

/**
 * Save timetable entries to database
 */
async function saveTimetableToDatabase(entries, mode) {
  const result = {
    inserted: 0,
    updated: 0,
    deleted: 0,
    failed: 0,
    errors: []
  };

  if (!entries || entries.length === 0) {
    throw new Error('No entries to save');
  }

  if (!['replace', 'merge'].includes(mode)) {
    throw new Error('Invalid mode. Must be "replace" or "merge"');
  }

  try {
    // Get all unique sections
    const sectionNames = [...new Set(entries.map(e => e.section))];
    const sections = await Section.find({ name: { $in: sectionNames } });
    const sectionMap = new Map(sections.map(s => [s.name, s._id]));

    // Get all subjects
    const subjectCodes = [...new Set(entries.map(e => e.subjectCode))];
    const subjects = await Subject.find({ code: { $in: subjectCodes } });
    const subjectMap = new Map(subjects.map(s => [s.code, s._id]));

    // If mode is 'replace', delete existing timetables for these sections
    if (mode === 'replace') {
      const deleteResult = await Timetable.deleteMany({
        section: { $in: Array.from(sectionMap.values()) }
      });
      result.deleted = deleteResult.deletedCount;
      console.log(`🗑️  Deleted ${result.deleted} existing entries`);
    }

    // Prepare timetable documents
    const timetableDocs = [];
    
    for (const entry of entries) {
      const sectionId = sectionMap.get(entry.section);
      const subjectId = subjectMap.get(entry.subjectCode);

      if (!sectionId || !subjectId) {
        result.failed++;
        result.errors.push({
          entry,
          error: 'Section or Subject not found'
        });
        continue;
      }

      timetableDocs.push({
        section: sectionId,
        subject: subjectId,
        day: entry.day,
        startTime: entry.startTime,
        endTime: entry.endTime,
        room: entry.roomNo,
        classType: entry.classType
      });
    }

    // Bulk insert
    if (timetableDocs.length > 0) {
      const insertResult = await Timetable.insertMany(timetableDocs, { ordered: false });
      result.inserted = insertResult.length;
      console.log(`✅ Inserted ${result.inserted} new entries`);
    }

  } catch (error) {
    console.error('💥 Save error:', error);
    
    // Handle partial success in bulk insert
    if (error.writeErrors) {
      result.inserted = error.result?.nInserted || 0;
      result.failed = error.writeErrors.length;
      result.errors = error.writeErrors.map(e => ({
        error: e.errmsg || e.message,
        index: e.index
      }));
      console.log(`⚠️  Partial success: ${result.inserted} inserted, ${result.failed} failed`);
    } else if (error.code === 11000) {
      // Duplicate key error
      throw new Error('Duplicate timetable entries detected. Use merge mode or delete existing entries first.');
    } else if (error.name === 'ValidationError') {
      throw new Error('Data validation failed: ' + error.message);
    } else {
      throw error;
    }
  }

  return result;
}

/**
 * Download Excel template
 * GET /api/admin/download-timetable-template
 */
exports.downloadTemplate = async (req, res) => {
  try {
    const workbook = generateTemplate();
    
    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=timetable_template.xlsx');
    res.setHeader('Content-Length', buffer.length);
    
    return res.send(buffer);
    
  } catch (error) {
    console.error('❌ Template download error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate template',
      error: error.message
    });
  }
};

/**
 * Get upload history (placeholder for future implementation)
 * GET /api/admin/upload-history
 */
exports.getUploadHistory = async (req, res) => {
  try {
    // TODO: Implement upload history tracking
    // This would require a new UploadHistory model
    
    return res.status(200).json({
      success: true,
      message: 'Upload history feature coming soon',
      history: []
    });
    
  } catch (error) {
    console.error('❌ History error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch upload history',
      error: error.message
    });
  }
};

/**
 * Rollback last upload (placeholder for future implementation)
 * POST /api/admin/rollback-upload
 */
exports.rollbackUpload = async (req, res) => {
  try {
    // TODO: Implement rollback functionality
    // This would require storing upload transactions
    
    return res.status(200).json({
      success: false,
      message: 'Rollback feature coming soon. Please manually manage timetables for now.'
    });
    
  } catch (error) {
    console.error('❌ Rollback error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to rollback upload',
      error: error.message
    });
  }
};
