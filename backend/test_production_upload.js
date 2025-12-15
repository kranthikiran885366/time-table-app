/**
 * Test script for production-level Excel upload
 * Tests section-wise processing with replace/append modes
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:5000';

// Test Excel file path (update this to your test file)
const TEST_FILE = path.join(__dirname, '09 July III Year Time Table.xlsx');

async function testUpload() {
  console.log('🧪 Testing Production-Level Excel Upload\n');
  console.log('=' .repeat(60));

  try {
    // Check if test file exists
    if (!fs.existsSync(TEST_FILE)) {
      console.error('❌ Test file not found:', TEST_FILE);
      console.log('\n💡 Please update TEST_FILE variable with correct path');
      return;
    }

    console.log('📄 Test file:', TEST_FILE);
    console.log('📊 File size:', (fs.statSync(TEST_FILE).size / 1024).toFixed(2), 'KB');

    // Test 1: Dry run (parse only, don't save)
    console.log('\n' + '='.repeat(60));
    console.log('TEST 1: Dry Run (Parse Only)');
    console.log('='.repeat(60));

    const dryRunForm = new FormData();
    dryRunForm.append('file', fs.createReadStream(TEST_FILE));
    dryRunForm.append('dryRun', 'true');
    dryRunForm.append('mode', 'replace');

    const dryRunResponse = await axios.post(
      `${API_URL}/api/admin/upload-timetable`,
      dryRunForm,
      {
        headers: {
          ...dryRunForm.getHeaders(),
          'Authorization': 'Bearer YOUR_TOKEN_HERE' // Update with real token if needed
        }
      }
    );

    console.log('\n✅ Dry Run Success:');
    console.log('  - Total Sheets:', dryRunResponse.data.summary.totalSheets);
    console.log('  - Total Entries:', dryRunResponse.data.summary.totalEntries);
    console.log('  - Valid Entries:', dryRunResponse.data.summary.validEntries);
    console.log('  - Invalid Entries:', dryRunResponse.data.summary.invalidEntries);
    console.log('  - Errors:', dryRunResponse.data.summary.errors);
    console.log('  - Warnings:', dryRunResponse.data.summary.warnings);

    if (dryRunResponse.data.sections) {
      console.log('\n📋 Sections found:');
      dryRunResponse.data.sections.forEach(sec => {
        console.log(`  - ${sec.section}: ${sec.entries} entries`);
      });
    }

    // Test 2: Actual upload with REPLACE mode
    console.log('\n' + '='.repeat(60));
    console.log('TEST 2: Actual Upload (REPLACE Mode)');
    console.log('='.repeat(60));
    console.log('⚠️  This will DELETE existing timetable data for these sections!');
    console.log('Press Ctrl+C within 3 seconds to cancel...');
    
    await new Promise(resolve => setTimeout(resolve, 3000));

    const uploadForm = new FormData();
    uploadForm.append('file', fs.createReadStream(TEST_FILE));
    uploadForm.append('dryRun', 'false');
    uploadForm.append('mode', 'replace');
    uploadForm.append('skipConflictCheck', 'true');

    const uploadResponse = await axios.post(
      `${API_URL}/api/admin/upload-timetable`,
      uploadForm,
      {
        headers: {
          ...uploadForm.getHeaders(),
          'Authorization': 'Bearer YOUR_TOKEN_HERE'
        }
      }
    );

    console.log('\n✅ Upload Success:');
    console.log('  - Sections Created:', uploadResponse.data.saved?.sectionsCreated || 0);
    console.log('  - Entries Inserted:', uploadResponse.data.saved?.inserted || 0);
    console.log('  - Entries Deleted:', uploadResponse.data.saved?.deleted || 0);
    console.log('  - Failed:', uploadResponse.data.saved?.failed || 0);
    console.log('  - Skipped Sheets:', uploadResponse.data.saved?.skippedSheets || 0);

    if (uploadResponse.data.saved?.errors && uploadResponse.data.saved.errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      uploadResponse.data.saved.errors.slice(0, 5).forEach(err => {
        console.log(`  - Section ${err.section}: ${err.error}`);
      });
      if (uploadResponse.data.saved.errors.length > 5) {
        console.log(`  ... and ${uploadResponse.data.saved.errors.length - 5} more errors`);
      }
    }

    // Test 3: Upload again with MERGE mode (should skip duplicates)
    console.log('\n' + '='.repeat(60));
    console.log('TEST 3: Upload Again (MERGE Mode)');
    console.log('='.repeat(60));
    console.log('This should skip duplicate entries...\n');

    await new Promise(resolve => setTimeout(resolve, 2000));

    const mergeForm = new FormData();
    mergeForm.append('file', fs.createReadStream(TEST_FILE));
    mergeForm.append('dryRun', 'false');
    mergeForm.append('mode', 'merge');
    mergeForm.append('skipConflictCheck', 'true');

    const mergeResponse = await axios.post(
      `${API_URL}/api/admin/upload-timetable`,
      mergeForm,
      {
        headers: {
          ...mergeForm.getHeaders(),
          'Authorization': 'Bearer YOUR_TOKEN_HERE'
        }
      }
    );

    console.log('\n✅ Merge Success:');
    console.log('  - Sections Created:', mergeResponse.data.saved?.sectionsCreated || 0);
    console.log('  - Entries Inserted:', mergeResponse.data.saved?.inserted || 0);
    console.log('  - Entries Deleted:', mergeResponse.data.saved?.deleted || 0);
    console.log('  - Failed (duplicates):', mergeResponse.data.saved?.failed || 0);

    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests completed successfully!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    if (error.response) {
      console.error('\n📋 Server Response:');
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Make sure backend server is running on port 5000');
    }
  }
}

// Run tests
testUpload().then(() => {
  console.log('\n✨ Test script finished');
  process.exit(0);
}).catch(err => {
  console.error('\n💥 Fatal error:', err);
  process.exit(1);
});
