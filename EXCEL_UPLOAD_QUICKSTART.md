# 📊 Excel Timetable Upload - Quick Start Guide

## 🚀 Getting Started

### Backend Setup

1. **Install Dependencies** (already done)
   ```bash
   cd backend
   npm install xlsx
   ```

2. **Start Server**
   ```bash
   node server.js
   ```

### Flutter Setup

1. **Install Dependencies** (already done)
   ```bash
   cd flutter_app
   flutter pub get
   ```

2. **Run App**
   ```bash
   flutter run -d chrome
   ```

## 📥 How to Use

### Step 1: Login as Admin

Use admin credentials:
- **Email**: `admin@vfstr.ac.in`
- **Password**: `admin123`

### Step 2: Navigate to Upload Screen

1. Go to **Admin Config** screen
2. Click **"Upload Timetable from Excel"** button

### Step 3: Download Template (First Time)

1. Click **"Template"** button
2. Download `timetable_template.xlsx`
3. Open in Excel/Google Sheets

### Step 4: Fill Your Timetable

**Sheet Name = Section Name** (e.g., `CSE-A`, `ECE-B`)

**Table Format:**
```
| Day | 8.15-9.05 | 9.05-9.55 | 9.55-10.10 | 10.10-11.00 | ...
|----|-----------|-----------|------------|-------------|
| MON | CN-407    | CD-T-407  | BREAK      | IAI-301     | ...
| TUE | MSD-317   | —         | BREAK      | MSD-512     | ...
```

**Cell Format:**
- `SUBJECT-ROOM` → Theory class (e.g., `CN-407`)
- `SUBJECT-T-ROOM` → Theory class (e.g., `CD-T-407`)
- `SUBJECT-L-ROOM` → Lab class (e.g., `MSD-L-512`)
- `BREAK` or `—` → Skip

### Step 5: Validate First (Dry Run)

1. **Choose your Excel file**
2. Enable **"Dry Run (Validate Only)"** ✓
3. Click **"Validate"**
4. Check for errors/warnings

### Step 6: Upload for Real

1. Disable **"Dry Run"** 
2. Select mode:
   - **Replace**: Delete old timetable, insert new
   - **Merge**: Keep old, add new
3. Click **"Upload & Save"**
4. ✅ Done!

## ⚠️ Common Issues

### ❌ "Section not found"

**Problem**: Sheet name doesn't match any section in database.

**Solution**: 
1. Check existing sections in database
2. Rename Excel sheet to match exactly
3. Or create the section first

### ❌ "Subject not found"

**Problem**: Subject code doesn't exist in database.

**Solution**:
1. Check subject codes in database
2. Update Excel with correct codes
3. Or create the subject first

### ❌ "Room not found"

**Problem**: Room number doesn't exist in database.

**Solution**:
1. Check room numbers in database
2. Update Excel with correct room numbers
3. Or create the room first

### ❌ "Room conflict"

**Problem**: Same room assigned to multiple sections at same time.

**Solution**:
1. Check the conflicting entries
2. Assign different rooms
3. Or change time slots

### ⚠️ "Capacity warning"

**Problem**: Room capacity < section strength (Warning only)

**Solution**:
- This is just a warning, upload will succeed
- Consider assigning a larger room
- Or split the section

## 🧪 Test with Sample Data

Our sample data includes:

**Sections:**
- CSE-A, CSE-B, CSE-C, CSE-D
- ECE-A, ECE-B, ECE-C
- MECH-A, MECH-B

**Subjects:**
- CS: CN, CD, IAI, MSD, OS, SE, DS, ALGO, DB, WEB, ML, AI
- ECE: EC, VLSI, DSP, EMF
- Mech: ME, TD, CAD, SOM

**Rooms:**
- Classrooms: 201-205, 301-303, 401-407, 317
- Labs: 505-512, 515
- Seminar: 105

## 🎯 Upload Modes

### Replace Mode (Recommended)

```
Before: CSE-A has 40 classes
Upload: New Excel with 45 classes for CSE-A
After:  CSE-A has 45 classes (old deleted, new inserted)
```

### Merge Mode

```
Before: CSE-A has 40 classes
Upload: New Excel with 10 classes for CSE-A
After:  CSE-A has 50 classes (old kept, new added)
```

⚠️ **Warning**: Merge mode can create duplicates if same time slots used!

## 📊 Result Interpretation

### Success Response

```
✅ Timetable uploaded successfully

Summary:
  Total Sheets: 3
  Total Entries: 120
  Valid Entries: 120
  Errors: 0
  Warnings: 2
```

### Error Response

```
❌ Validation failed

Errors (5):
  - Subject "XYZ" not found
  - Room 407 conflict on Monday 8:15-9:05
  - Section "ABC" not found
```

### Warnings

```
⚠️ Warnings (2):
  - Room 407 capacity (50) < Section CSE-A strength (60)
  - Room 301 capacity (40) < Section ECE-A strength (45)
```

Warnings don't prevent upload, but you should review them.

## 🔧 API Testing with curl

### Upload Timetable

```bash
curl -X POST http://localhost:5000/api/upload/timetable \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "file=@timetable.xlsx" \
  -F "dryRun=false" \
  -F "mode=replace"
```

### Download Template

```bash
curl -X GET http://localhost:5000/api/upload/template \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -o template.xlsx
```

## 📁 Files Created

```
backend/
├── controllers/uploadController.js    ✅ Upload logic
├── routes/upload.js                   ✅ API routes
├── utils/
│   ├── excelParser.js                 ✅ Excel parsing
│   └── timetableValidator.js          ✅ Validation
├── test_excel_upload.js               ✅ Test script
└── timetable_template.xlsx            ✅ Generated template

flutter_app/
└── lib/
    └── screens/
        └── timetable_upload_screen.dart  ✅ Upload UI

EXCEL_UPLOAD_DOCUMENTATION.md           ✅ Full docs
EXCEL_UPLOAD_QUICKSTART.md             ✅ This file
```

## 🎓 Example Workflow

1. **Admin logs in**
2. **Downloads template**
3. **Fills data for CSE-A, CSE-B, ECE-A**
4. **Validates with dry run** → Finds 2 errors
5. **Fixes errors in Excel**
6. **Validates again** → Success!
7. **Uploads with Replace mode**
8. **Database updated** → 120 new entries
9. **Students see updated timetable** ✅

## 🚨 Troubleshooting

### Server Not Starting

```bash
# Check if port 5000 is in use
netstat -ano | findstr :5000

# Kill existing process
taskkill /PID <PID_NUMBER> /F

# Restart server
node server.js
```

### Flutter Build Errors

```bash
# Clean build
flutter clean
flutter pub get

# Run again
flutter run -d chrome
```

### Template Not Downloading

Check:
1. Are you logged in as admin?
2. Is backend server running?
3. Check browser console for errors
4. Try with curl to test API directly

## 📞 Need Help?

1. Check `EXCEL_UPLOAD_DOCUMENTATION.md` for detailed info
2. Run test script: `node test_excel_upload.js`
3. Check server logs for errors
4. Use dry run mode to debug

## ✨ Features

- ✅ Multi-sheet Excel support
- ✅ Automatic parsing and validation
- ✅ Conflict detection (room, faculty, section)
- ✅ Dry run mode (validate without saving)
- ✅ Replace/Merge modes
- ✅ Detailed error reporting
- ✅ Capacity warnings
- ✅ Template generation
- ✅ Beautiful Flutter UI
- ✅ Progress tracking
- ✅ Admin authentication

## 🎯 Next Steps

- [ ] Test with your own data
- [ ] Create sections/subjects/rooms if needed
- [ ] Upload timetables for all sections
- [ ] Monitor for conflicts
- [ ] Update as needed throughout semester

---

**Happy Scheduling! 🎓📅**
