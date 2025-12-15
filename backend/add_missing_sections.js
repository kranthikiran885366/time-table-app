const mongoose = require('mongoose');
const Section = require('./models/Section');
require('dotenv').config();

const addMissingSections = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📊 Adding missing sections for Excel upload...');

    // Sections from your Excel file
    const sectionsToAdd = [
      { sectionCode: 'SEC1', name: 'Section 1', department: 'Computer Science', year: 3, semester: 5, strength: 60 },
      { sectionCode: 'SEC2', name: 'Section 2', department: 'Computer Science', year: 3, semester: 5, strength: 60 },
      { sectionCode: 'SEC3', name: 'Section 3', department: 'Computer Science', year: 3, semester: 5, strength: 60 },
      { sectionCode: 'SEC4', name: 'Section 4', department: 'Computer Science', year: 3, semester: 5, strength: 60 },
      { sectionCode: 'SEC5', name: 'Section 5', department: 'Computer Science', year: 3, semester: 5, strength: 60 },
      { sectionCode: 'SEC6', name: 'Section 6', department: 'Computer Science', year: 3, semester: 5, strength: 60 },
      { sectionCode: 'SEC7', name: 'Section 7', department: 'Computer Science', year: 3, semester: 5, strength: 60 },
      { sectionCode: 'SEC8', name: 'Section 8', department: 'Computer Science', year: 3, semester: 5, strength: 60 },
      { sectionCode: 'SEC9', name: 'Section 9', department: 'Computer Science', year: 3, semester: 5, strength: 60 },
      { sectionCode: 'SEC10', name: 'Section 10', department: 'Computer Science', year: 3, semester: 5, strength: 60 },
      { sectionCode: 'SEC11', name: 'Section 11', department: 'Computer Science', year: 3, semester: 5, strength: 60 },
      { sectionCode: 'SEC12', name: 'Section 12', department: 'Computer Science', year: 3, semester: 5, strength: 60 },
      { sectionCode: 'SEC13', name: 'Section 13', department: 'Computer Science', year: 3, semester: 5, strength: 60 },
      { sectionCode: 'SEC14', name: 'Section 14', department: 'Computer Science', year: 3, semester: 5, strength: 60 },
      { sectionCode: 'SEC15', name: 'Section 15', department: 'Computer Science', year: 3, semester: 5, strength: 60 },
      { sectionCode: 'SEC16', name: 'Section 16', department: 'Computer Science', year: 3, semester: 5, strength: 60 },
      { sectionCode: 'SEC17', name: 'Section 17', department: 'Computer Science', year: 3, semester: 5, strength: 60 },
      { sectionCode: 'SEC18', name: 'Section 18', department: 'Computer Science', year: 3, semester: 5, strength: 60 },
      { sectionCode: 'SEC19', name: 'Section 19', department: 'Computer Science', year: 3, semester: 5, strength: 60 }
    ];

    // Check which sections already exist
    const existingSections = await Section.find({
      sectionCode: { $in: sectionsToAdd.map(s => s.sectionCode) }
    });
    
    const existingCodes = new Set(existingSections.map(s => s.sectionCode));
    const newSections = sectionsToAdd.filter(s => !existingCodes.has(s.sectionCode));

    if (newSections.length === 0) {
      console.log('✅ All sections already exist!');
      return;
    }

    // Insert new sections
    const result = await Section.insertMany(newSections);
    
    console.log(`✅ Added ${result.length} new sections:`);
    result.forEach(section => {
      console.log(`   - ${section.sectionCode}: ${section.name}`);
    });

    console.log('\n🎉 Now you can upload your Excel file successfully!');

  } catch (error) {
    console.error('❌ Error adding sections:', error);
  } finally {
    mongoose.connection.close();
  }
};

addMissingSections();