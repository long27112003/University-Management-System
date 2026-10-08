const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const coll = mongoose.connection.collection('attendances');
  const countAll = await coll.countDocuments();
  const countWithoutSession = await coll.countDocuments({ session: { $in: [null, undefined] } });
  const sample = await coll.findOne({ session: { $in: [null, undefined] } });
  console.log('Total attendances in DB:', countAll);
  console.log('Total without valid session:', countWithoutSession);
  console.log('Sample legacy record:', sample);
  await mongoose.disconnect();
}

run();
