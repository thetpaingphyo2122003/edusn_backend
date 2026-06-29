require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const connectDB = require('../src/config/database');
const { seedTimetable } = require('./seed/seeders/timetable');

const run = async () => {
  await connectDB();
  console.log('Seeding timetable from static HTML (edusn.co.uk)...');

  const count = await seedTimetable();

  console.log(`Done. ${count} timetable records are in the database.`);
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error('Timetable seed failed:', error);
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
