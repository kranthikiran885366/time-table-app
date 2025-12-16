const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB Atlas connection string
const MONGODB_URI = 'mongodb+srv://kranthi:kranthi%40123@cluster0.a5rncbm.mongodb.net/timetable_db?retryWrites=true&w=majority&appName=Cluster0';

// Faculty schema (inline for this script)
const facultySchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: { type: String, enum: ['faculty', 'admin'], default: 'faculty' },
  department: String,
  phone: String,
  designation: String,
  subjects: [String],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const Faculty = mongoose.model('Faculty', facultySchema);

async function createAdminUser() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB Atlas');

    // Check if admin already exists
    const existingAdmin = await Faculty.findOne({ email: '231fa04a03@gmail.com' });
    
    if (existingAdmin) {
      console.log('\n⚠️  Admin user already exists!');
      console.log('Email: 231fa04a03@gmail.com');
      console.log('Deleting old admin and creating new one...');
      await Faculty.deleteOne({ email: '231fa04a03@gmail.com' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin @123', 10);

    // Create admin user
    const admin = new Faculty({
      name: 'Admin User',
      email: '231fa04a03@gmail.com',
      password: hashedPassword,
      role: 'admin',
      department: 'Administration',
      phone: '+91 1234567890',
      designation: 'System Administrator',
      subjects: [],
      isActive: true
    });

    await admin.save();

    console.log('\n✅ Admin user created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('   Email: 231fa04a03@gmail.com');
    console.log('   Password: admin @123');
    console.log('   Role: Admin');
    console.log('\n✅ You can now login to the app with these credentials!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createAdminUser();
