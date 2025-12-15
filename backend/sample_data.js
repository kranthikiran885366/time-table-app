const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Faculty = require('./models/Faculty');
const Subject = require('./models/Subject');
const Section = require('./models/Section');
const Room = require('./models/Room');
const Timetable = require('./models/Timetable');
const University = require('./models/University');

const sampleData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('🗑️  Clearing existing data...');
    // Clear existing data
    await Faculty.deleteMany({});
    await Subject.deleteMany({});
    await Section.deleteMany({});
    await Room.deleteMany({});
    await Timetable.deleteMany({});
    await University.deleteMany({});

    console.log('👥 Creating users...');
    // Create Admin User
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await Faculty.create({
      name: 'System Admin',
      department: 'Administration',
      email: '231fa04a02@gmail.com',
      password: hashedPassword,
      role: 'admin'
    });

    // Create Faculty Members
    const faculties = await Faculty.insertMany([
      {
        name: 'Dr. Rajesh Kumar',
        department: 'Computer Science',
        email: 'rajesh@vfstr.ac.in',
        password: await bcrypt.hash('faculty123', 10),
        role: 'faculty'
      },
      {
        name: 'Dr. Priya Sharma',
        department: 'Computer Science',
        email: 'priya@vfstr.ac.in',
        password: await bcrypt.hash('faculty123', 10),
        role: 'faculty'
      },
      {
        name: 'Prof. Amit Patel',
        department: 'Computer Science',
        email: 'amit@vfstr.ac.in',
        password: await bcrypt.hash('faculty123', 10),
        role: 'faculty'
      },
      {
        name: 'Dr. Sneha Reddy',
        department: 'Electronics',
        email: 'sneha@vfstr.ac.in',
        password: await bcrypt.hash('faculty123', 10),
        role: 'faculty'
      },
      {
        name: 'Prof. Vikram Singh',
        department: 'Electronics',
        email: 'vikram@vfstr.ac.in',
        password: await bcrypt.hash('faculty123', 10),
        role: 'faculty'
      },
      {
        name: 'Dr. Lakshmi Narayanan',
        department: 'Mechanical',
        email: 'lakshmi@vfstr.ac.in',
        password: await bcrypt.hash('faculty123', 10),
        role: 'faculty'
      }
    ]);

    console.log('📚 Creating subjects...');
    // Create Subjects for different departments
    const subjects = await Subject.insertMany([
      // Computer Science
      { name: 'Data Structures', code: 'CS201', department: 'Computer Science', semester: 3, credits: 4 },
      { name: 'Database Management Systems', code: 'CS301', department: 'Computer Science', semester: 5, credits: 3 },
      { name: 'Operating Systems', code: 'CS302', department: 'Computer Science', semester: 5, credits: 4 },
      { name: 'Computer Networks', code: 'CS303', department: 'Computer Science', semester: 5, credits: 3 },
      { name: 'Software Engineering', code: 'CS304', department: 'Computer Science', semester: 5, credits: 3 },
      { name: 'Web Technologies', code: 'CS305', department: 'Computer Science', semester: 5, credits: 3 },
      { name: 'Python Programming', code: 'CS202', department: 'Computer Science', semester: 3, credits: 3 },
      { name: 'Machine Learning', code: 'CS401', department: 'Computer Science', semester: 7, credits: 4 },
      
      // Electronics
      { name: 'Digital Electronics', code: 'EC201', department: 'Electronics', semester: 3, credits: 4 },
      { name: 'Microprocessors', code: 'EC301', department: 'Electronics', semester: 5, credits: 4 },
      { name: 'VLSI Design', code: 'EC302', department: 'Electronics', semester: 5, credits: 3 },
      { name: 'Embedded Systems', code: 'EC303', department: 'Electronics', semester: 5, credits: 4 },
      
      // Mechanical
      { name: 'Thermodynamics', code: 'ME201', department: 'Mechanical', semester: 3, credits: 4 },
      { name: 'Fluid Mechanics', code: 'ME301', department: 'Mechanical', semester: 5, credits: 4 }
    ]);

    console.log('🎓 Creating sections...');
    // Create Sections
    const sections = await Section.insertMany([
      // Computer Science sections
      { name: 'CSE-A', department: 'Computer Science', year: 2, semester: 3, strength: 60 },
      { name: 'CSE-B', department: 'Computer Science', year: 2, semester: 3, strength: 58 },
      { name: 'CSE-C', department: 'Computer Science', year: 3, semester: 5, strength: 55 },
      { name: 'CSE-D', department: 'Computer Science', year: 3, semester: 5, strength: 52 },
      { name: 'CSE-AI', department: 'Computer Science', year: 4, semester: 7, strength: 45 },
      
      // Electronics sections
      { name: 'ECE-A', department: 'Electronics', year: 2, semester: 3, strength: 50 },
      { name: 'ECE-B', department: 'Electronics', year: 3, semester: 5, strength: 48 },
      
      // Mechanical sections
      { name: 'MECH-A', department: 'Mechanical', year: 2, semester: 3, strength: 55 },
      { name: 'MECH-B', department: 'Mechanical', year: 3, semester: 5, strength: 50 }
    ]);

    console.log('🏫 Creating rooms...');
    // Create Rooms
    const rooms = await Room.insertMany([
      // A Block - Classrooms
      { number: '101', block: 'A', capacity: 60, type: 'classroom' },
      { number: '102', block: 'A', capacity: 60, type: 'classroom' },
      { number: '103', block: 'A', capacity: 70, type: 'classroom' },
      { number: '104', block: 'A', capacity: 50, type: 'classroom' },
      { number: '105', block: 'A', capacity: 80, type: 'seminar hall' },
      
      // B Block - Labs
      { number: '201', block: 'B', capacity: 30, type: 'lab' },
      { number: '202', block: 'B', capacity: 30, type: 'lab' },
      { number: '203', block: 'B', capacity: 40, type: 'lab' },
      { number: '204', block: 'B', capacity: 35, type: 'lab' },
      
      // C Block - Mixed
      { number: '301', block: 'C', capacity: 60, type: 'classroom' },
      { number: '302', block: 'C', capacity: 65, type: 'classroom' },
      { number: '303', block: 'C', capacity: 30, type: 'lab' },
      
      // D Block - Specialized
      { number: '401', block: 'D', capacity: 100, type: 'seminar hall' },
      { number: '402', block: 'D', capacity: 40, type: 'lab' }
    ]);

    console.log('📅 Creating comprehensive timetable...');
    // Create Comprehensive Timetable Entries
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Helper function to find by name/code
    const findSubject = (code) => subjects.find(s => s.code === code);
    const findSection = (name) => sections.find(s => s.name === name);
    const findRoom = (number) => rooms.find(r => r.number === number);
    const findFaculty = (name) => faculties.find(f => f.name.includes(name));

    // Comprehensive timetable for CSE-A (Monday to Saturday)
    const cseATimetable = [
      // Monday
      { day: 'Monday', startTime: '09:00', endTime: '10:00', roomId: findRoom('101')._id, facultyId: findFaculty('Rajesh')._id, subjectId: findSubject('CS201')._id, sectionIds: [findSection('CSE-A')._id], classType: 'theory' },
      { day: 'Monday', startTime: '10:00', endTime: '11:00', roomId: findRoom('101')._id, facultyId: findFaculty('Priya')._id, subjectId: findSubject('CS202')._id, sectionIds: [findSection('CSE-A')._id], classType: 'theory' },
      { day: 'Monday', startTime: '11:00', endTime: '12:00', roomId: findRoom('102')._id, facultyId: findFaculty('Amit')._id, subjectId: findSubject('CS201')._id, sectionIds: [findSection('CSE-A')._id], classType: 'theory' },
      { day: 'Monday', startTime: '13:30', endTime: '15:30', roomId: findRoom('201')._id, facultyId: findFaculty('Rajesh')._id, subjectId: findSubject('CS202')._id, sectionIds: [findSection('CSE-A')._id], classType: 'lab' },
      { day: 'Monday', startTime: '15:30', endTime: '16:30', roomId: findRoom('103')._id, facultyId: findFaculty('Priya')._id, subjectId: findSubject('CS201')._id, sectionIds: [findSection('CSE-A')._id], classType: 'theory' },
      
      // Tuesday
      { day: 'Tuesday', startTime: '09:00', endTime: '10:00', roomId: findRoom('102')._id, facultyId: findFaculty('Amit')._id, subjectId: findSubject('CS202')._id, sectionIds: [findSection('CSE-A')._id], classType: 'theory' },
      { day: 'Tuesday', startTime: '10:00', endTime: '11:00', roomId: findRoom('102')._id, facultyId: findFaculty('Rajesh')._id, subjectId: findSubject('CS201')._id, sectionIds: [findSection('CSE-A')._id], classType: 'theory' },
      { day: 'Tuesday', startTime: '11:00', endTime: '12:00', roomId: findRoom('103')._id, facultyId: findFaculty('Priya')._id, subjectId: findSubject('CS202')._id, sectionIds: [findSection('CSE-A')._id], classType: 'theory' },
      { day: 'Tuesday', startTime: '14:30', endTime: '15:30', roomId: findRoom('101')._id, facultyId: findFaculty('Amit')._id, subjectId: findSubject('CS201')._id, sectionIds: [findSection('CSE-A')._id], classType: 'theory' },
      
      // Wednesday
      { day: 'Wednesday', startTime: '09:00', endTime: '10:00', roomId: findRoom('104')._id, facultyId: findFaculty('Rajesh')._id, subjectId: findSubject('CS201')._id, sectionIds: [findSection('CSE-A')._id], classType: 'theory' },
      { day: 'Wednesday', startTime: '10:00', endTime: '11:00', roomId: findRoom('104')._id, facultyId: findFaculty('Priya')._id, subjectId: findSubject('CS202')._id, sectionIds: [findSection('CSE-A')._id], classType: 'theory' },
      { day: 'Wednesday', startTime: '13:30', endTime: '15:30', roomId: findRoom('202')._id, facultyId: findFaculty('Amit')._id, subjectId: findSubject('CS201')._id, sectionIds: [findSection('CSE-A')._id], classType: 'lab' },
      { day: 'Wednesday', startTime: '15:30', endTime: '16:30', roomId: findRoom('101')._id, facultyId: findFaculty('Rajesh')._id, subjectId: findSubject('CS202')._id, sectionIds: [findSection('CSE-A')._id], classType: 'theory' },
      
      // Thursday
      { day: 'Thursday', startTime: '09:00', endTime: '10:00', roomId: findRoom('101')._id, facultyId: findFaculty('Priya')._id, subjectId: findSubject('CS201')._id, sectionIds: [findSection('CSE-A')._id], classType: 'theory' },
      { day: 'Thursday', startTime: '10:00', endTime: '11:00', roomId: findRoom('101')._id, facultyId: findFaculty('Amit')._id, subjectId: findSubject('CS202')._id, sectionIds: [findSection('CSE-A')._id], classType: 'theory' },
      { day: 'Thursday', startTime: '11:00', endTime: '12:00', roomId: findRoom('102')._id, facultyId: findFaculty('Rajesh')._id, subjectId: findSubject('CS201')._id, sectionIds: [findSection('CSE-A')._id], classType: 'theory' },
      { day: 'Thursday', startTime: '14:30', endTime: '15:30', roomId: findRoom('103')._id, facultyId: findFaculty('Priya')._id, subjectId: findSubject('CS202')._id, sectionIds: [findSection('CSE-A')._id], classType: 'theory' },
      
      // Friday
      { day: 'Friday', startTime: '09:00', endTime: '10:00', roomId: findRoom('102')._id, facultyId: findFaculty('Amit')._id, subjectId: findSubject('CS201')._id, sectionIds: [findSection('CSE-A')._id], classType: 'theory' },
      { day: 'Friday', startTime: '10:00', endTime: '11:00', roomId: findRoom('102')._id, facultyId: findFaculty('Rajesh')._id, subjectId: findSubject('CS202')._id, sectionIds: [findSection('CSE-A')._id], classType: 'theory' },
      { day: 'Friday', startTime: '13:30', endTime: '15:30', roomId: findRoom('203')._id, facultyId: findFaculty('Priya')._id, subjectId: findSubject('CS202')._id, sectionIds: [findSection('CSE-A')._id], classType: 'lab' },
      
      // Saturday
      { day: 'Saturday', startTime: '09:00', endTime: '10:00', roomId: findRoom('101')._id, facultyId: findFaculty('Rajesh')._id, subjectId: findSubject('CS201')._id, sectionIds: [findSection('CSE-A')._id], classType: 'theory' },
      { day: 'Saturday', startTime: '10:00', endTime: '11:00', roomId: findRoom('101')._id, facultyId: findFaculty('Amit')._id, subjectId: findSubject('CS202')._id, sectionIds: [findSection('CSE-A')._id], classType: 'theory' }
    ];

    // CSE-C timetable (3rd year - semester 5)
    const cseCTimetable = [
      // Monday
      { day: 'Monday', startTime: '09:00', endTime: '10:00', roomId: findRoom('301')._id, facultyId: findFaculty('Priya')._id, subjectId: findSubject('CS301')._id, sectionIds: [findSection('CSE-C')._id], classType: 'theory' },
      { day: 'Monday', startTime: '10:00', endTime: '11:00', roomId: findRoom('301')._id, facultyId: findFaculty('Amit')._id, subjectId: findSubject('CS302')._id, sectionIds: [findSection('CSE-C')._id], classType: 'theory' },
      { day: 'Monday', startTime: '11:00', endTime: '12:00', roomId: findRoom('301')._id, facultyId: findFaculty('Rajesh')._id, subjectId: findSubject('CS303')._id, sectionIds: [findSection('CSE-C')._id], classType: 'theory' },
      { day: 'Monday', startTime: '14:30', endTime: '15:30', roomId: findRoom('302')._id, facultyId: findFaculty('Priya')._id, subjectId: findSubject('CS304')._id, sectionIds: [findSection('CSE-C')._id], classType: 'theory' },
      { day: 'Monday', startTime: '15:30', endTime: '16:30', roomId: findRoom('302')._id, facultyId: findFaculty('Amit')._id, subjectId: findSubject('CS305')._id, sectionIds: [findSection('CSE-C')._id], classType: 'theory' },
      
      // Tuesday
      { day: 'Tuesday', startTime: '13:30', endTime: '15:30', roomId: findRoom('204')._id, facultyId: findFaculty('Rajesh')._id, subjectId: findSubject('CS301')._id, sectionIds: [findSection('CSE-C')._id], classType: 'lab' },
      { day: 'Tuesday', startTime: '15:30', endTime: '16:30', roomId: findRoom('301')._id, facultyId: findFaculty('Priya')._id, subjectId: findSubject('CS302')._id, sectionIds: [findSection('CSE-C')._id], classType: 'theory' },
      
      // Wednesday
      { day: 'Wednesday', startTime: '09:00', endTime: '10:00', roomId: findRoom('302')._id, facultyId: findFaculty('Amit')._id, subjectId: findSubject('CS303')._id, sectionIds: [findSection('CSE-C')._id], classType: 'theory' },
      { day: 'Wednesday', startTime: '10:00', endTime: '11:00', roomId: findRoom('302')._id, facultyId: findFaculty('Rajesh')._id, subjectId: findSubject('CS304')._id, sectionIds: [findSection('CSE-C')._id], classType: 'theory' },
      { day: 'Wednesday', startTime: '11:00', endTime: '12:00', roomId: findRoom('302')._id, facultyId: findFaculty('Priya')._id, subjectId: findSubject('CS305')._id, sectionIds: [findSection('CSE-C')._id], classType: 'theory' },
      
      // Thursday
      { day: 'Thursday', startTime: '13:30', endTime: '15:30', roomId: findRoom('303')._id, facultyId: findFaculty('Amit')._id, subjectId: findSubject('CS305')._id, sectionIds: [findSection('CSE-C')._id], classType: 'lab' },
      { day: 'Thursday', startTime: '15:30', endTime: '16:30', roomId: findRoom('301')._id, facultyId: findFaculty('Rajesh')._id, subjectId: findSubject('CS301')._id, sectionIds: [findSection('CSE-C')._id], classType: 'theory' },
      
      // Friday
      { day: 'Friday', startTime: '09:00', endTime: '10:00', roomId: findRoom('301')._id, facultyId: findFaculty('Priya')._id, subjectId: findSubject('CS302')._id, sectionIds: [findSection('CSE-C')._id], classType: 'theory' },
      { day: 'Friday', startTime: '10:00', endTime: '11:00', roomId: findRoom('301')._id, facultyId: findFaculty('Amit')._id, subjectId: findSubject('CS303')._id, sectionIds: [findSection('CSE-C')._id], classType: 'theory' },
      { day: 'Friday', startTime: '11:00', endTime: '12:00', roomId: findRoom('301')._id, facultyId: findFaculty('Rajesh')._id, subjectId: findSubject('CS304')._id, sectionIds: [findSection('CSE-C')._id], classType: 'theory' }
    ];

    // ECE-A timetable
    const eceATimetable = [
      { day: 'Monday', startTime: '09:00', endTime: '10:00', roomId: findRoom('104')._id, facultyId: findFaculty('Sneha')._id, subjectId: findSubject('EC201')._id, sectionIds: [findSection('ECE-A')._id], classType: 'theory' },
      { day: 'Monday', startTime: '10:00', endTime: '11:00', roomId: findRoom('104')._id, facultyId: findFaculty('Vikram')._id, subjectId: findSubject('EC201')._id, sectionIds: [findSection('ECE-A')._id], classType: 'theory' },
      { day: 'Tuesday', startTime: '09:00', endTime: '11:00', roomId: findRoom('201')._id, facultyId: findFaculty('Sneha')._id, subjectId: findSubject('EC201')._id, sectionIds: [findSection('ECE-A')._id], classType: 'lab' },
      { day: 'Wednesday', startTime: '09:00', endTime: '10:00', roomId: findRoom('104')._id, facultyId: findFaculty('Vikram')._id, subjectId: findSubject('EC201')._id, sectionIds: [findSection('ECE-A')._id], classType: 'theory' },
      { day: 'Thursday', startTime: '10:00', endTime: '11:00', roomId: findRoom('104')._id, facultyId: findFaculty('Sneha')._id, subjectId: findSubject('EC201')._id, sectionIds: [findSection('ECE-A')._id], classType: 'theory' },
      { day: 'Friday', startTime: '14:30', endTime: '16:30', roomId: findRoom('202')._id, facultyId: findFaculty('Vikram')._id, subjectId: findSubject('EC201')._id, sectionIds: [findSection('ECE-A')._id], classType: 'lab' }
    ];

    // Insert all timetables
    await Timetable.insertMany([...cseATimetable, ...cseCTimetable, ...eceATimetable]);

    console.log('🏛️  Creating university configuration...');
    // Create University Configuration
    await University.create({
      name: 'Vignan Foundation for Science, Technology and Research',
      tagline: 'VFSTR • Excellence in Innovation and Learning',
      logoUrl: 'https://i.imgur.com/placeholder.png',
      primaryColor: '#7B68B3',
      isActive: true
    });

    console.log('\n✅ Sample data created successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - Faculties: ${faculties.length + 1} (including admin)`);
    console.log(`   - Subjects: ${subjects.length}`);
    console.log(`   - Sections: ${sections.length}`);
    console.log(`   - Rooms: ${rooms.length}`);
    console.log(`   - Timetable Entries: ${cseATimetable.length + cseCTimetable.length + eceATimetable.length}`);
    console.log('\n🔐 Login Credentials:');
    console.log('   Admin: admin@vfstr.ac.in / admin123');
    console.log('   Faculty: rajesh@vfstr.ac.in / faculty123');
    console.log('   (All faculty passwords: faculty123)\n');
    
  } catch (error) {
    console.error('Error creating sample data:', error);
  } finally {
    mongoose.connection.close();
  }
};

sampleData();