# Excel Timetable Upload Feature

## Overview

The Admin Excel Upload feature allows administrators to upload complete section timetables using Excel files. The system automatically parses the Excel data, validates it, detects conflicts, and updates the database.

## 📊 Excel Format

### File Requirements
- **Format**: `.xlsx` (Excel 2007+)
- **Max Size**: 5MB
- **Structure**: Multi-sheet workbook

### Sheet Structure

Each sheet represents **ONE SECTION**. The sheet name becomes the section name.

#### Example Sheet Names:
- `CSE-A`
- `ECE-B`
- `MECH-A`
- `SEC1`
- `2nd Year CS`

### Table Format

```
| Day | 8.15-9.05 | 9.05-9.55 | 9.55-10.10 | 10.10-11.00 | 11.00-11.50 | ...
|----|-----------|-----------|------------|-------------|-------------|
| MON | CN-407    | CD-T-407  | BREAK      | IAI-301     | MSD-L-512   | ...
| TUE | MSD-317   | —         | BREAK      | MSD-512     | CN-407      | ...
| WED | SE-403    | OS-405    | BREAK      | CD-407      | CN-407      | ...
```

### Cell Format Rules

| Format | Meaning | Class Type | Example |
|--------|---------|------------|---------|
| `SUBJECT-ROOM` | Subject + Room | Theory (default) | `CN-407` |
| `SUBJECT-T-ROOM` | Subject + Theory + Room | Theory | `CD-T-407` |
| `SUBJECT-L-ROOM` | Subject + Lab + Room | Lab | `MSD-L-512` |
| `BREAK` | Break period | Ignored | `BREAK` |
| `LUNCH` | Lunch break | Ignored | `LUNCH` |
| `—` or empty | Free period | Ignored | `—` |

### Time Slot Format

Supported formats:
- `8.15-9.05` (dot separator)
- `8:15-9:05` (colon separator)
- `08:15-09:05` (with leading zeros)

### Day Format

Supported day formats:
- Full names: `Monday`, `Tuesday`, etc.
- Abbreviations: `MON`, `TUE`, `WED`, `THU`, `FRI`, `SAT`, `SUN`

## 🔌 API Endpoints

### 1. Upload Timetable

**POST** `/api/upload/timetable`

Upload and process Excel timetable file.

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data
```

**Body Parameters:**
- `file` (required): Excel file (.xlsx)
- `dryRun` (optional): `true` | `false` (default: `false`)
  - `true`: Validate only, don't save to database
  - `false`: Validate and save to database
- `mode` (optional): `replace` | `merge` (default: `replace`)
  - `replace`: Delete existing timetable for sections, then insert new
  - `merge`: Keep existing entries, add new ones
- `skipConflictCheck` (optional): `true` | `false` (default: `false`)

**Example Request (using curl):**
```bash
curl -X POST http://localhost:5000/api/upload/timetable \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "file=@timetable.xlsx" \
  -F "dryRun=false" \
  -F "mode=replace"
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Timetable uploaded and saved successfully",
  "summary": {
    "totalSheets": 3,
    "totalEntries": 120,
    "validEntries": 120,
    "invalidEntries": 0,
    "errors": 0,
    "warnings": 2,
    "conflicts": 0
  },
  "sections": [
    {
      "section": "CSE-A",
      "entries": 45,
      "parseErrors": []
    }
  ],
  "errors": [],
  "warnings": [
    {
      "type": "CAPACITY_WARNING",
      "message": "Room 407 capacity (50) is less than section CSE-A strength (60)",
      "severity": "WARNING"
    }
  ],
  "saved": {
    "inserted": 120,
    "updated": 0,
    "deleted": 115,
    "failed": 0
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Timetable validation failed",
  "summary": {
    "totalSheets": 3,
    "totalEntries": 120,
    "validEntries": 0,
    "invalidEntries": 120,
    "errors": 5,
    "warnings": 0,
    "conflicts": 3
  },
  "errors": [
    {
      "type": "SUBJECT_NOT_FOUND",
      "message": "Subject 'XYZ' does not exist in database",
      "subjectCode": "XYZ"
    },
    {
      "type": "ROOM_CONFLICT",
      "severity": "ERROR",
      "message": "Room 407 is assigned to multiple sections at the same time",
      "day": "Monday",
      "time": "08:15-09:05",
      "room": "407",
      "sections": ["CSE-A", "CSE-B"]
    }
  ]
}
```

### 2. Download Template

**GET** `/api/upload/template`

Download an Excel template with sample data.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:**
- Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Excel file download

**Example Request:**
```bash
curl -X GET http://localhost:5000/api/upload/template \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -o timetable_template.xlsx
```

### 3. Upload History

**GET** `/api/upload/history`

Get history of previous uploads (Coming soon).

### 4. Rollback Upload

**POST** `/api/upload/rollback`

Rollback the last upload (Coming soon).

## 🛡️ Validation & Conflict Detection

### Entity Validation

The system validates that all referenced entities exist:

1. **Sections**: Sheet names must match existing sections in database
2. **Subjects**: All subject codes must exist in database
3. **Rooms**: All room numbers must exist in database

### Conflict Detection

#### 1. Room Conflicts
Same room assigned to multiple sections at the same time.

**Example:**
```
Monday 8:15-9:05
- CSE-A in Room 407
- CSE-B in Room 407  ❌ CONFLICT
```

#### 2. Section Overlaps
Same section scheduled for multiple classes at overlapping times.

**Example:**
```
CSE-A on Monday 8:15-9:05
- CN in Room 407
- CD in Room 301  ❌ CONFLICT (same section, same time)
```

#### 3. Faculty Conflicts
Same faculty teaching multiple classes at the same time.

**Example:**
```
Monday 8:15-9:05
- Dr. Smith teaching CSE-A (CN)
- Dr. Smith teaching ECE-A (DS)  ❌ CONFLICT
```

#### 4. Capacity Warnings
Room capacity less than section strength (Warning, not error).

**Example:**
```
Section CSE-A (60 students) assigned to Room 407 (capacity: 50)  ⚠️ WARNING
```

## 📱 Flutter UI Flow

### 1. Access Upload Screen

From Admin Config Screen, click "Upload Timetable from Excel" button.

### 2. Select File

Click "Choose Excel File (.xlsx)" button to open file picker. Only `.xlsx` files are allowed.

### 3. Configure Options

- **Dry Run**: Enable to validate without saving
- **Upload Mode**:
  - **Replace**: Delete existing timetable for sections, then insert new
  - **Merge**: Keep existing entries, add new ones

### 4. Validate

Click "Validate" button (with Dry Run enabled) to check for errors without saving.

### 5. Upload

Click "Upload & Save" button (with Dry Run disabled) to save to database.

### 6. View Results

Results show:
- Summary statistics (sheets, entries, errors, warnings)
- Detailed error messages with location (sheet, day, time)
- Conflict details (room conflicts, faculty conflicts, etc.)
- Warning messages (capacity issues, etc.)

## 🔧 Backend Architecture

### File Structure

```
backend/
├── controllers/
│   └── uploadController.js      # Upload logic, save to database
├── routes/
│   └── upload.js                # API routes with multer config
├── utils/
│   ├── excelParser.js           # Excel parsing logic
│   └── timetableValidator.js    # Validation & conflict detection
└── server.js                    # Main server with route registration
```

### Key Functions

#### excelParser.js

- `parseExcelFile(buffer)`: Parse entire Excel workbook
- `parseSheet(sheet, sheetName)`: Parse single sheet
- `parseCellValue(cellValue)`: Parse cell format (SUBJECT-ROOM)
- `parseTimeSlot(timeSlot)`: Parse time format (8.15-9.05)
- `parseDay(dayValue)`: Parse day name (MON → Monday)
- `generateTemplate()`: Create sample Excel template

#### timetableValidator.js

- `validateTimetableData(entries, options)`: Main validation function
- `validateEntities(entries)`: Check if sections/subjects/rooms exist
- `detectConflicts(entries, entities)`: Detect all types of conflicts
- `checkRoomConflicts(entries, day)`: Room conflict detection
- `checkSectionConflicts(entries, day)`: Section overlap detection
- `checkFacultyConflicts(entries, entities)`: Faculty conflict detection
- `checkRoomCapacity(entries, entities, day)`: Capacity warnings

#### uploadController.js

- `uploadTimetable(req, res)`: Main upload handler
- `saveTimetableToDatabase(entries, mode)`: Save parsed data to MongoDB
- `downloadTemplate(req, res)`: Generate and send template file
- `getUploadHistory(req, res)`: Upload history (placeholder)
- `rollbackUpload(req, res)`: Rollback functionality (placeholder)

## 🧪 Testing

### Test Case 1: Valid Upload

1. Download template: `GET /api/upload/template`
2. Fill in valid data for existing sections
3. Upload with dry run: `POST /api/upload/timetable` (dryRun=true)
4. Verify success response
5. Upload for real: `POST /api/upload/timetable` (dryRun=false)
6. Verify data in database

### Test Case 2: Validation Errors

1. Create Excel with non-existent subject code
2. Upload with dry run
3. Verify error response with `SUBJECT_NOT_FOUND` error

### Test Case 3: Room Conflict

1. Create Excel with same room for multiple sections at same time
2. Upload with dry run
3. Verify conflict detection with `ROOM_CONFLICT` error

### Test Case 4: Replace vs Merge

1. Upload initial timetable with mode=replace
2. Verify old entries are deleted
3. Upload additional timetable with mode=merge
4. Verify old entries are kept, new ones added

## 🚀 Deployment Considerations

### Production Checklist

- [ ] Increase file size limit if needed (currently 5MB)
- [ ] Add rate limiting to prevent abuse
- [ ] Implement upload history tracking
- [ ] Implement rollback functionality
- [ ] Add email notifications on upload completion
- [ ] Add audit logging for admin actions
- [ ] Configure proper CORS for production domain
- [ ] Use cloud storage (S3) for temporary file storage
- [ ] Add progress tracking for large files
- [ ] Implement background job processing for large uploads

### Security

- ✅ Admin-only access enforced via JWT middleware
- ✅ File type validation (only .xlsx allowed)
- ✅ File size limit (5MB)
- ✅ Input validation on all parsed data
- ❌ TODO: Virus scanning on uploaded files
- ❌ TODO: IP-based rate limiting

## 📝 Sample Data

### Sections Required

Before uploading, ensure these sections exist in database:
```javascript
// Run seed data or manually create sections
CSE-A, CSE-B, CSE-C, CSE-D
ECE-A, ECE-B, ECE-C
MECH-A, MECH-B
```

### Subjects Required

Ensure subject codes match those in database:
```javascript
CN, CD, IAI, MSD, OS, SE  // Computer Science
DS, ALGO, DB, WEB, ML, AI // More CS subjects
EC, VLSI, DSP, EMF        // Electronics
ME, TD, CAD, SOM          // Mechanical
```

### Rooms Required

Ensure room numbers exist in database:
```javascript
// Classrooms
201, 202, 203, 301, 302, 303, 401, 402, 403, 404, 405, 407, 317

// Labs
505, 506, 507, 508, 509, 510, 512, 515

// Seminar Halls
105 (seminar hall)
```

## 🔄 Workflow Diagram

```
User Uploads Excel
        ↓
[Multer] File Validation (type, size)
        ↓
[excelParser] Parse Excel → Extract Sections & Entries
        ↓
[timetableValidator] Entity Validation
        ↓
[timetableValidator] Conflict Detection
        ↓
    Errors Found? → YES → Return Error Response
        ↓ NO
    Dry Run? → YES → Return Preview (no save)
        ↓ NO
[uploadController] Save to Database (replace/merge mode)
        ↓
Return Success Response
```

## 📞 Support

For issues or questions:
1. Check validation error messages carefully
2. Download template and compare format
3. Verify all sections, subjects, and rooms exist in database
4. Use dry run mode first to validate before saving

## 🎯 Future Enhancements

- [ ] Support for CSV format
- [ ] Drag-and-drop file upload
- [ ] Multi-file upload (multiple sections in separate files)
- [ ] Visual preview of parsed timetable before saving
- [ ] Export existing timetable to Excel
- [ ] Duplicate detection (same entry uploaded twice)
- [ ] Automatic section/room/subject creation from Excel
- [ ] Mobile app support
- [ ] Real-time validation as user types in Excel
- [ ] Integration with Google Sheets
