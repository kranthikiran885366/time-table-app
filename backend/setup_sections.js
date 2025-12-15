const mongoose = require('mongoose');
const Section = require('./models/Section');

// MongoDB Atlas connection string from .env
const MONGODB_URI = 'mongodb+srv://kranthi:kranthi%40123@cluster0.a5rncbm.mongodb.net/timetable_db?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('✓ Connected to MongoDB Atlas');
    
    // Check existing sections
    const existingCount = await Section.countDocuments();
    console.log(`\nExisting sections: ${existingCount}`);
    
    if (existingCount >= 19) {
      console.log('✓ Sections already exist. No need to create.');
      process.exit(0);
    }
    
    // Create SEC1-SEC19
    const sections = [];
    for (let i = 1; i <= 19; i++) {
      sections.push({
        sectionCode: `SEC${i}`,
        name: `Section ${i}`,
        department: 'Computer Science',
        year: 2,
        semester: 4,
        strength: 60,
        academicYear: '2024-25',
        classTeacher: null,
        isActive: true
      });
    }
    
    console.log('\nCreating 19 sections (SEC1-SEC19)...');
    const result = await Section.insertMany(sections);
    console.log(`✓ Successfully created ${result.length} sections!`);
    
    // Verify
    const allSections = await Section.find({}).select('sectionCode name').sort('sectionCode');
    console.log('\n📋 All sections in database:');
    allSections.forEach(s => console.log(`  - ${s.sectionCode}: ${s.name}`));
    
    console.log('\n✅ Database setup complete!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
