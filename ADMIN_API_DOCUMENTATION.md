# Admin Features - API Documentation

## 🔐 Authentication & Security

### Password Management
```
POST /api/auth/change-password
Headers: Authorization: Bearer <token>
Body: { currentPassword, newPassword }

POST /api/auth/request-reset
Body: { email }

POST /api/auth/reset-password
Body: { token, newPassword }
```

## 🏛️ Department Management

### Department CRUD
```
GET    /api/department                    - Get all departments
GET    /api/department/:id                - Get department by ID
GET    /api/department/analytics          - Get department analytics
POST   /api/department                    - Create department (Admin)
PUT    /api/department/:id                - Update department (Admin)
DELETE /api/department/:id                - Delete department (Admin)
POST   /api/department/assign-hod         - Assign HOD (Admin)
```

### Department Model
```javascript
{
  name: String,
  code: String,
  hodId: ObjectId (ref: Faculty),
  description: String,
  building: String,
  floor: String,
  contactEmail: String,
  contactPhone: String,
  establishedYear: Number,
  totalFaculty: Number,
  totalStudents: Number,
  isActive: Boolean
}
```

## 📢 Announcements

### Announcement CRUD
```
GET    /api/announcement                  - Get all active announcements
GET    /api/announcement/:id              - Get announcement by ID
POST   /api/announcement                  - Create announcement (Auth)
PUT    /api/announcement/:id              - Update announcement (Admin)
DELETE /api/announcement/:id              - Delete announcement (Admin)
PATCH  /api/announcement/:id/pin          - Toggle pin status (Admin)
```

### Query Parameters
```
GET /api/announcement?targetAudience=all&isActive=true&isPinned=true
```

### Announcement Model
```javascript
{
  title: String,
  message: String,
  type: Enum ['info', 'warning', 'urgent', 'holiday', 'cancellation', 'general'],
  priority: Enum ['low', 'medium', 'high', 'critical'],
  targetAudience: Enum ['all', 'students', 'faculty', 'department', 'section'],
  targetDepartments: [String],
  targetSections: [ObjectId],
  createdBy: ObjectId (ref: Faculty),
  startDate: Date,
  endDate: Date,
  isActive: Boolean,
  isPinned: Boolean,
  attachments: [{ fileName, fileUrl, fileType }],
  viewCount: Number,
  sendEmail: Boolean,
  sendPush: Boolean
}
```

## 🔍 Activity Logs & Audit Trail

### Activity Log Endpoints
```
GET /api/activity-log                     - Get activity logs (Admin)
GET /api/activity-log/user/:userId        - Get user activity summary (Admin)
GET /api/activity-log/export              - Export logs (Admin)
```

### Query Parameters
```
GET /api/activity-log?userId=xxx&action=CREATE&entity=Faculty&startDate=2025-01-01&endDate=2025-12-31&page=1&limit=50
```

### Activity Log Model
```javascript
{
  userId: ObjectId (ref: Faculty),
  userName: String,
  userRole: String,
  action: Enum ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'UPLOAD', 'DOWNLOAD', 'APPROVE', 'REJECT', 'PUBLISH', 'ROLLBACK'],
  entity: Enum ['Faculty', 'Subject', 'Section', 'Room', 'Timetable', 'Department', 'Announcement', 'University', 'User'],
  entityId: String,
  description: String,
  changes: Object,
  ipAddress: String,
  userAgent: String,
  device: String,
  browser: String,
  status: Enum ['success', 'failure'],
  errorMessage: String
}
```

## 📊 Advanced Analytics

### Dashboard & Reports
```
GET /api/analytics/dashboard              - Dashboard overview (Admin)
GET /api/analytics/room-utilization       - Room utilization report (Admin)
GET /api/analytics/faculty-workload       - Faculty workload analysis (Admin)
GET /api/analytics/department-wise        - Department analytics (Admin)
GET /api/analytics/peak-times             - Peak time analysis (Admin)
GET /api/analytics/conflicts              - Conflict detection report (Admin)
```

### Dashboard Stats Response
```javascript
{
  overview: {
    totalFaculty: Number,
    totalDepartments: Number,
    totalRooms: Number,
    totalSections: Number,
    totalSubjects: Number,
    totalClasses: Number,
    activeAnnouncements: Number
  },
  recentActivity: [ActivityLog],
  systemHealth: {
    databaseStatus: String,
    lastBackup: Date,
    storageUsed: String,
    apiStatus: String
  }
}
```

### Room Utilization Response
```javascript
{
  rooms: [{
    room: String,
    type: String,
    capacity: Number,
    totalClasses: Number,
    weeklyHours: Number,
    utilizationPercent: Number,
    status: 'high' | 'medium' | 'low'
  }],
  summary: {
    averageUtilization: Number,
    highlyUtilized: Number,
    underutilized: Number
  }
}
```

### Faculty Workload Response
```javascript
{
  faculty: [{
    id: ObjectId,
    name: String,
    department: String,
    email: String,
    totalClasses: Number,
    weeklyHours: Number,
    maxWeeklyHours: Number,
    utilizationPercent: Number,
    subjectCount: Number,
    sectionCount: Number,
    loadStatus: 'overloaded' | 'optimal' | 'moderate' | 'light',
    onLeave: Boolean
  }],
  summary: {
    averageHours: Number,
    overloaded: Number,
    optimal: Number,
    underutilized: Number,
    onLeave: Number
  }
}
```

## 👨‍🏫 Enhanced Faculty Management

### Enhanced Faculty Model
```javascript
{
  // Basic Info
  name: String,
  department: String,
  email: String (unique),
  role: Enum ['admin', 'hod', 'faculty', 'lab-incharge', 'assistant', 'professor', 'student'],
  password: String (hashed),
  phone: String,
  designation: String,
  qualification: String,
  specialization: String,
  experience: Number,
  joiningDate: Date,
  employeeId: String (unique),
  
  // Workload Management
  maxWeeklyHours: Number (default: 24),
  maxDailyHours: Number (default: 6),
  currentWeeklyHours: Number,
  preferredTimeSlots: [String],
  
  // Availability
  isAvailable: Boolean,
  availability: [{
    day: String,
    startTime: String,
    endTime: String,
    isAvailable: Boolean
  }],
  
  // Leave Management
  onLeave: Boolean,
  leaveHistory: [{
    startDate: Date,
    endDate: Date,
    reason: String,
    status: Enum ['pending', 'approved', 'rejected'],
    appliedOn: Date
  }],
  
  // Additional Info
  photoUrl: String,
  address: String,
  emergencyContact: String,
  bloodGroup: String,
  isActive: Boolean,
  
  // Password Reset
  resetPasswordToken: String,
  resetPasswordExpires: Date
}
```

## 🏢 Enhanced Room Management

### Enhanced Room Model
```javascript
{
  // Basic Info
  number: String (unique),
  block: String,
  capacity: Number,
  type: Enum ['classroom', 'lab', 'seminar hall', 'auditorium', 'conference'],
  floor: String,
  building: String,
  
  // Equipment & Facilities
  equipment: [{
    name: String,
    quantity: Number,
    condition: Enum ['excellent', 'good', 'fair', 'poor'],
    lastServiced: Date
  }],
  
  facilities: {
    hasProjector: Boolean,
    hasAC: Boolean,
    hasSmartBoard: Boolean,
    hasComputers: Boolean,
    computerCount: Number,
    hasSpeakers: Boolean,
    hasWhiteboard: Boolean,
    hasMicrophone: Boolean
  },
  
  // Status & Availability
  isActive: Boolean,
  isUnderMaintenance: Boolean,
  maintenanceSchedule: [{
    startDate: Date,
    endDate: Date,
    reason: String,
    status: Enum ['scheduled', 'ongoing', 'completed']
  }],
  
  // Additional Info
  department: String,
  incharge: ObjectId (ref: Faculty),
  notes: String,
  qrCode: String
}
```

## 🎯 Implemented Features Summary

### ✅ Core Infrastructure
- [x] Department model and management
- [x] Activity logs and audit trail
- [x] Announcement system
- [x] Enhanced faculty model with workload management
- [x] Enhanced room model with equipment tracking
- [x] Password reset functionality

### ✅ Admin Features
- [x] Department CRUD operations
- [x] Department analytics
- [x] HOD assignment
- [x] Announcement management
- [x] Activity log tracking and export
- [x] Dashboard statistics
- [x] Room utilization analytics
- [x] Faculty workload analysis
- [x] Department-wise analytics
- [x] Peak time analysis
- [x] Conflict detection reports

### ✅ Security Features
- [x] Activity logging for all operations
- [x] Password change
- [x] Password reset with token
- [x] IP and device tracking
- [x] Role-based access control
- [x] Account activation/deactivation

### 🎨 Features Ready for Frontend Integration
All backend endpoints are ready. Frontend can now:
1. Display admin dashboard with statistics
2. Manage departments and assign HODs
3. Create and manage announcements
4. View activity logs and audit trail
5. View analytics and reports
6. Manage faculty workload
7. Track room utilization
8. Detect and resolve conflicts

## 📝 Usage Examples

### Create Department
```javascript
POST /api/department
Headers: { Authorization: "Bearer <admin-token>" }
Body: {
  "name": "Computer Science",
  "code": "CSE",
  "description": "Department of Computer Science and Engineering",
  "building": "Academic Block A",
  "floor": "3rd Floor",
  "contactEmail": "cse@university.edu",
  "contactPhone": "+91-1234567890"
}
```

### Create Announcement
```javascript
POST /api/announcement
Headers: { Authorization: "Bearer <token>" }
Body: {
  "title": "Holiday Notice",
  "message": "University will remain closed on 26th January 2025.",
  "type": "holiday",
  "priority": "high",
  "targetAudience": "all",
  "isPinned": true,
  "sendEmail": true,
  "startDate": "2025-01-25",
  "endDate": "2025-01-27"
}
```

### Get Faculty Workload Report
```javascript
GET /api/analytics/faculty-workload
Headers: { Authorization: "Bearer <admin-token>" }

Response: {
  "faculty": [...],
  "summary": {
    "averageHours": "18.5",
    "overloaded": 2,
    "optimal": 15,
    "underutilized": 3,
    "onLeave": 1
  }
}
```

---

**Note**: All admin routes require authentication and admin role. Activity logging is automatic for all operations performed by authenticated users.
