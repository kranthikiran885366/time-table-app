const XLSX = require('xlsx');
const path = require('path');
const { parseExcelFile, generateTemplate } = require('./utils/excelParser');

console.log('🧪 Testing Excel Upload Feature\n');

// Test 1: Generate Template
console.log('📝 Test 1: Generating Excel Template');
try {
  const workbook = generateTemplate();
  const filePath = path.join(__dirname, 'timetable_template.xlsx');
  XLSX.writeFile(workbook, filePath);
  console.log('✅ Template generated successfully:', filePath);
} catch (error) {
  console.error('❌ Template generation failed:', error.message);
}

// Test 2: Parse Generated Template
console.log('\n📊 Test 2: Parsing Generated Template');
try {
  const workbook = generateTemplate();
  const buffer = XLSX.write(workbook, { type: 'buffer' });
  
  const parseResult = parseExcelFile(buffer);
  
  console.log('✅ Parsing successful!');
  console.log('Summary:', JSON.stringify(parseResult.summary, null, 2));
  console.log('Sections found:', parseResult.sections.length);
  
  parseResult.sections.forEach(section => {
    console.log(`  - ${section.sectionName}: ${section.timetable.length} entries`);
  });
  
  if (parseResult.errors.length > 0) {
    console.log('⚠️  Parse Errors:', parseResult.errors.length);
  }
} catch (error) {
  console.error('❌ Parsing failed:', error.message);
}

// Test 3: Cell Value Parsing
console.log('\n🔬 Test 3: Cell Value Parsing');
const { parseCellValue } = require('./utils/excelParser');

const testCases = [
  'CN-407',
  'CD-T-407',
  'MSD-L-512',
  'BREAK',
  '—',
  '',
  'IAI-301'
];

testCases.forEach(testCase => {
  try {
    const result = parseCellValue(testCase);
    if (result) {
      console.log(`✅ "${testCase}" → Subject: ${result.subjectCode}, Type: ${result.classType}, Room: ${result.roomNo}`);
    } else {
      console.log(`⏭️  "${testCase}" → Skipped (break/empty)`);
    }
  } catch (error) {
    console.log(`❌ "${testCase}" → Error: ${error.message}`);
  }
});

// Test 4: Time Slot Parsing
console.log('\n⏰ Test 4: Time Slot Parsing');
const { parseTimeSlot } = require('./utils/excelParser');

const timeTests = [
  '8.15-9.05',
  '8:15-9:05',
  '08:15-09:05',
  '10.10-11.00'
];

timeTests.forEach(testTime => {
  const result = parseTimeSlot(testTime);
  if (result) {
    console.log(`✅ "${testTime}" → ${result.startTime} to ${result.endTime}`);
  } else {
    console.log(`❌ "${testTime}" → Failed to parse`);
  }
});

console.log('\n✨ All tests completed!');
