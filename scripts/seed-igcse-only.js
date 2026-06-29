require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const connectDB = require('../src/config/database');
const { seedIgcseCourses } = require('./seed/seeders/igcseCourses');

const run = async () => {
  await connectDB();
  console.log('Seeding IGCSE courses from static HTML (edusn.co.uk)...');

  const count = await seedIgcseCourses();

  console.log(`Done. ${count} IGCSE course records are in the database.`);
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error('IGCSE course seed failed:', error);
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
