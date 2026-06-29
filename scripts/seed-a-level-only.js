require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const connectDB = require('../src/config/database');
const { seedALevelCourses } = require('./seed/seeders/aLevelCourses');

const run = async () => {
  await connectDB();
  console.log('Seeding AS & A Level courses from static HTML (edusn.co.uk)...');

  const count = await seedALevelCourses();

  console.log(`Done. ${count} AS/A Level course records are in the database.`);
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error('AS/A Level course seed failed:', error);
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
