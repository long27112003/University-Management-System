const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Attendance = require('../models/Attendance');

async function archiveLegacyAttendance() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  const legacyRecords = await db.collection('attendances').find({
    $or: [{ session: { $exists: false } }, { session: null }]
  }).toArray();

  console.log(`Found ${legacyRecords.length} legacy attendance records.`);

  if (legacyRecords.length > 0) {
    const legacyColl = db.collection('legacy_attendances');
    await legacyColl.insertMany(legacyRecords);
    console.log(`✅ Archived ${legacyRecords.length} records to collection 'legacy_attendances'.`);

    const delRes = await db.collection('attendances').deleteMany({
      $or: [{ session: { $exists: false } }, { session: null }]
    });
    console.log(`✅ Removed ${delRes.deletedCount} legacy records from 'attendances' collection.`);
  }

  // Drop old conflicting indexes if any exist
  const existingIndexes = await db.collection('attendances').indexes();
  console.log('Current indexes:', existingIndexes.map(i => i.name));

  // Sync new model indexes
  await Attendance.syncIndexes();
  const updatedIndexes = await db.collection('attendances').indexes();
  console.log('✅ Synchronized Attendance indexes:', updatedIndexes.map(i => i.name));

  await mongoose.disconnect();
}

archiveLegacyAttendance().catch(err => {
  console.error('Error archiving legacy attendance:', err);
  process.exit(1);
});
