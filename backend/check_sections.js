const mongoose = require('mongoose');
const Section = require('./models/Section');

mongoose.connect('mongodb://localhost:27017/timetable-db')
  .then(async () => {
    console.log('✓ Connected to MongoDB');
    
    const sections = await Section.find({})
      .select('sectionCode name isActive')
      .sort('sectionCode');
    
    console.log(`\nTotal sections in database: ${sections.length}\n`);
    
    if (sections.length > 0) {
      sections.forEach(s => {
        console.log(`  - ${s.sectionCode}: ${s.name} (active: ${s.isActive})`);
      });
    } else {
      console.log('  No sections found!');
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
