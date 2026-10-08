const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI);
  const notices = await mongoose.connection.collection('notices').find().toArray();
  let count = 0;
  for (const n of notices) {
    let aud = (n.audience || 'all').toLowerCase();
    if (aud === 'professor') aud = 'teacher';
    if (!['all', 'teacher', 'student', 'receptionist'].includes(aud)) aud = 'all';
    await mongoose.connection.collection('notices').updateOne({ _id: n._id }, { $set: { audience: aud } });
    count++;
  }
  console.log(`Migrated ${count} notices to approved audience values.`);
  await mongoose.disconnect();
}

migrate().catch(console.error);
