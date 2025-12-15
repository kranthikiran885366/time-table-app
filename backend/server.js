const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const facultyRoutes = require('./routes/faculty');
const subjectRoutes = require('./routes/subject');
const sectionRoutes = require('./routes/section');
const roomRoutes = require('./routes/room');
const timetableRoutes = require('./routes/timetable');
const searchRoutes = require('./routes/search');
const authRoutes = require('./routes/auth');
const universityRoutes = require('./routes/university');
const uploadRoutes = require('./routes/upload');
const departmentRoutes = require('./routes/department');
const announcementRoutes = require('./routes/announcement');
const activityLogRoutes = require('./routes/activityLog');
const analyticsRoutes = require('./routes/analytics');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/subject', subjectRoutes);
app.use('/api/section', sectionRoutes);
app.use('/api/room', roomRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/university', universityRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/department', departmentRoutes);
app.use('/api/announcement', announcementRoutes);
app.use('/api/activity-log', activityLogRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api', searchRoutes);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});