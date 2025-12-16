# Timetable Management System

<div align="center">

![Flutter](https://img.shields.io/badge/Flutter-3.38.3-blue?logo=flutter)
![Node.js](https://img.shields.io/badge/Node.js-20.x-green?logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?logo=mongodb)
![License](https://img.shields.io/badge/License-MIT-yellow)
![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20Web-lightgrey)
![Status](https://img.shields.io/badge/Status-Active-success)

![Flutter CI](https://github.com/kranthikiran885366/time-table-app/workflows/Flutter%20CI/badge.svg)
![Backend CI/CD](https://github.com/kranthikiran885366/time-table-app/workflows/Backend%20CI%2FCD/badge.svg)

![GitHub stars](https://img.shields.io/github/stars/kranthikiran885366/time-table-app?style=social)
![GitHub forks](https://img.shields.io/github/forks/kranthikiran885366/time-table-app?style=social)
![GitHub watchers](https://img.shields.io/github/watchers/kranthikiran885366/time-table-app?style=social)
![GitHub last commit](https://img.shields.io/github/last-commit/kranthikiran885366/time-table-app)
![GitHub repo size](https://img.shields.io/github/repo-size/kranthikiran885366/time-table-app)
![GitHub release](https://img.shields.io/github/v/release/kranthikiran885366/time-table-app)
![GitHub downloads](https://img.shields.io/github/downloads/kranthikiran885366/time-table-app/total)

A comprehensive university timetable management system with Excel upload support, real-time notifications, and admin dashboard. Built with Flutter + Node.js + MongoDB.

**📱 [Download Latest Release](https://github.com/kranthikiran885366/time-table-app/releases/latest)** | **🌐 [Live Demo](https://time-table-app-exrd.onrender.com/api)**

[Features](#features) • [Download](#-download) • [Installation](#installation--setup) • [Documentation](#documentation) • [Contributing](#contributing) • [License](#license)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [📱 Download](#-download)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Installation & Setup](#installation--setup)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Excel Upload Feature](#excel-upload-feature)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [Team](#-team)
- [Security](#security)
- [License](#license)
- [Support](#support)

## 🎯 Overview

The Timetable Management System is a full-stack application designed to simplify college schedule management. It provides a user-friendly interface for students, faculty, and administrators to view, manage, and organize class schedules efficiently.

## 📱 Download

### Latest Release
[![Download APK](https://img.shields.io/badge/Download-Latest%20Release-blue?style=for-the-badge&logo=android)](https://github.com/kranthikiran885366/time-table-app/releases/latest)

### Installation Options

| Platform | File | Size | Download |
|----------|------|------|----------|
| **Android (ARM64)** | Recommended for modern devices | ~25-30 MB | [Download](https://github.com/kranthikiran885366/time-table-app/releases/latest/download/timetable-app-arm64-v8a-latest.apk) |
| **Android (ARMv7)** | For older 32-bit devices | ~25-30 MB | [Download](https://github.com/kranthikiran885366/time-table-app/releases/latest/download/timetable-app-armeabi-v7a-latest.apk) |
| **Android (x86_64)** | For emulators and x86 devices | ~30-35 MB | [Download](https://github.com/kranthikiran885366/time-table-app/releases/latest/download/timetable-app-x86_64-latest.apk) |
| **App Bundle** | For Google Play Store | ~20-25 MB | [Download](https://github.com/kranthikiran885366/time-table-app/releases/latest/download/timetable-app-latest.aab) |

### Installation Steps
1. Download the appropriate APK for your device
2. Enable "Unknown Sources" in Settings → Security
3. Install the APK file
4. Launch the app and enjoy!

**📝 Note**: First installation may require internet for initial setup.

### Key Highlights

✅ **Excel Upload**: Bulk upload timetables with validation and conflict detection  
✅ **Real-time Search**: Instant room and section schedule lookups  
✅ **Conflict Detection**: Automatic detection of room, faculty, and section overlaps  
✅ **Responsive Design**: Works seamlessly on mobile and web  
✅ **Role-based Access**: Separate interfaces for students, faculty, and admins  
✅ **Live Class Indicators**: Real-time current class highlighting  

## ✨ Features

### 🎓 Student Features
- **Room Search**: Find current and upcoming classes in any room
- **Section Timetable**: View complete weekly schedule for your section
- **Live Class Indicator**: See which classes are currently running
- **Free Periods**: Identify available time slots
- **Subject Details**: View subject codes, names, and faculty information

### 👨‍🏫 Faculty Features
- **Personal Timetable**: Complete weekly teaching schedule
- **Today's Classes**: Quick view of today's lectures
- **Room Information**: See assigned rooms for each class
- **Section Details**: View student sections being taught

### 👨‍💼 Admin Features
- **Complete CRUD Operations**: Manage Faculty, Subjects, Rooms, Sections, Timetables
- **Excel Upload**: Bulk import timetables from Excel files
  - Multi-sheet support (one section per sheet)
  - Automatic parsing and validation
  - Conflict detection before saving
  - Replace or Merge modes
  - Dry-run mode for validation only
- **University Branding**: Configure logo, name, tagline, colors
- **Conflict Detection**: Real-time alerts for scheduling conflicts
- **Capacity Warnings**: Alerts when room capacity is exceeded
- **Validation**: Comprehensive entity and data validation

### 🎨 UI/UX Features
- **Material 3 Design**: Modern, clean interface
- **Responsive Layout**: Optimized for mobile, tablet, and desktop
- **Loading States**: Clear progress indicators for all operations
- **Error Handling**: User-friendly error messages with retry options
- **Confirmation Dialogs**: Safety checks for destructive actions
- **Search Validation**: Input validation with helpful feedback

## 🛠️ Tech Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 16+ | Runtime environment |
| Express.js | 4.18+ | Web framework |
| MongoDB | 5.0+ | Database |
| Mongoose | 7.5+ | ODM |
| JWT | 9.0+ | Authentication |
| Multer | 1.4+ | File upload |
| XLSX | 0.18+ | Excel parsing |
| bcryptjs | 2.4+ | Password hashing |
| Moment.js | 2.29+ | Date/time handling |

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Flutter | 3.0+ | UI framework |
| Dart | 3.0+ | Programming language |
| Provider | 6.0+ | State management |
| HTTP | 1.1+ | API communication |
| file_picker | 6.1+ | File selection |
| intl | 0.18+ | Internationalization |

### Development Tools
- **Nodemon**: Auto-restart on file changes
- **Git**: Version control
- **VS Code**: Recommended IDE

## Project Structure

```
time table app/
├── backend/
│   ├── controllers/
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   ├── utils/
│   ├── server.js
│   ├── sample_data.js
│   └── package.json
└── flutter_app/
    ├── lib/
    │   ├── screens/
    │   ├── widgets/
    │   ├── services/
    │   ├── models/
    │   ├── providers/
    │   └── main.dart
    └── pubspec.yaml
```

## Installation & Setup

### Prerequisites
- Node.js (v16+)
- MongoDB
- Flutter SDK
- Git

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file with your configuration:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/timetable_db
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
```

4. Start MongoDB service

5. Run sample data script:
```bash
node sample_data.js
```

6. Start the server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to Flutter app directory:
```bash
cd flutter_app
```

2. Get Flutter dependencies:
```bash
flutter pub get
```

3. Run the app:
```bash
flutter run
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### University Configuration
- `GET /api/university/config` - Get university branding
- `PUT /api/university/config` - Update university branding (Admin only)

### Search APIs
- `GET /api/room/:roomNo/current` - Get current room details
- `GET /api/section/:sectionId/today` - Get section's today timetable
- `GET /api/section/:sectionId/weekly` - Get section's weekly timetable

### Admin APIs
- `GET/POST/PUT/DELETE /api/faculty` - Faculty CRUD
- `GET/POST/PUT/DELETE /api/subject` - Subject CRUD
- `GET/POST/PUT/DELETE /api/section` - Section CRUD
- `GET/POST/PUT/DELETE /api/room` - Room CRUD
- `GET/POST/PUT/DELETE /api/timetable` - Timetable CRUD

## Database Schema

### Faculty
```javascript
{
  name: String,
  department: String,
  email: String (unique),
  role: String (admin/faculty/student),
  password: String (hashed)
}
```

### Subject
```javascript
{
  name: String,
  code: String (unique),
  department: String,
  semester: Number,
  credits: Number
}
```

### Section
```javascript
{
  name: String,
  department: String,
  year: Number,
  semester: Number,
  strength: Number
}
```

### Room
```javascript
{
  number: String (unique),
  block: String,
  capacity: Number,
  type: String (classroom/lab)
}
```

### Timetable
```javascript
{
  day: String,
  startTime: String,
  endTime: String,
  roomId: ObjectId (ref: Room),
  facultyId: ObjectId (ref: Faculty),
  subjectId: ObjectId (ref: Subject),
  sectionIds: [ObjectId] (ref: Section),
  classType: String (theory/lab),
  status: String (scheduled/completed/cancelled)
}
```

### University
```javascript
{
  name: String,
  tagline: String,
  logoUrl: String,
  primaryColor: String (hex color),
  isActive: Boolean
}
```

## Sample Credentials

After running the sample data script:
- **Admin**: admin@college.edu / admin123
- **Faculty**: john@college.edu / faculty123

## Key Features Implementation

### Room Search
- Shows current running class with live indicator
- Displays next upcoming class
- Lists all today's classes for the room

### Section Search
- Today's timetable with current class highlight
- Weekly view with expandable day cards
- Live class status indication

### Conflict Detection
- Room booking conflicts
- Faculty scheduling conflicts
- Automatic validation before timetable creation

### Responsive Design
- Material 3 UI components
- Clean, student-friendly interface
- Mobile and web responsive layout

## Development Notes

### Backend Architecture
- Clean separation of concerns with controllers, routes, models
- JWT-based authentication with role-based access
- Comprehensive error handling
- Time-zone safe logic for class scheduling

### Frontend Architecture
- Provider pattern for state management
- Reusable widget components
- Service layer for API communication
- Clean navigation structure

### Business Logic
- Real-time current day and time detection
- Intelligent class status determination
- Support for lab classes with multiple sections
- Graceful handling of no-class scenarios

## Deployment

### Backend Deployment
1. Set production environment variables
2. Use PM2 for process management
3. Configure reverse proxy (Nginx)
4. Set up MongoDB Atlas for cloud database

### Frontend Deployment
1. Build for web: `flutter build web`
2. Build for mobile: `flutter build apk` or `flutter build ios`
3. Deploy web build to hosting service
4. Distribute mobile apps through app stores

## 👥 Team

This project was developed by a dedicated team of developers under expert guidance.

### Development Team
- **Kranthi** - Lead Developer
- **Sawdik** - Full Stack Developer
- **Kartheek** - Mobile Developer

### Guidance
- **Uttejkumar** - Technical Mentor & Project Guide

### Acknowledgments
We would like to thank our mentor for the continuous support and valuable insights throughout the development of this project.

---

<div align="center">

**Made with ❤️ by Team TimetableApp**

[![GitHub](https://img.shields.io/badge/GitHub-Repository-black?style=flat-square&logo=github)](https://github.com/kranthikiran885366/time-table-app)
[![Issues](https://img.shields.io/badge/Issues-Report%20Bug-red?style=flat-square&logo=github)](https://github.com/kranthikiran885366/time-table-app/issues)
[![Pull Requests](https://img.shields.io/badge/PRs-Welcome-brightgreen?style=flat-square&logo=github)](https://github.com/kranthikiran885366/time-table-app/pulls)

</div>

## Future Enhancements

- Push notifications for class reminders
- Offline caching with local storage
- PDF timetable export functionality
- Real-time updates with WebSocket
- Multi-college support
- Advanced analytics and reporting
- Mobile app with native features

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## License

This project is licensed under the MIT License.