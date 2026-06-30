require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const connectDB = require('../src/config/database');
const { seedAwards } = require('./seed/seeders/awards');

const htmlFile = process.env.AWARDS_HTML || '2022_2023AY_Awards.html';
const academicYear = process.env.AWARDS_YEAR || null;

const run = async () => {
  await connectDB();
  console.log(`Seeding awards from ${htmlFile}${academicYear ? ` (${academicYear})` : ''}...`);

  const count = await seedAwards({
    htmlFile,
    forceAcademicYear: academicYear,
    updateDefaultYear: process.env.AWARDS_KEEP_DEFAULT !== '1',
  });

  console.log(`Done. ${count} award records are in the database.`);
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error('Awards seed failed:', error);
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
