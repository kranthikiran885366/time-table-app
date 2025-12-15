# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-12-14

### Added
- **Excel Upload Feature**: Complete admin timetable upload system
  - Multi-sheet Excel file parsing (.xlsx)
  - Cell format parsing (SUBJECT-ROOM, SUBJECT-T-ROOM, SUBJECT-L-ROOM)
  - Time slot parsing (8.15-9.05, 08:15-09:05 formats)
  - Day parsing (MON, MONDAY, Mon variations)
  - Template generation and download
  - Comprehensive validation (entities, conflicts, capacity)
  - Conflict detection (room, faculty, section overlaps)
  - Multiple upload modes (Replace, Merge, Dry-run)
  - Error handling with specific error codes
  - File size limit (5MB) and type validation
  - Progress tracking and loading states
  
- **Backend Features**
  - JWT-based authentication system
  - Role-based access control (Admin, Faculty, Student)
  - RESTful API endpoints for all entities
  - MongoDB integration with Mongoose
  - Excel parsing utilities (excelParser.js)
  - Timetable validation utilities (timetableValidator.js)
  - Time helper utilities
  - Multer file upload middleware
  - Public read endpoints for search functionality
  - Protected admin endpoints for modifications
  
- **Frontend Features (Flutter)**
  - Material 3 design system
  - Responsive UI (Mobile + Web)
  - Landing page with university branding
  - Room search with live class indicator
  - Section timetable with today's and weekly view
  - Admin configuration screen
  - Excel upload screen with file picker
  - Loading overlays and progress indicators
  - Error dialogs with user-friendly messages
  - Confirmation dialogs for destructive actions
  - Retry functionality for failed operations
  
- **Database Models**
  - University (branding configuration)
  - Faculty (name, email, department)
  - Subject (code, name, type)
  - Room (number, type, capacity, location)
  - Section (name, department, semester)
  - Timetable (section, subject, room, faculty, day, time)
  
- **API Endpoints**
  - `/api/auth/register` - User registration
  - `/api/auth/login` - User authentication
  - `/api/faculty` - Faculty CRUD operations
  - `/api/subject` - Subject CRUD operations
  - `/api/room` - Room CRUD operations (public read)
  - `/api/section` - Section CRUD operations (public read)
  - `/api/timetable` - Timetable CRUD operations (public read)
  - `/api/university` - University configuration
  - `/api/upload/timetable` - Excel upload (admin only)
  - `/api/upload/template` - Template download (admin only)
  - `/api/search/room/:roomNumber` - Search by room (public)
  - `/api/search/section/:sectionId` - Search by section (public)
  
- **Development Tools**
  - Nodemon for auto-restart during development
  - Sample data script for testing
  - Excel upload test script
  - Environment variable configuration (.env)
  
- **Documentation**
  - README.md with setup instructions
  - EXCEL_UPLOAD_DOCUMENTATION.md (technical guide)
  - EXCEL_UPLOAD_QUICKSTART.md (user guide)
  - CONTRIBUTING.md (contribution guidelines)
  - CODE_OF_CONDUCT.md
  - LICENSE (MIT)
  - CHANGELOG.md (this file)
  
### Changed
- Enhanced error messages for better user experience
- Improved authentication middleware with public/protected routes
- Optimized file upload validation
- Updated color scheme for Material 3 compatibility

### Fixed
- Token expiration issues in authentication
- 401 errors on public search endpoints
- 404 error messages now user-friendly
- File upload size validation
- Excel parsing edge cases
- Conflict detection accuracy
- Room capacity validation

### Security
- JWT token-based authentication
- Password hashing with bcryptjs
- Admin-only access for modifications
- File type and size validation
- Input sanitization and validation

## [Unreleased]

### Planned Features
- Batch Excel upload (multiple files)
- Export timetable to PDF
- Email notifications for schedule changes
- Mobile app (Android/iOS)
- Real-time updates with WebSocket
- Conflict resolution suggestions
- Advanced search filters
- Faculty availability management
- Room booking system
- Academic calendar integration

---

## Version History

### [1.0.0] - 2025-12-14
Initial release with core timetable management features and Excel upload system.

---

**Note**: This project uses semantic versioning. Version numbers follow the format MAJOR.MINOR.PATCH where:
- MAJOR version for incompatible API changes
- MINOR version for new functionality in a backwards compatible manner
- PATCH version for backwards compatible bug fixes
