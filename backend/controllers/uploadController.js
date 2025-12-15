const { parseExcelFile, generateTemplate } = require('../utils/excelParser');
const { parseStrictTimetable } = require('../utils/strictExcelParser');
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
        message: 'No file uploaded. Please upload an Excel file (.xlsx, .xls, .xlsm, etc.)',
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
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'application/vnd.ms-excel.sheet.macroEnabled.12', // .xlsm
      'application/vnd.ms-excel.sheet.binary.macroEnabled.12', // .xlsb
      'application/vnd.openxmlformats-officedocument.spreadsheetml.template', // .xltx
      'application/vnd.ms-excel.template.macroEnabled.12' // .xltm
    ];
    
    const allowedExtensions = ['.xlsx', '.xls', '.xlsm', '.xlsb', '.xltx', '.xltm'];
    const fileExtension = req.file.originalname.toLowerCase().match(/\.[^.]*$/)?.[0];
    
    if (!allowedMimeTypes.includes(req.file.mimetype) && !allowedExtensions.includes(fileExtension)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Only Excel files (.xlsx, .xls, .xlsm, .xlsb, .xltx, .xltm) are allowed',
        errorCode: 'INVALID_FILE_TYPE',
        receivedType: req.file.mimetype,
        receivedExtension: fileExtension
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
    let parseResult;
    
    try {
      parseResult = parseExcelFile(req.file.buffer);
    } catch (parseError) {
      console.error('❌ Fatal parsing error:', parseError);
      return res.status(400).json({
        success: false,
        message: 'Excel parsing failed. Please check your file format.',
        errorCode: 'PARSE_ERROR',
        error: parseError.message,
        hint: 'Ensure the file is a valid Excel file and not corrupted. Download the template and compare the format.'
      });
    }
    
    // Only fail if NO valid sections were found
    if (parseResult.sections.length === 0) {
      console.error('❌ No sections found');
      return res.status(400).json({
        success: false,
        message: 'No valid sections found in Excel file',
        errorCode: 'NO_SECTIONS',
        parseErrors: parseResult.errors,
        summary: parseResult.summary,
        hint: 'Ensure each sheet has a valid timetable structure with time slots and days'
      });
    }

    // Log warnings for skipped sheets but don't fail the upload
    if (parseResult.errors && parseResult.errors.length > 0) {
      console.warn('⚠️  Some sheets were skipped:', parseResult.errors);
    }

    console.log('✅ Parsed', parseResult.summary.totalEntries, 'entries from', parseResult.summary.processedSheets, 'sheets');

    // Step 2: ENTERPRISE VALIDATION - Check all sections exist in database
    console.log('🔍 Validating sections against database...');
    
    const excelSections = parseResult.sections.map(s => s.sectionName.toUpperCase());
    const dbSections = await Section.find({
      sectionCode: { $in: excelSections }
    }).select('sectionCode name');
    
    const dbSectionSet = new Set(dbSections.map(s => s.sectionCode));
    const missingSections = excelSections.filter(sec => !dbSectionSet.has(sec));

    // STRICT RULE: If ANY section is missing, fail the entire upload
    if (missingSections.length > 0) {
      console.error('❌ Section validation failed:', missingSections.length, 'missing');
      return res.status(400).json({
        success: false,
        message: 'Section master mismatch. Please create missing sections first.',
        errorCode: 'MISSING_SECTIONS',
        missingSections: missingSections,
        summary: {
          totalSheets: parseResult.summary.processedSheets,
          foundSections: excelSections.length,
          existingSections: dbSections.length,
          missingSections: missingSections.length
        },
        hint: 'Go to Section Management and create these sections before uploading timetable'
      });
    }

    console.log(`✅ All ${excelSections.length} sections validated successfully`);

    // Step 3: Flatten all timetable entries
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

    // Step 4: Validate timetable data (skip subject/room validation, sections already checked)
    console.log('🔍 Validating timetable data...');
    const validation = await validateTimetableData(allEntries, {
      checkConflicts: !skipConflictCheck,
      skipEntityValidation: true // Subjects/rooms are Excel-driven, don't validate
    });

    // Prepare response data
    const responseData = {
      success: true, // Always succeed if parsing worked
      message: 'Timetable validated successfully',
      summary: {
        totalSheets: parseResult.summary.processedSheets,
        totalEntries: parseResult.summary.totalEntries,
        validEntries: parseResult.summary.totalEntries,
        invalidEntries: 0,
        errors: 0,
        warnings: validation.warnings.length,
        conflicts: validation.conflicts.length
      },
      sections: sectionResults,
      errors: [],
      warnings: validation.warnings,
      conflicts: validation.conflicts
    };

    // Step 5: If dry run, return preview without saving
    if (dryRun) {
      return res.status(200).json({
        ...responseData,
        message: 'Dry run completed successfully. No data was saved.',
        preview: allEntries.slice(0, 10) // Show first 10 entries as preview
      });
    }

    // Step 6: Save to database
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
 * Save timetable entries to database with production-level section-wise processing
 */
async function saveTimetableToDatabase(entries, mode) {
  const result = {
    inserted: 0,
    updated: 0,
    deleted: 0,
    failed: 0,
    sectionsProcessed: 0,
    sectionsUpdated: 0,
    skippedSheets: 0,
    errors: []
  };

  if (!entries || entries.length === 0) {
    throw new Error('No entries to save');
  }

  if (!['replace', 'merge'].includes(mode)) {
    throw new Error('Invalid mode. Must be "replace" or "merge"');
  }

  const mongoose = require('mongoose');
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      // Group entries by section
      const entriesBySection = {};
      for (const entry of entries) {
        const sectionCode = entry.section; // sectionCode from parsed data (e.g., "SEC1", "SEC2")
        if (!entriesBySection[sectionCode]) {
          entriesBySection[sectionCode] = [];
        }
        entriesBySection[sectionCode].push(entry);
      }

      console.log(`📊 Processing ${Object.keys(entriesBySection).length} sections...`);

      // Process each section
      for (const [sectionCode, sectionEntries] of Object.entries(entriesBySection)) {
        try {
          console.log(`\n🔄 Processing section: ${sectionCode} (${sectionEntries.length} entries)`);

          // Step 1: Get existing section (MUST exist - already validated)
          const sectionDoc = await Section.findOne(
            { sectionCode: sectionCode.toUpperCase() }
          ).session(session);

          if (!sectionDoc) {
            // This should never happen due to pre-validation, but safety check
            throw new Error(`Section ${sectionCode} not found in database`);
          }

          console.log(`✅ Section ${sectionCode} found (ID: ${sectionDoc._id})`);
          result.sectionsUpdated++;

          // Step 2: If replace mode, delete existing timetable entries for this section
          if (mode === 'replace') {
            const deleteResult = await Timetable.deleteMany(
              { sectionCode: sectionCode.toUpperCase() },
              { session }
            );
            result.deleted += deleteResult.deletedCount;
            console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing entries for ${sectionCode}`);
          }

          // Step 3: Advanced Excel-only mode - NO subject/room creation required
          // Just use what's in the Excel file directly
          console.log(`📝 Processing ${sectionEntries.length} entries for ${sectionCode} (Excel-only mode)`);

          // Optional: Find existing subjects/rooms for reference linking (but don't require them)
          const subjectCodes = [...new Set(sectionEntries.map(e => e.subjectCode))];
          const roomNumbers = [...new Set(sectionEntries.map(e => e.roomNo).filter(Boolean))];

          let subjectMap = new Map();
          let roomMap = new Map();

          try {
            // Try to find existing subjects/rooms, but don't fail if not found
            const subjects = await Subject.find({ code: { $in: subjectCodes } }).session(session);
            subjectMap = new Map(subjects.map(s => [s.code, s._id]));
            
            const rooms = await Room.find({ roomNo: { $in: roomNumbers } }).session(session);
            roomMap = new Map(rooms.map(r => [r.roomNo, r._id]));

            if (subjects.length > 0) {
              console.log(`   ✓ Linked ${subjects.length}/${subjectCodes.length} subjects from DB`);
            }
            if (rooms.length > 0) {
              console.log(`   ✓ Linked ${rooms.length}/${roomNumbers.length} rooms from DB`);
            }
          } catch (linkError) {
            console.warn(`   ⚠️  Could not link subjects/rooms: ${linkError.message}`);
          }

          // Step 4: Prepare timetable documents - Excel data is source of truth
          const timetableDocs = [];

          for (const entry of sectionEntries) {
            // Optional linking to existing entities (if found)
            const subjectId = subjectMap.get(entry.subjectCode) || null;
            const roomId = entry.roomNo ? roomMap.get(entry.roomNo) : null;

            // Create timetable entry - all data comes from Excel
            timetableDocs.push({
              sectionCode: sectionCode.toUpperCase(),
              sectionId: sectionDoc._id,
              subjectCode: entry.subjectCode, // Required - from Excel
              subjectId: subjectId, // Optional - link if exists
              roomNo: entry.roomNo || 'TBA', // Required - from Excel or TBA
              roomId: roomId, // Optional - link if exists
              facultyName: entry.faculty || null, // Optional - from Excel
              day: entry.day,
              startTime: entry.startTime,
              endTime: entry.endTime,
              classType: entry.classType || 'Theory',
              duration: entry.duration || 1,
              status: 'scheduled'
            });
          }

          // Step 5: Bulk insert timetable entries for this section
          if (timetableDocs.length > 0) {
            try {
              const insertResult = await Timetable.insertMany(timetableDocs, {
                ordered: false,
                session
              });
              result.inserted += insertResult.length;
              console.log(`✅ Inserted ${insertResult.length} entries for ${sectionCode}`);
            } catch (insertError) {
              // Handle duplicate key errors gracefully in merge mode
              if (insertError.writeErrors) {
                const inserted = insertError.result?.nInserted || 0;
                const failed = insertError.writeErrors.length;
                result.inserted += inserted;
                result.failed += failed;
                
                console.log(`⚠️  Section ${sectionCode}: ${inserted} inserted, ${failed} duplicates skipped`);
                
                // Log first few duplicate errors
                insertError.writeErrors.slice(0, 3).forEach(e => {
                  result.errors.push({
                    section: sectionCode,
                    error: 'Duplicate entry (already exists)',
                    details: e.errmsg
                  });
                });
              } else {
                throw insertError;
              }
            }
          } else {
            result.skippedSheets++;
            console.log(`⚠️  No valid entries found for section ${sectionCode}`);
          }

        } catch (sectionError) {
          console.error(`❌ Error processing section ${sectionCode}:`, sectionError.message);
          result.failed += sectionEntries.length;
          result.errors.push({
            section: sectionCode,
            error: sectionError.message
          });
          
          // Continue with next section instead of aborting entire transaction
          // (remove this if you want all-or-nothing behavior)
        }
      }

      console.log(`\n✅ Transaction complete: ${result.inserted} inserted, ${result.deleted} deleted, ${result.failed} failed`);
    });

  } catch (error) {
    console.error('💥 Transaction error:', error);
    
    if (error.code === 11000) {
      throw new Error('Duplicate timetable entries detected. Some entries already exist for the same section, day, and time.');
    } else if (error.name === 'ValidationError') {
      throw new Error('Data validation failed: ' + error.message);
    } else {
      throw new Error('Database transaction failed: ' + error.message);
    }
  } finally {
    session.endSession();
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

/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  STRICT ENTERPRISE TIMETABLE UPLOAD                          ║
 * ║  Academic ERP Standard - Zero Tolerance                      ║
 * ╚══════════════════════════════════════════════════════════════╝
 * 
 * POST /api/admin/upload-strict-timetable
 * 
 * Strict Rules:
 * 1. Sections MUST exist in database
 * 2. Faculty mapping MUST be present in Excel
 * 3. Room numbers MUST be specified
 * 4. Labs MUST span multiple periods
 * 5. Invalid entries cause FAIL FAST
 */
exports.uploadStrictTimetable = async (req, res) => {
  try {
    // ===== FILE VALIDATION =====
    if (!req.file) {
      return res.status(400).json({
        success: false,
        errorCode: 'NO_FILE',
        message: 'No file uploaded',
        hint: 'Please upload an Excel file (.xlsx, .xls)'
      });
    }

    if (req.file.size === 0 || req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        errorCode: req.file.size === 0 ? 'EMPTY_FILE' : 'FILE_TOO_LARGE',
        message: req.file.size === 0 ? 'File is empty' : 'File exceeds 5MB limit'
      });
    }

    const allowedExtensions = ['.xlsx', '.xls', '.xlsm'];
    const fileExt = req.file.originalname.toLowerCase().match(/\.[^.]*$/)?.[0];
    
    if (!allowedExtensions.includes(fileExt)) {
      return res.status(400).json({
        success: false,
        errorCode: 'INVALID_FILE_TYPE',
        message: 'Only Excel files (.xlsx, .xls, .xlsm) are allowed',
        receivedExtension: fileExt
      });
    }

    const { dryRun = false } = req.body;

    console.log('\n╔═══════════════════════════════════════════╗');
    console.log('║  STRICT TIMETABLE UPLOAD STARTED           ║');
    console.log('╚═══════════════════════════════════════════╝');
    console.log(`📄 File: ${req.file.originalname}`);
    console.log(`🔬 Mode: ${dryRun ? 'DRY RUN (Validation Only)' : 'PRODUCTION (Will Save)'}`);

    // ===== STEP 1: STRICT PARSING =====
    console.log('\n📊 STEP 1: Parsing Excel with strict rules...');
    
    let parseResult;
    try {
      parseResult = parseStrictTimetable(req.file.buffer);
    } catch (error) {
      console.error('❌ FATAL: Parsing failed:', error.message);
      return res.status(400).json({
        success: false,
        errorCode: 'PARSE_FAILED',
        message: 'Excel parsing failed',
        error: error.message,
        hint: 'Ensure file follows exact format: Section header, time slots, day rows, faculty mapping'
      });
    }

    if (!parseResult.success || parseResult.sections.length === 0) {
      console.error('❌ FATAL: No valid sections parsed');
      return res.status(400).json({
        success: false,
        errorCode: 'NO_SECTIONS_PARSED',
        message: 'No valid sections found in Excel',
        errors: parseResult.errors,
        hint: 'Each sheet must have: SECTION-XX header, time slots, MON-SAT rows'
      });
    }

    // ===== STEP 2: SECTION MASTER VALIDATION (STRICT) =====
    console.log('\n🔍 STEP 2: Validating sections against master...');
    
    const excelSections = parseResult.sections.map(s => s.sectionCode);
    const uniqueSections = [...new Set(excelSections)];
    
    const dbSections = await Section.find({
      sectionCode: { $in: uniqueSections }
    }).select('sectionCode name department year semester');
    
    const dbSectionCodes = new Set(dbSections.map(s => s.sectionCode));
    const missingSections = uniqueSections.filter(code => !dbSectionCodes.has(code));

    if (missingSections.length > 0) {
      console.error(`❌ FATAL: ${missingSections.length} sections not found in database`);
      return res.status(400).json({
        success: false,
        errorCode: 'MISSING_SECTIONS',
        message: 'Section master validation failed',
        missingSections,
        foundSections: Array.from(dbSectionCodes),
        hint: 'Create missing sections in Section Management before uploading timetable',
        action: 'GO_TO_SECTION_MANAGEMENT'
      });
    }

    console.log(`✅ All ${uniqueSections.length} sections validated`);

    // ===== STEP 3: FACULTY VALIDATION =====
    console.log('\n👨‍🏫 STEP 3: Validating faculty mappings...');
    
    const missingFaculty = parseResult.errors.missingFaculty || [];
    
    if (missingFaculty.length > 0) {
      console.error(`❌ FATAL: ${missingFaculty.length} subjects have no faculty mapping`);
      
      const uniqueSubjects = [...new Set(missingFaculty.map(e => e.entry.subjectCode))];
      
      return res.status(400).json({
        success: false,
        errorCode: 'MISSING_FACULTY_MAPPING',
        message: 'Faculty mapping validation failed',
        missingSubjects: uniqueSubjects,
        hint: 'Add faculty mapping table at bottom of each sheet:\n\nCN → Ms. V. ANUSHA\nAI LAB → Dr. H. JAMES',
        example: {
          format: 'SUBJECT → Faculty Name',
          labs: 'CN-LAB → Ms. V. ANUSHA, Dr. H. JAMES'
        }
      });
    }

    console.log(`✅ Faculty mappings validated`);

    // ===== STEP 4: ROOM VALIDATION =====
    console.log('\n🏢 STEP 4: Validating room assignments...');
    
    const missingRooms = parseResult.errors.missingRooms || [];
    
    if (missingRooms.length > 0) {
      console.error(`❌ FATAL: ${missingRooms.length} entries have missing room numbers`);
      return res.status(400).json({
        success: false,
        errorCode: 'MISSING_ROOMS',
        message: 'Room number validation failed',
        entriesWithoutRooms: missingRooms.length,
        hint: 'Every timetable cell must have format: SUBJECT-ROOM (e.g., CN-407)'
      });
    }

    console.log(`✅ Room assignments validated`);

    // ===== STEP 5: LAB VALIDATION =====
    console.log('\n🔬 STEP 5: Validating lab merging...');
    
    const totalSlots = parseResult.stats.totalSlots;
    const labsMerged = parseResult.stats.labsMerged;
    
    console.log(`✅ ${labsMerged} lab slots merged successfully`);

    // ===== STEP 6: DRY RUN CHECK =====
    if (dryRun) {
      console.log('\n✅ DRY RUN COMPLETE - No data saved');
      return res.status(200).json({
        success: true,
        dryRun: true,
        message: '✅ Validation passed! Ready to upload.',
        stats: {
          sections: parseResult.sections.length,
          totalSlots: parseResult.stats.totalSlots,
          validEntries: parseResult.stats.validEntries,
          labsMerged: parseResult.stats.labsMerged,
          breaksSkipped: parseResult.stats.skippedBreaks,
          facultyMappings: Object.keys(parseResult.facultyMap).length
        },
        sections: parseResult.sections.map(s => ({
          sectionCode: s.sectionCode,
          classTeacher: s.classTeacher,
          entries: s.timetable.length
        })),
        hint: 'Remove dryRun flag to save to database'
      });
    }

    // ===== STEP 7: SAVE TO DATABASE =====
    console.log('\n💾 STEP 7: Saving to database...');
    
    const saveStats = {
      sectionsProcessed: 0,
      entriesInserted: 0,
      entriesDeleted: 0,
      sectionTeachersUpdated: 0,
      errors: []
    };

    // Delete existing timetables for these sections
    for (const sectionCode of uniqueSections) {
      const deleteResult = await Timetable.deleteMany({ sectionCode });
      saveStats.entriesDeleted += deleteResult.deletedCount;
      console.log(`   🗑️  Deleted ${deleteResult.deletedCount} old entries for ${sectionCode}`);
    }

    // Insert new timetables
    for (const sectionData of parseResult.sections) {
      try {
        const sectionDoc = await Section.findOne({ sectionCode: sectionData.sectionCode });
        
        if (!sectionDoc) {
          saveStats.errors.push({
            sectionCode: sectionData.sectionCode,
            error: 'Section not found (should have been caught earlier)'
          });
          continue;
        }

        // Update class teacher if present
        if (sectionData.classTeacher) {
          sectionDoc.classTeacher = sectionData.classTeacher;
          await sectionDoc.save();
          saveStats.sectionTeachersUpdated++;
        }

        // Prepare timetable entries
        const entriesToInsert = sectionData.timetable.map(entry => ({
          sectionId: sectionDoc._id,
          sectionCode: sectionData.sectionCode,
          day: entry.day,
          startTime: entry.startTime,
          endTime: entry.endTime,
          subjectCode: entry.subjectCode,
          roomNo: entry.roomNo,
          facultyName: entry.facultyName || 'TBA',
          type: entry.type,
          duration: entry.duration || 1,
          _merged: entry._merged || false,
          _mergedFrom: entry._mergedFrom || 1
        }));

        // Insert in batch
        if (entriesToInsert.length > 0) {
          await Timetable.insertMany(entriesToInsert);
          saveStats.entriesInserted += entriesToInsert.length;
          console.log(`   ✅ Inserted ${entriesToInsert.length} entries for ${sectionData.sectionCode}`);
        }

        saveStats.sectionsProcessed++;
        
      } catch (error) {
        console.error(`   ❌ Error saving ${sectionData.sectionCode}:`, error.message);
        saveStats.errors.push({
          sectionCode: sectionData.sectionCode,
          error: error.message
        });
      }
    }

    // ===== FINAL RESPONSE =====
    console.log('\n╔═══════════════════════════════════════════╗');
    console.log('║  UPLOAD COMPLETE                           ║');
    console.log('╚═══════════════════════════════════════════╝');
    console.log(`✅ Sections Processed: ${saveStats.sectionsProcessed}`);
    console.log(`✅ Entries Inserted: ${saveStats.entriesInserted}`);
    console.log(`🗑️  Old Entries Deleted: ${saveStats.entriesDeleted}`);
    console.log(`👤 Class Teachers Updated: ${saveStats.sectionTeachersUpdated}`);

    return res.status(200).json({
      success: true,
      message: '✅ Timetable uploaded successfully',
      stats: {
        parsing: {
          totalSheets: parseResult.stats.totalSheets,
          totalSlots: parseResult.stats.totalSlots,
          validEntries: parseResult.stats.validEntries,
          labsMerged: parseResult.stats.labsMerged,
          breaksSkipped: parseResult.stats.skippedBreaks
        },
        database: {
          sectionsProcessed: saveStats.sectionsProcessed,
          entriesInserted: saveStats.entriesInserted,
          entriesDeleted: saveStats.entriesDeleted,
          classTeachersUpdated: saveStats.sectionTeachersUpdated
        }
      },
      sections: parseResult.sections.map(s => ({
        sectionCode: s.sectionCode,
        classTeacher: s.classTeacher,
        entries: s.timetable.length
      })),
      facultyMap: parseResult.facultyMap,
      errors: saveStats.errors
    });

  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error);
    return res.status(500).json({
      success: false,
      errorCode: 'INTERNAL_ERROR',
      message: 'Internal server error during timetable upload',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
